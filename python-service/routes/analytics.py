from fastapi import APIRouter
import os
import logging

router = APIRouter()
logger = logging.getLogger("stellarvax-analytics")

ANOMALY_THRESHOLD = int(os.getenv("ANOMALY_THRESHOLD", "50"))

@router.get("/rates")
async def get_rates():
    return {
        "status": "success",
        "data": {
            "vaccine_types": {
                "COVID-19": 65.4,
                "Influenza": 22.1,
                "Hepatitis-B": 8.5,
                "MMR": 3.0,
                "Polio": 1.0
            },
            "regions": {
                "North America": 78.2,
                "Europe": 82.5,
                "Asia-Pacific": 69.1,
                "Africa": 44.8,
                "Latin America": 58.3
            },
            "total_verifiable_records": 1420
        }
    }

@router.get("/issuers")
async def get_issuers():
    return {
        "status": "success",
        "data": [
            {
                "issuer": "GBADMIN12345678901234567890123456789012345678901234567890",
                "volume": 842,
                "last_active": "2026-07-08T07:15:00Z",
                "status": "authorized"
            },
            {
                "issuer": "GBV7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH1",
                "volume": 578,
                "last_active": "2026-07-08T06:44:12Z",
                "status": "authorized"
            }
        ]
    }

@router.get("/anomalies")
async def get_anomalies():
    return {
        "status": "success",
        "anomaly_threshold": ANOMALY_THRESHOLD,
        "flags": [
            {
                "issuer": "GBMOCKANOMALY1234567890123456789012345678901234567890",
                "mint_count_recent": 62,
                "reason": f"Mint count exceeded threshold of {ANOMALY_THRESHOLD} inside anomaly check window.",
                "severity": "high"
            }
        ]
    }
