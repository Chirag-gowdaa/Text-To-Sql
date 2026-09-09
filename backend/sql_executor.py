#what this page does it: here we are executing the sql query that we generated in the previous page(sql_generator) and returning the results to the frontend

import sqlite3

def execute_sql(sql: str) -> list[dict]:
    if not sql.strip().upper().startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed")

    connection = sqlite3.connect('database.db')
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()

    cursor.execute(sql)
    rows = cursor.fetchall()
    connection.close()

    return [dict(row) for row in rows]

if __name__ == "__main__":

    test_queries = [
        "SELECT * FROM customers LIMIT 5",
        "SELECT * FROM orders WHERE status = 'delivered' LIMIT 5",
        "SELECT * FROM products ORDER BY price DESC LIMIT 5",
    ]

    for sql in test_queries:
        print(f"\nQuery: {sql}")
        results = execute_sql(sql)
        for row in results:
            print(row)
        print("-" * 50)
