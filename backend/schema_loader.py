import sqlite3
def get_schema()-> str:
    connection = sqlite3.connect('database.db')
    cursor = connection.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    connection.close()
    return "\n".join([t[0] for t in tables if t[0]])

if __name__ == "__main__":
    print(get_schema())
