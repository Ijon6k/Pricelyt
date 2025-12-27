import random

AGENTS = [
    {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "locale": "en-US",
        "timezone": "America/New_York",
    },
    {
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64)",
        "locale": "en-GB",
        "timezone": "Europe/London",
    },
    {
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "locale": "en-SG",
        "timezone": "Asia/Singapore",
    },
]


def pick_agent():
    return random.choice(AGENTS)
