import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Oauth_button from './components/Oauth_button/Oauth_button'
import Atl_Oauth_button from './components/Atl_Oauth_button/Atl_Oauth_button'
import StreamingPage from './components/StreamingPage/StreamingPage'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Oauth_button />} />
        <Route path="/atlassian/oauth/callback" element={<welcome />} />
        <Route path="/streaming" element={<StreamingPage />} />
      </Routes>
    </Router>
  )
}

export default App
