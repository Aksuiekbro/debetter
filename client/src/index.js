import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Import i18n configuration
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { SocketProvider } from './contexts/SocketContext'; // Import SocketProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback="Loading..."> {/* Or a proper loading spinner */}
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </Suspense>
  </React.StrictMode>
);