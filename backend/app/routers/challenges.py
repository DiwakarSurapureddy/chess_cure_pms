from fastapi import APIRouter, HTTPException

from app.models.challenge import (
    ChallengeCreateRequest,
    ChallengeSolveRequest,
)
from app.services.challenge_service import challenge_service


router = APIRouter(
    prefix="/api/challenges",
    tags=["Challenges"],
)


@router.post("")
def create_challenge(request: ChallengeCreateRequest):
    if request.difficulty.lower() not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard",
        )

    challenge = challenge_service.create_challenge(
        title=request.title,
        difficulty=request.difficulty.lower(),
        fen=request.fen,
        solution=request.solution,
    )

    return {
        "success": True,
        "message": "Challenge created successfully",
        "challenge": challenge.get_state(),
    }


@router.post("/random")
def create_random_challenge(difficulty: str = "easy"):
    challenge, message = challenge_service.create_random_challenge(
        difficulty
    )

    if challenge is None:
        raise HTTPException(
            status_code=400,
            detail=message,
        )

    return {
        "success": True,
        "message": message,
        "challenge": challenge.get_state(),
    }


@router.get("")
def get_all_challenges():
    challenges = challenge_service.get_all_challenges()

    return {
        "success": True,
        "count": len(challenges),
        "challenges": [
            challenge.get_state()
            for challenge in challenges
        ],
    }


@router.get("/difficulty/{difficulty}")
def get_challenges_by_difficulty(difficulty: str):
    if difficulty.lower() not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard",
        )

    challenges = challenge_service.get_challenges_by_difficulty(
        difficulty.lower()
    )

    return {
        "success": True,
        "difficulty": difficulty.lower(),
        "count": len(challenges),
        "challenges": [
            challenge.get_state()
            for challenge in challenges
        ],
    }


@router.get("/{challenge_id}")
def get_challenge(challenge_id: str):
    challenge = challenge_service.get_challenge(challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    return {
        "success": True,
        "challenge": challenge.get_state(),
    }


@router.post("/{challenge_id}/solve")
def solve_challenge(
    challenge_id: str,
    request: ChallengeSolveRequest,
):
    challenge, message = challenge_service.solve_challenge(
        challenge_id,
        request.move,
    )

    if challenge is None:
        raise HTTPException(
            status_code=400,
            detail=message,
        )

    return {
        "success": True,
        "message": message,
        "challenge": challenge.get_state(),
    }


@router.post("/{challenge_id}/reset")
def reset_challenge(challenge_id: str):
    challenge, message = challenge_service.reset_challenge(
        challenge_id
    )

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail=message,
        )

    return {
        "success": True,
        "message": message,
        "challenge": challenge.get_state(),
    }


@router.delete("/{challenge_id}")
def delete_challenge(challenge_id: str):
    deleted = challenge_service.delete_challenge(
        challenge_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    return {
        "success": True,
        "message": "Challenge deleted successfully",
    }