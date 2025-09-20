import sqlite3

def add_users():
    file = 'accurate.db'
    script = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        userid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'company', 'subject'))
    );
    """
    
    try:
        with sqlite3.connect(file) as connection:
            print(f"Successfully connected to SQLite database '{file}'")
            cursor = connection.cursor()
            cursor.executescript(script)
            print("Users table created successfully.")
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
            table_exists = cursor.fetchone()
            if table_exists:
                print("Users table confirmed in database.")
                
                cursor.execute("PRAGMA table_info(users);")
                columns = cursor.fetchall()
                print("Users table schema:")
                
                for col in columns:
                    print(f"  - {col[1]} ({col[2]})")
            
            connection.commit()
            
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
        raise
        
    print("Users table setup complete.")

if __name__ == '__main__':
    add_users() 