"""
Solmaz Fashion — NVIDIA AI Proxy Server (Python + FastAPI)
===========================================================

Client-side AI asistanının NVIDIA API anahtarını görmeden 
güvenli bir şekilde API çağrıları yapmasını sağlar.

KURULUM:
1. pip install fastapi uvicorn python-dotenv httpx
2. .env dosyası oluşturun: NVIDIA_API_KEY=nvapi-XXXXXXXX
3. uvicorn python-server:app --reload --port 3001

PRODUCTION: Railway, Render, Fly.io, Heroku gibi platformlarda deploy edin.
"""

import os
import logging
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# NVIDIA API Configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra"

if not NVIDIA_API_KEY:
    logger.warning("⚠️ NVIDIA_API_KEY environment variable not set!")

# Pydantic Models
class Message(BaseModel):
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1, max_length=50000)

class ChatRequest(BaseModel):
    model: Optional[str] = DEFAULT_MODEL
    messages: List[Message] = Field(..., min_items=1, max_items=20)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=1024, ge=1, le=4096)
    stream: Optional[bool] = False

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "solmaz-fashion-ai-proxy"
    version: str = "1.0.0"

# Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Solmaz Fashion AI Proxy starting up...")
    logger.info(f"🔑 NVIDIA API Key: {'Configured' if NVIDIA_API_KEY else 'MISSING!'}")
    yield
    logger.info("🛑 Solmaz Fashion AI Proxy shutting down...")

# FastAPI App
app = FastAPI(
    title="Solmaz Fashion AI Proxy",
    description="Secure proxy for NVIDIA Nemotron 3 Ultra API",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Dependency for API key validation
async def verify_nvidia_key():
    if not NVIDIA_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later."
        )

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    return HealthResponse()

@app.post("/api/ai-chat", dependencies=[Depends(verify_nvidia_key)])
@limiter.limit("30/minute")  # Rate limiting: 30 requests per minute per IP
async def chat_completion(request: Request, chat_request: ChatRequest):
    """
    Secure proxy endpoint for NVIDIA Nemotron 3 Ultra chat completions.
    
    Forwards requests to NVIDIA API without exposing API key to client.
    """
    client_ip = get_remote_address(request)
    logger.info(f"📥 Chat request from {client_ip}, messages: {len(chat_request.messages)}")
    
    try:
        # Prepare headers for NVIDIA API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Accept": "application/json"
        }
        
        # Prepare payload
        payload = {
            "model": chat_request.model,
            "messages": [msg.dict() for msg in chat_request.messages],
            "temperature": chat_request.temperature,
            "max_tokens": chat_request.max_tokens,
            "stream": chat_request.stream
        }
        
        # Make request to NVIDIA API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                NVIDIA_API_URL,
                headers=headers,
                json=payload
            )
        
        # Handle NVIDIA API errors
        if response.status_code != 200:
            error_detail = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_detail.get("error", {}).get("message", f"NVIDIA API error: {response.status_code}")
            logger.error(f"❌ NVIDIA API Error ({response.status_code}): {error_msg}")
            raise HTTPException(
                status_code=response.status_code,
                detail={"error": {"message": error_msg}}
            )
        
        # Return successful response
        data = response.json()
        logger.info(f"✅ Response sent to {client_ip}")
        return data
        
    except httpx.TimeoutException:
        logger.error("⏱️ NVIDIA API timeout")
        raise HTTPException(status_code=504, detail={"error": {"message": "AI servisi yanıt vermedi. Lütfen tekrar deneyin."}})
    except httpx.RequestError as e:
        logger.error(f"🌐 Network error: {e}")
        raise HTTPException(status_code=502, detail={"error": {"message": "AI servisine bağlanılamıyor."}})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"💥 Unexpected error: {e}")
        raise HTTPException(status_code=500, detail={"error": {"message": "Sunucu hatası. Lütfen daha sonra tekrar deneyin."}})

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Solmaz Fashion AI Proxy",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "chat_endpoint": "POST /api/ai-chat"
    }

# Run with: uvicorn python-server:app --reload --port 3001
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("python-server:app", host="0.0.0.0", port=3001, reload=True)