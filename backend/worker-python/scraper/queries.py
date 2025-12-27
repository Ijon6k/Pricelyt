SQL_PICK_ELIGIBLE = """
SELECT id, keyword
FROM trackers
WHERE
    status = 'PENDING'
    OR (
        status = 'READY'
        AND (
            last_scraped_at IS NULL
            OR last_scraped_at <= NOW() - (scrape_interval_minutes || ' minutes')::INTERVAL
        )
    )
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
"""

SQL_MARK_PROCESSING = """
UPDATE trackers
SET status = 'PROCESSING',
    processing_started_at = NOW()
WHERE id = %s;
"""

SQL_MARK_READY = """
UPDATE trackers
SET status = 'READY',
    last_scraped_at = NOW(),
    processing_started_at = NULL,
    error_count = 0,
    last_error_code = NULL,
    last_error_message = NULL,
    last_error_at = NULL
WHERE id = %s;
"""

SQL_MARK_ERROR = """
UPDATE trackers
SET status = 'ERROR',
    error_count = COALESCE(error_count, 0) + 1,
    last_error_code = %s,
    last_error_message = %s,
    last_error_at = NOW(),
    processing_started_at = NULL
WHERE id = %s;
"""

SQL_INSERT_PRICE_LOG = """
INSERT INTO price_logs (
    tracker_id,
    market_price,
    min_price,
    max_price,
    median_price,
    sample_count,
    scraped_at
)
VALUES (%s, %s, %s, %s, %s, %s, NOW());
"""

SQL_INSERT_NEWS_LOG = """
INSERT INTO news_logs (
    tracker_id,
    title,
    source_url,
    content,
    is_blocked,
    scraped_at
)
VALUES (%s, %s, %s, %s, %s, NOW());
"""
