import React, { useEffect, useState } from "react";
import Homepage_Navbar from "../../Components/HomePage Navbar/Homepage_Navbar";
import HeroSection from "../../Components/Hero Section/HeroSection";
import CodeConvertor from "../../Components/Code Convertor/CodeConvertor";
import HomeKeyFeatures from "../../Components/HomeKeyFeatures/HomeKeyFeatures";
import Work from "../../Components/Work/Work";
import Stats from "../../Components/Stats/Stats";
import Footer from "../../Components/Footer/Footer";
import "./HomePage.css"; // Import CSS for styling

const HomePage = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "auto",
      }}
    >
      <Homepage_Navbar />
      <HeroSection />
      <CodeConvertor />
      <HomeKeyFeatures />
      <Work />
      <Stats />
      <Footer />

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
};

export default HomePage;
