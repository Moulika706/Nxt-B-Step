import os
import sqlite3
from mcp.server.fastmcp import FastMCP

DB_PATH = os.path.join(os.path.dirname(__file__), "accurate.db")

mcp = FastMCP("Accurate DB Server")

def getconn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def querydb(sql: str) -> str:
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

def get_tables() -> str:
    return querydb("SELECT name FROM sqlite_master WHERE type='table'")

def get_schema(table_name: str) -> str:
    return querydb(f"PRAGMA table_info({table_name})")

@mcp.tool()
def querydb_tool(sql: str) -> str:
    return querydb(sql)

@mcp.tool()
def get_tables_tool() -> str:
    return get_tables()

@mcp.tool()
def get_schema_tool(table_name: str) -> str:
    return get_schema(table_name)

if __name__ == "__main__":
    mcp.run()