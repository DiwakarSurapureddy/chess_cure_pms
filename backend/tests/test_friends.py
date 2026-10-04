import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_friend_request_flow():
    # 1. Login user diwa
    diwa_login = client.post("/api/auth/login", json={
        "email": "diwa@gmail.com",
        "password": "diwa123"
    })
    assert diwa_login.status_code == 200
    diwa_token = diwa_login.json()["token"]

    # 2. Login user Sumathi Gajjala
    sumathi_login = client.post("/api/auth/login", json={
        "email": "gajjalasumathi502@gmail.com",
        "password": "diwa123"
    })
    assert sumathi_login.status_code == 200
    sumathi_token = sumathi_login.json()["token"]
    sumathi_player_id = sumathi_login.json()["user"]["playerId"]

    # 3. Diwa sends friend request to Sumathi using Sumathi's Game ID
    send_res = client.post("/api/friends/request", json={
        "target_player_id": sumathi_player_id
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert send_res.status_code == 200
    assert send_res.json()["status"] in ["pending", "accepted"]

    # 4. Sumathi checks notifications
    notif_res = client.get("/api/friends/notifications", headers={"Authorization": f"Bearer {sumathi_token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]

    if len(notifs) > 0:
        req_id = notifs[0]["id"]
        # 5. Sumathi accepts Diwa's friend request
        accept_res = client.post("/api/friends/respond", json={
            "request_id": req_id,
            "action": "accept"
        }, headers={"Authorization": f"Bearer {sumathi_token}"})
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "accepted"

    # 6. Both users check friends list (should contain each other)
    diwa_friends = client.get("/api/friends/list", headers={"Authorization": f"Bearer {diwa_token}"})
    assert diwa_friends.status_code == 200
    friends_of_diwa = diwa_friends.json()["friends"]
    assert any(f["playerId"] == sumathi_player_id for f in friends_of_diwa)

    sumathi_friends = client.get("/api/friends/list", headers={"Authorization": f"Bearer {sumathi_token}"})
    assert sumathi_friends.status_code == 200
    friends_of_sumathi = sumathi_friends.json()["friends"]
    assert any(f["username"] == "diwa" for f in friends_of_sumathi)

def test_match_challenge_flow():
    # 1. Login Diwa
    diwa_login = client.post("/api/auth/login", json={
        "email": "diwa@gmail.com",
        "password": "diwa123"
    })
    diwa_token = diwa_login.json()["token"]

    # 2. Login Sumathi
    sumathi_login = client.post("/api/auth/login", json={
        "email": "gajjalasumathi502@gmail.com",
        "password": "diwa123"
    })
    sumathi_token = sumathi_login.json()["token"]
    sumathi_player_id = sumathi_login.json()["user"]["playerId"]

    # 3. Diwa challenges Sumathi to a match
    chal_res = client.post("/api/friends/challenge", json={
        "target_player_id": sumathi_player_id
    }, headers={"Authorization": f"Bearer {diwa_token}"})
    assert chal_res.status_code == 200
    chal_data = chal_res.json()
    assert chal_data["success"] is True
    game_id = chal_data["gameId"]
    challenge_id = chal_data["challengeId"]

    # 4. Sumathi checks notifications for match challenge
    notif_res = client.get("/api/friends/notifications", headers={"Authorization": f"Bearer {sumathi_token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]
    match_notifs = [n for n in notifs if n.get("type") == "match_challenge" and n.get("id") == challenge_id]
    assert len(match_notifs) == 1

    # 5. Sumathi accepts the match challenge
    resp_res = client.post("/api/friends/challenge/respond", json={
        "challenge_id": challenge_id,
        "action": "accept"
    }, headers={"Authorization": f"Bearer {sumathi_token}"})
    assert resp_res.status_code == 200
    resp_data = resp_res.json()
    assert resp_data["status"] == "accepted"
    assert resp_data["gameId"] == game_id

    # 6. Diwa checks challenge status (should be 'accepted')
    status_res = client.get(f"/api/friends/challenge/status/{game_id}", headers={"Authorization": f"Bearer {diwa_token}"})
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "accepted"

