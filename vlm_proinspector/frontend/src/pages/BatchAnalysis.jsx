import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiList } from 'react-icons/fi';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FileUpload from '../components/shared/FileUpload';
import { analyzeBatchUpload } from '../services/api';

const BatchAnalysis = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
    setError(null);
  };

  // Handle batch name change
  const handleBatchNameChange = (e) => {
    setBatchName(e.target.value);
  };

  // Submit batch for analysis
  const handleSubmit = async () => {
    if (!files.length) {
      setError('Please select at least one image to analyze');
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    setError(null);
    
    try {
      const batchResult = await analyzeBatchUpload(files, batchName || null);
      setResult(batchResult);
    } catch (err) {
      console.error('Batch submission error:', err);
      setError(err.message || 'Failed to submit batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to the report page
  const viewReport = () => {
    if (result?.batch_id) {
      navigate(`/reports/${result.batch_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Batch Analysis</h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Upload multiple rack images for batch processing
        </p>
      </div>
      
      {/* Batch upload form */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Upload Images</h2>
          
          {/* Batch name input */}
          <div className="mb-6">
            <label htmlFor="batchName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              Batch Name (optional)
            </label>
            <input
              type="text"
              id="batchName"
              className="input w-full"
              placeholder="Enter a name for this batch"
              value={batchName}
              onChange={handleBatchNameChange}
              disabled={isSubmitting}
            />
          </div>
          
          {/* File upload component */}
          <FileUpload
            multiple={true}
            maxFiles={50}
            maxSize={10485760} // 10MB
            onFilesSelected={handleFilesSelected}
          />
        </div>
        
        {files.length > 0 && (
          <div className="bg-secondary-50 dark:bg-secondary-800 p-6 border-t border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              {`${files.length} image${files.length !== 1 ? 's' : ''} selected`}
            </div>
            
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting || files.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Batch'}
            </Button>
          </div>
        )}
      </Card>
      
      {/* Status/Result section */}
      {(error || result) && (
        <Card animate={true}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Batch Status</h2>
            
            {error && (
              <div className="bg-status-red/10 border border-status-red/20 rounded-lg p-4 flex items-start">
                <FiAlertCircle className="text-status-red flex-shrink-0 h-5 w-5 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-status-red font-medium">Submission failed</h3>
                  <p className="text-status-red/80 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {result && (
              <div className="bg-status-green/10 border border-status-green/20 rounded-lg p-4 flex flex-col">
                <div className="flex items-start">
                  <FiCheckCircle className="text-status-green flex-shrink-0 h-5 w-5 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-status-green font-medium">Batch submitted successfully</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                      {result.message || 'Your images are being processed in the background.'}
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Batch Details:
                      </p>
                      <ul className="list-inside text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
                        <li className="flex items-center space-x-2">
                          <span className="font-medium">Batch ID:</span> 
                          <span className="text-primary-600 dark:text-primary-400 font-mono">{result.batch_id}</span>
                        </li>
                        {batchName && (
                          <li className="flex items-center space-x-2">
                            <span className="font-medium">Batch Name:</span> 
                            <span>{batchName}</span>
                          </li>
                        )}
                        <li className="flex items-center space-x-2">
                          <span className="font-medium">Status:</span> 
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                            {result.status || 'Processing'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFiles([]);
                      setBatchName('');
                      setResult(null);
                    }}
                  >
                    Submit Another Batch
                  </Button>
                  
                  <Button
                    onClick={viewReport}
                    className="flex items-center"
                  >
                    <FiList className="mr-2" />
                    View Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Info card */}
      <Card className="bg-primary-50 dark:bg-primary-900/10 border-l-4 border-primary-500">
        <div className="p-4">
          <h3 className="text-lg font-medium text-primary-800 dark:text-primary-300">Batch Processing Information</h3>
          <ul className="mt-2 pl-5 list-disc text-primary-700 dark:text-primary-400 space-y-1">
            <li>You can upload up to 50 images in a single batch</li>
            <li>Each image must be under 10MB in size</li>
            <li>Processing time depends on the number of images and their complexity</li>
            <li>Results will be available in the Reports section once processing is complete</li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};

export default BatchAnalysis;
