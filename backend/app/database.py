import sqlite3
import os
from dotenv import load_dotenv

DATABASE_PATH = os.getenv("DATABASE_URL", "app.db")

# Strip "sqlite:///"
if DATABASE_PATH.startswith("sqlite:///"):
    DATABASE_PATH = DATABASE_PATH.replace("sqlite:///./", "")
    DATABASE_PATH = DATABASE_PATH.replace("sqlite:///", "")

def get_db_connection():
    """Open a connection to the SQLite database"""
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row  
    return conn

def init_db():
    """Create tables if they don't exist"""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add some sample data if table is empty
    # if conn.execute('SELECT COUNT(*) FROM users').fetchone()[0] == 0:
    #     conn.execute("INSERT INTO users (name, email) VALUES (?, ?)", 
    #                 ('Edin', 'edin@example.com'))
    #     conn.execute("INSERT INTO users (name, email) VALUES (?, ?)", 
    #                 ('Brian', 'brian@example.com'))
        
    conn.commit()
    conn.close()