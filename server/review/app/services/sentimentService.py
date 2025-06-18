from google import genai
from app.config import settings
from typing import Literal
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

SentimentType = Literal["LIKE", "NEUTRAL", "DISLIKE"]

class SentimentService:
    def __init__(self):
        if settings.googleAiApiKey:
            try:
                self.client = genai.Client(api_key=settings.googleAiApiKey)
                self.modelName = 'gemini-1.5-flash'
                self.executor = ThreadPoolExecutor(max_workers=2)
                logging.info(f"Gemini AI initialized with model: {self.modelName}")
            except Exception as e:
                logging.error(f"Failed to initialize Gemini AI: {e}")
                self.client = None
                self.executor = None
        else:
            logging.warning("Google AI API key not provided")
            self.client = None
            self.executor = None
    
    def _analyze_sentiment_sync(self, content: str) -> SentimentType:
        """Synchronous sentiment analysis"""
        try:
            prompt = f"""
            Analyze the sentiment of this product review and classify it as one of: LIKE, NEUTRAL, DISLIKE
            
            Guidelines:
            - LIKE: Positive sentiment, satisfied customer, good experience
            - NEUTRAL: Neutral or mixed sentiment, balanced review
            - DISLIKE: Negative sentiment, unsatisfied customer, bad experience
            
            Review: "{content.strip()}"
            
            Respond with only one word: LIKE, NEUTRAL, or DISLIKE
            """
            
            response = self.client.models.generate_content(
                model=self.modelName,
                contents=prompt
            )
            
            sentiment = response.text.strip().upper()
            
            if sentiment in ["LIKE", "NEUTRAL", "DISLIKE"]:
                logging.info(f"Sentiment analysis result: {sentiment}")
                return sentiment
            else:
                logging.warning(f"Unexpected sentiment result: {sentiment}, defaulting to NEUTRAL")
                return "NEUTRAL"
                
        except Exception as e:
            logging.error(f"Sentiment analysis error: {e}")
            return "NEUTRAL"
    
    async def analyzeSentiment(self, content: str) -> SentimentType:
        """Asynchronous wrapper for sentiment analysis"""
        if not self.client or not content or not content.strip():
            return "NEUTRAL"
        
        try:
            loop = asyncio.get_event_loop()
            sentiment = await loop.run_in_executor(
                self.executor, 
                self._analyze_sentiment_sync, 
                content
            )
            return sentiment
            
        except Exception as e:
            logging.error(f"Async sentiment analysis error: {e}")
            return "NEUTRAL"

sentimentService = SentimentService()