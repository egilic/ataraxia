import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Materials.css';

function Materials() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Logo />
      <div className="materials-page">
        <div className="materials-container">
          <header className="materials-header">
            <h1>Welcome, {user.name}</h1>
            <p className="subtitle">Your Journey to Ataraxia</p>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </header>

          <main className="materials-content">
            <div className="materials-section">
              <h2>Stoic Teachings</h2>
              <p>Access wisdom from Marcus Aurelius, Epictetus, and Seneca</p>
              {/* Add your materials here */}
            </div>

            <div className="materials-section">
              <h2>Daily Practices</h2>
              <p>Exercises to cultivate inner peace and resilience</p>
              {/* Add your practices here */}
            </div>

            <div className="materials-section">
              <h2>Reflections</h2>
              <p>Journal prompts and guided meditations</p>
              {/* Add your content here */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Materials;