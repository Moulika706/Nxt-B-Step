import os
import asyncio, sys, json
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
from contextlib import asynccontextmanager
import requests

from decision_platform import init_decision_tables, review_recommendation, run_decision_workflow

load_dotenv()

agent = None
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "microsoft/Phi-3.5-mini-instruct")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_decision_tables()
    yield


app = FastAPI(title="Accurate DecisionOS", lifespan=lifespan)

async def init():
    return True


def call_huggingface(prompt: str) -> str:
    if not HF_API_TOKEN:
        return "Hugging Face token is not configured. Set HF_API_TOKEN before running the app."

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 250,
            "temperature": 0.7,
            "return_full_text": False,
        },
    }

    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list) and data:
            if isinstance(data[0], dict) and "generated_text" in data[0]:
                return data[0]["generated_text"].strip()

        if isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip()

        return str(data)
    except Exception as e:
        return f"Hugging Face request failed: {str(e)}"


def local_fallback_response(message: str, user_email: str) -> dict[str, object]:
    lowered = message.lower()
    if any(word in lowered for word in ["status", "pending", "delay", "discrepancy", "risk"]):
        return {
            "message": "The planner can help surface pending blockers, discrepancies, and the next best action for the current case.",
            "followup": [
                "Show me the current risks",
                "What should I do next for this order?",
                "Summarize the latest blockers",
            ],
        }

    return {
        "message": f"Hello {user_email.split('@')[0]}, the local decision workflow is available and ready for review.",
        "followup": [
            "Run the planner for this interaction",
            "Show me the latest risks",
            "What actions should I take next?",
        ],
    }


def _fallback_chat_response(message: str, user_email: str):
    lowered = message.lower()

    if any(word in lowered for word in ["status", "pending", "delay", "discrepancy", "risk"]):
        return {
            "message": "I can help review the current case and surface the next best action. The planner can identify pending searches, discrepancies, and recommended follow-up steps.",
            "followup": [
                "Show me the current risks",
                "What should I do next for this order?",
                "Summarize the latest blockers",
            ],
        }

    return {
        "message": f"Hello {user_email.split('@')[0]}, I can help review decisions and next-best actions for this workflow.",
        "followup": [
            "Run the planner for this interaction",
            "Show me the latest risks",
            "What actions should I take next?",
        ],
    }


@app.post("/chat")
async def chat(chat: ChatMessage):
    try:
        prompt = f"""
You are a helpful assistant for a decision platform.
User message: {chat.message}

Reply briefly, clearly, and helpfully.
"""
        reply = call_huggingface(prompt)

        if reply.startswith("Hugging Face request failed"):
            return local_fallback_response(chat.message, chat.userid)

        return {
            "message": reply,
            "followup": [
                "Show me the current risks",
                "What should I do next for this order?",
                "Summarize the latest blockers",
            ],
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/decision/run")
async def decision_run(request: DecisionRequest):
    if not request.interaction.strip():
        raise HTTPException(status_code=400, detail="interaction is required")

    try:
        return run_decision_workflow(
            content=request.interaction,
            user_email=request.userid,
            session_id=request.sessionid,
        )
    except Exception as e:
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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Accurate DecisionOS Working!"}