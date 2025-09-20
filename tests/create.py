import sqlite3

def crds():
    file = 'accurate.db'
    script = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        userid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'company', 'subject')),
        email TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS company (
        comp_id INTEGER PRIMARY KEY,
        comp_name TEXT,
        comp_code TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS subject (
        subject_id INTEGER PRIMARY KEY,
        subject_name TEXT,
        subject_alias TEXT,
        subject_contact TEXT,
        subject_address1 TEXT,
        subject_address2 TEXT,
        sbj_city TEXT
    );

    CREATE TABLE IF NOT EXISTS package (
        package_code INTEGER PRIMARY KEY,
        package_name TEXT,
        package_price REAL,
        comp_code TEXT,
        FOREIGN KEY (comp_code) REFERENCES company(comp_code)
    );

    CREATE TABLE IF NOT EXISTS search_status (
        status_code TEXT PRIMARY KEY,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS search_type (
        search_type_code TEXT PRIMARY KEY,
        search_type TEXT,
        search_type_category TEXT
    );

    CREATE TABLE IF NOT EXISTS order_request (
        order_id INTEGER PRIMARY KEY,
        order_packageid TEXT UNIQUE,
        order_subjectid INTEGER,
        order_companycode TEXT,
        order_status TEXT,
        order_packagecode INTEGER,
        FOREIGN KEY (order_subjectid) REFERENCES subject(subject_id),
        FOREIGN KEY (order_companycode) REFERENCES company(comp_code),
        FOREIGN KEY (order_status) REFERENCES search_status(status_code),
        FOREIGN KEY (order_packagecode) REFERENCES package(package_code)
    );

    CREATE TABLE IF NOT EXISTS search (
        searchid INTEGER PRIMARY KEY,
        package_req_id TEXT,
        subject_id INTEGER,
        search_type_code TEXT,
        search_status TEXT,
        county_name TEXT,
        state_code TEXT,
        pkg_code INTEGER,
        sub_status TEXT,
        FOREIGN KEY (package_req_id) REFERENCES order_request(order_packageid),
        FOREIGN KEY (subject_id) REFERENCES subject(subject_id),
        FOREIGN KEY (search_type_code) REFERENCES search_type(search_type_code),
        FOREIGN KEY (search_status) REFERENCES search_status(status_code),
        FOREIGN KEY (pkg_code) REFERENCES package(package_code)
    );
    """
    try:
        with sqlite3.connect(file) as connection:
            print(f"Successfully connected to SQLite database '{file}'")
            cursor = connection.cursor()
            cursor.executescript(script)
            print("Tables created successfully.")
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print("Created tables:", [table[0] for table in tables])
            cursor.execute("PRAGMA foreign_keys;")
            fk_status = cursor.fetchone()[0]
            print(f"Foreign keys enabled: {'Yes' if fk_status == 1 else 'No'}")
            connection.commit()
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
        raise
    print("Database setup complete.")

if __name__ == '__main__':
    crds()