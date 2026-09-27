import random
import uuid

from app.models.challenge import Challenge


class ChallengeService:
    def __init__(self):
        self.challenges = {}

        self.challenge_templates = {
            "easy": [
                {
                    "title": "Easy Opening Challenge",
                    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                    "solution": "e7e5",
                },
                {
                    "title": "Easy Knight Challenge",
                    "fen": "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
                    "solution": "b8c6",
                },
            ],
            "medium": [
                {
                    "title": "Medium Tactical Challenge",
                    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                    "solution": "f1b5",
                },
                {
                    "title": "Medium Center Challenge",
                    "fen": "rnbqkbnr/ppp2ppp/8/3pp3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
                    "solution": "c4d5",
                },
            ],
            "hard": [
                {
                    "title": "Hard Tactical Challenge",
                    "fen": "r1bq1rk1/ppp2ppp/2np1n2/8/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w - - 0 1",
                    "solution": "d2d4",
                },
                {
                    "title": "Hard Strategy Challenge",
                    "fen": "r2q1rk1/ppp1bppp/2np1n2/8/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 w - - 0 1",
                    "solution": "d2d4",
                },
            ],
        }

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

    def create_random_challenge(self, difficulty: str = "easy"):
        difficulty = difficulty.lower()

        if difficulty not in self.challenge_templates:
            return None, "Difficulty must be easy, medium, or hard"

        template = random.choice(
            self.challenge_templates[difficulty]
        )

        challenge = self.create_challenge(
            title=template["title"],
            difficulty=difficulty,
            fen=template["fen"],
            solution=template["solution"],
        )

        return challenge, "Random challenge created successfully"

    def get_challenge(self, challenge_id: str):
        return self.challenges.get(challenge_id)

    def get_all_challenges(self):
        return list(self.challenges.values())

    def get_challenges_by_difficulty(self, difficulty: str):
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

        if challenge.completed:
            return None, "Challenge is already completed"

        success, message = challenge.validate_solution(move)

        return challenge, message

    def reset_challenge(self, challenge_id: str):
        challenge = self.get_challenge(challenge_id)

        if challenge is None:
            return None, "Challenge not found"

        challenge.status = "active"
        challenge.completed = False
        challenge.result = None
        challenge.completed_at = None

        return challenge, "Challenge reset successfully"

    def delete_challenge(self, challenge_id: str):
        if challenge_id not in self.challenges:
            return False

        del self.challenges[challenge_id]

        return True


challenge_service = ChallengeService()