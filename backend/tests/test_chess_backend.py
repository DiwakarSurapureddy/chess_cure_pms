from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_create_game():
    response = client.post(
        "/api/games",
        json={
            "player1": "Mounika",
            "player2": "Computer",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "game" in data
    assert data["game"]["game_id"]


def test_get_games():
    response = client.get("/api/games")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "games" in data


def test_create_and_move():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    assert create_response.status_code == 200

    game_id = create_response.json()["game"]["game_id"]

    move_response = client.post(
        f"/api/games/{game_id}/move",
        json={
            "from_square": "e2",
            "to_square": "e4",
        },
    )

    assert move_response.status_code == 200

    data = move_response.json()

    assert data["success"] is True


def test_game_history():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    game_id = create_response.json()["game"]["game_id"]

    move_response = client.post(
        f"/api/games/{game_id}/move",
        json={
            "from_square": "e2",
            "to_square": "e4",
        },
    )

    assert move_response.status_code == 200

    history_response = client.get(
        f"/api/games/{game_id}/history"
    )

    assert history_response.status_code == 200

    data = history_response.json()

    assert data["success"] is True
    assert data["move_count"] == 1


def test_computer_game():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player",
            "player2": "Computer",
        },
    )

    game_id = create_response.json()["game"]["game_id"]

    response = client.post(
        f"/api/games/{game_id}/play-computer",
        params={
            "difficulty": "easy",
        },
        json={
            "from_square": "e2",
            "to_square": "e4",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "moves" in data


def test_random_challenge():
    response = client.post(
        "/api/challenges/random",
        params={
            "difficulty": "easy",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "challenge" in data


def test_challenge_solve():
    create_response = client.post(
        "/api/challenges",
        json={
            "title": "Test Challenge",
            "difficulty": "easy",
            "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
            "solution": "e7e5",
        },
    )

    assert create_response.status_code == 200

    challenge = create_response.json()["challenge"]

    challenge_id = challenge["challenge_id"]

    response = client.post(
        f"/api/challenges/{challenge_id}/solve",
        json={
            "move": "e7e5",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_invalid_move():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    game_id = create_response.json()["game"]["game_id"]

    response = client.post(
        f"/api/games/{game_id}/move",
        json={
            "from_square": "e2",
            "to_square": "e5",
        },
    )

    assert response.status_code == 400


def test_reset_game():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    game_id = create_response.json()["game"]["game_id"]

    response = client.post(
        f"/api/games/{game_id}/reset"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_websocket_connection():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    assert create_response.status_code == 200

    game_id = create_response.json()["game"]["game_id"]

    with client.websocket_connect(
        f"/api/games/{game_id}/ws"
    ) as websocket:

        message = websocket.receive_json()

        assert message["type"] == "connected"
        assert message["game"]["game_id"] == game_id


def test_websocket_move():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    assert create_response.status_code == 200

    game_id = create_response.json()["game"]["game_id"]

    with client.websocket_connect(
        f"/api/games/{game_id}/ws"
    ) as websocket:

        connected_message = websocket.receive_json()

        assert connected_message["type"] == "connected"

        websocket.send_json(
            {
                "action": "move",
                "from_square": "e2",
                "to_square": "e4",
            }
        )

        move_message = websocket.receive_json()

        assert move_message["type"] == "move"
        assert move_message["success"] is True
        assert move_message["game"]["moves"][-1] == "e2e4"


def test_two_player_realtime_move():
    create_response = client.post(
        "/api/games",
        json={
            "player1": "Player 1",
            "player2": "Player 2",
        },
    )

    assert create_response.status_code == 200

    game_id = create_response.json()["game"]["game_id"]

    with client.websocket_connect(
        f"/api/games/{game_id}/ws"
    ) as player1:

        player1_connected = player1.receive_json()

        assert player1_connected["type"] == "connected"

        with client.websocket_connect(
            f"/api/games/{game_id}/ws"
        ) as player2:

            player2_connected = player2.receive_json()

            assert player2_connected["type"] == "connected"

            player1_connection_update = player1.receive_json()

            assert player1_connection_update["type"] == "connected"

            player1.send_json(
                {
                    "action": "move",
                    "from_square": "e2",
                    "to_square": "e4",
                }
            )

            player1_update = player1.receive_json()
            player2_update = player2.receive_json()

            assert player1_update["type"] == "move"
            assert player2_update["type"] == "move"

            assert (
                player1_update["game"]["moves"][-1]
                == "e2e4"
            )

            assert (
                player2_update["game"]["moves"][-1]
                == "e2e4"
            )