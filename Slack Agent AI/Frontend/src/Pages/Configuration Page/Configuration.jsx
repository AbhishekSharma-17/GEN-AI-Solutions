import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import ConfigurationForm from '../../Components/Configuration Form/ConfigurationForm'
import './Configuration.css'

const Configuration = () => {
  return (
    <div className='configuration-page'>
      <Navbar></Navbar>
      <ConfigurationForm></ConfigurationForm>
    </div>
  )
}

export default Configuration
