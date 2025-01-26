import React from 'react'
import './App.css'
import './index.css'
import Home from './Pages/Home/Home'
import 'bootstrap/dist/css/bootstrap.min.css'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


const App = () => {
  return (
    <div className='main-app'>
      <Home></Home>
    </div>
  )
}

export default App
