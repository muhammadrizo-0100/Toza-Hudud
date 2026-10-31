import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastOptions>({
    message: '',
    severity: 'success',
    duration: 3500
  });

  const showToast = useCallback(
    (message: string, severity: AlertColor = 'success', duration = 3500) => {
      setToast({ message, severity, duration });
      setOpen(true);
    },
    []
  );

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration || 4500);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={SlideTransition}
        sx={{
          mt: 7,
          mr: 1,
          zIndex: 9999
        }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{
            minWidth: 280,
            maxWidth: 440,
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
            fontWeight: 600,
            fontSize: '0.88rem',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '1.25rem',
              mr: 1.25
            }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
