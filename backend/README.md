# Chess Cure Backend

Chess Cure is a backend system for a chess application built with FastAPI and Python.

## Technologies

* Python
* FastAPI
* Uvicorn
* python-chess
* Pydantic
* Pytest
* WebSocket

## Features

### Chess Game

* Create chess games
* Manage game sessions
* Validate legal chess moves
* Track game status
* Reset and delete games
* Store move history

### Play With Computer

* Computer chess opponent
* Easy difficulty
* Medium difficulty
* Hard difficulty
* Computer move generation

### Two Player Online

* Two-player chess games
* Real-time game communication
* WebSocket connections
* Real-time move updates
* Game state synchronization

### Chess Challenges

* Create chess challenges
* Random challenges
* Easy, Medium and Hard difficulty
* Challenge validation
* Solve and reset challenges
* Delete challenges

## Project Structure

```text
backend/
│
├── app/
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   ├── utils/
│   ├── websockets/
│   ├── config.py
│   ├── database.py
│   ├── dependencies.py
│   └── main.py
│
├── tests/
│   └── test_chess_backend.py
│
└── README.md
```

## Main API Endpoints

### Health

```text
GET /api/health
```

### Games

```text
POST /api/games
GET /api/games
GET /api/games/{game_id}
POST /api/games/{game_id}/start
POST /api/games/{game_id}/move
GET /api/games/{game_id}/history
POST /api/games/{game_id}/computer-move
POST /api/games/{game_id}/play-computer
POST /api/games/{game_id}/reset
DELETE /api/games/{game_id}
```

### Real-Time Chess

```text
WebSocket /api/games/{game_id}/ws
```

The WebSocket allows two players connected to the same game to receive chess move updates in real time.

### Challenges

```text
POST /api/challenges
GET /api/challenges
GET /api/challenges/{challenge_id}
POST /api/challenges/random
POST /api/challenges/{challenge_id}/solve
POST /api/challenges/{challenge_id}/reset
DELETE /api/challenges/{challenge_id}
```

## How to Run

Open PowerShell inside the `backend` folder.

Run:

```powershell
python -m uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

## Swagger API Documentation

Open:

```text
http://127.0.0.1:8000/docs
```

Swagger can be used to view and test the available REST APIs.

## Running Tests

From the `backend` folder, run:

```powershell
python -m pytest tests/test_chess_backend.py -v
```

### Test Result

```text
13 passed in 0.77s
```

The test suite verifies:

* Health API
* Game creation
* Game listing
* Chess move validation
* Game history
* Computer game
* Random challenges
* Challenge solving
* Invalid moves
* Game reset
* WebSocket connection
* Real-time chess moves
* Two-player real-time communication

## Development Status

Day 1 to Day 5 backend development, testing, integration and bug fixing are completed.

Real-time two-player online chess communication using WebSocket is also implemented and tested successfully.

**Current status: Backend development and testing completed.**

