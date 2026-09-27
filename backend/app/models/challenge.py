from datetime import datetime, UTC
from typing import Optional

from pydantic import BaseModel, Field


class Challenge:
    def __init__(
        self,
        challenge_id: str,
        title: str,
        difficulty: str,
        fen: str,
        solution: str,
    ):
        self.challenge_id = challenge_id
        self.title = title
        self.difficulty = difficulty
        self.fen = fen
        self.solution = solution

        self.status = "active"
        self.completed = False
        self.result: Optional[str] = None

        self.created_at = datetime.now(UTC)
        self.completed_at: Optional[datetime] = None

    def validate_solution(self, move: str):
        if move == self.solution:
            self.completed = True
            self.status = "completed"
            self.result = "correct"
            self.completed_at = datetime.now(UTC)

            return True, "Challenge solved successfully"

        self.result = "incorrect"

        return False, "Incorrect move"

    def get_state(self):
        return {
            "challenge_id": self.challenge_id,
            "title": self.title,
            "difficulty": self.difficulty,
            "fen": self.fen,
            "status": self.status,
            "completed": self.completed,
            "result": self.result,
            "created_at": self.created_at.isoformat(),
            "completed_at": (
                self.completed_at.isoformat()
                if self.completed_at
                else None
            ),
        }


class ChallengeCreateRequest(BaseModel):
    title: str
    difficulty: str
    fen: str
    solution: str


class ChallengeSolveRequest(BaseModel):
    move: str


class ChallengeDifficultyRequest(BaseModel):
    difficulty: str = Field(default="easy")