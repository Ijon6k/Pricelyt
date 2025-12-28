from agent_profiles import pick_agent
from playwright.async_api import async_playwright


async def create_browser():
    agent = pick_agent()

    p = await async_playwright().start()

    browser = await p.chromium.launch(
        headless=True,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-infobars",
            "--window-position=0,0",
            "--ignore-certificate-errors",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            # Opsional: Fake WebGL vendor (Advanced)
            # f"--use-gl={agent['vendor']}"
        ],
    )

    context = await browser.new_context(
        user_agent=agent["user_agent"],
        locale=agent["locale"],
        timezone_id=agent["timezone"],
        viewport=agent["viewport"],  # Resolusi Layar Dinamis!
        device_scale_factor=1,
        is_mobile=False,
        has_touch=False,
    )

    # --- STEALTH MODE ---
    await context.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    """)

    # Inject Platform (Win32, MacIntel, dll) biar sinkron sama User Agent
    await context.add_init_script(f"""
        Object.defineProperty(navigator, 'platform', {{ get: () => '{agent["platform"]}' }});
    """)

    page = await context.new_page()

    # Header Standar
    await page.set_extra_http_headers(
        {
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Referer": "https://www.google.com/",
        }
    )

    return p, browser, page
