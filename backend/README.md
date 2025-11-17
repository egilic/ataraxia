Frontend - React
Backend - Python with Flask
Database - PostgresSQL


Backend
- cd backend/
- conda create -n ataraxia_env python=3.11
- conda activate ataraxia_env
- pip install -r requirements.txt
- python setup_db.py
- uvicorn app.main:app --reload