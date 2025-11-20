import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './Materials.css';

function Materials() {
  const [user, setUser] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackStatus('');
    setFeedbackLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: feedback })
      });

      const data = await response.json();

      if (response.status === 429) {
        throw new Error('Too many feedback submissions. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send feedback');
      }

      setFeedbackStatus('success');
      setFeedback('');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackStatus('');
      }, 2000);

    } catch (error) {
      setFeedbackStatus(error.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Logo />
      {/* Logout button */}
      <button onClick={handleLogout} className="logout-button-fixed">
        Logout
      </button>

      <div className="materials-page">
        <div className="materials-container">
          <header className="materials-header">
            <h1>Welcome, {user.name}</h1>
            <p className="subtitle">Your Journey to Ataraxia</p>
          </header>

          <main className="materials-content">
            <div className="materials-section">
              <h2>Stoic Teachings</h2>
              <p>Access wisdom from Marcus Aurelius, Epictetus, and Seneca</p>
            </div>

            <div className="materials-section">
              <h2>Daily Practices</h2>
              <p>Exercises to cultivate inner peace and resilience</p>
            </div>

            <div className="materials-section">
              <h2>Reflections</h2>
              <p>Journal prompts and guided meditations</p>
            </div>

            <div className="materials-section">
              <h2>Habit Tracker</h2>
              <p>Track your daily Stoic practices and build lasting change</p>
              <Link to="/habit-tracker">
                <button className="section-button">Open Tracker</button>
              </Link>
            </div>
          </main>

          <footer className="materials-footer">
            <div className="stoic-border"></div>
            <blockquote className="materials-quote">
              "It is impossible for a man to learn what he thinks he already knows."
              <cite className="materials-author">- Epictetus</cite>
            </blockquote>
          </footer>
        </div>

        {/* Feedback Button */}
        <button 
          className="feedback-button"
          onClick={() => setShowFeedback(true)}
        >
          <span className="feedback-icon">✉</span>
          <span className="feedback-text">Feedback</span>
        </button>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="feedback-modal-overlay" onClick={() => setShowFeedback(false)}>
            <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="feedback-close"
                onClick={() => setShowFeedback(false)}
              >
                ×
              </button>
              
              <h2>Share Your Thoughts</h2>
              <p className="feedback-subtitle">How can we improve Ataraxia?</p>

              {feedbackStatus === 'success' && (
                <div className="success-message">
                  Thank you for your feedback!
                </div>
              )}

              {feedbackStatus && feedbackStatus !== 'success' && (
                <div className="error-message">
                  {feedbackStatus}
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit}>
                <textarea
                  className="feedback-textarea"
                  placeholder="Share your ideas, suggestions, or concerns..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  rows="6"
                />
                <button 
                  type="submit" 
                  className="feedback-submit"
                  disabled={feedbackLoading}
                >
                  {feedbackLoading ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default Materials;