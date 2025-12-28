import asyncio
import logging
import random
import time

from db import get_conn
from queries import (
    SQL_INSERT_NEWS_LOG,
    SQL_INSERT_PRICE_LOG,
    SQL_MARK_ERROR,
    SQL_MARK_PROCESSING,
    SQL_MARK_READY,
    SQL_PICK_ELIGIBLE,
)
from scraper_ebay import scrape_ebay
from scraper_news import scrape_news

# Import kedua scraper
from scraper_price import scrape_price as scrape_amazon

# ---------------- logging ----------------

logger = logging.getLogger("worker")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

SLEEP_IDLE_SECONDS = 5
MAX_AMAZON_RETRIES = 2  # Gagal 2x -> Pindah ke eBay

# ---------------- db helpers (Sama seperti sebelumnya) ----------------


def pick_tracker():
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
        safe_msg = str(message)[:255]
        cur.execute(SQL_MARK_ERROR, (code, safe_msg, tracker_id))
        conn.commit()
    conn.close()


def insert_price_logs(tracker_id, price_result):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                SQL_INSERT_PRICE_LOG,
                (
                    tracker_id,
                    price_result["market_price"],
                    price_result["min_price"],
                    price_result["max_price"],
                    price_result["median_price"],
                    price_result["count"],
                ),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def insert_news_logs(tracker_id, news_items):
    if not news_items:
        return
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            for item in news_items:
                cur.execute(
                    SQL_INSERT_NEWS_LOG,
                    (
                        tracker_id,
                        item["title"],
                        item["source_url"],
                        item["content"],
                        item["is_blocked"],
                    ),
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------- main loop ----------------


def run():
    logger.info("Worker started. Logic: Amazon (2x) -> eBay (Fallback).")

    while True:
        picked = pick_tracker()

        if not picked:
            logger.info("no eligible tracker, sleeping...")
            time.sleep(SLEEP_IDLE_SECONDS)
            continue

        tracker_id, keyword = picked
        logger.info("PROCESSING tracker keyword=%s", keyword)

        price_result = None
        last_error = None
        source_used = "None"

        # --- PHASE 1: AMAZON (Max 2 Attempts) ---
        for attempt in range(1, MAX_AMAZON_RETRIES + 1):
            try:
                logger.info(
                    f"[AMAZON] Attempt {attempt}/{MAX_AMAZON_RETRIES} for {keyword}..."
                )
                price_result = asyncio.run(scrape_amazon(keyword))

                if price_result:
                    logger.info("Amazon scrape SUCCESS.")
                    source_used = "Amazon"
                    break
                else:
                    logger.warning(
                        f"[AMAZON] Attempt {attempt} returned empty. Retrying..."
                    )
                    time.sleep(random.uniform(2, 5))

            except Exception as e:
                last_error = e
                logger.error(f"[AMAZON] Attempt {attempt} CRASHED: {e}")
                time.sleep(random.uniform(2, 5))

        # --- PHASE 2: EBAY FALLBACK (If Amazon Failed) ---
        if not price_result:
            logger.warning(
                f"Amazon failed after {MAX_AMAZON_RETRIES} attempts. Switching to eBay fallback..."
            )
            try:
                # Coba eBay sekali saja (atau bisa diloop juga kalau mau)
                price_result = asyncio.run(scrape_ebay(keyword))
                if price_result:
                    logger.info("eBay scrape SUCCESS.")
                    source_used = "eBay"
                else:
                    logger.error("eBay fallback also returned empty.")
            except Exception as e:
                last_error = e
                logger.error(f"eBay fallback CRASHED: {e}")

        # --- FINAL CHECK ---
        if not price_result:
            error_msg = (
                str(last_error) if last_error else "All sources (Amazon & eBay) failed."
            )
            logger.error(f"FAILED ALL SOURCES for {keyword}. Marking ERROR.")
            mark_error(tracker_id, "SCRAPE_FAILED", error_msg)
            continue

        # --- SUCCESS SAVE ---
        try:
            logger.info(
                "Saving price data (Source: %s) | Market: $%s | Count: %s",
                source_used,
                price_result["market_price"],
                price_result["count"],
            )

            insert_price_logs(tracker_id, price_result)

            # News Scrape
            logger.info("Starting news scrape...")
            news_result = asyncio.run(scrape_news(keyword))
            insert_news_logs(tracker_id, news_result)

            mark_ready(tracker_id)
            logger.info("Tracker %s marked READY.", keyword)

        except Exception as e:
            logger.exception("Worker Database Error processing %s", keyword)
            mark_error(tracker_id, "DB_ERROR", str(e))


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        pass
