from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ambiguity_detector import detect_ambiguity
from sql_generator import generate_sql
from db_manager import (
    connect_database,
    get_schema_from_engine,
    execute_sql_on_engine,
    disconnect_database,
)
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← change to * temporarily to test
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectRequest(BaseModel):
    connection_string: str


class AnalyzeRequest(BaseModel):
    query: str
    clarifications: list[str] = []
    session_id: str


import math


class GenerateRequest(BaseModel):
    query: str
    clarifications: list[str] = []
    session_id: str
    limit: int = 20
    offset: int = 0


@app.get("/")
def root():
    return {"message": "Text-to-SQL backend is running"}


@app.post("/connect")
def connect(request: ConnectRequest):
    session_id = str(uuid.uuid4())
    result = connect_database(request.connection_string, session_id)
    if result["success"]:
        schema = get_schema_from_engine(session_id)
        return {"success": True, "session_id": session_id, "schema": schema}
    return {"success": False, "message": result.get("message") or result.get("error", "Connection failed")}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    schema = get_schema_from_engine(request.session_id)
    result = detect_ambiguity(request.query, schema)
    return result


@app.post("/generate")
def generate(request: GenerateRequest, limit: int = 20, offset: int = 0):
    eff_limit = limit if limit != 20 else request.limit
    eff_offset = offset if offset != 0 else request.offset

    schema = get_schema_from_engine(request.session_id)
    sql = generate_sql(request.query, schema, request.clarifications)
    exec_data = execute_sql_on_engine(sql, request.session_id, limit=eff_limit, offset=eff_offset)

    results = exec_data["results"]
    total_count = exec_data["total_count"]
    total_pages = max(1, math.ceil(total_count / eff_limit)) if eff_limit > 0 else 1
    current_page = (eff_offset // eff_limit) + 1 if eff_limit > 0 else 1

    return {
        "sql": sql,
        "results": results,
        "row_count": len(results),
        "total_count": total_count,
        "current_page": current_page,
        "total_pages": total_pages,
        "limit": eff_limit,
        "offset": eff_offset,
    }


@app.post("/disconnect")
def disconnect(session_id: str):
    disconnect_database(session_id)
    return {"message": "Disconnected"}
