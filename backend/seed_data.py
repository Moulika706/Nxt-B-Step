import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "accurate.db")

def seed_operational_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create operational tables
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS company (
            comp_code TEXT PRIMARY KEY,
            comp_name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS subject (
            subject_id INTEGER PRIMARY KEY,
            subject_name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS package (
            package_code TEXT PRIMARY KEY,
            package_name TEXT NOT NULL,
            package_price REAL
        );
        
        CREATE TABLE IF NOT EXISTS order_request (
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
        
        CREATE TABLE IF NOT EXISTS search (
            searchid INTEGER PRIMARY KEY,
            package_req_id TEXT,
            search_type_code TEXT,
            search_status TEXT,
            sub_status TEXT,
            FOREIGN KEY (package_req_id) REFERENCES order_request(order_packageid)
        );
        
        CREATE TABLE IF NOT EXISTS search_type (
            search_type_code TEXT PRIMARY KEY,
            search_type TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS search_status (
            status_code TEXT PRIMARY KEY,
            status TEXT NOT NULL
        );
    """)
    
    # Insert sample companies
    companies = [
        ('BRIGHT', 'BrightPath Staffing'),
        ('TECH', 'TechCorp Solutions'),
        ('HEALTH', 'HealthFirst Medical'),
        ('FIN', 'FinanceHub Inc'),
    ]
    cursor.executemany("INSERT OR REPLACE INTO company VALUES (?, ?)", companies)
    
    # Insert sample subjects
    subjects = [
        (1, 'John Smith'),
        (2, 'Sarah Johnson'),
        (3, 'Michael Brown'),
        (4, 'Emily Davis'),
    ]
    cursor.executemany("INSERT OR REPLACE INTO subject VALUES (?, ?)", subjects)
    
    # Insert sample packages
    packages = [
        ('STD', 'Standard Screening', 49.99),
        ('PREM', 'Premium Screening', 89.99),
        ('EXEC', 'Executive Screening', 149.99),
    ]
    cursor.executemany("INSERT OR REPLACE INTO package VALUES (?, ?, ?)", packages)
    
    # Insert search types
    search_types = [
        ('CRIM', 'Criminal Background'),
        ('EMP', 'Employment Verification'),
        ('EDU', 'Education Verification'),
        ('MVR', 'Motor Vehicle Record'),
        ('PRO', 'Professional License'),
    ]
    cursor.executemany("INSERT OR REPLACE INTO search_type VALUES (?, ?)", search_types)
    
    # Insert search statuses
    search_statuses = [
        ('P', 'Pending'),
        ('C', 'Complete'),
        ('D', 'Discrepant'),
        ('F', 'Failed'),
    ]
    cursor.executemany("INSERT OR REPLACE INTO search_status VALUES (?, ?)", search_statuses)
    
    # Insert sample orders
    orders = [
        (1, 'ORD-001', 1, 'BRIGHT', 'STD', 'P', (datetime.now() - timedelta(days=5)).isoformat()),
        (2, 'ORD-002', 2, 'TECH', 'PREM', 'P', (datetime.now() - timedelta(days=3)).isoformat()),
        (3, 'ORD-003', 3, 'HEALTH', 'EXEC', 'C', (datetime.now() - timedelta(days=10)).isoformat()),
        (4, 'ORD-004', 4, 'FIN', 'STD', 'P', (datetime.now() - timedelta(days=1)).isoformat()),
    ]
    cursor.executemany("INSERT OR REPLACE INTO order_request VALUES (?, ?, ?, ?, ?, ?, ?)", orders)
    
    # Insert sample searches with various statuses
    searches = [
        (1, 'ORD-001', 'CRIM', 'P', None),
        (2, 'ORD-001', 'EMP', 'D', 'Discrepancy found'),
        (3, 'ORD-001', 'EDU', 'C', None),
        (4, 'ORD-002', 'CRIM', 'P', None),
        (5, 'ORD-002', 'EMP', 'P', None),
        (6, 'ORD-002', 'MVR', 'P', None),
        (7, 'ORD-003', 'CRIM', 'C', None),
        (8, 'ORD-003', 'EMP', 'C', None),
        (9, 'ORD-004', 'CRIM', 'P', None),
        (10, 'ORD-004', 'EMP', 'P', None),
    ]
    cursor.executemany("INSERT OR REPLACE INTO search VALUES (?, ?, ?, ?, ?)", searches)
    
    conn.commit()
    conn.close()
    print("Sample data seeded successfully!")

if __name__ == "__main__":
    seed_operational_data()