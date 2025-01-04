import React from 'react'
import Homepage_Navbar from '../../Components/HomePage Navbar/Homepage_Navbar'
import HeroSection from '../../Components/Hero Section/HeroSection'

const HomePage = () => {
  return (
    <div style={{display:"flex", flexDirection:"column",gap:"10px"}}>
      <Homepage_Navbar></Homepage_Navbar>
      <HeroSection/>
    </div>
  )
}

export default HomePage
