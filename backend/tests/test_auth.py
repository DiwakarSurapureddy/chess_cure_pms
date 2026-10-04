import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    # Login with seeded demo user
    response = client.post(
        "/api/auth/login",
        json={"email": "grandmaster@chesscure.com", "password": "Checkmate2026!"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_login_invalid_password():
    res = client.post(
        "/api/auth/login",
        json={"email": "grandmaster@chesscure.com", "password": "WrongPassword!"}
    )
    assert res.status_code in [400, 401]
    assert res.json()["success"] is False

def test_register_and_login():
    import uuid
    rand_user = f"user_{uuid.uuid4().hex[:6]}"
    rand_email = f"{rand_user}@test.com"

    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": rand_user,
            "email": rand_email,
            "password": "Password123!",
            "skill": "intermediate"
        }
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["success"] is True

    # Duplicate registration should fail
    dup_res = client.post(
        "/api/auth/register",
        json={
            "username": rand_user,
            "email": rand_email,
            "password": "Password123!"
        }
    )
    assert dup_res.status_code == 400
    assert dup_res.json()["success"] is False

def test_profile_endpoints(auth_headers):
    # GET profile
    res = client.get("/api/profile/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True

    # GET stats
    stats_res = client.get("/api/profile/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert "totalGames" in data
    assert "winRate" in data

    # GET games history
    games_res = client.get("/api/profile/games", headers=auth_headers)
    assert games_res.status_code == 200
    assert isinstance(games_res.json(), list)

def test_record_new_game(auth_headers):
    payload = {
        "opponent": "Test Engine Lvl 5",
        "mode": "vs Computer",
        "result": "Won",
        "method": "Checkmate",
        "moves": 28,
        "ratingChange": "+15"
    }
    res = client.post("/api/profile/games", headers=auth_headers, json=payload)
    assert res.status_code == 201
    assert res.json()["opponent"] == "Test Engine Lvl 5"
    assert res.json()["result"] == "Won"

def test_settings_preferences(auth_headers):
    # GET preferences
    res = client.get("/api/settings/preferences", headers=auth_headers)
    assert res.status_code == 200
    assert "boardTheme" in res.json()

    # PUT preferences
    update_res = client.put(
        "/api/settings/preferences",
        headers=auth_headers,
        json={"pieceAudio": False, "soundVolume": 65}
    )
    assert update_res.status_code == 200
    assert update_res.json()["pieceAudio"] is False
    assert update_res.json()["soundVolume"] == 65

def test_settings_password_validation(auth_headers):
    # Incorrect current password
    bad_res = client.put(
        "/api/settings/password",
        headers=auth_headers,
        json={"currentPassword": "WrongPassword", "newPassword": "BrandNewPassword123!"}
    )
    assert bad_res.status_code == 400
    assert "Current password is incorrect" in bad_res.json()["error"]

def test_facebook_auth_endpoint():
    res = client.post(
        "/api/auth/facebook",
        json={
            "accessToken": "EAABsampleToken",
            "name": "Facebook Test Player",
            "email": "fb_tester@facebook.com",
            "avatar": "https://graph.facebook.com/v20.0/test/picture"
        }
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "token" in res.json()
    assert res.json()["user"]["authProvider"] == "facebook" or res.json()["user"]["email"] == "fb_tester@facebook.com"

def test_logout():
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True
