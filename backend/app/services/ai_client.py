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
            self.model = genai.GenerativeModel('gemini-2.0-flash')
        except ImportError:
            raise ImportError("google-generativeai package not installed. Install with: pip install google-generativeai")
    
    async def chat(self, message: str, context: Optional[str] = None) -> str:
        prompt = message
        if context:
            prompt = f"Context:\n{context}\n\nQuestion:\n{message}"
        
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    async def embed(self, text: str) -> list:
        try:
            import google.generativeai as genai
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
            )
            return result['embedding']
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


class GroqProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        except ImportError:
            raise ImportError("openai package not installed. Install with: pip install openai")
    
    async def chat(self, message: str, context: Optional[str] = None) -> str:
        messages = [{"role": "user", "content": message}]
        if context:
            messages.insert(0, {"role": "system", "content": context})
        
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            try:
                response = await self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception as fallback_e:
                raise Exception(f"Groq API error: {str(e)} (Fallback error: {str(fallback_e)})")
    
    async def embed(self, text: str) -> list:
        raise NotImplementedError("Groq API does not currently support text embeddings. Falling back to keyword search.")


def get_ai_provider() -> AIProvider:
    if settings.groq_api_key:
        return GroqProvider(settings.groq_api_key)
    elif settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key)
    elif settings.xai_api_key:
        return XAIProvider(settings.xai_api_key)
    else:
        raise ValueError("No AI API key configured. Set GROQ_API_KEY, GEMINI_API_KEY, or XAI_API_KEY in .env")


def get_embedding_provider() -> AIProvider:
    """Get AI provider specifically for embeddings (prefer Gemini for better embeddings)"""
    if settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key)
    elif settings.groq_api_key:
        return GroqProvider(settings.groq_api_key)
    elif settings.xai_api_key:
        return XAIProvider(settings.xai_api_key)
    else:
        raise ValueError("No AI API key configured for embeddings. Set GROQ_API_KEY, GEMINI_API_KEY, or XAI_API_KEY in .env")
