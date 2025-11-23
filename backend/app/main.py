from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field
from app.database import get_supabase_client
from app.auth import hash_password, verify_password, create_access_token, verify_token
from app.utils.email import send_password_reset_notification, send_feedback_email
from collections import defaultdict
from os import load_dotenv

load_dotenv()

app = FastAPI()

supabase = get_supabase_client()

# Rate limiting data structures
password_reset_attempts = defaultdict(list)
feedback_attempts = defaultdict(list)

# Constants
MAX_RESET_ATTEMPTS = 3
RESET_WINDOW_MINUTES = 8 * 60
MAX_FEEDBACK_ATTEMPTS = 2
FEEDBACK_WINDOW_MINUTES = 60 * 24 # Two attempts per day

# Allow React to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=10)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10)

class ForgotPasswordRequest(BaseModel):
    email : EmailStr

class FeedbackRequest(BaseModel):
    message: str = Field(max_length=3000)

class SaveHabitsRequest(BaseModel):
    habits: list

class SaveCompletedRequest(BaseModel):
    completed_data: dict
    month: str

class SaveSleepRequest(BaseModel):
    sleep_data: dict
    month: str

class SaveMomentsRequest(BaseModel):
    moments: dict
    month: str

def get_current_user_from_token(authorization: str = Header(None)):
    """Extract user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


def check_rate_limit(email: str) -> bool:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=RESET_WINDOW_MINUTES)

     # Remove old attempts
    new_list = []
    for attempt in password_reset_attempts[email]:
        if attempt > cutoff:
            new_list.append(attempt)
    password_reset_attempts[email] = new_list

    # Check if under limit
    if len(password_reset_attempts[email]) >= MAX_RESET_ATTEMPTS:
        return False
    
    # Bookkeeping
    password_reset_attempts[email].append(now)
    return True


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/")
def root():
    return {"message": "API is running"}


@app.post("/api/signup")
def signup(signup_data: SignupRequest):
    # Check if user already exists
    existing_user = supabase.table('users').select('*').eq('email', signup_data.email).execute()

    if existing_user.data:
        raise HTTPException(status_code=400, detail="This email is already registered")
    
    # Hash password then create new user
    hashed_pw = hash_password(signup_data.password)
    
    result = supabase.table('users').insert({
        'name': signup_data.name,
        'email': signup_data.email,
        'hashed_password': hashed_pw
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user = result.data[0]

    # Create token
    token = create_access_token({"user_id": user['id'], "email": user['email']})

    return {
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }
    }



@app.post("/api/login")
def login(login_data: LoginRequest):
    result = supabase.table('users').select('*').eq('email', login_data.email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Fetch user
    user = result.data[0]

    if not verify_password(login_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user['id'], "email": user['email']})

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }
    }


@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    # Rate limit
    if not check_rate_limit(request.email):
        raise HTTPException(
            status_code=429,
            detail="Too many password reset attempts. Please try again later. After 3 attempts you will be locked out.")
   
    # Find user
    result = supabase.table('users').select('*').eq('email', request.email).execute()
    
    # Still return success to not reveal which emails exist
    if not result.data:
        return {"message": "If that email exists, we've been notified"}
    
    user = result.data[0]
    email_sent = send_password_reset_notification(user['email'], user['name'])
    
    if email_sent:
        return {"message": "Password reset request received. We'll contact you shortly."}
    else:
        return {"message": "There was an issue. Please try again later."}


@app.get("/api/habits")
def get_habits(authorization: str = Header(None)):
    """Get user's habits"""
    current_user = get_current_user_from_token(authorization)
    
    result = supabase.table('habits').select('*').eq('user_id', current_user['user_id']).execute()
    
    if result.data:
        return {"habits": result.data[0]['habits']}
    else:
        return {"habits": []}


@app.post("/api/feedback")
def submit_feedback(request: FeedbackRequest, authorization: str = Header(None)):
    """Submit user feedback"""
    curr_user = get_current_user_from_token(authorization)
    email = curr_user['email']

    if not check_rate_limit(email):
        raise HTTPException(
            status_code=429,
            detail="Too many feedback submissions. Please try again in an hour."
        )
    
    result = supabase.table('users').select('name, email').eq('id', curr_user['user_id']).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = result.data[0]
    email_sent = send_feedback_email(user['name'], user['email'], request.message)
    
    if email_sent:
        return {"message": "Thank you for your feedback!"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send feedback. Please try again.")


@app.get("/api/habits")
def get_habits(authorization: str = Header(None)):
    """Get user's habits"""
    current_user = get_current_user_from_token(authorization)
    
    result = supabase.table('habits').select('*').eq('user_id', current_user['user_id']).execute()
    
    if result.data:
        return {"habits": result.data[0]['habits']}
    else:
        return {"habits": []}
    

@app.post("/api/habits")
def save_habits(request: SaveHabitsRequest, authorization: str = Header(None)):
    """Save user's habits"""
    current_user = get_current_user_from_token(authorization)
    
    # Check if habits exist for this user
    existing = supabase.table('habits').select('*').eq('user_id', current_user['user_id']).execute()
    
    if existing.data:
        # Update
        result = supabase.table('habits').update({
            'habits': request.habits,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('user_id', current_user['user_id']).execute()
    else:
        # Insert
        result = supabase.table('habits').insert({
            'user_id': current_user['user_id'],
            'habits': request.habits
        }).execute()
    
    return {"message": "Habits saved successfully"}



@app.get("/api/users")
def get_users():
    """Get all users (for testing)"""
    conn = get_db_connection()
    cursor = conn.execute('SELECT id, name, email FROM users')
    users = cursor.fetchall()
    conn.close()
    return {"users": [dict(user) for user in users]}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    conn = get_db_connection()
    
    # Raw SQL with parameter
    cursor = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user is None:
        return {"error": "User not found"}, 404
    
    return dict(user)


@app.post("/api/users")
def create_user(name: str, email: str):
    conn = get_db_connection()
    
    # Insert new user
    cursor = conn.execute(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        (name, email)
    )
    conn.commit()
    
    user_id = cursor.lastrowid
    conn.close()
    
    return {"id": user_id, "name": name, "email": email}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    
    conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    return {"message": "User deleted"}
