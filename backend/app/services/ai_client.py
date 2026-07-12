from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings


class AIProvider(ABC):
    @abstractmethod
    async def chat(self, message: str, context: Optional[str] = None) -> str:
        pass
    
    @abstractmethod
    async def embed(self, text: str) -> list:
        pass


class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Import google.generativeai only when needed
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.embedding_model = genai.GenerativeModel('embedding-001')
        except ImportError:
            raise ImportError("google-generativeai package not installed. Install with: pip install google-generativeai")
    
    async def chat(self, message: str, context: Optional[str] = None) -> str:
        prompt = message
        if context:
            prompt = f"Context:\n{context}\n\nQuestion:\n{message}"
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    async def embed(self, text: str) -> list:
        try:
            response = self.embedding_model.embed_content(text)
            return response['embedding']
        except Exception as e:
            raise Exception(f"Gemini embedding error: {str(e)}")


class XAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Import openai for xAI (they use OpenAI-compatible API)
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1"
            )
        except ImportError:
            raise ImportError("openai package not installed. Install with: pip install openai")
    
    async def chat(self, message: str, context: Optional[str] = None) -> str:
        messages = [{"role": "user", "content": message}]
        if context:
            messages.insert(0, {"role": "system", "content": context})
        
        try:
            response = await self.client.chat.completions.create(
                model="grok-beta",
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"xAI API error: {str(e)}")
    
    async def embed(self, text: str) -> list:
        # xAI doesn't have a public embedding API yet, fallback to a mock or use another provider
        raise NotImplementedError("xAI embedding API not available. Use Gemini for embeddings.")


def get_ai_provider() -> AIProvider:
    if settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key)
    elif settings.xai_api_key:
        return XAIProvider(settings.xai_api_key)
    else:
        raise ValueError("No AI API key configured. Set GEMINI_API_KEY or XAI_API_KEY in .env")
