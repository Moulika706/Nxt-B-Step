import sqlite3
import re

# Connect to the SQLite database
conn = sqlite3.connect('accurate.db')
cursor = conn.cursor()

def clean_company_name(name):
    if name:
        cleaned_name = re.sub(r'^\*+|\*+$', '', name).strip()
        return cleaned_name
    return name

try:
    cursor.execute("SELECT rowid, comp_name FROM company")
    companies = cursor.fetchall()

    for rowid, comp_name in companies:
        cleaned_name = clean_company_name(comp_name)
        if cleaned_name != comp_name:
            cursor.execute("UPDATE company SET comp_name = ? WHERE rowid = ?", (cleaned_name, rowid))
            print(f"Updated: '{comp_name}' to '{cleaned_name}'")

    conn.commit()
    print("Database cleaning completed successfully.")

except sqlite3.Error as e:
    print(f"An error occurred: {e}")

finally:
    conn.close()