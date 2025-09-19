import sqlite3

def crds():
    """
    Creates the SQLite database and all the necessary tables.
    """
    file = 'accurate.db'
    
    # The complete SQL script to create all tables
    script = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE companies (
        company_id INTEGER PRIMARY KEY,
        company_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE candidates (
        candidate_id INTEGER PRIMARY KEY,
        full_name TEXT NOT NULL,
        alias TEXT,
        contact_info TEXT,
        address TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE packages (
        package_id INTEGER PRIMARY KEY,
        company_id INTEGER NOT NULL,
        package_name TEXT NOT NULL,
        package_price REAL,
        description TEXT,
        FOREIGN KEY (company_id) REFERENCES companies (company_id)
    );

    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        package_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id),
        FOREIGN KEY (company_id) REFERENCES companies (company_id),
        FOREIGN KEY (package_id) REFERENCES packages (package_id)
    );

    CREATE TABLE components (
        component_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL,
        search_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
    );

    CREATE TABLE order_status (
        history_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
    );
    """
    
    connection = None
    try:
        # 1. Connect to the database (this will create the file if it doesn't exist)
        connection = sqlite3.connect(file)
        print(f"Successfully connected to SQLite database '{file}'")
        
        # 2. Create a cursor object to execute SQL commands
        cursor = connection.cursor()
        
        # 3. Execute the entire script
        cursor.executescript(script)
        print("Executing SQL script to create tables...")
        
        # 4. Commit the changes to save them to the database file
        connection.commit()
        print("Tables created and database setup complete.")
        
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        
    finally:
        # 5. Close the connection
        if connection:
            connection.close()
            print("Database connection closed.")

if __name__ == '__main__':
    crds()