import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SingleAnalysis from './pages/SingleAnalysis';
import BatchAnalysis from './pages/BatchAnalysis';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import NotFound from './pages/NotFound';

// Create a react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyze" element={<SingleAnalysis />} />
              <Route path="/analyze/batch" element={<BatchAnalysis />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:batchId" element={<ReportDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
