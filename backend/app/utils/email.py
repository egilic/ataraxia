import resend
import os
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY") 
SUPPORT_EMAIL = "ataraxiahelpdesk@gmail.com"  

resend.api_key = RESEND_API_KEY

def send_password_reset_notification(user_email: str, user_name: str):
    """
    Send an email to YOU when someone requests a password reset
    """
    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",  # Resend's test email
            "to": SUPPORT_EMAIL,  
            "subject": f"Password Reset Request - Ataraxia",
            "html": f"""
                <h2>Password Reset Request</h2>
                <p>A user has requested a password reset:</p>
                <ul>
                    <li><strong>Name:</strong> {user_name}</li>
                    <li><strong>Email:</strong> {user_email}</li>
                </ul>
                <p>Please help them reset their password manually.</p>
            """
        })
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False