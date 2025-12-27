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
        ],
    )

    context = await browser.new_context(
        user_agent=agent["user_agent"],
        locale=agent["locale"],
        timezone_id=agent["timezone"],
        viewport={"width": 1280, "height": 800},
    )

    page = await context.new_page()
    return p, browser, page
