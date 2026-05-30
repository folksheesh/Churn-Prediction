"""
Email service for sending real emails via SMTP.
Falls back to simulation mode (console logging) when SMTP is not configured.

Configure via environment variables:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_USE_TLS
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# ── SMTP Configuration ──────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@churnsense.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

MAX_RETRIES = 3

def is_smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def _send_smtp_email(to_email: str, subject: str, html_body: str) -> dict:
    """Send an email via SMTP with retry logic. Returns status dict."""
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            if SMTP_USE_TLS:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
                server.starttls()
            else:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)

            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            server.quit()

            logger.info(f"Email sent to {to_email}: {subject}")
            return {"status": "Sent", "error": None}

        except Exception as e:
            last_error = str(e)
            logger.warning(f"SMTP attempt {attempt}/{MAX_RETRIES} failed: {e}")

    logger.error(f"Email delivery failed after {MAX_RETRIES} retries: {last_error}")
    return {"status": "Failed", "error": last_error}


def _simulate_email(to_email: str, subject: str, html_body: str) -> dict:
    """Simulate email sending when SMTP is not configured."""
    logger.info(
        f"[EMAIL SIMULATION] To: {to_email} | Subject: {subject} | "
        f"Body length: {len(html_body)} chars"
    )
    print(f"\n{'='*60}")
    print(f"  📧 EMAIL SIMULATION (SMTP not configured)")
    print(f"  To:      {to_email}")
    print(f"  Subject: {subject}")
    print(f"  Time:    {datetime.utcnow().isoformat()}")
    print(f"{'='*60}\n")
    return {"status": "Sent", "error": None, "simulated": True}


def send_email(to_email: str, subject: str, html_body: str) -> dict:
    """
    Send an email. Uses SMTP if configured, otherwise simulates.
    Returns: {"status": "Sent"|"Failed", "error": str|None, "simulated": bool}
    """
    if is_smtp_configured():
        result = _send_smtp_email(to_email, subject, html_body)
        result["simulated"] = False
        return result
    else:
        return _simulate_email(to_email, subject, html_body)


# ── Email Templates ──────────────────────────────────────────────────────────

def build_contact_customer_email(customer_name: str) -> dict:
    """Template for 'Contact Customer' mitigation action."""
    subject = "We'd Love to Hear From You"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ChurnSense</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Customer Success Team</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {customer_name},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed a decrease in your recent engagement and wanted to check if there's 
                anything we can help with.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Your satisfaction is our top priority, and we'd love to understand how we can 
                improve your experience with our platform.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Feel free to reply to this email or reach out to our support team at any time.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 24px;">
                Best regards,<br>
                <strong>Customer Success Team</strong>
            </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Sent by ChurnSense — Intelligent Customer Retention Platform
        </p>
    </div>
    """
    return {"subject": subject, "body": body}


def build_engagement_email(customer_name: str) -> dict:
    """Template for 'Send Engagement Email' mitigation action."""
    subject = "We Miss You! Here's What's New"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome Back!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">We've been making things better for you</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {customer_name},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                It's been a while since your last visit, and we wanted to share some exciting 
                updates we've been working on:
            </p>
            <ul style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                <li>🚀 Improved dashboard with faster analytics</li>
                <li>📊 New predictive insights powered by AI</li>
                <li>🛡️ Enhanced security and performance</li>
            </ul>
            <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    Log In &amp; Explore →
                </a>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                We'd love to see you back!
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>Customer Success Team</strong>
            </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Sent by ChurnSense — Intelligent Customer Retention Platform
        </p>
    </div>
    """
    return {"subject": subject, "body": body}


def build_retention_offer_email(customer_name: str) -> dict:
    """Template for 'Send Retention Offer' mitigation action."""
    subject = "A Special Offer Just For You 🎁"
    body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Exclusive Offer</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Just for you, {customer_name}!</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {customer_name},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                As a valued customer, we'd like to offer you an exclusive retention package:
            </p>
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #92400e; margin: 0;">15% OFF</p>
                <p style="font-size: 14px; color: #92400e; margin: 4px 0 0 0;">on your next 3 months</p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                This offer is our way of saying thank you for being part of our community. 
                We value your business and want to ensure you continue getting the best experience.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="#" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    Claim Your Offer →
                </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                This offer expires in 7 days. Terms and conditions apply.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                Best regards,<br>
                <strong>Customer Success Team</strong>
            </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Sent by ChurnSense — Intelligent Customer Retention Platform
        </p>
    </div>
    """
    return {"subject": subject, "body": body}
