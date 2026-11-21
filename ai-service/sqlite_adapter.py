import os
import re
import sqlite3


def translate_tsql_to_sqlite(sql: str) -> str:
    s = sql

    # 0. Unicode string literals N'...' -> '...' (safe negative lookbehind so identifiers ending in N are untouched)
    s = re.sub(r"(?<![A-Za-z0-9_])N'", "'", s)

    # 1. Functions: CONVERT(NVARCHAR(50), GETDATE(), 120), GETDATE(), ISNULL -> COALESCE, SCOPE_IDENTITY(), NEWID()
    s = re.sub(
        r"\bCONVERT\s*\(\s*N?VARCHAR\s*\(\s*\d+\s*\)\s*,\s*GETDATE\s*\(\s*\)\s*(?:,\s*\d+\s*)?\)",
        "datetime('now', 'localtime')",
        s,
        flags=re.IGNORECASE,
    )
    s = re.sub(r"\bISNULL\s*\(", "COALESCE(", s, flags=re.IGNORECASE)
    s = re.sub(r"\bGETDATE\s*\(\s*\)", "datetime('now', 'localtime')", s, flags=re.IGNORECASE)
    s = re.sub(r"\bSCOPE_IDENTITY\s*\(\s*\)", "last_insert_rowid()", s, flags=re.IGNORECASE)
    s = re.sub(r"\bNEWID\s*\(\s*\)", "hex(randomblob(16))", s, flags=re.IGNORECASE)

    # 2. INSERT INTO ... OUTPUT INSERTED.<col> VALUES (...) -> INSERT INTO ... VALUES (...) RETURNING <col>
    s = re.sub(
        r"\bOUTPUT\s+INSERTED\.([A-Za-z0-9_]+)\s+(VALUES\s*\([^;]+?\))",
        r"\2 RETURNING \1",
        s,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # 3. Subqueries with (SELECT TOP N ... ) -> (SELECT ... LIMIT N)
    def replace_subquery_top(match):
        n = match.group(1)
        body = match.group(2)
        return f"(SELECT {body} LIMIT {n})"

    prev = None
    while prev != s:
        prev = s
        s = re.sub(
            r"\(\s*SELECT\s+TOP\s+(\d+)\s+([^()]+?)\)",
            replace_subquery_top,
            s,
            flags=re.IGNORECASE | re.DOTALL,
        )

    # 4. Top-level SELECT TOP N ... -> SELECT ... LIMIT N
    top_match = re.match(r"^(\s*SELECT\s+)TOP\s+(\d+)\s+(.*)$", s, flags=re.IGNORECASE | re.DOTALL)
    if top_match:
        prefix, n, rest = top_match.groups()
        rest_stripped = rest.rstrip().rstrip(";")
        if not re.search(r"\bLIMIT\s+\d+\s*$", rest_stripped, flags=re.IGNORECASE):
            s = f"{prefix}{rest_stripped} LIMIT {n}"

    return s


class SQLiteCursorWrapper:
    def __init__(self, cursor: sqlite3.Cursor):
        self._cursor = cursor

    @property
    def description(self):
        return self._cursor.description

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def execute(self, sql: str, params=()):
        translated = translate_tsql_to_sqlite(sql)
        if params is None:
            params = ()
        elif not isinstance(params, (tuple, list)):
            params = (params,)
        if ";" in translated.strip().rstrip(";"):
            parts = [p.strip() for p in translated.strip().rstrip(";").split(";") if p.strip()]
            if len(parts) == 2 and "last_insert_rowid()" in parts[1].lower():
                self._cursor.execute(parts[0], tuple(params))
                self._cursor.execute(parts[1])
                return self
        self._cursor.execute(translated, tuple(params))
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        self._cursor.close()


class SQLiteConnectionWrapper:
    def __init__(self, db_path: str):
        self._conn = sqlite3.connect(db_path, check_same_thread=False, isolation_level=None)

    def cursor(self):
        return SQLiteCursorWrapper(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


def get_sqlite_connection(db_path: str = None) -> SQLiteConnectionWrapper:
    if not db_path:
        db_path = os.getenv("SQLITE_DB_PATH") or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "caykiengla.db"
        )
    return SQLiteConnectionWrapper(db_path)
