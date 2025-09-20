import sqlite3

def populate_users_table():
    file = 'accurate.db'
    
    users = [
        ('8899', 'Amazon Salesforce', 'company'),
    ]
    
    try:
        with sqlite3.connect(file) as connection:
            print(f"Successfully connected to SQLite database '{file}'")
            cursor = connection.cursor()
            
            cursor.executemany(
                "INSERT OR REPLACE INTO users (userid, name, role) VALUES (?, ?, ?)",
                users
            )
            
            print(f"Successfully inserted {len(users)} users into the users table.")
            
            cursor.execute("SELECT * FROM users ORDER BY role, userid;")
            users = cursor.fetchall()
            print("\nUsers table contents:")
            print("UserID | Name | Role")
            print("-" * 40)
            for user in users:
                print(f"{user[0]} | {user[1]} | {user[2]}")
                
            connection.commit()
            
    except sqlite3.Error as e:
        print(f"Database error occurred: {e}")
        raise
        
    print("\nUsers table population complete.")

if __name__ == '__main__':
    populate_users_table() 