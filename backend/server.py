import sqlite3
from mcp.server.fastmcp import FastMCP
import asyncio

# Initialize MCP server
mcp = FastMCP("Accurate DB Server")

# Database Connection
def getconn():
    path = os.path.join(os.path.dirname(__file__), 'accurate.db')
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

@mcp.tool()
def querydb(sql: str) -> str:
    """Execute a SQL query on the accurate.db database"""
    try:
        conn = getconn()
        cursor = conn.cursor()
        cursor.execute(sql)
        
        if sql.strip().upper().startswith('SELECT'):
            results = cursor.fetchall()
            return str([dict(row) for row in results])
        else:
            conn.commit()
            return f"Query executed successfully. Rows affected: {cursor.rowcount}"
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        conn.close()

@mcp.tool()
def get_tables() -> str:
    """Get all table names from the database"""
    return querydb("SELECT name FROM sqlite_master WHERE type='table'")

@mcp.tool()
def get_schema(table_name: str) -> str:
    """Get the schema for a specific table"""
    return querydb(f"PRAGMA table_info({table_name})")

if __name__ == "__main__":
    mcp.run()