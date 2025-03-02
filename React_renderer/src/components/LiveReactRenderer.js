import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import * as Recharts from 'recharts';
import './LiveReactRenderer.css';
// Memoized Error Fallback Component
const ErrorFallback = React.memo(({ error }) => (
  <div className="error-fallback">
    <h3>Error:</h3>
    <pre>{error.message}</pre>
  </div>
));

const LiveReactRenderer = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  const rootRef = useRef(null);

  // Default Recharts example
  const defaultCode = `
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgeDistributionChart = () => {
  const data = [
    { name: '18-24', value: 25 },
    { name: '25-34', value: 35 },
    { name: '35-44', value: 20 },
    { name: '45-54', value: 10 },
    { name: '55+', value: 10 },
  ];

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  return (
    <div style={{ padding: 20 }}>
      <h2>Customer Age Distribution</h2>
      <ResponsiveContainer width={400} height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgeDistributionChart;
  `.trim();

  // Custom require implementation
  const require = useCallback((name) => {
    switch (name) {
      case 'react': return React;
      case 'react-dom/client': return { createRoot: ReactDOM.createRoot };
      case 'recharts': return Recharts;
      default: throw new Error(`Cannot import ${name}`);
    }
  }, []);

  // Execute code with debounce
  const executeCode = useCallback(() => {
    try {
      if (!previewRef.current) return;

      // Transpile code with Babel
      const transpiledCode = window.Babel.transform(code, {
        presets: ['react', 'env'],
        sourceType: 'module'
      }).code;

      const exports = {};
      const module = { exports };

      // Execute transpiled code
      const func = new Function('require', 'module', 'exports', 'React', transpiledCode);
      func(require, module, exports, React);

      // Get component
      const Component = module.exports.default || module.exports;

      // Cleanup previous root
      if (rootRef.current) {
        rootRef.current.unmount();
      }

      // Create new root
      rootRef.current = ReactDOM.createRoot(previewRef.current);

      // Render with error boundary
      rootRef.current.render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Component />
        </ErrorBoundary>
      );

      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [code, require]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(executeCode, 300);
    return () => clearTimeout(timer);
  }, [code, executeCode]);

  // Set default code on mount
  useEffect(() => {
    setCode(defaultCode);
  }, [defaultCode]);

  return (
    <div className="live-react-renderer">
      {/* Editor Panel */}
      <div className="editor-panel">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter React component code..."
        />
      </div>

      {/* Preview Panel */}
      <div className="preview-panel">
        <div ref={previewRef} />
        {error && (
          <div className="error-message">
            <strong>Error:</strong>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveReactRenderer;