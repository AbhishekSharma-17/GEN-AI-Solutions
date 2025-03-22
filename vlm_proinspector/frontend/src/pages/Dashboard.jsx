import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiUploadCloud, FiFileText, FiActivity } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import Card from '../components/ui/Card';
import { listReports } from '../services/api';

const Dashboard = () => {
  // Fetch reports data
  const { 
    data: reportsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
    // Don't refetch automatically
    staleTime: 30000,
  });

  // Stats state
  const [stats, setStats] = useState({
    totalReports: 0,
    totalImages: 0,
    greenCount: 0,
    amberCount: 0,
    redCount: 0
  });

  // Update stats when reports data changes
  useEffect(() => {
    if (reportsData?.reports) {
      // Simulate aggregated stats from reports
      const totalReports = reportsData.reports.length;
      
      // This is a placeholder calculation - in a real app, you'd fetch these from backend
      let totalImages = 0;
      reportsData.reports.forEach(report => {
        totalImages += report.total_images || 0;
      });
      
      // Sample distribution for demo purposes
      // In a real app, these would come from the backend
      const greenCount = Math.round(totalImages * 0.6);
      const amberCount = Math.round(totalImages * 0.3);
      const redCount = totalImages - greenCount - amberCount;
      
      setStats({
        totalReports,
        totalImages,
        greenCount,
        amberCount,
        redCount
      });
    }
  }, [reportsData]);

  // Feature cards for navigation
  const featureCards = [
    {
      title: 'Single Analysis',
      description: 'Analyze a single rack image in real-time',
      icon: <FiImage className="h-10 w-10 text-primary-500" />,
      link: '/analyze',
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Batch Processing',
      description: 'Upload multiple images for batch analysis',
      icon: <FiUploadCloud className="h-10 w-10 text-purple-500" />,
      link: '/analyze/batch',
      color: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Reports',
      description: 'View detailed analysis reports',
      icon: <FiFileText className="h-10 w-10 text-teal-500" />,
      link: '/reports',
      color: 'bg-teal-50 dark:bg-teal-900/20'
    }
  ];

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Dashboard</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Welcome to ProInspector - Warehouse Rack Analysis System
          </p>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-secondary-800 shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/20">
              <FiActivity className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Reports</p>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                {isLoading ? '...' : stats.totalReports}
              </h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-secondary-800 shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-status-green/10">
              <FiActivity className="h-6 w-6 text-status-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Green Status</p>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                {isLoading ? '...' : `${stats.greenCount} racks`}
              </h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-secondary-800 shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-status-amber/10">
              <FiActivity className="h-6 w-6 text-status-amber" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Amber Status</p>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                {isLoading ? '...' : `${stats.amberCount} racks`}
              </h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-secondary-800 shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-status-red/10">
              <FiActivity className="h-6 w-6 text-status-red" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Red Status</p>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                {isLoading ? '...' : `${stats.redCount} racks`}
              </h3>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Features section */}
      <section>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {featureCards.map((card, index) => (
            <motion.div key={index} variants={item}>
              <Link to={card.link} className="block h-full">
                <Card hover animate={false} className="h-full transition-all duration-200 hover:shadow-md">
                  <div className={`p-4 rounded-full ${card.color} mb-4 inline-block`}>
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-secondary-600 dark:text-secondary-400">
                    {card.description}
                  </p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Recent reports */}
      <section>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
          Recent Reports
        </h2>
        
        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-status-red">
              Error loading reports. Please try again later.
            </div>
          ) : reportsData?.reports?.length === 0 ? (
            <div className="text-center p-6 text-secondary-600 dark:text-secondary-400">
              No reports available yet. Start by analyzing some rack images.
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
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Images
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {reportsData?.reports?.slice(0, 5).map((report) => (
                    <tr key={report.batch_id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                        <Link to={`/reports/${report.batch_id}`} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {reportsData?.reports?.length > 5 && (
            <div className="px-6 py-3 bg-secondary-50 dark:bg-secondary-800 border-t dark:border-secondary-700">
              <Link to="/reports" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                View all reports →
              </Link>
            </div>
          )}
        </Card>
      </section>
    </motion.div>
  );
};

export default Dashboard;
