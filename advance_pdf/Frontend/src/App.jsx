import React, { useContext } from "react";
import "./App.css";
import "./index.css";
// import Navbar from "./Components/Navbar/Navbar";
// import Sidebar from "./Components/Sidebar/Sidebar";
// import Chat from "./Components/Chat/Chat";
// import Upload from "./Components/Upload/Upload";
import "bootstrap/dist/css/bootstrap.min.css";
// import PDFReview from "./Components/PDF Review/PDFReview";
import { Context } from "./Context/Context";
import HomePage from "./Pages/HomePage/HomePage";
import { ToastContainer } from "react-toastify";

const App = () => {
  const { file } = useContext(Context); // Accessing file from the context
  console.log("File in App:", file); // Debugging log

  return (
    <>
    <HomePage></HomePage>
    <ToastContainer/>
    </>
    // <div className="main-app">
    //   {/* Navbar */}
    //   <Navbar />

    //   {/* Main Content */}
    //   <div className="main-content">
    //     {/* Sidebar */}
    //     <div className="sidebar">
    //       <Sidebar />
    //     </div>

    //     {/* Upload and Review Section */}
    //     <div className="upload">
    //       {file ? (
    //         <PDFReview file={file} /> // Show PDFReview if a file is uploaded
    //       ) : (
    //         <Upload /> // Show Upload component if no file is uploaded
    //       )}
    //     </div>

    //     {/* Chat Section */}
    //     <div className="chat">
    //       <Chat />
    //     </div>
    //   </div>
    // </div>
  );
};

export default App;
