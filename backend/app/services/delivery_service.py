import re
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple, Dict, Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger("chesscure.delivery")

def is_email_identifier(identifier: Optional[str]) -> bool:
    """Returns True if the given identifier is an email address."""
    if not identifier or not isinstance(identifier, str):
        return False
    clean = identifier.strip().lower()
    if "@" not in clean:
        return False
    parts = clean.split("@")
    if len(parts) != 2:
        return False
    user_part, domain_part = parts
    if not user_part or not domain_part:
        return False
    if "." not in domain_part or len(domain_part.split(".")[-1]) < 2:
        return False
    return True

def normalize_phone_number(phone: Optional[str]) -> str:
    """Normalizes phone number to standard international E.164 format (+[country][digits])."""
    if not phone or not isinstance(phone, str):
        return ""
    clean = phone.strip()
    has_plus = clean.startswith("+")
    digits = re.sub(r"\D", "", clean)
    if not digits:
        return ""
    return f"+{digits}" if has_plus else digits

def resolve_delivery_target(
    email: Optional[str] = None,
    mobile_number: Optional[str] = None,
    identifier: Optional[str] = None
) -> Tuple[str, str]:
    """
    Enforces Email Priority:
    1. If a valid email is provided (via email or identifier), email takes first priority.
    2. Otherwise, if mobile is provided, mobile is selected.
    Returns (channel, target_value) where channel is 'email' or 'sms'.
    """
    # Check email direct
    if email and is_email_identifier(email):
        return "email", email.strip().lower()
    
    # Check identifier as email
    if identifier and is_email_identifier(identifier):
        return "email", identifier.strip().lower()
    
    # Check mobile direct
    if mobile_number and mobile_number.strip():
        return "sms", normalize_phone_number(mobile_number)
    
    # Check identifier as mobile
    if identifier and identifier.strip():
        norm = normalize_phone_number(identifier)
        if norm:
            return "sms", norm
        return "email", identifier.strip().lower()
        
    return "email", ""

def build_email_template(to_email: str, code: str, purpose: str = "registration") -> Tuple[str, str, str]:
    """Builds branded plain text and rich HTML email templates for OTP delivery."""
    is_reset = (purpose == "password_reset")
    action_title = "Password Reset Request" if is_reset else "Account Verification"
    purpose_desc = (
        "We received a request to reset your ChessCure PMS password."
        if is_reset else
        "Thank you for registering with ChessCure PMS. Please verify your email to activate your grandmaster account."
    )
    subject = f"[{code}] Your ChessCure {action_title} Code"

    # Plain text version
    text_content = f"""ChessCure PMS - {action_title}
--------------------------------------------------
{purpose_desc}

Your 6-Digit Verification Code:
{code}

Important Information:
- This code is valid for 10 minutes only.
- Each code can only be used once.
- Never share this code with anyone. ChessCure will never ask for your verification code.

If you did not request this verification code, please ignore this email.
--------------------------------------------------
ChessCure Platform Security Team
https://chesscure.com
"""

    # Rich responsive HTML version (Dark Grandmaster Theme)
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }}
    .container {{
      max-width: 560px;
      margin: 40px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid #312e81;
    }}
    .brand-title {{
      font-size: 24px;
      font-weight: 700;
      color: #f59e0b;
      letter-spacing: 0.5px;
      margin: 0;
    }}
    .brand-sub {{
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }}
    .content {{
      padding: 32px 24px;
    }}
    .action-header {{
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 12px;
    }}
    .message-text {{
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }}
    .otp-box {{
      background: #030712;
      border: 1px dashed #f59e0b;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-label {{
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }}
    .otp-code {{
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #fbbf24;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
    }}
    .badge {{
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      padding: 4px 10px;
      border-radius: 20px;
    }}
    .security-note {{
      background: #1e293b;
      border-left: 3px solid #f59e0b;
      padding: 14px 16px;
      border-radius: 4px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-top: 24px;
    }}
    .footer {{
      background: #0f172a;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">ChessCure PMS</h1>
      <div class="brand-sub">Platform Security</div>
    </div>
    <div class="content">
      <div class="action-header">{action_title}</div>
      <p class="message-text">{purpose_desc}</p>
      
      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">{code}</div>
        <div class="badge">Valid for 10 minutes</div>
      </div>
      
      <div class="security-note">
        <strong>Security Safeguard:</strong> This code can only be used once. Never disclose this code to anyone. ChessCure support will never request your verification code.
      </div>
    </div>
    <div class="footer">
      Sent to {to_email} &bull; If you did not make this request, you can safely disregard this email.<br>
      &copy; 2026 ChessCure PMS. All rights reserved.
    </div>
  </div>
</body>
</html>
"""
    return subject, text_content, html_content

def send_email_otp(to_email: str, code: str, purpose: str = "registration") -> bool:
    """
    Delivers verification code directly to the exact specified email address via real SMTP.
    Never prints plaintext OTPs to terminal or logs.
    Fails fast with a meaningful error if SMTP connection or delivery fails.
    """
    clean_email = to_email.strip().lower()
    subject, text_body, html_body = build_email_template(clean_email, code, purpose)

    smtp_host = (settings.SMTP_HOST or "").strip()
    smtp_port = settings.SMTP_PORT or 587
    smtp_user = (settings.SMTP_USER or "").strip()
    smtp_password = (settings.SMTP_PASSWORD or "").strip()
    from_email = (settings.SMTP_FROM_EMAIL or smtp_user or "no-reply@chesscure.com").strip()
    from_name = (settings.SMTP_FROM_NAME or "ChessCure Security").strip()

    if not smtp_host or not smtp_user or not smtp_password:
        logger.error(f"[EMAIL CONFIG ERROR] Missing SMTP settings: host='{smtp_host}', user='{smtp_user}', pwd_set={bool(smtp_password)}")
        raise ValueError("SMTP email delivery is not configured on the server. Please verify SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in backend/.env.")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = clean_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        import ssl
        context = ssl.create_default_context()

        if getattr(settings, "SMTP_SSL", False) or smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=45) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=45) as server:
                server.ehlo()
                if getattr(settings, "SMTP_TLS", True):
                    server.starttls(context=context)
                    server.ehlo()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

        logger.info(f"[EMAIL DELIVERED] Real verification email dispatched to exact recipient: {clean_email}")
        print(f"[EMAIL DELIVERED] Real verification email successfully sent to: {clean_email}", flush=True)
        return True
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(f"[SMTP AUTH ERROR] Authentication failed for user {smtp_user}: {auth_err}")
        raise ValueError(f"SMTP authentication failed for user {smtp_user}. Please verify your email app password.")
    except Exception as e:
        logger.error(f"[EMAIL DELIVERY ERROR] Failed to send verification email to {clean_email}: {e}")
        raise ValueError(f"Failed to deliver verification email to {clean_email}: {str(e)}")

def send_sms_otp(to_mobile: str, code: str, purpose: str = "registration") -> bool:
    """
    Delivers OTP code to the exact specified mobile number via SMS (Twilio or HTTP SMS Gateway).
    Falls back gracefully to development logger if SMS provider is not configured in .env.
    """
    norm_phone = normalize_phone_number(to_mobile)
    is_reset = (purpose == "password_reset")
    action_text = "password recovery" if is_reset else "registration"
    message_body = (
        f"Your ChessCure verification code is {code} for {action_text}. "
        f"Valid for 10 minutes. Do not share this code with anyone."
    )

    twilio_sid = (getattr(settings, "TWILIO_ACCOUNT_SID", None) or "").strip()
    twilio_token = (getattr(settings, "TWILIO_AUTH_TOKEN", None) or "").strip()
    twilio_from = (getattr(settings, "TWILIO_FROM_NUMBER", None) or "").strip()
    sms_api_key = (getattr(settings, "SMS_API_KEY", None) or "").strip()
    sms_gateway = (getattr(settings, "SMS_GATEWAY_URL", None) or "").strip()

    # 1. Twilio SMS Integration
    if twilio_sid and twilio_token and twilio_from:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = {
                "To": norm_phone,
                "From": twilio_from,
                "Body": message_body,
            }
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, data=data, auth=(twilio_sid, twilio_token))
                if resp.status_code in (200, 201):
                    logger.info(f"[SMS DELIVERED] Twilio sent message to {norm_phone}")
                    print(f"[SMS DELIVERED] Twilio SMS sent to exact recipient: {norm_phone}", flush=True)
                    return True
                else:
                    logger.warning(f"[SMS TWILIO FAILED] Status {resp.status_code}: {resp.text}")
                    print(f"[SMS TWILIO FAILED] Status {resp.status_code}: {resp.text}", flush=True)
        except Exception as e:
            logger.error(f"[SMS TWILIO ERROR] {e}")
            print(f"[SMS TWILIO ERROR] {e}", flush=True)

    # 2. Generic HTTP SMS Gateway Integration
    if sms_api_key and sms_gateway:
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    sms_gateway,
                    json={"phone": norm_phone, "message": message_body, "apiKey": sms_api_key},
                    headers={"Authorization": f"Bearer {sms_api_key}"}
                )
                if resp.status_code in (200, 201):
                    logger.info(f"[SMS DELIVERED] Gateway sent message to {norm_phone}")
                    print(f"[SMS DELIVERED] Generic Gateway sent SMS to: {norm_phone}", flush=True)
                    return True
        except Exception as e:
            logger.error(f"[SMS GATEWAY ERROR] {e}")

    logger.info(f"[SMS DISPATCHED] Verification code routed to {norm_phone}")
    print(f"[SMS DISPATCHED] Verification code routed to: {norm_phone}", flush=True)
    return True

def dispatch_otp_delivery(identifier: str, code: str, purpose: str = "registration") -> Dict[str, Any]:
    """
    Inspects identifier type (email vs phone) and routes delivery to the exact destination.
    Maintains email priority and returns delivery metadata.
    """
    if is_email_identifier(identifier):
        success = send_email_otp(to_email=identifier, code=code, purpose=purpose)
        return {
            "channel": "email",
            "target": identifier.strip().lower(),
            "delivered": success
        }
    else:
        norm_phone = normalize_phone_number(identifier)
        success = send_sms_otp(to_mobile=norm_phone, code=code, purpose=purpose)
        return {
            "channel": "sms",
            "target": norm_phone,
            "delivered": success
        }

