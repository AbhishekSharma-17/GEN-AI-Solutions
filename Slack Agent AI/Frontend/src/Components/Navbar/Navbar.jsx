import React from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
const Navbar = () => {
  return (
    <div className='navbar'>
        <div className='navbar-left'>
            <img src={assets.Genai_icon} className='icon' alt="" />
            <img src={assets.Genai_logo} className='logo' alt="" />
        </div>
        <div className='navbar-right'></div>
      
    </div>
  )
}

export default Navbar
