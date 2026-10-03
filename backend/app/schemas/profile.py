from typing import Optional, List
from pydantic import BaseModel, Field

class GameCreateRequest(BaseModel):
    opponent: str = Field(..., description="Opponent name or engine level")
    mode: Optional[str] = Field("vs Computer", description="Game mode")
    result: str = Field(..., description="Won, Lost, or Draw")
    method: Optional[str] = Field("Checkmate", description="Method of win/loss/draw")
    moves: Optional[int] = Field(0, description="Total moves played")
    ratingChange: Optional[str] = Field("+0", description="Rating delta string, e.g. +15, -10")

class GameResponse(BaseModel):
    id: str
    opponent: str
    mode: str
    result: str
    method: str
    moves: int
    ratingChange: str
    date: str

class GameStatsResponse(BaseModel):
    totalGames: int
    wins: int
    losses: int
    draws: int
    winRate: int
    lossRate: int
    drawRate: int
    rating: int
    puzzlesSolved: int
    skill: str
    title: str

class PreferencesUpdateRequest(BaseModel):
    boardTheme: Optional[str] = None
    pieceAudio: Optional[bool] = None
    secretMoveNotifications: Optional[bool] = None
    soundVolume: Optional[int] = None
    showInstructions: Optional[bool] = None

class PreferencesResponse(BaseModel):
    boardTheme: str
    pieceAudio: bool
    secretMoveNotifications: bool
    soundVolume: int
    showInstructions: bool = True

class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., description="Current account password")
    newPassword: str = Field(..., min_length=6, description="New password with minimum 6 characters")
