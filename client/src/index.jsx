import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css'; // Import Tailwind CSS
import './i18n'; // Import i18n configuration
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { SocketProvider } from './contexts/SocketContext.jsx'; // Import SocketProvider
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback="Loading..."> {/* Or a proper loading spinner */}
      <AuthProvider>
        <SocketProvider>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </SocketProvider>
      </AuthProvider>
    </Suspense>
  </React.StrictMode>
);