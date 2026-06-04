import sqlite3

def add_columns():
    conn = sqlite3.connect('uhlis.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE medical_records ADD COLUMN file_path VARCHAR")
        print("Added file_path column.")
    except sqlite3.OperationalError as e:
        print("file_path:", e)
        
    try:
        cursor.execute("ALTER TABLE medical_records ADD COLUMN summary TEXT")
        print("Added summary column.")
    except sqlite3.OperationalError as e:
        print("summary:", e)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
