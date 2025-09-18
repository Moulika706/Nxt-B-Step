import os
import asyncio, sys
from fastapi import FastAPI
from dotenv import load_dotenv
from pydantic import BaseModel
from agents import Agent, Runner
from agents.mcp.server import MCPServerStdio

load_dotenv()

app = FastAPI(title="Accurate AI")

class ChatMessage(BaseModel):
    message: str
    session: str

chat = None
agent = None
session = None

async def init():

    global agent, session
    server_path = os.path.join(os.path.dirname(__file__), "server.py")

    mcp_server = MCPServerStdio(
        name="Accurate DB Server",
        params={
            "command": sys.executable,
            "args": [server_path, "--server_type=stdio"]
        }
    )
    
    try:
        await mcp_server.connect()
        
        agent = Agent(
            name="Database Agent",
            model="gpt-4.1-nano",
            instructions="""
            You are the Accurate Chatbot, an expert AI assistant for HR and recruitment professionals. 
            Your primary purpose is to provide fast and accurate information about background check orders by querying a SQLite database. 
            You are helpful, precise, and an expert on the background check lifecycle.
            - Query the accurate.db database using the querydb tool
            - Get table names using get_tables tool  
            - Get table schemas using get_schema tool
            First, understand the user's intent. Second, identify the necessary tables and columns. Third, construct the correct SQL query. 
            Finally, interpret the query result and provide a clear, conversational answer.
            When a user asks about a candidate by name, use the LIKE operator in your SQL query to ensure a match (e.g., WHERE c.full_name LIKE '%Tony Stark%').
            Here are database ideas so you can navigate the database: Database Schema
            companies
                - company_id (INTEGER PRIMARY KEY): Unique ID for a client company.
                - company_name (TEXT): The name of the client company.
            candidates
                - candidate_id (INTEGER PRIMARY KEY): Unique ID for a candidate.
                - full_name (TEXT): The full name of the person being screened.
            packages
                - package_id (INTEGER PRIMARY KEY): Unique ID for a screening package.
                - package_name (TEXT): The name of the package, e.g., 'Smokey Bear 3.0'.
            orders
                - order_id (INTEGER PRIMARY KEY): Unique ID for an order.
                - candidate_id (INTEGER): Foreign key linking to the candidates table.
                - company_id (INTEGER): Foreign key linking to the companies table.
                - package_id (INTEGER): Foreign key linking to the packages table.
                - status (TEXT): The current status of the order (e.g., 'Completed', 'Pending', 'In Adjudication').
                - created_at (TEXT): The timestamp when the order was created.
                - completed_at (TEXT): The timestamp when the order was completed.
            components
                - component_id (INTEGER PRIMARY KEY): Unique ID for a single search.
                - order_id (INTEGER): Links to the parent order.
                - search_type (TEXT): The type of search, e.g., 'CRIM' (Criminal), 'EDU' (Education), 'MVR' (Motor Vehicle).
                - status (TEXT): The status of this specific component.
            order_status
                - history_id (INTEGER PRIMARY KEY): Unique ID for a status change event.
                - order_id (INTEGER): Links to the parent order.
                - status (TEXT): The status at that point in time.
                - notes (TEXT): Crucial information explaining WHY the status was set. Use this to answer questions about delays or specific statuses.
                - changed_at (TEXT): The exact time the status changed.
            Always be helpful and provide clear responses about the database data.""",
            mcp_servers=[mcp_server]
        )

        return True
            
    except Exception as e:
        print(f"Error initializing agent: {e}")
        return False

@app.on_event("startup")
async def startups():
    await init()

@app.post("/chat")
async def chat(chat: ChatMessage):
    global agent, session
    if not agent:
        return {"error": "Agent not initialized"}
    
    try:
        result = await Runner.run(agent, chat.message)
        return {"response": result.final_output}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Accurate AI is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)