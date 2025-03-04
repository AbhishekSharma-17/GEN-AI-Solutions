import React from 'react';
import ReactDOM from 'react-dom/client'; // Note the /client import
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

// Create a root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);