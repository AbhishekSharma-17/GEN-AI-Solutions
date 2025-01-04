import React from "react";
import Homepage_Navbar from "../../Components/HomePage Navbar/Homepage_Navbar";
import HeroSection from "../../Components/Hero Section/HeroSection";
import CodeConvertor from "../../Components/Code Convertor/CodeConvertor";
import HomeKeyFeatures from "../../Components/HomeKeyFeatures/HomeKeyFeatures";
import Work from "../../Components/Work/Work";
import Stats from "../../Components/Stats/Stats";
import Footer from "../../Components/Footer/Footer";

const HomePage = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "auto",
        border: "1px solid red",
      }}
    >
      <Homepage_Navbar></Homepage_Navbar>
      <HeroSection />
      <CodeConvertor />
      <HomeKeyFeatures/>
      <Work></Work>
      <Stats />
      <Footer></Footer>
    </div>
  );
};

export default HomePage;
