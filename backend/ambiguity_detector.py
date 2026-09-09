# When a user types a query like "show me top customers" — the system doesn't know:

# Top by what? (revenue? order count?)
# Top how many? (5? 10? 100?)
# From when? (this month? all time?)
# Thats ambiguity. the query is uncear the llm's job is to detect this and return a structure answer.


import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()  # Load environment variables from .env file

client = Groq(api_key=os.getenv("GROQ_LLM_API_KEY"))


def detect_ambiguity(user_query: str, schema: str) -> dict:
    prompt = (
        """
        You are a SQL analyst. You are given a database schema and a user query.
        Your job is to check if the query is too vague to write accurate SQL.
        
        Database schema:
        """
                + schema
                + """
        
        User query: \""""
                + user_query
                + """\"
        
        Examples of AMBIGUOUS queries:
        - "show me recent orders" → recent is not defined
        - "top customers" → top by what? how many?
        - "active users" → what makes a user active?
        - "show me sales" → which time period?
        
        Examples of CLEAR queries:
        - "show me orders from last 7 days"
        - "top 5 customers by total revenue in 2025"
        - "all products with stock less than 10"
        
        Return ONLY this JSON. No explanation. No markdown. Just raw JSON:
        {
          "is_ambiguous": true or false,
          "reason": "what is unclear, or null if clear",
          "clarification_question": "one question to ask the user, or null if clear",
          "confidence": a number between 0.0 and 1.0
        }
        """
    )
    response = client.chat.completions.create(
        model="qwen/qwen3.6-27b",  # ← use this
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    print("Raw response from LLM:", raw)

    start = raw.find("{")

    if start == -1:
        raise ValueError(f"No JSON object found in LLM response:\n{raw}")

    decoder = json.JSONDecoder()

    result, end = decoder.raw_decode(raw[start:])

    return result


if __name__ == "__main__":

    # Hardcode a fake schema for now (later this comes from your DB)
    fake_schema = """
    CREATE TABLE customers (id INTEGER, name TEXT, email TEXT, city TEXT);
    CREATE TABLE orders (id INTEGER, customer_id INTEGER, total REAL, created_at DATETIME, status TEXT);
    CREATE TABLE products (id INTEGER, name TEXT, category TEXT, price REAL, stock INTEGER);
    """

    test_queries = [
        "show me top customers",
        "show me recent orders",
        "which products are low on stock",
        "show me top 5 customers by revenue this month",
        "all orders from last 7 days",
        "active users this week",
    ]

    for query in test_queries:
        print(f"\nQuery: {query}")
        result = detect_ambiguity(query, fake_schema)
        print(f"Ambiguous: {result['is_ambiguous']}")
        print(f"Reason: {result['reason']}")
        print(f"Question: {result['clarification_question']}")
        print(f"Confidence: {result['confidence']}")
        print("-" * 50)
