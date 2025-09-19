import sqlite3
import random
from datetime import datetime, timedelta

def populate():
    """
    Populates the SQLite database with test data.
    """
    file = 'accurate.db'
    connection = None

    try:
        connection = sqlite3.connect(file)
        cursor = connection.cursor()
        print(f"Successfully connected to SQLite database '{file}'")
        
        # Enable Foreign Keys
        cursor.execute("PRAGMA foreign_keys = ON;")

        # Insert Companies
        print("Inserting companies...") 
        companies = [('Innovate Inc.',), ('Cyber Systems Ltd.',), ('Quantum Solutions',)]
        cursor.executemany("INSERT INTO companies (company_name) VALUES (?)", companies)

        # Insert Candidates
        print("Inserting candidates...")
        candidates = [
            ('Tony Stark', 'Iron Man', 'tony@stark.com', '10880 Malibu Point'),
            ('Steve Rogers', 'Captain America', 'steve@avengers.com', '569 Leaman Place, Brooklyn'),
            ('Natasha Romanoff', 'Black Widow', 'nat@avengers.com', 'Unknown'),
            ('Bruce Banner', 'Hulk', 'bruce@culver.edu', 'Dayton, Ohio'),
            ('Diana Prince', 'Wonder Woman', 'diana@them.com', 'Themyscira')
        ]
        cursor.executemany(
            "INSERT INTO candidates (full_name, alias, contact_info, address) VALUES (?, ?, ?, ?)",
            candidates
        )

        # Insert Packages
        print("Inserting packages...")
        packages = [
            ('Smokey Bear 3.0', 1, 150.0, 'Standard background check with criminal and education verification.'),
            ('Executive Tier', 2, 350.0, 'Comprehensive check for executive roles, includes MVR.'),
            ('Basic Check', 1, 75.0, 'Simple criminal record check.'),
            ('Global Verified', 3, 500.0, 'International screening for all components.')
        ]
        cursor.executemany(
            "INSERT INTO packages (package_name, company_id, package_price, description) VALUES (?, ?, ?, ?)",
            packages
        )

        # Insert Orders, Components, and Status History
        print("Inserting orders and their history...")
        
        def get_timestamp(days_ago):
            return (datetime.now() - timedelta(days=days_ago)).isoformat()

        # Order 1: Completed quickly
        cursor.execute(
            "INSERT INTO orders (candidate_id, company_id, package_id, status, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (1, 1, 1, 'Completed', get_timestamp(5), get_timestamp(3), get_timestamp(3))
        )
        order_1_id = cursor.lastrowid
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)", (order_1_id, 'CRIM', 'Record Not Found', get_timestamp(5), get_timestamp(4)))
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)", (order_1_id, 'EDU', 'Verified', get_timestamp(5), get_timestamp(3)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_1_id, 'Pending', 'Order initiated.', get_timestamp(5)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_1_id, 'Completed', 'All components verified.', get_timestamp(3)))
        
        # Order 2: In Adjudication
        cursor.execute(
            "INSERT INTO orders (candidate_id, company_id, package_id, status, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (2, 2, 2, 'In Adjudication', get_timestamp(10), get_timestamp(1), None)
        )
        order_2_id = cursor.lastrowid
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)", (order_2_id, 'CRIM', 'Record Found', get_timestamp(10), get_timestamp(2)))
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at) VALUES (?, ?, ?, ?)", (order_2_id, 'MVR', 'Pending', get_timestamp(10)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_2_id, 'Pending', 'Order initiated.', get_timestamp(10)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_2_id, 'In Adjudication', 'Discrepancy found in criminal record. Awaiting client review.', get_timestamp(1)))

        # Order 3: Pending
        cursor.execute(
            "INSERT INTO orders (candidate_id, company_id, package_id, status, created_at) VALUES (?, ?, ?, ?, ?)",
            (3, 1, 3, 'Pending', get_timestamp(2))
        )
        order_3_id = cursor.lastrowid
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at) VALUES (?, ?, ?, ?)", (order_3_id, 'CRIM', 'In Progress', get_timestamp(2)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_3_id, 'Pending', 'Awaiting candidate documentation to proceed.', get_timestamp(2)))

        # Order 4: Completed after a long time
        cursor.execute(
            "INSERT INTO orders (candidate_id, company_id, package_id, status, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (4, 3, 4, 'Completed', get_timestamp(20), get_timestamp(8), get_timestamp(8))
        )
        order_4_id = cursor.lastrowid
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)", (order_4_id, 'CRIM', 'Record Not Found', get_timestamp(20), get_timestamp(15)))
        cursor.execute("INSERT INTO components (order_id, search_type, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?)", (order_4_id, 'EDU', 'Verified', get_timestamp(20), get_timestamp(8)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_4_id, 'Pending', 'Order initiated.', get_timestamp(20)))
        cursor.execute("INSERT INTO order_status (order_id, status, notes, changed_at) VALUES (?, ?, ?, ?)", (order_4_id, 'Completed', 'All components verified.', get_timestamp(8)))

        # Commit the transaction
        connection.commit()
        print("Test data inserted successfully.")

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        if connection:
            connection.rollback()
            print("Transaction rolled back.")
    finally:
        if connection:
            connection.close()
            print("Database connection closed.")

if __name__ == '__main__':
    populate()