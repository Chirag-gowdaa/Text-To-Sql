import re
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key = os.getenv("GROQ_LLM_API_KEY"))

def generate_sql(query , schema, clarifications = []   ):
    clarification_text = (
        "\n".join([f"- {c}" for c in clarifications]) if clarifications else "None"
    )

    prompt = f"""
    You are a SQL analyst. You are given a database schema and a user query.
    Your job is to write an accurate SQL query for SQLite based on the user query and the schema.
    
    Database schema:
    {schema}
    
    User query: "{query}"
    
    Additional context from user:
    {clarification_text}
    
    IMPORTANT: Use only SQLite syntax. Only use table and column names that exist in the schema.
    For dates use datetime('now', '-7 days') not INTERVAL syntax.
    
    Return ONLY the SQL query. No explanation. No markdown. Just raw SQL:
    """

    response = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[{"role": "user", "content": prompt}],
        max_completion_tokens = 512,
        reasoning_effort = "none",
        temperature=0,
    )

    sql_query = extract_sql(response.choices[0].message.content.strip())

    return sql_query


def extract_sql(response):
    match = re.search(r"(SELECT\s+.*?;)", response, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else response.strip()


if __name__ == "__main__":
    user_query = "show me orders from last 7days"
    schema = """
    CREATE TABLE orders (
        id INT PRIMARY KEY,
        customer_id INT,
        order_date DATE,
        total_amount DECIMAL(10, 2)
    )
    """ #""" is used to create multi-line strings in Python. It allows you to include line breaks and indentation in the string without using escape characters.
    sql_query = generate_sql(user_query, schema)
    print("Generated SQL query:", sql_query)
