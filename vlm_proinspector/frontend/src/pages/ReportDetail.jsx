import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiAlertCircle, FiDownload, FiBarChart2 } from 'react-icons/fi';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getReport } from '../services/api';

const ReportDetail = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  
  // Fetch report data
  const { 
    data: report,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['report', batchId],
    queryFn: () => getReport(batchId),
    enabled: !!batchId,
  });

  // Get status counts
  const statusCounts = React.useMemo(() => {
    if (!report?.summary) return { total: 0, green: 0, amber: 0, red: 0 };
    
    return {
      total: report.summary.total_images || 0,
      green: report.summary.green_count || 0,
      amber: report.summary.amber_count || 0,
      red: report.summary.red_count || 0
    };
  }, [report]);

  // Navigate back to reports list
  const handleBack = () => {
    navigate('/reports');
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="rounded-full border-4 border-secondary-200 dark:border-secondary-700 border-t-primary-500 w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="p-8 text-center">
          <FiAlertCircle className="h-12 w-12 text-status-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            Error Loading Report
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            {error?.message || `Could not load report for batch ID: ${batchId}`}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => refetch()}>Try Again</Button>
            <Button variant="secondary" onClick={handleBack}>
              Back to Reports
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            Report Not Found
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            The report you're looking for does not exist or has been deleted.
          </p>
          <Button variant="secondary" onClick={handleBack}>
            Back to Reports
          </Button>
        </div>
      </Card>
    );
  }

  // Helper function to get the appropriate badge class for a category
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
      {/* Page header with back button */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        >
          <FiArrowLeft className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Report Details
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {report.batch_name ? `${report.batch_name} (${report.batch_id})` : report.batch_id}
          </p>
        </div>
      </div>
      
      {/* Report summary */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Report Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Batch ID</dt>
                  <dd className="text-base text-secondary-900 dark:text-white font-mono">{report.batch_id}</dd>
                </div>
                
                {report.batch_name && (
                  <div>
                    <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Batch Name</dt>
                    <dd className="text-base text-secondary-900 dark:text-white">{report.batch_name}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Timestamp</dt>
                  <dd className="text-base text-secondary-900 dark:text-white">
                    {new Date(report.timestamp).toLocaleString()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Images</dt>
                  <dd className="text-base text-secondary-900 dark:text-white">{statusCounts.total}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-3">Status Distribution</h3>
              
              {/* Progress bars for each category */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-status-green">Green</span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {statusCounts.green} ({Math.round(report.summary.green_percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2.5">
                    <div 
                      className="bg-status-green h-2.5 rounded-full" 
                      style={{ width: `${report.summary.green_percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-status-amber">Amber</span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {statusCounts.amber} ({Math.round(report.summary.amber_percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2.5">
                    <div 
                      className="bg-status-amber h-2.5 rounded-full" 
                      style={{ width: `${report.summary.amber_percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-status-red">Red</span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {statusCounts.red} ({Math.round(report.summary.red_percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2.5">
                    <div 
                      className="bg-status-red h-2.5 rounded-full" 
                      style={{ width: `${report.summary.red_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              className="flex items-center"
            >
              <FiDownload className="mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Results list */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
            Image Analysis Results
          </h2>
          
          {report.results.length === 0 ? (
            <p className="text-secondary-600 dark:text-secondary-400">
              No results available for this report.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                <thead className="bg-secondary-50 dark:bg-secondary-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Image
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {report.results.map((result) => (
                    <tr key={result.image_index} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 dark:text-secondary-400">
                        #{result.image_index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 dark:text-secondary-400">
                        {result.image_name || `Image ${result.image_index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${getBadgeClass(result.category)}`}>
                          {result.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // We could open a modal here to show details
                            alert(`Analysis details for Image ${result.image_index + 1}: ${result.observations.substring(0, 100)}...`);
                          }}
                        >
                          View Analysis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      
      {/* Recommendations */}
      {report.summary.red_count > 0 && (
        <Card className="bg-status-red/10 border-l-4 border-status-red">
          <div className="p-4">
            <h3 className="text-lg font-medium text-status-red">Critical Issues Detected</h3>
            <p className="mt-2 text-secondary-700 dark:text-secondary-300">
              This batch contains {report.summary.red_count} rack{report.summary.red_count !== 1 ? 's' : ''} with critical structural issues that require immediate attention.
              Please review the red status items in detail and take appropriate action.
            </p>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default ReportDetail;
