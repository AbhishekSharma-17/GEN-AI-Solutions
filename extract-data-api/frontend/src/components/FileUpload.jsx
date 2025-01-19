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
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={handleFileChange} accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.html,.txt,.xml" />
      <button type="submit" disabled={!file}>
        Upload and Convert
      </button>
    </form>
  );
};

export default FileUpload;
