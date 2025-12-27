# worker.py
import asyncio
import logging
import time
from tkinter import SW

from db import get_conn
from psycopg2.sql import SQL
from queries import (
    SQL_INSERT_NEWS_LOG,
    SQL_INSERT_PRICE_LOG,
    SQL_MARK_ERROR,
    SQL_MARK_PROCESSING,
    SQL_MARK_READY,
)
from scraper_news import scrape_news
from scraper_price import scrape_price

# ---------------- logging ----------------

logger = logging.getLogger("worker")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

SLEEP_IDLE_SECONDS = 5


# ---------------- db helpers ----------------


def pick_tracker():
    """
    Pick 1 eligible tracker and lock it as PROCESSING.
    """
    conn = get_conn()
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(SQL_PICK_ELIGIBLE)
            row = cur.fetchone()

            if not row:
                conn.rollback()
                return None

            tracker_id, keyword = row
            cur.execute(SQL_MARK_PROCESSING, (tracker_id,))
            conn.commit()

            return tracker_id, keyword

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def mark_ready(tracker_id):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(SQL_MARK_READY, (tracker_id,))
        conn.commit()
    conn.close()


def mark_error(tracker_id, code, message):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            SQL_MARK_ERROR,
            (code, message[:255], tracker_id),
        )
        conn.commit()
    conn.close()


# ---------------- main loop ----------------


def run():
    logger.info("worker started")

    while True:
        picked = pick_tracker()

        if not picked:
            logger.info("no eligible tracker, sleeping...")
            time.sleep(SLEEP_IDLE_SECONDS)
            continue

        tracker_id, keyword = picked
        logger.info("processing tracker keyword=%s", keyword)

        try:
            # -------- price scrape --------
            price_result = asyncio.run(scrape_price(keyword))
            if not price_result:
                raise RuntimeError("price scrape returned no data")

            logger.info(
                "price summary median=%s market=%s min=%s max=%s count=%s",
                price_result["median_price"],
                price_result["market_price"],
                price_result["min_price"],
                price_result["max_price"],
                price_result["count"],
            )

            # -------- news scrape --------
            news_result = asyncio.run(scrape_news(keyword))

            logger.info(
                "news scrape done keyword=%s total=%s",
                keyword,
                len(news_result),
            )

            # 🔜 nanti:
            # insert_price_logs(tracker_id, price_result)
            # insert_news_logs(tracker_id, news_result)

            mark_ready(tracker_id)

        except Exception as e:
            logger.exception("worker error keyword=%s", keyword)
            mark_error(tracker_id, "SCRAPE_FAILED", str(e))
