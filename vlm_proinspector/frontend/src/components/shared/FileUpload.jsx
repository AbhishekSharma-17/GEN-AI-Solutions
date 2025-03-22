import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Button from '../ui/Button';

const FileUpload = ({
  multiple = false,
  maxFiles = 50,
  maxSize = 10485760, // 10MB
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
  onFilesSelected,
  showPreview = true
}) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle accepted files
    if (acceptedFiles?.length) {
      setFiles(prev => {
        const updatedFiles = multiple ? [...prev, ...acceptedFiles] : [...acceptedFiles];
        // If we have a callback, call it
        if (onFilesSelected) {
          onFilesSelected(updatedFiles);
        }
        return updatedFiles;
      });
    }

    // Handle rejected files
    if (rejectedFiles?.length) {
      setErrors(rejectedFiles.map(rejection => {
        if (rejection.errors[0].code === 'file-too-large') {
          return `${rejection.file.name} is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
        }
        if (rejection.errors[0].code === 'file-invalid-type') {
          return `${rejection.file.name} is not an accepted file type`;
        }
        return `${rejection.file.name}: ${rejection.errors[0].message}`;
      }));
    }
  }, [multiple, onFilesSelected, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    maxSize,
    accept
  });

  const removeFile = (index) => {
    setFiles(prev => {
      const updatedFiles = [...prev];
      updatedFiles.splice(index, 1);
      
      // If we have a callback, call it with the updated files
      if (onFilesSelected) {
        onFilesSelected(updatedFiles);
      }
      
      return updatedFiles;
    });
  };

  const clearErrors = (index) => {
    setErrors(prev => {
      const updatedErrors = [...prev];
      updatedErrors.splice(index, 1);
      return updatedErrors;
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-500'
            : 'border-secondary-300 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-600'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <FiUploadCloud className="h-10 w-10 text-secondary-400 dark:text-secondary-500" />
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            {isDragActive
              ? 'Drop the files here...'
              : `Drag & drop ${multiple ? 'files' : 'a file'} here, or click to select ${multiple ? 'files' : 'a file'}`}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {multiple ? `Maximum ${maxFiles} files, up to ${Math.round(maxSize / 1024 / 1024)}MB each` : `Maximum file size: ${Math.round(maxSize / 1024 / 1024)}MB`}
          </p>
        </div>
      </motion.div>

      {/* Show any errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-4 py-2 bg-status-red/10 border border-status-red/20 rounded-md"
            >
              <div className="flex items-center">
                <FiAlertCircle className="text-status-red mr-2" />
                <p className="text-sm text-status-red">{error}</p>
              </div>
              <button
                onClick={() => clearErrors(index)}
                className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
              >
                <FiX className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setErrors([])}
            className="mt-1"
          >
            Clear All Errors
          </Button>
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Selected {files.length} file{files.length !== 1 ? 's' : ''}:
          </h4>
          <div className={`grid gap-4 ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'}`}>
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(file)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary-100 dark:bg-secondary-800">
                      <span className="text-secondary-600 dark:text-secondary-400">
                        {file.name.split('.').pop().toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 bg-white dark:bg-secondary-800 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-center truncate text-secondary-600 dark:text-secondary-400">
                  {file.name}
                </p>
              </motion.div>
            ))}
          </div>
          {files.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  if (onFilesSelected) onFilesSelected([]);
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
