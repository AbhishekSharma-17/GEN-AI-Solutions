import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiHome } from 'react-icons/fi';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[70vh]"
    >
      <Card className="w-full max-w-lg text-center p-8">
        <FiAlertCircle className="h-16 w-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        
        <p className="text-secondary-600 dark:text-secondary-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex justify-center">
          <Link to="/">
            <Button className="flex items-center">
              <FiHome className="mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default NotFound;
