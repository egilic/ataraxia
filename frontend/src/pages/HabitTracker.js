import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './HabitTracker.css';

function HabitTracker() {
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabitIndex, setEditingHabitIndex] = useState(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [completedHabits, setCompletedHabits] = useState({});
  const [sleepData, setSleepData] = useState({});
  const [editingSleepDay, setEditingSleepDay] = useState(null);
  const [sleepInput, setSleepInput] = useState('');
  const navigate = useNavigate();

  // Default 10 habits
  const defaultHabits = [
    'Morning Meditation',
    'Exercise',
    'Reading',
    'Journaling',
    'Gratitude Practice',
    'Cold Shower',
    'Evening Reflection',
    'Healthy Eating',
    'No Social Media',
    'Act of Kindness'
  ];

  // Get current month info
  const getCurrentMonth = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const [currentMonth] = useState(getCurrentMonth());
  const [daysInMonth] = useState(getDaysInMonth());

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));

    const savedHabits = localStorage.getItem('habits');
    const savedCompleted = localStorage.getItem('completedHabits');
    const savedSleep = localStorage.getItem('sleepData');
    
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      setHabits(defaultHabits);
      localStorage.setItem('habits', JSON.stringify(defaultHabits));
    }
    
    if (savedCompleted) {
      setCompletedHabits(JSON.parse(savedCompleted));
    }

    if (savedSleep) {
      setSleepData(JSON.parse(savedSleep));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleAddHabit = () => {
    if (newHabitName.trim() && habits.length < 15) {
      const newHabits = [...habits, newHabitName.trim()];
      setHabits(newHabits);
      localStorage.setItem('habits', JSON.stringify(newHabits));
      setNewHabitName('');
      setShowAddHabit(false);
    }
  };

  const handleEditHabit = (index) => {
    if (editHabitName.trim()) {
      const newHabits = [...habits];
      newHabits[index] = editHabitName.trim();
      setHabits(newHabits);
      localStorage.setItem('habits', JSON.stringify(newHabits));
      setEditingHabitIndex(null);
      setEditHabitName('');
    }
  };

  const handleDeleteHabit = (index) => {
    const newHabits = habits.filter((_, i) => i !== index);
    setHabits(newHabits);
    localStorage.setItem('habits', JSON.stringify(newHabits));
    
    const newCompleted = { ...completedHabits };
    Object.keys(newCompleted).forEach(key => {
      if (key.startsWith(`${index}-`)) {
        delete newCompleted[key];
      }
    });
    setCompletedHabits(newCompleted);
    localStorage.setItem('completedHabits', JSON.stringify(newCompleted));
  };

  const toggleHabitCompletion = (habitIndex, day) => {
    const key = `${habitIndex}-${day}`;
    const newCompleted = {
      ...completedHabits,
      [key]: !completedHabits[key]
    };
    setCompletedHabits(newCompleted);
    localStorage.setItem('completedHabits', JSON.stringify(newCompleted));
  };

  const handleSleepSubmit = (day) => {
    const hours = parseFloat(sleepInput);
    if (!isNaN(hours) && hours >= 0 && hours <= 10) {
      const newSleepData = {
        ...sleepData,
        [day]: hours
      };
      setSleepData(newSleepData);
      localStorage.setItem('sleepData', JSON.stringify(newSleepData));
      setEditingSleepDay(null);
      setSleepInput('');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Logo />
      
      <Link to="/materials" className="back-button">
        <span className="back-arrow">←</span>
        <span className="back-text">Back to Materials</span>
      </Link>
      
      <button onClick={handleLogout} className="logout-button-fixed">
        Logout
      </button>

      <div className="habit-tracker-page">
        <div className="habit-tracker-container">
          <header className="habit-tracker-header">
            <h1>{currentMonth}</h1>
            <p className="subtitle">Track your daily practices</p>
          </header>

          <div className="tracker-layout">
            {/* Left Side - Memorable Moments */}
            <aside className="memorable-moments">
              <h2>Memorable Moments</h2>
              <div className="moments-list">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <div key={day} className="moment-day">
                    <span className="moment-day-number">Day {day}</span>
                    <textarea
                      className="moment-input"
                      placeholder="What made today memorable?"
                      rows="2"
                    />
                  </div>
                ))}
              </div>
            </aside>

            {/* Center - Habit Tracker Grid */}
            <main className="habit-grid-section">
              <div className="habit-controls">
                {habits.length < 15 && (
                  <button 
                    className="add-habit-button"
                    onClick={() => setShowAddHabit(true)}
                  >
                    + Add Habit ({habits.length}/15)
                  </button>
                )}
              </div>

              {showAddHabit && (
                <div className="add-habit-form">
                  <input
                    type="text"
                    className="habit-input"
                    placeholder="Enter habit name..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                    maxLength="30"
                    autoFocus
                  />
                  <div className="habit-form-buttons">
                    <button onClick={handleAddHabit} className="save-habit">
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddHabit(false);
                        setNewHabitName('');
                      }} 
                      className="cancel-habit"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="habit-grid">
                <div className="grid-header">
                  <div className="grid-cell header-cell">Day</div>
                  {habits.map((habit, index) => (
                    <div key={index} className="grid-cell header-cell habit-name">
                      {editingHabitIndex === index ? (
                        <div className="edit-habit-container">
                          <input
                            type="text"
                            className="edit-habit-input"
                            value={editHabitName}
                            onChange={(e) => setEditHabitName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEditHabit(index)}
                            maxLength="30"
                            autoFocus
                          />
                          <div className="edit-habit-buttons">
                            <button
                              className="save-edit"
                              onClick={() => handleEditHabit(index)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-edit"
                              onClick={() => {
                                setEditingHabitIndex(null);
                                setEditHabitName('');
                              }}
                              title="Cancel"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span 
                            onClick={() => {
                              setEditingHabitIndex(index);
                              setEditHabitName(habit);
                            }}
                            style={{ cursor: 'pointer' }}
                            title="Click to edit"
                          >
                            {habit}
                          </span>
                          <button
                            className="delete-habit"
                            onClick={() => handleDeleteHabit(index)}
                            title="Delete habit"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <div key={day} className="grid-row">
                    <div className="grid-cell day-cell">{day}</div>
                    {habits.map((_, habitIndex) => {
                      const key = `${habitIndex}-${day}`;
                      const isCompleted = completedHabits[key];
                      
                      return (
                        <div
                          key={habitIndex}
                          className={`grid-cell habit-cell ${isCompleted ? 'completed' : ''}`}
                          onClick={() => toggleHabitCompletion(habitIndex, day)}
                        >
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </main>

            {/* Right Side - Sleep Tracker */}
            <aside className="sleep-tracker">
              <h2>Sleep Tracker</h2>
              <p className="sleep-subtitle">Track your nightly sleep (hours)</p>
              
              <div className="sleep-graph-container">
                <svg className="sleep-graph" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid meet">
                  {/* Y-axis labels (hours) */}
                  {[0, 2, 4, 6, 8, 10].map(hour => (
                    <text 
                      key={hour} 
                      x="10" 
                      y={550 - (hour * 50) + 5}
                      className="axis-label"
                    >
                      {hour}h
                    </text>
                  ))}

                  {/* Horizontal grid lines */}
                  {[0, 2, 4, 6, 8, 10].map(hour => (
                    <line
                      key={hour}
                      x1="50"
                      y1={550 - (hour * 50)}
                      x2="390"
                      y2={550 - (hour * 50)}
                      className="grid-line"
                    />
                  ))}

                  {/* Plot line connecting points */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
                    const currentSleep = sleepData[day];
                    const nextSleep = sleepData[day + 1];
                    
                    if (currentSleep !== undefined && nextSleep !== undefined && index < daysInMonth - 1) {
                      const x1 = 50 + (index * (340 / daysInMonth));
                      const y1 = 550 - (currentSleep * 50);
                      const x2 = 50 + ((index + 1) * (340 / daysInMonth));
                      const y2 = 550 - (nextSleep * 50);
                      
                      return (
                        <line
                          key={`line-${day}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          className="sleep-line"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Plot points */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
                    const hours = sleepData[day];
                    if (hours !== undefined) {
                      const x = 50 + (index * (340 / daysInMonth));
                      const y = 550 - (hours * 50);
                      
                      return (
                        <circle
                          key={day}
                          cx={x}
                          cy={y}
                          r="4"
                          className="sleep-point"
                        />
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>

              {/* Sleep input list */}
              <div className="sleep-input-list">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <div key={day} className="sleep-day">
                    <span className="sleep-day-number">Day {day}:</span>
                    {editingSleepDay === day ? (
                      <div className="sleep-edit">
                        <input
                          type="number"
                          className="sleep-hours-input"
                          value={sleepInput}
                          onChange={(e) => setSleepInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSleepSubmit(day)}
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="0-10"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSleepSubmit(day)}
                          className="sleep-save"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSleepDay(null);
                            setSleepInput('');
                          }}
                          className="sleep-cancel"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <span 
                        className="sleep-hours-display"
                        onClick={() => {
                          setEditingSleepDay(day);
                          setSleepInput(sleepData[day]?.toString() || '');
                        }}
                      >
                        {sleepData[day] !== undefined ? `${sleepData[day]} hrs` : 'Click to add'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <footer className="habit-tracker-footer">
            <div className="stoic-border"></div>
            <blockquote className="habit-quote">
              "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
              <cite className="habit-author">- Aristotle</cite>
            </blockquote>
          </footer>
        </div>
      </div>
    </>
  );
}

export default HabitTracker;