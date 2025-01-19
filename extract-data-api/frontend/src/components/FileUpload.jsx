import React, { useState } from 'react';

const FileUpload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="file-upload-container">
      <form onSubmit={handleSubmit}>
        <div className="file-input-wrapper">
          <button className="btn">Choose File</button>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.html,.txt,.xml"
          />
        </div>
        <p>{file ? file.name : 'No file chosen'}</p>
        <button type="submit" disabled={!file}>
          Upload and Convert
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
