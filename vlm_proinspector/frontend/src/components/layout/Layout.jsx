import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, FiImage, FiUploadCloud, FiFileText,
  FiMenu, FiX, FiSun, FiMoon, FiBell
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, toggleDarkMode, darkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <FiHome className="h-5 w-5" /> },
    { path: '/analyze', label: 'Single Analysis', icon: <FiImage className="h-5 w-5" /> },
    { path: '/analyze/batch', label: 'Batch Analysis', icon: <FiUploadCloud className="h-5 w-5" /> },
    { path: '/reports', label: 'Reports', icon: <FiFileText className="h-5 w-5" /> },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-50">
        <div className="flex flex-col h-full bg-white dark:bg-secondary-800 shadow-lg">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b dark:border-secondary-700">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">ProInspector</h1>
          </div>
          
          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                          : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Bottom content */}
          <div className="p-4 border-t dark:border-secondary-700">
            <button
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <>
                  <FiSun className="mr-2 h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <FiMoon className="mr-2 h-4 w-4" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm"
              onClick={toggleSidebar}
            ></div>
            
            {/* Sidebar panel */}
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-secondary-800 shadow-lg"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col h-full">
                {/* Logo and close button */}
                <div className="flex items-center justify-between h-16 px-4 border-b dark:border-secondary-700">
                  <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">ProInspector</h1>
                  <button 
                    className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700"
                    onClick={toggleSidebar}
                  >
                    <FiX className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
                  </button>
                </div>
                
                {/* Navigation links */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={toggleSidebar}
                          className={({ isActive }) => 
                            `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                                : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'
                            }`
                          }
                        >
                          <span className="mr-3">{item.icon}</span>
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                {/* Bottom content */}
                <div className="p-4 border-t dark:border-secondary-700">
                  <button
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? (
                      <>
                        <FiSun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <FiMoon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-secondary-800 shadow-sm border-b dark:border-secondary-700">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Left: Mobile menu button */}
            <button
              className="p-2 mr-2 md:hidden rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700"
              onClick={toggleSidebar}
            >
              <FiMenu className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
            </button>
            
            {/* Page title (for mobile) */}
            <div className="md:hidden">
              <h1 className="text-lg font-medium text-secondary-900 dark:text-white">
                {navItems.find(item => item.path === location.pathname)?.label || 'ProInspector'}
              </h1>
            </div>
            
            {/* Right: Notifications */}
            <div className="flex items-center ml-auto">
              <button className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700">
                <FiBell className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
