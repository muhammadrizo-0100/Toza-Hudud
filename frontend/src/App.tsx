import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { store } from './store';
import { theme } from './theme';
import { AppRoutes } from './routes/AppRoutes';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}
