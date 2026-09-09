import sqlite3  # this is for connecting to the database
from faker import Faker  # this is for generating fake data
import random  # this is for generating random numbers

fake = Faker()  # this is for generating fake data

connection = sqlite3.connect("database.db")
cursor = (
    connection.cursor()
)  # why we need this? because we need to execute SQL commands and queries on the database

cursor.executescript("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
""")

for _ in range(
    50
):  # here we are generating 50 fake customers and inserting them into the customers table
    name = fake.name()
    email = fake.email()

    cursor.execute(
        """insert into customers (name, email) values (?, ?) """, (name, email)
    )

for _ in range(
    30
):  # here we are generating 30 fake products and inserting them into the products table
    name = fake.catch_phrase()  # this is for generating random product names
    price = round(
        random.uniform(100.0, 10000.0), 2
    )  # this is for generating random prices between 100 and 10000

    cursor.execute(
        """insert into products (name, price) values (?, ?) """, (name, price)
    )

for _ in range(75):
    customer_id = random.randint(1, 50)
    order_date = fake.date_between(start_date="-1y", end_date="today").isoformat()
    total = round(random.uniform(500.0, 5000.0), 2)
    status = random.choice(["delivered", "pending", "cancelled"])
    cursor.execute(
        """
        INSERT INTO orders (customer_id, order_date, total, status)
        VALUES (?, ?, ?, ?)
        """,
        (customer_id, order_date, total, status),
    )

for order_id in range(1, 76):
    # Each order gets between 1 and 5 products
    number_of_items = random.randint(1, 5)
    # Prevent duplicate products in the same order
    product_ids = random.sample(range(1, 31), number_of_items)

for product_id in product_ids:
    quantity = random.randint(1, 5)
    unit_price = round(random.uniform(100.0, 10000.0), 2)
    cursor.execute(
        """
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
        """,
        (order_id, product_id, quantity, unit_price),
    )

connection.commit()
connection.close()


print("Database seeded successfully!")
