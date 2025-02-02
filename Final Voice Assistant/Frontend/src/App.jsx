import React from 'react'
import './App.css'
import VoiceChat from './Components/VoiceChat/VoiceChat'
import Navbar from './Components/Navbar/Navbar'

const App = () => {
  return (
    <div className='main-app'>
      <Navbar></Navbar>
      <VoiceChat></VoiceChat>
    </div>
  )
}

export default App
