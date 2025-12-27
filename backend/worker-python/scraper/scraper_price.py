# scraper_price.py
import asyncio
import logging
import statistics
from typing import Dict, List, Optional

from browser_factory import create_browser

logger = logging.getLogger("scraper.price")

MAX_ITEMS = 48  # 1 page only


def _is_noise_price(price: int) -> bool:
    """
    Filter harga aneh:
    - terlalu kecil (aksesoris / part)
    - terlalu besar (bundle / scam)
    """
    return price < 200 or price > 8000


async def scrape_price(keyword: str) -> Optional[Dict]:
    """
    Scrape Amazon SG page-1 only and return market price summary.

    Return:
    {
        count: int,
        median_price: int,
        market_price: int,
        min_raw: int,
        max_raw: int,
    }
    """

    logger.info("start price scrape keyword=%s", keyword)

    identifiers = [
        term.lower() for term in keyword.split() if any(char.isdigit() for char in term)
    ]

    p, browser, page = await create_browser()

    prices: List[int] = []

    try:
        url = f"https://www.amazon.sg/s?k={keyword}&page=1"
        logger.info("fetching price page=1 url=%s", url)

        await page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=30000,
        )
        await asyncio.sleep(2.5)

        items = await page.query_selector_all(
            'div[data-component-type="s-search-result"]'
        )

        logger.info("found %s items on page 1", len(items))

        for item in items[:MAX_ITEMS]:
            title_el = await item.query_selector("h2")
            price_el = await item.query_selector(".a-price-whole")

            if not title_el or not price_el:
                continue

            title = (await title_el.inner_text()).lower()

            # strict model match
            if not all(id_ in title for id_ in identifiers):
                continue

            raw_price = await price_el.inner_text()
            clean = "".join(filter(str.isdigit, raw_price))

            if not clean:
                continue

            price = int(clean)

            if _is_noise_price(price):
                continue

            prices.append(price)

        if not prices:
            logger.warning("no valid prices found keyword=%s", keyword)
            return None

        prices.sort()

        median_price = int(statistics.median(prices))

        # market price = trimmed mean (buang 20% atas & bawah)
        trim = max(1, len(prices) // 5)
        trimmed = prices[trim:-trim] if len(prices) > 5 else prices
        market_price = int(sum(trimmed) / len(trimmed))

        result = {
            "count": len(prices),
            "median_price": median_price,
            "market_price": market_price,
            "min_price": prices[0],
            "max_price": prices[-1],
        }

        logger.info(
            "price scrape done keyword=%s count=%s median=%s market=%s min=%s max=%s",
            keyword,
            result["count"],
            result["median_price"],
            result["market_price"],
            result["min_price"],
            result["max_price"],
        )

        return result

    except Exception:
        logger.exception("price scrape failed keyword=%s", keyword)
        return None

    finally:
        try:
            await browser.close()
        except Exception:
            pass
        try:
            await p.stop()
        except Exception:
            pass
