"""Shared constants for the scraper package."""

import os

# Rate used to normalize a detected non-USD (IDR) price back to USD.
# Override via env when scraping a different-currency marketplace.
# Set to 1 to disable normalisation.
IDR_TO_USD_RATE = int(os.getenv("IDR_TO_USD_RATE", "16200"))
