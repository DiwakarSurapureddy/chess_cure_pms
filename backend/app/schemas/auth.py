from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserResponse(BaseModel):
    id: str
    username: str
    name: Optional[str] = None
    email: str
    mobileNumber: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    skill: Optional[str] = "intermediate"
    rating: Optional[int] = 1200
    title: Optional[str] = "Tactical Aspirant"
    wins: Optional[int] = 0
    losses: Optional[int] = 0
    draws: Optional[int] = 0
    puzzlesSolved: Optional[int] = 0
    authProvider: Optional[str] = "local"
    isGuest: Optional[bool] = False
    playerId: Optional[str] = None
    createdAt: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, description="Desired username")
    email: EmailStr = Field(..., description="Valid user email address")
    mobileNumber: Optional[str] = Field(None, description="Optional mobile number")
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    skill: Optional[str] = Field("intermediate", description="beginner, intermediate, advanced, master")
    otp: Optional[str] = Field(None, description="6-digit verification code sent to email or mobile")

class LoginRequest(BaseModel):
    # 'email' field in frontend can be email, username, or phone number
    email: str = Field(..., description="Email address, username, or mobile number")
    password: str = Field(..., description="User password")
    rememberMe: Optional[bool] = Field(True, description="Keep user session logged in")

class FacebookAuthRequest(BaseModel):
    accessToken: Optional[str] = None
    email: Optional[str] = "fb_player@facebook.com"
    name: Optional[str] = "Facebook Master"
    avatar: Optional[str] = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80"

class GuestAuthRequest(BaseModel):
    username: Optional[str] = None

class OtpSendRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    mobileNumber: Optional[str] = None
    purpose: Optional[str] = Field("registration", description="registration or password_reset")

class OtpVerifyRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    mobileNumber: Optional[str] = None
    otp: str = Field(..., min_length=4, max_length=10)
    purpose: Optional[str] = Field("registration", description="registration or password_reset")

class ResetPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Email address or mobile number")
    otp: str = Field(..., min_length=4, max_length=10, description="Verification code")
    newPassword: str = Field(..., min_length=6, description="New password with minimum 6 characters")

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    mobileNumber: Optional[str] = None
    skill: Optional[str] = None
    avatar: Optional[str] = None
    rating: Optional[int] = None
    title: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    token: Optional[str] = None
    user: Optional[UserResponse] = None
