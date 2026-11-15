import os
import shutil
import sqlite3
import datetime
import decimal
import pyodbc

SERVER_NAME = r"DESKTOP-KTO6D9A\SQLEXPRESS"
DATABASE_NAME = "CayKiengLa"
SQLITE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "caykiengla.db")


def get_mssql_conn():
    for driver in ["{SQL Server}", "{ODBC Driver 17 for SQL Server}", "{ODBC Driver 18 for SQL Server}"]:
        try:
            conn_str = (
                f"DRIVER={driver};"
                f"SERVER={SERVER_NAME};"
                f"DATABASE={DATABASE_NAME};"
                f"Trusted_Connection=yes;"
                f"TrustServerCertificate=yes;"
            )
            return pyodbc.connect(conn_str, autocommit=True)
        except Exception:
            continue
    raise RuntimeError("Could not connect to SQL Server")


def map_sql_type(data_type: str, is_identity: bool) -> str:
    dt = data_type.lower()
    if is_identity:
        return "INTEGER PRIMARY KEY AUTOINCREMENT"
    if dt in ("int", "bigint", "smallint", "tinyint", "bit"):
        return "INTEGER"
    if dt in ("decimal", "numeric", "float", "real", "money", "smallmoney"):
        return "REAL"
    return "TEXT"


def convert_val(val):
    if val is None:
        return None
    if isinstance(val, bool):
        return 1 if val else 0
    if isinstance(val, decimal.Decimal):
        return float(val)
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m-%d %H:%M:%S") if isinstance(val, datetime.datetime) else val.strftime("%Y-%m-%d")
    if isinstance(val, bytes):
        return val.hex()
    return val


def main():
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)

    ms_conn = get_mssql_conn()
    ms_cur = ms_conn.cursor()

    sq_conn = sqlite3.connect(SQLITE_PATH)
    sq_cur = sq_conn.cursor()

    ms_cur.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> 'sysdiagrams'
        ORDER BY TABLE_NAME
    """)
    tables = [r[0] for r in ms_cur.fetchall()]

    total_rows = 0
    for tbl in tables:
        ms_cur.execute("""
            SELECT
                c.COLUMN_NAME,
                c.DATA_TYPE,
                COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY
            FROM INFORMATION_SCHEMA.COLUMNS c
            WHERE c.TABLE_NAME = ?
            ORDER BY c.ORDINAL_POSITION
        """, (tbl,))
        cols_meta = ms_cur.fetchall()

        ms_cur.execute("""
            SELECT k.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS t
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
              ON t.CONSTRAINT_NAME = k.CONSTRAINT_NAME
            WHERE t.TABLE_NAME = ? AND t.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ORDER BY k.ORDINAL_POSITION
        """, (tbl,))
        pk_cols = [r[0] for r in ms_cur.fetchall()]

        col_defs = []
        has_identity = any(bool(c[2]) for c in cols_meta)
        for col_name, data_type, is_id in cols_meta:
            sq_type = map_sql_type(data_type, bool(is_id))
            if not is_id and len(pk_cols) == 1 and col_name == pk_cols[0] and sq_type == "INTEGER":
                sq_type = "INTEGER PRIMARY KEY"
                has_identity = True
            col_defs.append(f'"{col_name}" {sq_type}')

        if not has_identity and pk_cols:
            pk_list = ", ".join(f'"{p}"' for p in pk_cols)
            col_defs.append(f"PRIMARY KEY ({pk_list})")

        create_sql = f'CREATE TABLE "{tbl}" ({", ".join(col_defs)})'
        sq_cur.execute(create_sql)

        col_names = [c[0] for c in cols_meta]
        select_cols = ", ".join(f"[{c}]" for c in col_names)
        ms_cur.execute(f"SELECT {select_cols} FROM [{tbl}]")
        rows = ms_cur.fetchall()

        if rows:
            placeholders = ", ".join("?" for _ in col_names)
            insert_cols = ", ".join(f'"{c}"' for c in col_names)
            insert_sql = f'INSERT INTO "{tbl}" ({insert_cols}) VALUES ({placeholders})'
            sq_cur.executemany(insert_sql, [[convert_val(v) for v in row] for row in rows])
            total_rows += len(rows)

        print(f"Exported table {tbl}: {len(rows)} rows")

    sq_conn.commit()
    sq_conn.close()
    ms_conn.close()

    other_path = r"E:\dowload\ai-service\caykiengla.db"
    if os.path.exists(os.path.dirname(other_path)):
        shutil.copy2(SQLITE_PATH, other_path)
        print(f"Copied SQLite DB to {other_path}")

    print(f"Done! Exported {len(tables)} tables ({total_rows} total rows) to {SQLITE_PATH}")


if __name__ == "__main__":
    main()
