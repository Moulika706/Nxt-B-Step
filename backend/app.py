import os
import json
import sqlite3
import re
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from server import querydb, get_tables, get_schema
from decision_platform import init_decision_tables, review_recommendation, run_decision_workflow

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "")
DB_PATH = os.path.join(os.path.dirname(__file__), "accurate.db")

# ─────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    sessionid: str
    userid: str

class DecisionRequest(BaseModel):
    interaction: str
    userid: str = "guest@accurate.ai"
    sessionid: str | None = None

class RecommendationReview(BaseModel):
    recommendation_id: str
    status: str
    note: str | None = None

# ─────────────────────────────────────────────
# Session management (SQLite-based)
# ─────────────────────────────────────────────

def init_session_table():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                session_id TEXT PRIMARY KEY,
                user_email TEXT,
                user_role TEXT DEFAULT 'guest',
                user_name TEXT DEFAULT 'Guest',
                history_json TEXT DEFAULT '[]',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()

def load_session(session_id: str) -> dict:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM chat_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if row:
            return {
                "session_id": row["session_id"],
                "user_email": row["user_email"],
                "user_role": row["user_role"],
                "user_name": row["user_name"],
                "history": json.loads(row["history_json"] or "[]"),
            }
        return {"session_id": session_id, "user_email": None, "user_role": "guest", "user_name": "Guest", "history": []}

def save_session(session_id: str, user_email: str, user_role: str, user_name: str, history: list):
    now = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO chat_sessions (session_id, user_email, user_role, user_name, history_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                user_email = excluded.user_email,
                user_role = excluded.user_role,
                user_name = excluded.user_name,
                history_json = excluded.history_json,
                updated_at = excluded.updated_at
        """, (session_id, user_email, user_role, user_name, json.dumps(history), now, now))
        conn.commit()

# ─────────────────────────────────────────────
# User lookup from DB
# ─────────────────────────────────────────────

def get_user_info(email: str) -> dict | None:
    result = querydb(f"SELECT userid, role, name, email FROM users WHERE email = '{email}'")
    try:
        rows = eval(result)  # result is a string repr of list of dicts
        if rows:
            return rows[0]
    except Exception:
        pass
    return None

# ─────────────────────────────────────────────
# Hugging Face chat inference
# ─────────────────────────────────────────────

def call_hf_model(messages: list[dict], model: str = "mistralai/Mistral-7B-Instruct-v0.3") -> str:
    """Call Hugging Face Inference API with conversation history."""
    import urllib.request

    url = f"https://api-inference.huggingface.co/models/{model}/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"

    payload = json.dumps({
        "model": model,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3,
    }).encode("utf-8")

    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"I'm sorry, I couldn't reach the AI model right now. Error: {str(e)}"

# ─────────────────────────────────────────────
# DB tool executor — agent calls these by name
# ─────────────────────────────────────────────

TOOLS_SCHEMA = [
    {
        "name": "querydb",
        "description": "Run a SQL SELECT query on the background check database and return results.",
        "parameters": {"sql": "The SQL query string to execute."},
    },
    {
        "name": "get_tables",
        "description": "Return a list of all table names in the database.",
        "parameters": {},
    },
    {
        "name": "get_schema",
        "description": "Return column info for a specific table.",
        "parameters": {"table_name": "The name of the table to inspect."},
    },
]

def run_tool(tool_name: str, args: dict) -> str:
    if tool_name == "querydb":
        return querydb(args.get("sql", ""))
    elif tool_name == "get_tables":
        return get_tables()
    elif tool_name == "get_schema":
        return get_schema(args.get("table_name", ""))
    return "Unknown tool."

# ─────────────────────────────────────────────
# Agentic chat loop (tool-calling simulation)
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are Accurate AI, an expert assistant for background check operations in HR and staffing.

You help HR professionals, recruiters, and candidates query background check orders, statuses, companies, and search results.

You have access to a SQLite database with these tables:
- users: userid, name, role ('admin'/'company'/'subject'), email
- company: comp_id, comp_name, comp_code
- subject: subject_id, subject_name, subject_alias, subject_contact, subject_address1, subject_address2, sbj_city
- package: package_code, package_name, package_price, comp_code
- search_status: status_code, status (e.g. 'P'=PENDING, 'F'=FOUND, 'N'=NOT FOUND, 'C'=CANCELLED)
- search_type: search_type_code, search_type, search_type_category
- order_request: order_id, order_packageid, order_subjectid, order_companycode, order_status, order_packagecode
- search: searchid, package_req_id, subject_id, search_type_code, search_status, county_name, state_code, pkg_code, sub_status

Access Rules by Role:
- admin: full access to all data
- company: filter by order_companycode = user's comp_code (look up comp_code from company table using userid as comp_id)
- subject: filter by order_subjectid = user's subject_id or subject_id = user's subject_id
- guest: limited read access, no sensitive data

Database Rules:
- Never DELETE rows or DROP tables
- You may INSERT new rows only
- Never reveal internal user IDs or technical errors to users

To use a tool, output a JSON block like:
```tool
{"name": "querydb", "args": {"sql": "SELECT ..."}}
```

After using a tool and seeing the result, provide your final answer.

Always end your response with exactly 5 follow-up questions in a JSON block:
```followup
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
```

When showing data summaries (counts, distributions, comparisons), include a chart block:
```chart
{"type": "bar", "title": "Your Title", "data": [{"name": "Category", "value": 100}]}
```
Supported types: bar, line, pie, area"""


def run_agent_loop(user_message: str, history: list, user_info: dict | None) -> tuple[str, list]:
    """
    Run a multi-turn tool-calling loop with the HF model.
    Returns (final_text_response, followup_questions)
    """
    # Inject user context at start of conversation
    if not history:
        if user_info:
            context = f"[Context: User '{user_info.get('name')}' (email: {user_info.get('email')}, role: {user_info.get('role')}, userid: {user_info.get('userid')}) is now chatting. Greet them by name and answer their question.]"
        else:
            context = "[Context: Guest user is chatting. Greet them and assist with general background check questions. They have limited data access.]"
        history = [{"role": "system", "content": SYSTEM_PROMPT}]
        history.append({"role": "user", "content": context + "\n\n" + user_message})
    else:
        history.append({"role": "user", "content": user_message})

    max_iterations = 4
    for i in range(max_iterations):
        response = call_hf_model(history)

        # Check if response contains a tool call
        tool_match = re.search(r"```tool\s*([\s\S]*?)```", response)
        if tool_match:
            try:
                tool_call = json.loads(tool_match.group(1).strip())
                tool_name = tool_call.get("name", "")
                tool_args = tool_call.get("args", {})
                tool_result = run_tool(tool_name, tool_args)

                # Append assistant tool-call and tool result to history
                history.append({"role": "assistant", "content": response})
                history.append({"role": "user", "content": f"[Tool result for {tool_name}]:\n{tool_result}\n\nNow provide your final answer to the user based on this data."})
                continue
            except Exception:
                pass

        # No tool call — this is the final response
        history.append({"role": "assistant", "content": response})
        return response, history

    # Fallback if loop exhausted
    history.append({"role": "assistant", "content": response})
    return response, history


def parse_agent_response(raw: str) -> tuple[str, list, dict | None]:
    """Parse final response into display text, followup questions, and optional chart data."""
    followup = []
    chart_data = None

    # Extract followup questions
    followup_match = re.search(r"```followup\s*([\s\S]*?)```", raw)
    if followup_match:
        try:
            followup = json.loads(followup_match.group(1).strip())
            raw = raw.replace(followup_match.group(0), "").strip()
        except Exception:
            pass

    # Extract chart data
    chart_match = re.search(r"```chart\s*([\s\S]*?)```", raw)
    if chart_match:
        try:
            chart_data = json.loads(chart_match.group(1).strip())
            raw = raw.replace(chart_match.group(0), "").strip()
        except Exception:
            pass

    # Remove any leftover tool blocks
    raw = re.sub(r"```tool[\s\S]*?```", "", raw).strip()

    return raw, followup, chart_data

# ─────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────

app = FastAPI(title="Accurate DecisionOS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_session_table()
    init_decision_tables()

@app.post("/chat")
async def chat(chat: ChatMessage):
    try:
        session = load_session(chat.sessionid)
        history = session["history"]

        # Look up user from DB
        user_info = get_user_info(chat.userid)

        # If user_info not found and not guest, still proceed as guest
        if not user_info and chat.userid not in ("guest@accurate.ai", "8899"):
            # Try to register new user with a basic guest entry
            pass  # let agent handle it

        raw_response, updated_history = run_agent_loop(chat.message, history, user_info)
        display_text, followup, chart_data = parse_agent_response(raw_response)

        # Save updated session
        save_session(
            chat.sessionid,
            chat.userid,
            user_info["role"] if user_info else "guest",
            user_info["name"] if user_info else "Guest",
            updated_history,
        )

        response_payload = {"message": display_text, "followup": followup}
        if chart_data:
            response_payload["chart"] = chart_data
        return response_payload

    except Exception as e:
        return {"message": f"I encountered an error: {str(e)}. Please try again.", "followup": []}


@app.post("/decision/run")
async def decision_run(request: DecisionRequest):
    if not request.interaction.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="interaction is required")
    try:
        return run_decision_workflow(
            content=request.interaction,
            user_email=request.userid,
            session_id=request.sessionid,
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decision/review")
async def decision_review(request: RecommendationReview):
    try:
        return review_recommendation(
            recommendation_id=request.recommendation_id,
            status=request.status,
            note=request.note,
        )
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"message": "Accurate DecisionOS is running!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)