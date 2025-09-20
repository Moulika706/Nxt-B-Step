import sqlite3

def crds():
    file = 'accurates.db'
    script = """
    CREATE TABLE IF NOT EXISTS users (
        userid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'company', 'subject')),
        email TEXT UNIQUE
    );
    """
    try:
        with sqlite3.connect(file) as connection:
            print(f"Successfully connected to SQLite database '{file}'")
            cursor = connection.cursor()
            cursor.executescript(script)
            connection.commit()
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
        raise
    print("Database Addon complete.")

if __name__ == '__main__':
    crds()