from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import UserPreference
from app.core.security import verify_password, get_password_hash
from app.schemas.profile import (
    PreferencesUpdateRequest,
    PreferencesResponse,
    ChangePasswordRequest,
)

router = APIRouter(tags=["Settings"])

@router.get("/preferences", response_model=PreferencesResponse)
def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[GET] Retrieves theme, audio, and notification preferences for current user."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref.to_dict()

@router.put("/preferences", response_model=PreferencesResponse)
def update_user_preferences(
    payload: PreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[PUT] Updates theme, piece audio, and move notification preferences."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if payload.boardTheme is not None:
        pref.board_theme = payload.boardTheme
    if payload.pieceAudio is not None:
        pref.piece_audio = payload.pieceAudio
    if payload.secretMoveNotifications is not None:
        pref.secret_move_notifications = payload.secretMoveNotifications
    if payload.soundVolume is not None:
        pref.sound_volume = payload.soundVolume
    if payload.showInstructions is not None:
        pref.show_instructions = payload.showInstructions

    db.commit()
    db.refresh(pref)
    return pref.to_dict()

@router.put("/password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[PUT] Validates current password and updates to new password."""
    if current_user.auth_provider != "local" and not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Social login accounts do not have a password. Please sign in via your social provider."
        )

    if not current_user.hashed_password or not verify_password(payload.currentPassword, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Please recheck and try again."
        )

    if payload.currentPassword == payload.newPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the current password."
        )

    current_user.hashed_password = get_password_hash(payload.newPassword)
    db.commit()
    return {
        "success": True,
        "message": "Password changed successfully. Please keep it secure."
    }

@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """[DELETE] Permanently deletes the current user account and preferences."""
    # Delete preferences
    db.query(UserPreference).filter(UserPreference.user_id == current_user.id).delete()
    # Delete user
    db.delete(current_user)
    db.commit()
    return {
        "success": True,
        "message": "Your ChessCure account has been permanently removed."
    }
