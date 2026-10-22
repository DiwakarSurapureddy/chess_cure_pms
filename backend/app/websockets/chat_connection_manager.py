from typing import Dict, Set

from fastapi import WebSocket


def chat_room_key(user1_id: str, user2_id: str) -> str:
    """Return the same room key regardless of which participant connects first."""
    return ":".join(sorted((user1_id, user2_id)))


class ChatConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    def connect(self, room: str, websocket: WebSocket) -> None:
        self.active_connections.setdefault(room, set()).add(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        connections = self.active_connections.get(room)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self.active_connections.pop(room, None)

    def is_user_online(self, user_id: str) -> bool:
        return any(
            user_id in room.split(":", 1)
            for room, connections in self.active_connections.items()
            if connections
        )

    async def publish(self, room: str, event: dict) -> None:
        dead = []
        for websocket in list(self.active_connections.get(room, set())):
            try:
                await websocket.send_json(event)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(room, websocket)

    async def relay(self, room: str, event: dict, sender: WebSocket) -> None:
        """Relay a signaling event to the other participant's chat sockets."""
        dead = []
        for websocket in list(self.active_connections.get(room, set())):
            if websocket is sender:
                continue
            try:
                await websocket.send_json(event)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(room, websocket)


chat_connection_manager = ChatConnectionManager()
