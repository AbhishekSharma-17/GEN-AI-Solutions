import React from 'react'
import './HomePage.css'
import HomePageNavbar from '../../Components/Homepage Navbar/HomePageNavbar'
import HomePageContainer from '../../Components/HomePage Container/HomePageContainer'
import KeyFeatures from '../../Components/KeyFeatures/KeyFeatures'

const HomePage = () => {
  
  return (
    <div className='homePage-div'>
      <HomePageNavbar/>
      <HomePageContainer/>
      <KeyFeatures/>
    </div>
  )
}

export default HomePage
