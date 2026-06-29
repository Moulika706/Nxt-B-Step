def seed_operational_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop existing operational tables if they exist
    cursor.executescript("""
        DROP TABLE IF EXISTS search;
        DROP TABLE IF EXISTS order_request;
        DROP TABLE IF EXISTS subject;
        DROP TABLE IF EXISTS package;
        DROP TABLE IF EXISTS company;
        DROP TABLE IF EXISTS search_type;
        DROP TABLE IF EXISTS search_status;
    """)
    
    # Create operational tables
    cursor.executescript("""
        CREATE TABLE company (
            comp_code TEXT PRIMARY KEY,
            comp_name TEXT NOT NULL
        );
        
        CREATE TABLE subject (
            subject_id INTEGER PRIMARY KEY,
            subject_name TEXT NOT NULL
        );
        
        CREATE TABLE package (
            package_code TEXT PRIMARY KEY,
            package_name TEXT NOT NULL,
            package_price REAL
        );
        
        CREATE TABLE order_request (
            order_id INTEGER PRIMARY KEY,
            order_packageid TEXT NOT NULL,
            order_subjectid INTEGER,
            order_companycode TEXT,
            order_packagecode TEXT,
            order_status TEXT,
            created_at TEXT,
            FOREIGN KEY (order_subjectid) REFERENCES subject(subject_id),
            FOREIGN KEY (order_companycode) REFERENCES company(comp_code),
            FOREIGN KEY (order_packagecode) REFERENCES package(package_code)
        );
        
        CREATE TABLE search (
            searchid INTEGER PRIMARY KEY,
            package_req_id TEXT,
            search_type_code TEXT,
            search_status TEXT,
            sub_status TEXT,
            FOREIGN KEY (package_req_id) REFERENCES order_request(order_packageid)
        );
        
        CREATE TABLE search_type (
            search_type_code TEXT PRIMARY KEY,
            search_type TEXT NOT NULL
        );
        
        CREATE TABLE search_status (
            status_code TEXT PRIMARY KEY,
            status TEXT NOT NULL
        );
    """)