import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './Signup.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
      }
      
      setMessage(data.message);
      setSubmitted(true);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Logo />
        <div className="signup-page">
          <div className="signup-container">
            <h1 className="signup-title">Request Received</h1>
            <p className="signup-subtitle">We'll contact you shortly to help reset your password</p>
            
            <div className="success-message" style={{ marginTop: '2rem' }}>
              {message}
            </div>

            <Link to="/login">
              <button className="signup-button" style={{ marginTop: '2rem' }}>
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Logo />
      <div className="signup-page">
        <div className="signup-container">
          <h1 className="signup-title">Forgot Password?</h1>
          <p className="signup-subtitle">We'll help you reset it</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? 'Sending...' : 'Request Password Reset'}
            </button>
          </form>

          <p className="login-link">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;