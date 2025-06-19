import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GROK_API_KEY = os.getenv("GROK_KEY")
    GROK_MODEL = os.getenv("GROK_MODEL", "grok-3-latest")
    GROK_BASE_URL = "https://api.x.ai/v1"

config = Config()