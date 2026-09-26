from pydantic import BaseModel


class GameCreateRequest(BaseModel):
    player_name: str = "Player"


class MoveRequest(BaseModel):
    move: str


class GameResponse(BaseModel):
    game_id: str
    player_name: str
    fen: str
    turn: str
    game_over: bool
