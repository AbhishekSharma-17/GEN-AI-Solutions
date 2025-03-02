import React from 'react'
import './Stats.css'

const Stats = () => {
  return (
    <div className='stat-sections'>
      <div className="stats-section">
        <div className="stat-card">
          <h3>1M+</h3>
          <p>Queries Converted</p>
        </div>
        <div className="stat-card">
          <h3>99%</h3>
          <p>Accuracy Rate</p>
        </div>
        <div className="stat-card">
          <h3>80%</h3>
          <p>Time Saved</p>
        </div>
      </div>
    </div>
  )
}

export default Stats
