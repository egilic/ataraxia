import resend
import os
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY") 
SUPPORT_EMAIL = "ataraxiahelpdesk@gmail.com"  

resend.api_key = RESEND_API_KEY

def send_password_reset_notification(user_email: str, user_name: str):
    """
    Send an email when someone requests a password reset
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
    
def send_feedback_email(user_name: str, user_email: str, feedback_message: str):
    """Send feedback to support email"""
    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": SUPPORT_EMAIL,
            "subject": f"Ataraxia Feedback from {user_name}",
            "html": f"""
                <h2>New Feedback Received</h2>
                <p><strong>From:</strong> {user_name} ({user_email})</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>{feedback_message}</p>
            """
        })
        return True
    except Exception as e:
        print(f"Error sending feedback email: {e}")
        return False