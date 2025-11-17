import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

function Logo() {
  return (
    <Link to="/" className="logo-link">
      <div className="logo">
        <img 
          src="/marcus-aur.jpg" 
          alt="Ataraxia" 
          className="logo-image"
        />
        <span className="logo-text"></span>
      </div>
    </Link>
  );
}

export default Logo;