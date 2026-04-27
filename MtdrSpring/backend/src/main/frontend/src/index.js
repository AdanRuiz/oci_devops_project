import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from 'react-oidc-context';
import { oidcConfig } from './auth/authConfig';
import { setAuthToken } from './models/api/client';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider
      {...oidcConfig}
      onSigninCallback={(user) => {
        const token = user?.access_token ?? user?.id_token ?? null;
        if (token) setAuthToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }}
    >
      <App />
    </AuthProvider>
  </React.StrictMode>
);
