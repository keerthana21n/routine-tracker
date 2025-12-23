import React, { useState } from 'react';
import './App.css';
import DailyTracker from './pages/DailyTracker';
import TrendsView from './pages/TrendsView';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('tracker');

  return (
    <div className="App">
      <header className="app-header">
        <h1>📊 Routine Tracker</h1>
        <p>Track your daily habits and see your progress</p>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'tracker' ? 'active' : ''}
          onClick={() => setActiveTab('tracker')}
        >
          📝 Daily Tracker
        </button>
        <button 
          className={activeTab === 'trends' ? 'active' : ''}
          onClick={() => setActiveTab('trends')}
        >
          📈 Trends
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'tracker' && <DailyTracker />}
        {activeTab === 'trends' && <TrendsView />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
