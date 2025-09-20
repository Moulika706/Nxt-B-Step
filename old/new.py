import os
import asyncio, sys
from fastapi import FastAPI
from dotenv import load_dotenv
from pydantic import BaseModel
from contextlib import asynccontextmanager
from agents.mcp.server import MCPServerStdio
from agents import Agent, Runner, SQLiteSession

load_dotenv()

agent = None

class ChatMessage(BaseModel):
    message: str
    sessionid: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    agent = await init()
    yield

app = FastAPI(title="Accurate AI", lifespan=lifespan)

async def init():
    global agent

    server = os.path.join(os.path.dirname(__file__), "server.py")

    dbmcp = MCPServerStdio(
        name="Accurate DB Server",
        params={
            "command": sys.executable,
            "args": [server, "--server_type=stdio"]
        }
    )
    
    try:
        await dbmcp.connect()
        
        agent = Agent(
            name="Accurate Agent",
            model="gpt-4.1-nano",
            instructions="""
            You are the Accurate Chatbot, an expert AI assistant for HR and recruitment professionals. 
            Your primary purpose is to provide fast and accurate information about background check orders by querying a SQLite database. 
            You are helpful, precise, and an expert on the background check lifecycle.
            - Query the accurate.db database using the querydb tool
            - Get table names using get_tables tool & Get table schemas using get_schema tool
            First, understand the user's intent. Second, identify the necessary tables and columns. Third, construct the correct SQL query. 
            Finally, interpret the query result and provide a clear, conversational answer.
            When a user asks about a candidate by name, use the LIKE operator in your SQL query to ensure a match (e.g., WHERE subject.subject_name LIKE '%Tony Stark%').
            Here are database ideas so you can navigate the database: Database Schema
            company
                - comp_id (INTEGER PRIMARY KEY): Unique ID for a client company.
                - comp_name (TEXT): The name of the client company.
                - comp_code (TEXT UNIQUE): Short code for the company.
            subject
                - subject_id (INTEGER PRIMARY KEY): Unique ID for a subject.
                - subject_name (TEXT): The name of the subject.
                - subject_alias (TEXT): The alias of the subject.
                - subject_contact (TEXT): The contact information of the subject.
                - subject_address1 (TEXT): The address of the subject.
                - subject_address2 (TEXT): The address of the subject.
                - sbj_city (TEXT): The city of the subject.
            package
                - package_code (INTEGER PRIMARY KEY): Unique ID for a screening package.
                - package_name (TEXT): The name of the package, e.g., 'General Package'.
                - package_price (REAL): Cost of the package.
                - comp_code (TEXT): Foreign key linking to company.comp_code.
            search_status
                - status_code (TEXT PRIMARY KEY): Short code for status (e.g., 'C', 'P').
                - status (TEXT): Description of the status (e.g., 'CANCELLED', 'PENDING').
            search_type
                - search_type_code (TEXT PRIMARY KEY): Short code for search type (e.g., 'MVR', 'EMP').
                - search_type (TEXT): Description of the search type (e.g., 'MOTOR VEHICLE REPORT').
                - search_type_category (TEXT): Category of the search (e.g., 'G', 'CRI').
            order_request
                - order_id (INTEGER PRIMARY KEY): Unique ID for an order.
                - order_packageid (TEXT UNIQUE): Package ID string for the order.
                - order_subjectid (INTEGER): Foreign key linking to subject.subject_id.
                - order_companycode (TEXT): Foreign key linking to company.comp_code.
                - order_status (TEXT): Foreign key linking to search_status.status_code (e.g., 'P' for PENDING).
                - order_packagecode (INTEGER): Foreign key linking to package.package_code.
            search
                - searchid (INTEGER PRIMARY KEY): Unique ID for a single search/component.
                - package_req_id (TEXT): Foreign key linking to order_request.order_packageid.
                - subject_id (INTEGER): Foreign key linking to subject.subject_id.
                - search_type_code (TEXT): Foreign key linking to search_type.search_type_code.
                - search_status (TEXT): Foreign key linking to search_status.status_code.
                - county_name (TEXT): County for the search.
                - state_code (TEXT): State code for the search.
                - pkg_code (INTEGER): Foreign key linking to package.package_code.
                - sub_status (TEXT): Sub-status details (e.g., 'Discrepancy Found').
            Always be helpful and provide clear responses about the database data.""",
            mcp_servers=[dbmcp]
        )

        return True
            
    except Exception as e:
        print(f"Error initializing agent: {e}")
        return False

@app.post("/chat")
async def chat(chat: ChatMessage):
    global agent
    session = SQLiteSession(chat.sessionid)
    if not agent:
        return {"error": "Agent not initialized"}
    try:
        result = await Runner.run(agent, chat.message, session=session)
        return {"response": result.final_output}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Accurate AI Working!"}

if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        pass