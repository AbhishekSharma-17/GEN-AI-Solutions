import React from "react";
import "./Home.css";
import HomeHeader from "../../Components/Home Header/HomeHeader";
import HomeProvider from "../../Context/HomeContext";
import MediaSolution from "../../Components/Home Media Solutions/MediaSolution";
import Footer from "../../Components/Home Footer/Footer";

const Home = () => {
  return (
    <div className="home-page responsive-container">
      <div className="home-content">
        <HomeHeader></HomeHeader>
        <MediaSolution></MediaSolution>
        <Footer></Footer>
      </div>
    </div>
  );
};

export default Home;
