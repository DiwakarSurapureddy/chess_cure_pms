from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(
        self,
        game_id: str,
        websocket: WebSocket,
    ):
        try:
            await websocket.accept()
        except RuntimeError:
            # WebSocket was already accepted earlier
            pass

        if game_id not in self.active_connections:
            self.active_connections[game_id] = []

        if websocket not in self.active_connections[game_id]:
            self.active_connections[game_id].append(websocket)

    def disconnect(
        self,
        game_id: str,
        websocket: WebSocket,
    ):
        if game_id not in self.active_connections:
            return

        if websocket in self.active_connections[game_id]:
            self.active_connections[game_id].remove(websocket)

        if not self.active_connections[game_id]:
            del self.active_connections[game_id]

    async def send_to_game(
        self,
        game_id: str,
        message: dict,
    ):
        connections = list(self.active_connections.get(game_id, []))
        dead = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                dead.append(websocket)

        for ws in dead:
            self.disconnect(game_id, ws)

    async def send_to_player(
        self,
        websocket: WebSocket,
        message: dict,
    ):
        try:
            await websocket.send_json(message)
        except Exception:
            pass


connection_manager = ConnectionManager()
