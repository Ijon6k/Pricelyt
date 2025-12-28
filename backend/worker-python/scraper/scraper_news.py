import asyncio
import logging
import random
from datetime import datetime
from urllib.parse import urlparse

from browser_factory import create_browser

MAX_NEWS_TOTAL = 10
ARTICLE_TIMEOUT_MS = 20000

logger = logging.getLogger("scraper.news")

# Domain yang bukan berita artikel
IGNORED_DOMAINS = {
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "reddit.com",
    "instagram.com",
    "tiktok.com",
    "amazon.com",
    "ebay.com",
    "pinterest.com",
}


def is_valid_domain(url: str) -> bool:
    try:
        domain = urlparse(url).netloc.lower()
        return not any(ign in domain for ign in IGNORED_DOMAINS)
    except Exception:
        return False


def get_current_year():
    return str(datetime.now().year)


async def scrape_bing_news(page, keyword):
    """
    Mengambil berita dari Bing News dengan filter tahun berjalan.
    """
    year = get_current_year()
    # Query dibuat simpel agar hasil maksimal
    query = f"{keyword} news {year}"

    logger.info(f"Searching Bing News for '{query}'...")
    # qdr=y -> Past Year (Berita setahun terakhir agar tidak basi)
    url = f"https://www.bing.com/news/search?q={query}&qdr=y"

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)  # Beri waktu Bing merender list berita

        links = await page.evaluate("""
            () => {
                const results = [];
                // Selector utama Bing News
                const cards = document.querySelectorAll('div.news-card');
                cards.forEach(card => {
                    const anchor = card.querySelector('a.title');
                    if (anchor && anchor.href) {
                        results.push({
                            title: anchor.innerText.trim(),
                            link: anchor.href
                        });
                    }
                });

                // Fallback selector jika layout berbeda
                if (results.length === 0) {
                    const anchors = document.querySelectorAll('a.title');
                    anchors.forEach(a => {
                        if (a.href && a.innerText.trim().length > 10) {
                            results.push({
                                title: a.innerText.trim(),
                                link: a.href
                            });
                        }
                    });
                }
                return results.slice(0, 15);
            }
        """)
        return links
    except Exception as e:
        logger.warning(f"Bing News error: {e}")
        return []


async def fetch_article_content(page, url):
    """
    Mengambil isi artikel dengan mode hemat bandwidth.
    """
    content = ""
    is_blocked = False

    try:
        await page.set_extra_http_headers(
            {"Referer": "https://www.bing.com/", "Upgrade-Insecure-Requests": "1"}
        )

        await page.goto(url, wait_until="domcontentloaded", timeout=ARTICLE_TIMEOUT_MS)

        # Ekstrak paragraf
        paragraphs = await page.query_selector_all("p")
        if len(paragraphs) >= 2:
            texts = [await p.inner_text() for p in paragraphs[:8]]
            content = " ".join(texts).strip()
        else:
            # Fallback body text jika tidak pakai tag <p>
            content = await page.evaluate("document.body.innerText")
            content = content[:800].replace("\n", " ")

        # Deteksi WAF/Captcha
        block_triggers = [
            "verify you are a human",
            "access denied",
            "security check",
            "captcha",
            "cloudflare",
        ]
        if any(bt in content.lower() for bt in block_triggers):
            is_blocked = True
            content = "Blocked by WAF"

    except Exception:
        pass

    return content, is_blocked


async def scrape_news(keyword: str):
    logger.info("start news scrape keyword=%s", keyword)

    p, browser, page = await create_browser()
    final_results = []
    seen_urls = set()

    try:
        # OPTIMASI: Matikan resource berat untuk semua tahap
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ["image", "media", "font", "stylesheet"]
            else route.continue_(),
        )

        # 1. Ambil kandidat hanya dari Bing
        candidates = await scrape_bing_news(page, keyword)

        if not candidates:
            logger.warning("No news candidates found from Bing.")
            return []

        logger.info(f"Found {len(candidates)} candidates. Fetching details...")

        random.shuffle(candidates)

        for item in candidates:
            if len(final_results) >= MAX_NEWS_TOTAL:
                break

            url = item["link"]
            if url in seen_urls or not is_valid_domain(url):
                continue
            seen_urls.add(url)

            # Gunakan tab yang sama (page) untuk fetch artikel agar hemat RAM
            content, is_blocked = await fetch_article_content(page, url)

            if is_blocked or not content or len(content) < 60:
                continue

            final_results.append(
                {
                    "title": item["title"],
                    "source_url": url,
                    "content": content,
                    "is_blocked": False,
                }
            )

    finally:
        try:
            if page:
                await page.close()
            if browser:
                await browser.close()
            if p:
                await p.stop()
        except:
            pass

    logger.info(f"News Scrape DONE. Saved {len(final_results)} articles.")
    return final_results
