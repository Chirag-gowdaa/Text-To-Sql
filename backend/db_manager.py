# why i created this folder? the prpbelm was first i hardcoded database.db in order to solve that now i caan connect with any database with just providing connection string.
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

active_engine = {}


def connect_database(connection_string: str, session_id: str) -> dict:
    try:
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        active_engine[session_id] = engine
        return {"success":True}
    except Exception as e:
        return {"success":False, "error": str(e)}


def get_schema_from_engine(session_id: str)-> str:
    engine = active_engine.get(session_id)
    if not engine:
        raise ValueError("No active engine found for the provided session ID.")

    dialect = engine.dialect.name

    with engine.connect() as conn:
        if dialect == "sqlite":
            result = conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table'")
            )
            tables = [row[0] for row in result if row[0]]
            return "\n".join(tables)

        elif dialect == "postgressql":
            result = conn.execute(text("""
                                       SELECT table_nname FROM information_schema.tables
                                       WHERE table_schema = 'public"""))
            table_names = [row[0] for row in result]
            schema_parts = []
            for table in table_names:
                col_result = conn.execute(text(f"""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                """))
                cols = ", ".join([f"{r[0]} {r[1]}" for r in col_result])
                schema_parts.append(f"CREATE TABLE {table} ({cols});")
            return "\n".join(schema_parts)
        elif dialect == "mysql":
            result = conn.execute(text("SHOW TABLES"))
            table_names = [row[0] for row in result]
            schema_parts = []
            for table in table_names:
                col_result = conn.execute(text(f"DESCRIBE {table}"))
                cols = ", ".join([f"{r[0]} {r[1]}" for r in col_result])
                schema_parts.append(f"CREATE TABLE {table} ({cols});")
            return "\n".join(schema_parts)


def execute_sql_on_engine(sql: str, session_id: str, limit: int = 20, offset: int = 0) -> dict:
    engine = active_engine.get(session_id)
    if not engine:
        raise ValueError("No active connection for this session")

    clean_sql = sql.strip().rstrip(";")
    if not clean_sql.upper().startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed")

    with engine.connect() as conn:
        # Total count query
        count_sql = f"SELECT COUNT(*) FROM ({clean_sql}) AS subquery"
        count_result = conn.execute(text(count_sql))
        total_count = count_result.scalar() or 0

        # Paginated results query
        paginated_sql = f"SELECT * FROM ({clean_sql}) AS subquery LIMIT {limit} OFFSET {offset}"
        result = conn.execute(text(paginated_sql))
        columns = result.keys()
        rows = result.fetchall()
        rows_data = [dict(zip(columns, row)) for row in rows]

        return {
            "results": rows_data,
            "total_count": total_count,
        }


def disconnect_database(session_id: str):
    if session_id in active_engine:
        active_engine[session_id].dispose()
        del active_engine[session_id]
