import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { store } from './store';
import { theme } from './theme';
import { AppRoutes } from './routes/AppRoutes';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider } from './i18n';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </Provider>
  );
}
