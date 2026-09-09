import sqlite3

connection = sqlite3.connect("database.db")

cursor = connection.cursor()

cursor.execute("SELECT * FROM customers LIMIT 10")

customers = cursor.fetchall()

for customer in customers:
    print(customer)

connection.close()