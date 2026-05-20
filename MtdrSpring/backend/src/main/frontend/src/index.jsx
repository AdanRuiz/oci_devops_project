/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2021 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * @author  jean.de.lavarene@oracle.com
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import Landing from './Landing';
import Login from './Login';
import Dashboard from './Dashboard';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<App />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/manager" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);