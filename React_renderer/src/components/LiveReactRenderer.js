import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import * as Recharts from 'recharts';


function ErrorFallback({ error }) {
  return (
    <div style={{ 
      color: '#ff4444',
      padding: '20px',
      background: '#ffe6e6',
      borderRadius: '8px',
      margin: '20px 0',
      fontFamily: 'monospace'
    }}>
      <h3>Error:</h3>
      <pre>{error.message}</pre>
    </div>
  );
}

const LiveReactRenderer = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  const rootRef = useRef(null);
  const isMounted = useRef(false);

  // Default Recharts example
  const defaultCode = `
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 700 }
];

export default function ChartComponent() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Sales Data</h2>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          strokeWidth={2}
        />
      </LineChart>
    </div>
  );
}
  `.trim();

  useEffect(() => {
    isMounted.current = true;
    setCode(defaultCode);
    
    return () => {
      isMounted.current = false;
      if (rootRef.current) {
        rootRef.current.unmount();
      }
    };
  }, []);

  useEffect(() => {
    const executeCode = () => {
      try {
        if (!previewRef.current || !isMounted.current) return;

        // Transpile code with Babel
        const transpiledCode = window.Babel.transform(code, {
          presets: ['react', 'env'],
          sourceType: 'module'
        }).code;

        // Custom require implementation
        const require = (name) => {
          switch(name) {
            case 'react': return React;
            case 'react-dom/client': return { createRoot: ReactDOM.createRoot };
            case 'recharts': return Recharts;
            default: throw new Error(`Cannot import ${name}`);
          }
        };

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

        if (isMounted.current) setError('');
      } catch (err) {
        if (isMounted.current) setError(err.message);
      }
    };

    const timer = setTimeout(executeCode, 300);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      gap: '20px',
      padding: '20px',
      background: '#f8f9fa'
    }}>
      {/* Editor Panel */}
      <div style={{ 
        flex: 1,
        background: '#1e1e1e',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            padding: '20px',
            fontFamily: "'Fira Code', monospace",
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#d4d4d4',
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none'
          }}
          placeholder="Enter React component code..."
        />
      </div>

      {/* Preview Panel */}
      <div style={{ 
        flex: 1,
        background: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        overflow: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div ref={previewRef} />
        {error && (
          <div style={{ 
            color: '#ff4444',
            padding: '15px',
            background: '#ffe6e6',
            borderRadius: '6px',
            marginTop: '15px',
            fontFamily: 'monospace'
          }}>
            <strong>Error:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveReactRenderer;