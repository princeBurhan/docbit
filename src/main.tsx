import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
import { RouterProvider } from './router/router';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RouterProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </RouterProvider>
  </React.StrictMode>
);
