import asyncio
import logging
import random
import re
import statistics
from typing import Dict, List, Optional

from browser_factory import create_browser

logger = logging.getLogger("scraper.price")

PAGES_TO_SCRAPE = 3
MAX_DETAIL_PAGE_VISITS = 5
IDR_TO_USD_RATE = 16200


def _normalize_text(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def _parse_price_raw(text: str) -> int:
    if not text:
        return 0
    clean_chars = re.sub(r"[^\d.,]", "", text)
    if not clean_chars:
        return 0

    if "," in clean_chars and "." in clean_chars:
        if clean_chars.rfind(",") < clean_chars.rfind("."):
            clean_chars = clean_chars.split(".")[0].replace(",", "")
        else:
            clean_chars = clean_chars.split(",")[0].replace(".", "")
    elif "." in clean_chars:
        parts = clean_chars.split(".")
        if len(parts[-1]) == 2:
            clean_chars = parts[0]
        else:
            clean_chars = clean_chars.replace(".", "")
    elif "," in clean_chars:
        clean_chars = clean_chars.replace(",", "")

    final_digits = "".join(filter(str.isdigit, clean_chars))
    if not final_digits:
        return 0

    price_val = int(final_digits)
    if price_val > 50000:
        price_val = int(price_val / IDR_TO_USD_RATE)

    return price_val


def _filter_outliers(prices: List[int]) -> List[int]:
    if len(prices) < 3:
        return prices
    median = statistics.median(prices)
    min_limit = median * 0.1
    max_limit = median * 5.0
    filtered = [p for p in prices if min_limit <= p <= max_limit]
    if not filtered and prices:
        return prices
    return filtered


async def _scrape_detail_page(browser, url: str) -> int:
    page = await browser.new_page()
    price = 0
    try:
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ["image", "media", "font"]
            else route.continue_(),
        )

        await page.context.add_cookies(
            [
                {
                    "name": "lc-main",
                    "value": "en_US",
                    "domain": ".amazon.com",
                    "path": "/",
                },
                {
                    "name": "i18n-prefs",
                    "value": "USD",
                    "domain": ".amazon.com",
                    "path": "/",
                },
            ]
        )

        logger.info(f"Visiting detail page: {url[:60]}...")
        await page.goto(url, wait_until="domcontentloaded", timeout=15000)

        selectors = [
            "#price_inside_buybox",
            "#corePrice_feature_div .a-price-whole",
            "#corePriceDisplay_desktop_feature_div .a-price-whole",
            ".a-price-whole",
            ".apexPriceToPay",
        ]

        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    txt = await el.inner_text()
                    parsed = _parse_price_raw(txt)
                    if parsed > 0:
                        price = parsed
                        break
            except:
                continue

    except Exception:
        pass
    finally:
        await page.close()

    return price


async def scrape_price(keyword: str) -> Optional[Dict]:
    logger.info("start price scrape (Hybrid) 3 PAGES keyword=%s", keyword)

    raw_identifiers = [
        term.lower() for term in keyword.split() if any(char.isdigit() for char in term)
    ]
    identifiers = [_normalize_text(i) for i in raw_identifiers]

    p, browser, page = None, None, None
    all_prices: List[int] = []
    empty_price_links: List[str] = []

    try:
        p, browser, page = await create_browser()

        await page.context.add_cookies(
            [
                {
                    "name": "lc-main",
                    "value": "en_US",
                    "domain": ".amazon.com",
                    "path": "/",
                },
                {
                    "name": "i18n-prefs",
                    "value": "USD",
                    "domain": ".amazon.com",
                    "path": "/",
                },
            ]
        )

        for page_num in range(1, PAGES_TO_SCRAPE + 1):
            url = f"https://www.amazon.com/s?k={keyword}&page={page_num}&language=en_US&currency=USD"

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await asyncio.sleep(random.uniform(2.0, 3.0))

                content = await page.content()
                if (
                    "api-services-support@amazon.com" in content
                    or "Enter the characters" in content
                ):
                    break
                if "No results for" in content:
                    break

                items = await page.query_selector_all(
                    'div[data-component-type="s-search-result"]'
                )
                if not items:
                    break

                for item in items:
                    title_el = await item.query_selector("h2")
                    if not title_el:
                        continue

                    title_raw = await title_el.inner_text()
                    title_clean = _normalize_text(title_raw)
                    if not all(id_ in title_clean for id_ in identifiers):
                        continue

                    # --- FIX PENGAMBILAN LINK ---
                    # Cari tag 'a' dimanapun di dalam h2, atau class a-link-normal
                    item_url = ""
                    link_el = await item.query_selector("a.a-link-normal")
                    if not link_el:
                        link_el = await item.query_selector("h2 a")

                    if link_el:
                        href = await link_el.get_attribute("href")
                        if href and "/dp/" in href:  # Pastikan ini link produk valid
                            item_url = f"https://www.amazon.com{href}"

                    # Cari Harga
                    price = 0
                    price_el = await item.query_selector(".a-price-whole")
                    if not price_el:
                        price_el = await item.query_selector(".a-price")
                    if not price_el:
                        price_el = await item.query_selector(".a-offscreen")

                    if price_el:
                        raw_txt = await price_el.inner_text()
                        price = _parse_price_raw(raw_txt)

                    if price > 50:
                        all_prices.append(price)
                    elif item_url:
                        # Simpan link jika harga NOL/Gak Ketemu
                        empty_price_links.append(item_url)

            except Exception:
                continue

        # --- LOGIKA HYBRID: JIKA DATA DIKIT, BUKA DETAIL PAGE ---
        if len(all_prices) < 5 and empty_price_links:
            # Ambil 5 link unik
            targets = list(set(empty_price_links))[:MAX_DETAIL_PAGE_VISITS]
            logger.info(
                f"Low data ({len(all_prices)}). Visiting {len(targets)} detail pages..."
            )

            for t_url in targets:
                detail_price = await _scrape_detail_page(browser, t_url)
                if detail_price > 50:
                    all_prices.append(detail_price)
                await asyncio.sleep(random.uniform(2.0, 4.0))

        if not all_prices:
            logger.warning("no valid prices found keyword=%s", keyword)
            return None

        valid_prices = _filter_outliers(all_prices)
        valid_prices.sort()

        if not valid_prices:
            valid_prices = all_prices
            valid_prices.sort()

        median_price = int(statistics.median(valid_prices))
        market_price = int(statistics.mean(valid_prices))

        result = {
            "count": len(valid_prices),
            "median_price": median_price,
            "market_price": market_price,
            "min_price": valid_prices[0],
            "max_price": valid_prices[-1],
        }

        logger.info(
            "DONE %s | Market: $%s | Count: %s",
            keyword,
            result["market_price"],
            result["count"],
        )

        return result

    except Exception:
        return None

    finally:
        try:
            if page:
                await page.close()
            if browser:
                await browser.close()
            if p:
                await p.stop()
        except Exception:
            pass
