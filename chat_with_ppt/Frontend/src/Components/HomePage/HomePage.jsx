import React from 'react'
import './HomePage.css'
import HomePageNavbar from '../Homepage Navbar/HomePageNavbar'
import HomePageContainer from '../HomePage Container/HomePageContainer'
import KeyFeatures from '../KeyFeatures/KeyFeatures'

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
