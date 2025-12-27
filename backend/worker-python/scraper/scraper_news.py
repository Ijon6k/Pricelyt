# scraper_news.py
import asyncio
import logging
from urllib.parse import urlparse

from browser_factory import create_browser

MAX_NEWS_PER_SCRAPE = 10
ARTICLE_TIMEOUT_MS = 8000

logger = logging.getLogger("scraper.news")

# domain berat
BLOCKED_DOMAINS = {
    "msn.com",
    "www.msn.com",
}


def is_blocked_domain(url: str) -> bool:
    try:
        domain = urlparse(url).netloc.lower()
        return any(b in domain for b in BLOCKED_DOMAINS)
    except Exception:
        return True


async def scrape_news(keyword: str):
    logger.info("start news scrape keyword=%s", keyword)

    queries = [
        f"{keyword} price trend",
        f"{keyword} market analysis",
        f"{keyword} hardware news",
    ]

    p, browser, page = await create_browser()
    results = []

    try:
        for query in queries:
            if len(results) >= MAX_NEWS_PER_SCRAPE:
                break

            logger.info("searching news query='%s'", query)

            search_url = f"https://www.bing.com/news/search?q={query}"
            await page.goto(
                search_url,
                wait_until="domcontentloaded",
                timeout=20000,
            )

            try:
                await page.wait_for_selector("a.title", timeout=6000)
            except Exception:
                logger.warning("no news result rendered for query='%s'", query)
                continue

            await asyncio.sleep(1)

            # ambil DATA MENTAH, bukan element
            links = await page.evaluate("""
                () => Array.from(document.querySelectorAll("a.title"))
                    .slice(0, 12)
                    .map(a => ({
                        title: a.innerText.trim(),
                        link: a.href
                    }))
            """)

            logger.info(
                "found %d candidate articles for query='%s'",
                len(links),
                query,
            )

            for item in links:
                if len(results) >= MAX_NEWS_PER_SCRAPE:
                    break

                href = item.get("link")
                title = item.get("title")

                if not href or not title:
                    continue

                if is_blocked_domain(href):
                    logger.info("skip blocked domain %s", href)
                    continue

                if any(r["source_url"] == href for r in results):
                    continue

                article_page = await browser.new_page()

                try:
                    logger.info("fetching article %s", href)

                    try:
                        await article_page.goto(
                            href,
                            wait_until="domcontentloaded",
                            timeout=ARTICLE_TIMEOUT_MS,
                        )
                    except Exception:
                        logger.warning("timeout fetching article %s", href)
                        continue

                    await asyncio.sleep(0.8)

                    paragraphs = await article_page.query_selector_all("p")
                    content = " ".join(
                        [await p.inner_text() for p in paragraphs[:5]]
                    ).strip()

                    is_blocked = any(
                        kw in content.lower() for kw in ["verify", "captcha", "human"]
                    )

                    if is_blocked:
                        logger.warning("article blocked by WAF %s", href)

                    results.append(
                        {
                            "title": title[:255],
                            "source_url": href,
                            "content": None if is_blocked else content,
                            "is_blocked": is_blocked,
                        }
                    )

                except Exception:
                    logger.exception("unexpected error fetching article")

                finally:
                    try:
                        await article_page.close()
                    except Exception:
                        pass

        logger.info(
            "news scrape done keyword=%s total=%d",
            keyword,
            len(results),
        )

        return results

    finally:
        # cleanup TIDAK BOLEH bikin error baru
        try:
            await browser.close()
        except Exception:
            pass
        try:
            await p.stop()
        except Exception:
            pass
