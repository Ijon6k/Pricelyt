import os
import time

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def run_worker():
    while True:
        conn = get_conn()
        conn.autocommit = False

        try:
            with conn.cursor() as cur:
                # 1️⃣ ambil tracker eligible + LOCK
                cur.execute("""
                    SELECT id
                    FROM trackers
                    WHERE
                      (
                        status = 'PENDING'
                        OR (
                          status = 'ERROR'
                          AND error_count < 3
                          AND last_error_at < NOW() - INTERVAL '10 minutes'
                        )
                      )
                    ORDER BY created_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1;
                """)
                row = cur.fetchone()

                if not row:
                    conn.commit()
                    print("[worker] no tracker available, sleeping...")
                    time.sleep(5)
                    continue

                tracker_id = row[0]

                # 2️⃣ tandai PROCESSING
                cur.execute(
                    """
                    UPDATE trackers
                    SET status = 'PROCESSING',
                        processing_started_at = NOW()
                    WHERE id = %s;
                """,
                    (tracker_id,),
                )

                conn.commit()
                print(f"[worker] processing tracker {tracker_id}")

        except Exception as e:
            conn.rollback()
            print("[worker] error selecting tracker:", e)
            conn.close()
            time.sleep(5)
            continue

        # 3️⃣ simulasi kerja (nanti diganti scraping)
        time.sleep(5)

        # 4️⃣ tandai READY
        try:
            conn = get_conn()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE trackers
                    SET status = 'READY',
                        error_count = 0,
                        last_error_code = NULL,
                        last_error_message = NULL,
                        last_error_at = NULL
                    WHERE id = %s;
                """,
                    (tracker_id,),
                )
                conn.commit()

                print(f"[worker] tracker {tracker_id} marked READY")

        except Exception as e:
            print("[worker] error updating tracker:", e)

        finally:
            conn.close()
            time.sleep(2)


if __name__ == "__main__":
    run_worker()
