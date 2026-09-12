import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()  # Load environment variables from .env file

client = Groq(api_key=os.getenv("GROQ_LLM_API_KEY"))

response = client.chat.completions.create(
    model="groq/compound-mini",
    messages=[
        {
            "role": "user",
            "content": "Hello badass! explain what sqlite is in one sentence.",
        }
    ],
)

print(response.choices[0].message.content)
