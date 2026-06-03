"""
Seed demo price data for Pricelyt — realistic market prices with natural movement.
Generates 14-20 data points per tracker, simulating real scraping history.
"""

import os
import random
import time
from datetime import datetime, timedelta
import psycopg2

# --- Config ---
DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/pricelyt_db"
)

# Realistic base prices (market rates mid-2026)
# Format: (keyword, base_price_usd, volatility_pct, points, days_span)
DEMO_PRODUCTS = [
    # GPUs
    ("RTX 4070", 545, 8, 18, 90),
    ("rtx 4060", 310, 6, 16, 90),
    ("rtx 3060", 290, 5, 14, 90),
    ("5060", 275, 10, 16, 90),
    ("4060", 225, 7, 14, 90),
    # Laptops
    ("macbook m2", 980, 12, 15, 90),
    # Phones
    ("asus zenfone max pro m1", 125, 15, 12, 90),
    # Demo product (already has RAM)
    ("test product", 450, 20, 12, 90),
]

def generate_price_series(base, volatility_pct, num_points, days_span):
    """Generate realistic price series with trend, seasonality, and noise."""
    prices = []
    now = datetime.utcnow()
    
    # Random trend direction: -1 (declining) to +1 (rising)
    trend = random.uniform(-0.15, 0.10)  # slight bias toward decline (tech)
    trend_factor = trend / num_points
    
    for i in range(num_points):
        # Days ago (most recent first = index 0)
        days_ago = days_span * (num_points - 1 - i) / (num_points - 1)
        scraped_at = now - timedelta(days=days_ago)
        
        # Base movement: trend + random noise
        trend_component = base * trend_factor * i
        noise = random.gauss(0, base * volatility_pct / 100)
        
        # Add some "micro-seasonality" — small oscillations
        seasonality = base * 0.02 * (1 if i % 3 == 0 else -1 if i % 3 == 1 else 0)
        
        price = max(base * 0.7, base + trend_component + noise + seasonality)
        
        # Market price with small spread
        market_price = round(price, 2)
        sample_count = random.randint(8, 25)
        
        # Min/max spread
        spread = market_price * random.uniform(0.03, 0.12)
        min_price = round(market_price - spread/2, 2)
        max_price = round(market_price + spread/2, 2)
        
        prices.append({
            "market_price": market_price,
            "min_price": min_price,
            "max_price": max_price,
            "sample_count": sample_count,
            "scraped_at": scraped_at.isoformat(),
        })
    
    return prices


def seed():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    print("🌱 Seeding demo data...\n")
    
    for keyword, base_price, volatility, points, days in DEMO_PRODUCTS:
        # Find tracker
        cur.execute(
            "SELECT id, keyword FROM trackers WHERE keyword ILIKE %s LIMIT 1",
            (keyword,)
        )
        row = cur.fetchone()
        
        if not row:
            # Try partial match
            cur.execute(
                "SELECT id, keyword FROM trackers WHERE keyword ILIKE %s LIMIT 1",
                (f"%{keyword.split()[0]}%",)
            )
            row = cur.fetchone()
        
        if not row:
            print(f"  ⚠️  Tracker '{keyword}' not found — skipping")
            continue
        
        tracker_id, actual_keyword = row
        
        # Delete existing price logs for clean seed
        cur.execute("DELETE FROM price_logs WHERE tracker_id = %s", (tracker_id,))
        
        # Generate price series
        series = generate_price_series(base_price, volatility, points, days)
        
        for entry in series:
            cur.execute(
                """INSERT INTO price_logs 
                   (tracker_id, market_price, min_price, max_price, sample_count, 
                    source, currency, scraped_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (tracker_id, entry["market_price"], entry["min_price"],
                 entry["max_price"], entry["sample_count"], "marketplace", "USD",
                 entry["scraped_at"])
            )
        
        # Update tracker status
        cur.execute(
            "UPDATE trackers SET status = 'READY', last_scraped_at = NOW() WHERE id = %s",
            (tracker_id,)
        )
        
        conn.commit()
        
        latest_price = series[-1]["market_price"]
        first_price = series[0]["market_price"]
        change = ((latest_price - first_price) / first_price) * 100
        direction = "↑" if change > 0 else "↓" if change < 0 else "→"
        
        print(f"  ✅ {actual_keyword}: {points} data points | ${first_price:.0f} {direction} ${latest_price:.0f} ({change:+.1f}%)")
    
    cur.close()
    conn.close()
    
    print(f"\n✨ Done seeding! {len(DEMO_PRODUCTS)} products seeded.")
    print("Run: docker compose exec api wget -qO- http://localhost:8080/api/trackers/{id}/summary")


if __name__ == "__main__":
    seed()
