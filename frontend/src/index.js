import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Performance monitoring (optional)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance measurement (optional)
function sendToAnalytics(metric) {
  // You can send to your analytics service here
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);