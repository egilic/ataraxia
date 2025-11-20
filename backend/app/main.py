from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db_connection, init_db
from app.auth import hash_password, verify_password, create_access_token, verify_token
from app.utils.email import send_password_reset_notification
from collections import defaultdict


app = FastAPI()

init_db()

password_reset_attempts = defaultdict(list)
MAX_RESET_ATTEMPTS = 3
RESET_WINDOW_MINUTES = 8 * 60

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
    conn = get_db_connection()

    # Check if user already exists
    existing_user = conn.execute(
        'SELECT * FROM users WHERE email = ?',
        (signup_data.email,)
    ).fetchone()

    if (existing_user):
        conn.close()
        raise HTTPException(status_code=400, detail="This email is already registered")
    
    # Hash password then create new user
    hashed_pw = hash_password(signup_data.password)
    cursor = conn.execute(
        'INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?)',
        (signup_data.name, signup_data.email, hashed_pw)
    )
    conn.commit()
    user_id = cursor.lastrowid # Fetch linked iD
    conn.close()

    # Create token
    token = create_access_token({"user_id": user_id, "email": signup_data.email})

    return {
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "name": signup_data.name,
            "email": signup_data.email
        }
    }

@app.post("/api/login")
def login(login_data: LoginRequest):
    conn = get_db_connection()

    # Fetch user
    user = conn.execute(
        'SELECT * FROM users WHERE email = ?',
        (login_data.email,)
    ).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
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
            detail="Too many password reset attempts. Please try again later. After 3 attempts you will be locked out."
        )
    conn = get_db_connection()
    
    # Find user
    user = conn.execute(
        'SELECT * FROM users WHERE email = ?',
        (request.email,)
    ).fetchone()
    
    conn.close()
    
    # Still return success to not reveal which emails exist
    if not user:
        return {"message": "If that email exists, we've been notified"}
    
    # Send notification email to support
    email_sent = send_password_reset_notification(user['email'], user['name'])
    
    if email_sent:
        return {"message": "Password reset request received. We'll contact you shortly."}
    else:
        return {"message": "There was an issue. Please try again later."}

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
