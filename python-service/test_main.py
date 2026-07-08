from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "OK", "service": "stellarvax-analytics"}

def test_rates():
    response = client.get("/analytics/rates")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_anomalies():
    response = client.get("/analytics/anomalies")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_batch_verify():
    response = client.post("/batch/verify", json={"wallets": ["GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH"]})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
