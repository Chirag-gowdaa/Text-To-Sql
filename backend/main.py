from fastapi import FastAPI
from pydantic import BaseModel
from ambiguity_detector import detect_ambiguity
from sql_generator import generate_sql
from sql_executor import execute_sql
from schema_loader import get_schema
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    query: str
    clarifications: list[str] = []
    
class GenerateRequest(BaseModel):
    query: str
    clarifications: list[str] = []
    
@app.get("/")
def root():
    return {"message": "Welcome to the SQL Query Analyzer and Generator API!"}

@app.post("/analyze")
def analyze(request: AnalyzeRequest): # this takes query from user, runs ambiguity detector and returns results
    schema = get_schema()
    result = detect_ambiguity(request.query,schema)
    return result

@app.post("/generate")
def generate(request: GenerateRequest): # this takes query from user, generates SQL --> executes the sql and retuns the data.
    schema = get_schema()
    sql = generate_sql(request.query, schema,request.clarifications)
    results = execute_sql(sql)
    return {"sql": sql, "results": results, "row_count": len(results)}