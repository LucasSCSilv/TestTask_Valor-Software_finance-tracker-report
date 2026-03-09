import React from 'react'
import ReactDOM from 'react-dom/client'
import Reports from './reports'
import './index.css'

// Standalone preview (for development only)
// In production, Reports is consumed as a remote by finance-tracker (shell)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ background: '#070B14', minHeight: '100vh', padding: '2rem' }}>
      <Reports userId={null} />
    </div>
  </React.StrictMode>
)