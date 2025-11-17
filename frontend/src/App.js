import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Logo from './components/Logo';
import './App.css';

function LandingPage() {
  return (
    <>
      <Logo />
      <div className="App">
        <div className="container">
          <header className="header">
            <h1 className="title">Ataraxia</h1>
            <div className="definition">
              <p>calmness untroubled by mental or emotional disquiet</p>
            </div>
          </header>

          <main className="main">
            <div className="app-description">
              <p>
                Take back what 21st century innovation took from us—attention, 
                self-control, and connection. Ataraxia is designed to help you reach your goals, be 
                more fulfilled, and understand yourself better. The timeless wisdom the Stoics preached
                has become even more applicable to us.
              </p>
            </div>

            <Link to="/signup">
              <button className="cta-button">Reclaim Your Inner Citadel</button>
            </Link>
          </main>

          <footer className="footer">
            <div className="stoic-border"></div>
            <blockquote className="footer-quote">
              "If you want to improve, be content to be thought foolish and stupid."
              <cite className="footer-author">- Epictetus</cite>
            </blockquote>
          </footer>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </Router>
  );
}

export default App;