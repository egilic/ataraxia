from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_db_connection, init_db

app = FastAPI()


# Allow React to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    
    # Raw SQL query
    cursor = conn.execute('SELECT * FROM users')
    users = cursor.fetchall()
    
    # Convert to list of dictionaries
    users_list = [dict(user) for user in users]
    
    conn.close()
    return {"users": users_list}

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
