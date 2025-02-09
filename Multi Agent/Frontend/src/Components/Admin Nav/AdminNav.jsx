import React from 'react'
import './AdminNav.css'
import assets from '../../assets/assets'

const AdminNav = () => {
  return (
    <div className='admin-navbar'>
      <img src={assets.icon} id="icon" alt="" />
      <img src={assets.logo} id='logo' alt="" />
    </div>
  )
}

export default AdminNav
