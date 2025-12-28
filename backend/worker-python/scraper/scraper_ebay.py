import asyncio
import logging
import random
import re
import statistics
from typing import Dict, List, Optional

from browser_factory import create_browser

logger = logging.getLogger("scraper.ebay")

PAGES_TO_SCRAPE = 2
IDR_TO_USD_RATE = 16200  # Normalisasi ke USD untuk database

NEGATIVE_KEYWORDS = [
    "broken",
    "parts only",
    "faulty",
    "defective",
    "box only",
    "read description",
    "for parts",
    "not working",
    "cooler only",
    "damaged",
]


def _parse_ebay_price(text: str) -> int:
    """
    Parser cerdas untuk menangani harga rentang dan mata uang menempel.
    Contoh: 'IDR1,565,657.50 to IDR4,862,748.00'
    """
    if not text:
        return 0

    # 1. Ambil harga terendah jika ada rentang 'to'
    if " to " in text.lower():
        text = text.lower().split(" to ")[0]

    # 2. Ambil hanya angka dan pemisah desimal/ribuan
    clean_chars = re.sub(r"[^\d.,]", "", text)
    if not clean_chars:
        return 0

    # 3. Normalisasi pemisah ribuan/desimal
    if "," in clean_chars and "." in clean_chars:
        if clean_chars.rfind(",") < clean_chars.rfind("."):
            # Format: 1,234.56
            clean_chars = clean_chars.split(".")[0].replace(",", "")
        else:
            # Format: 1.234,56
            clean_chars = clean_chars.split(",")[0].replace(".", "")
    elif "." in clean_chars:
        parts = clean_chars.split(".")
        if len(parts[-1]) == 2:
            clean_chars = "".join(parts[:-1])
        else:
            clean_chars = clean_chars.replace(".", "")
    elif "," in clean_chars:
        clean_chars = clean_chars.replace(",", "")

    final_digits = "".join(filter(str.isdigit, clean_chars))
    if not final_digits:
        return 0

    price_val = int(final_digits)

    # 4. Konversi ke USD jika terdeteksi IDR (Jutaan)
    if price_val > 50000:
        price_val = int(price_val / IDR_TO_USD_RATE)

    return price_val


async def scrape_ebay(keyword: str) -> Optional[Dict]:
    p, browser, page = None, None, None
    all_prices: List[int] = []

    try:
        p, browser, page = await create_browser()

        # Block resource berat agar Docker stabil
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ["image", "media", "font"]
            else route.continue_(),
        )

        for page_num in range(1, PAGES_TO_SCRAPE + 1):
            url = f"https://www.ebay.com/sch/i.html?_nkw={keyword}&LH_BIN=1&_pgn={page_num}"
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)

            # Selector dinamis untuk menangkap container barang
            items = await page.query_selector_all("li.s-item, .s-item__wrapper")

            for item in items:
                title_el = await item.query_selector(".s-item__title, h3")
                if not title_el:
                    continue

                title_raw = await title_el.inner_text()
                if "shop on ebay" in title_raw.lower():
                    continue
                if any(bad in title_raw.lower() for bad in NEGATIVE_KEYWORDS):
                    continue

                price_el = await item.query_selector(".s-item__price")
                if not price_el:
                    continue

                price = _parse_ebay_price(await price_el.inner_text())
                if price > 20:
                    all_prices.append(price)

        if not all_prices:
            return None

        all_prices.sort()
        return {
            "count": len(all_prices),
            "median_price": int(statistics.median(all_prices)),
            "market_price": int(statistics.mean(all_prices)),
            "min_price": all_prices[0],
            "max_price": all_prices[-1],
        }

    except Exception:
        return None
    finally:
        if browser:
            await browser.close()
        if p:
            await p.stop()
