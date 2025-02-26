import React from "react";
import "./Home.css";
import HomeHeader from "../../Components/Home Header/HomeHeader";
import HomeProvider from "../../Context/HomeContext";
import MediaSolution from "../../Components/Home Media Solutions/MediaSolution";
import Footer from "../../Components/Home Footer/Footer";

const Home = () => {
  return (
    <div className="home-page">
      {/* <HomeProvider> */}
        <HomeHeader></HomeHeader>
        <MediaSolution></MediaSolution>
        <Footer></Footer>
      {/* </HomeProvider> */}
    </div>
  );
};

export default Home;
