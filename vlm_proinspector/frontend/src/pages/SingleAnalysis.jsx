import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FileUpload from '../components/shared/FileUpload';
import { analyzeImageUpload } from '../services/api';

const SingleAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  // Clear any existing results when new files are selected
  useEffect(() => {
    if (files.length > 0) {
      setResult(null);
      setError(null);
    }
  }, [files]);

  // Scroll to results when they become available
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Handle file selection
  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  // Extract category from result
  const extractCategory = (text) => {
    if (!text) return null;
    
    if (text.match(/\b(GREEN)\b/i)) return "GREEN";
    if (text.match(/\b(AMBER)\b/i)) {
      return text.match(/\b(RED)\b/i) ? "RED" : "AMBER";
    }
    if (text.match(/\b(RED)\b/i)) return "RED";
    
    return null;
  };

  // Analyze button handler
  const handleAnalyze = async () => {
    if (!files.length) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    try {
      // Send the first file for analysis (single image mode)
      const analysisResult = await analyzeImageUpload(files[0]);
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Determine the status badge class based on category
  const getBadgeClass = (category) => {
    switch(category) {
      case 'GREEN': return 'status-green';
      case 'AMBER': return 'status-amber';
      case 'RED': return 'status-red';
      default: return 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200';
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
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Single Image Analysis</h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Upload and analyze a single warehouse rack image
        </p>
      </div>
      
      {/* Upload section */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Upload Image</h2>
          <FileUpload 
            multiple={false}
            onFilesSelected={handleFilesSelected}
          />
        </div>
        
        {files.length > 0 && (
          <div className="bg-secondary-50 dark:bg-secondary-800 p-6 border-t border-secondary-200 dark:border-secondary-700 flex justify-end">
            <Button
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
            </Button>
          </div>
        )}
      </Card>
      
      {/* Results section */}
      {(isAnalyzing || result || error) && (
        <Card 
          className="overflow-hidden"
          ref={resultRef}
          animate={true}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Analysis Results</h2>
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full border-4 border-secondary-200 dark:border-secondary-700 border-t-primary-500 w-12 h-12 mb-4 animate-spin"></div>
                <p className="text-secondary-600 dark:text-secondary-400">Analyzing your image...</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-500 mt-2">
                  This may take a few moments
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-status-red/10 border border-status-red/20 rounded-lg p-4 flex items-start">
                <FiAlertCircle className="text-status-red flex-shrink-0 h-5 w-5 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-status-red font-medium">Analysis failed</h3>
                  <p className="text-status-red/80 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {result && (
              <div className="space-y-6">
                {/* Image preview */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <div className="rounded-lg overflow-hidden border dark:border-secondary-700">
                      {files[0] && (
                        <img 
                          src={URL.createObjectURL(files[0])} 
                          alt="Analyzed rack"
                          className="w-full h-auto object-contain"
                          onLoad={() => URL.revokeObjectURL(files[0])}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    {/* Category badge */}
                    <div className="mb-4">
                      <span className={`status-badge ${getBadgeClass(extractCategory(result))}`}>
                        {extractCategory(result) || 'ANALYSIS COMPLETE'}
                      </span>
                    </div>
                    
                    {/* Analysis text */}
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 text-sm overflow-auto max-h-96">
                        {result}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Hints and tips */}
      <Card className="bg-primary-50 dark:bg-primary-900/10 border-l-4 border-primary-500">
        <div className="p-4">
          <h3 className="text-lg font-medium text-primary-800 dark:text-primary-300">Tips</h3>
          <ul className="mt-2 pl-5 list-disc text-primary-700 dark:text-primary-400 space-y-1">
            <li>Upload clear, well-lit images of warehouse racks</li>
            <li>Make sure the rack structure is clearly visible</li>
            <li>For best results, capture images straight-on rather than at an angle</li>
            <li>Try to include the full height of the rack in the image</li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};

export default SingleAnalysis;
