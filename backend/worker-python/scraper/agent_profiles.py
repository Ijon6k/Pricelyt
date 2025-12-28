import random

# Koleksi User Agent Modern (Update Akhir 2024/2025)
# Format: (User Agent, Platform, Vendor, Viewport)
AGENTS_DB = [
    # --- WINDOWS (Chrome & Edge) ---
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "platform": "Win32",
        "vendor": "Google Inc.",
        "viewport": {"width": 1920, "height": 1080},  # Full HD
    },
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
        "platform": "Win32",
        "vendor": "Google Inc.",
        "viewport": {"width": 1366, "height": 768},  # Laptop standar
    },
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "platform": "Win32",
        "vendor": "Google Inc.",
        "viewport": {"width": 1536, "height": 864},  # Laptop modern
    },
    # --- MAC OS (Safari & Chrome) ---
    {
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "platform": "MacIntel",
        "vendor": "Apple Computer, Inc.",
        "viewport": {"width": 1440, "height": 900},  # Macbook Air
    },
    {
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "platform": "MacIntel",
        "vendor": "Google Inc.",
        "viewport": {"width": 1728, "height": 1117},  # Macbook Pro
    },
    # --- LINUX (Firefox & Chrome) ---
    {
        "ua": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "platform": "Linux x86_64",
        "vendor": "Google Inc.",
        "viewport": {"width": 1920, "height": 1080},
    },
    {
        "ua": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "platform": "Linux x86_64",
        "vendor": "",  # Firefox gak kirim vendor
        "viewport": {"width": 1366, "height": 768},
    },
]


def pick_agent():
    # Ambil acak dari database
    profile = random.choice(AGENTS_DB)

    return {
        "user_agent": profile["ua"],
        "platform": profile["platform"],
        "vendor": profile["vendor"],
        "viewport": profile["viewport"],
        # Locale & Timezone tetap statis US biar Amazon gak bingung
        "locale": "en-US",
        "timezone": "America/New_York",
    }
