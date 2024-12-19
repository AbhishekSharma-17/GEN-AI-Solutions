import React from 'react'
import assets from '../../assets/assets'
import './Navbar.css'

const Navbar = () => {
  return (
    <div className='main-navbar'>
      <a href=""><img src={assets.genAILogo} className='main-navbar-image-logo' alt="genAI-protos-logo" /></a>
      <img src={assets.icon}  className='main-navbar-image-icon' alt="genAI-protos icon" />
    </div>
  )
}

export default Navbar
