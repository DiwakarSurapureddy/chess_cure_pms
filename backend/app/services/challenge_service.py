import random
import uuid

import chess

from app.models.challenge import Challenge


class ChallengeService:
    def __init__(self):
        self.challenges = {}

    def create_challenge(
        self,
        title: str,
        difficulty: str,
        fen: str,
        solution: str,
    ):
        challenge_id = str(uuid.uuid4())

        challenge = Challenge(
            challenge_id=challenge_id,
            title=title,
            difficulty=difficulty,
            fen=fen,
            solution=solution,
        )

        self.challenges[challenge_id] = challenge

        return challenge

    def create_random_challenge(
        self,
        difficulty: str = "easy",
    ):
        difficulty = difficulty.lower()

        if difficulty not in ["easy", "medium", "hard"]:
            return None, "Difficulty must be easy, medium, or hard"

        positions = [
            {
                "title": "Find the best move",
                "fen": chess.Board().fen(),
                "solution": "e2e4",
            },
            {
                "title": "Start the chess game",
                "fen": chess.Board().fen(),
                "solution": "d2d4",
            },
            {
                "title": "Develop a piece",
                "fen": chess.Board().fen(),
                "solution": "g1f3",
            },
        ]

        position = random.choice(positions)

        challenge = self.create_challenge(
            title=position["title"],
            difficulty=difficulty,
            fen=position["fen"],
            solution=position["solution"],
        )

        return challenge, "Random challenge created successfully"

    def get_challenge(self, challenge_id: str):
        return self.challenges.get(challenge_id)

    def get_all_challenges(self):
        return list(self.challenges.values())

    def get_challenges_by_difficulty(
        self,
        difficulty: str,
    ):
        difficulty = difficulty.lower()

        return [
            challenge
            for challenge in self.challenges.values()
            if challenge.difficulty == difficulty
        ]

    def solve_challenge(
        self,
        challenge_id: str,
        move: str,
    ):
        challenge = self.get_challenge(challenge_id)

        if challenge is None:
            return None, "Challenge not found"

        if challenge.status == "completed":
            return challenge, "Challenge already completed"

        success, message = challenge.validate_solution(
            move.lower()
        )

        if not success:
            return None, message

        return challenge, message

    def reset_challenge(
        self,
        challenge_id: str,
    ):
        challenge = self.get_challenge(challenge_id)

        if challenge is None:
            return None, "Challenge not found"

        challenge.status = "active"
        challenge.completed = False
        challenge.result = None
        challenge.completed_at = None

        return challenge, "Challenge reset successfully"

    def delete_challenge(
        self,
        challenge_id: str,
    ):
        if challenge_id not in self.challenges:
            return False

        del self.challenges[challenge_id]

        return True


challenge_service = ChallengeService()