import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Signup.css';

function Signup() {
  // STATE: Variables - when they change, page updates
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // navigate: Function to change pages (like window.location)
  const navigate = useNavigate();

  // Runs every time user types in any input field
  const handleChange = (e) => {
    setFormData({
      ...formData,  // Keep all existing fields
      [e.target.name]: e.target.value  // Update field that changes
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();  // Stop page from reloading
    setError('');
    setLoading(true);
    
    try {
      // Send form data to fast API
      const response = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }
      
      // Save auth token and user info to browser storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to materials page if successful
      navigate('/materials');
      
    } catch (error) {
      setError(error.message);  // Show error to user
    } finally {
      setLoading(false);  // Always stop loading, success or failure
    }
  };

  return (
    <>
      <Logo />
      <div className="signup-page">
        <div className="signup-container">
          <h1 className="signup-title">Begin Your Journey</h1>
          <p className="signup-subtitle">Join the path to inner tranquility</p>

          {/* Conditional error */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}  // value from state
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="signup-button" disabled={loading}>
              {/* Conditional rendering: Show different text based on loading state */}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="login-link">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default Signup;