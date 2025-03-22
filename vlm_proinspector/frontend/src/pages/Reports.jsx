import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiFilter, FiDownload, FiAlertCircle } from 'react-icons/fi';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { listReports } from '../services/api';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  
  // Fetch all reports
  const { 
    data,
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery({
    queryKey: ['reports'],
    queryFn: listReports
  });

  // Filter and search reports
  const filteredReports = React.useMemo(() => {
    if (!data?.reports) return [];
    
    return data.reports
      .filter(report => {
        // Handle filtering
        if (filterValue === 'all') return true;
        
        // This is just an example - we don't have actual criteria in our API yet
        // In a real app, you would filter based on report properties
        // For now, let's simulate batch type filtering
        const reportDate = new Date(report.timestamp);
        const currentDate = new Date();
        
        if (filterValue === 'today') {
          return reportDate.toDateString() === currentDate.toDateString();
        } else if (filterValue === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(currentDate.getDate() - 7);
          return reportDate >= weekAgo;
        }
        
        return true;
      })
      .filter(report => {
        // Handle search
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          (report.batch_id && report.batch_id.toLowerCase().includes(searchLower)) ||
          (report.batch_name && report.batch_name.toLowerCase().includes(searchLower))
        );
      });
  }, [data, filterValue, searchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Reports</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            View and manage your rack inspection reports
          </p>
        </div>
        
        <div>
          <Button 
            variant="secondary" 
            onClick={() => refetch()}
            isLoading={isLoading}
          >
            Refresh Reports
          </Button>
        </div>
      </div>
      
      {/* Search and filters */}
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-secondary-400 dark:text-secondary-500" />
              </div>
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search by batch ID or name"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Filter dropdown */}
            <div className="sm:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-secondary-400 dark:text-secondary-500" />
                </div>
                <select
                  className="input pl-10 w-full appearance-none"
                  value={filterValue}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Reports</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Reports table */}
      <Card>
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
            </div>
          </div>
        ) : isError ? (
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <FiAlertCircle className="h-12 w-12 text-status-red mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">Failed to load reports</h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                {error?.message || 'An unexpected error occurred.'}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm || filterValue !== 'all' ? (
              <p className="text-secondary-600 dark:text-secondary-400">
                No reports match your filters. Try adjusting your search or filter criteria.
              </p>
            ) : (
              <div>
                <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                  No reports found. Start by analyzing some rack images.
                </p>
                <Link to="/analyze/batch">
                  <Button>Create Batch Analysis</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Images
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                {filteredReports.map((report) => (
                  <tr key={report.batch_id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      <Link 
                        to={`/reports/${report.batch_id}`}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {report.batch_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 dark:text-secondary-400">
                      {report.batch_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 dark:text-secondary-400">
                      {new Date(report.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 dark:text-secondary-400">
                      {report.total_images}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/reports/${report.batch_id}`}>
                          <Button variant="secondary" size="sm">View Details</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Tips section */}
      <Card className="bg-primary-50 dark:bg-primary-900/10 border-l-4 border-primary-500">
        <div className="p-4">
          <h3 className="text-lg font-medium text-primary-800 dark:text-primary-300">Report Management Tips</h3>
          <ul className="mt-2 pl-5 list-disc text-primary-700 dark:text-primary-400 space-y-1">
            <li>Reports are generated automatically when you submit a batch analysis</li>
            <li>Search by batch name or ID to quickly find specific reports</li>
            <li>Click on a report to view detailed analysis results</li>
            <li>Regular inspections help maintain warehouse safety standards</li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};

export default Reports;
