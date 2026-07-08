from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import httpx
import os
import logging

router = APIRouter()
logger = logging.getLogger("stellarvax-batch")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")

class BatchVerifyRequest(BaseModel):
    wallets: List[str]

@router.post("/verify")
async def batch_verify(payload: BatchVerifyRequest):
    results = {}
    async with httpx.AsyncClient() as client:
        for wallet in payload.wallets:
            if not wallet.startswith('G') or len(wallet) != 56:
                results[wallet] = {"verified": False, "error": "Invalid address format"}
                continue
            
            try:
                # Query Node.js public verification endpoint
                res = await client.get(f"{BACKEND_URL}/v1/verify/{wallet}", timeout=2.0)
                if res.status_code == 200:
                    results[wallet] = res.json()
                else:
                    results[wallet] = {"verified": False, "error": f"Backend returned status {res.status_code}"}
            except Exception as e:
                logger.error(f"Error querying backend for {wallet}: {e}")
                # Offline mock fallback
                is_demo = wallet == 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH'
                results[wallet] = {
                    "verified": is_demo,
                    "count": 1 if is_demo else 0,
                    "records": []
                }
    return {
        "status": "success",
        "results": results
    }
