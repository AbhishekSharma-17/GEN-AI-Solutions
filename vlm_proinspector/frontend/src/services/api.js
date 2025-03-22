import axios from 'axios';

// Create a base axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for single image analysis
export const analyzeImageUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/analyze/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'text',
    });
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const analyzeImageBase64 = async (base64Image) => {
  try {
    const response = await api.post('/analyze/base64', {
      image_base64: base64Image
    }, {
      responseType: 'text',
    });
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const analyzeImagePath = async (imagePath) => {
  try {
    const response = await api.post(`/analyze/path?image_path=${encodeURIComponent(imagePath)}`, {}, {
      responseType: 'text',
    });
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// API functions for batch processing
export const analyzeBatchUpload = async (files, batchName = null) => {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (batchName) {
      formData.append('batch_name', batchName);
    }
    
    const response = await api.post('/analyze/batch/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const analyzeBatchBase64 = async (images, batchName = null) => {
  try {
    const response = await api.post('/analyze/batch/base64', {
      images,
      batch_name: batchName
    });
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// API functions for reports
export const getReport = async (batchId) => {
  try {
    const response = await api.get(`/report/${batchId}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const listReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// Handle API errors
const handleError = (error) => {
  if (error.response) {
    // The server responded with an error status code
    const errorMessage = error.response.data.detail || 'An error occurred with the server response';
    return new Error(errorMessage);
  } else if (error.request) {
    // The request was made but no response was received
    return new Error('No response received from server. Please check your connection.');
  } else {
    // Something happened in setting up the request
    return error;
  }
};

// Helper function to convert a file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Get base64 string without the data:image prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default api;
