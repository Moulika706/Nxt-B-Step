import sqlite3
import pandas as pd
import numpy as np

def migrate():
    # Connect to the SQLite database
    conn = sqlite3.connect('accurate.db')
    print("Connected to SQLite database 'accurate.db'")

    # Define the sheets and corresponding table names
    sheet_to_table = [
        ('Search_status', 'search_status'),
        ('Search_Type Table', 'search_type'),
        ('Company Table', 'company'),
        ('Subject Table', 'subject'),
        ('Package Table', 'package'),
        ('Order_Request Table', 'order_request'),
        ('Search Table', 'search')
    ]

    # Path to the Excel file
    excel_file = 'dataset.xlsx'

    for sheet_name, table_name in sheet_to_table:
        print(f"Processing sheet '{sheet_name}' into table '{table_name}'")
        
        # Read the sheet, assuming first row is header
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        # Lowercase the column names to match DB schema
        df.columns = [col.lower() for col in df.columns]
        
        # Handle the typo in order_request table
        if table_name == 'order_request':
            if 'order_packcagecode' in df.columns:
                df.rename(columns={'order_packcagecode': 'order_packagecode'}, inplace=True)
        
        # Replace 'NULL' strings with np.nan (which becomes None in SQL)
        df = df.replace('NULL', np.nan)
        
        # Optional: strip whitespace from string columns
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].str.strip() if df[col].dtype == 'object' else df[col]
        
        # Insert into the table (append if exists, no index)
        df.to_sql(table_name, conn, if_exists='append', index=False)
        
        print(f"Inserted {len(df)} rows into '{table_name}'")

    # Commit and close
    conn.commit()
    conn.close()
    print("Data migration complete.")

if __name__ == '__main__':
    migrate()