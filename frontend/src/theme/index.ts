import { createTheme } from '@mui/material/styles';
import { palette } from './palette';

export const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"DM Sans Variable", "DM Sans", "Public Sans", "Segoe UI", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 800, lineHeight: 1.25, fontSize: '2.5rem', letterSpacing: '-0.02em', color: '#0F172A' },
    h2: { fontWeight: 800, lineHeight: 1.333, fontSize: '2rem', letterSpacing: '-0.02em', color: '#0F172A' },
    h3: { fontWeight: 700, lineHeight: 1.35, fontSize: '1.5rem', letterSpacing: '-0.01em', color: '#0F172A' },
    h4: { fontWeight: 700, lineHeight: 1.5, fontSize: '1.25rem', letterSpacing: '-0.01em', color: '#0F172A' },
    h5: { fontWeight: 700, lineHeight: 1.5, fontSize: '1.125rem', color: '#0F172A' },
    h6: { fontWeight: 600, lineHeight: 1.556, fontSize: '1.0625rem', color: '#0F172A' },
    subtitle1: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.571 },
    body1: { fontWeight: 400, fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.571 },
    caption: { fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.5 },
    overline: { fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' },
    button: { fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.571, textTransform: 'none' }
  },
  shape: {
    borderRadius: 10
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          width: '100%',
          height: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarGutter: 'stable'
        },
        body: {
          backgroundColor: '#F8FAFC',
          width: '100%',
          minHeight: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarGutter: 'stable'
        },
        '#root': {
          width: '100%',
          minHeight: '100%'
        },
        'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
          WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
          WebkitTextFillColor: '#1E293B !important',
          transition: 'background-color 5000s ease-in-out 0s'
        }
      }
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true
      },
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.14)',
          border: '1px solid #E2E8F0',
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: 'rgba(145, 158, 171, 0.16)' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: 'relative' as const,
          borderRadius: 16,
          boxShadow: '0 0 2px rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          border: '1px solid rgba(145, 158, 171, 0.16)'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: 'none',
          paddingInline: 16
        },
        sizeLarge: { minHeight: 48 },
        containedPrimary: {
          boxShadow: '0 8px 16px rgba(5, 150, 105, 0.24)',
          '&:hover': {
            backgroundColor: '#047857'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          transition: 'box-shadow 150ms ease, border-color 150ms ease'
        },
        notchedOutline: { borderColor: 'rgba(145, 158, 171, 0.24)' }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(145, 158, 171, 0.12)',
          padding: '12px 16px'
        },
        head: {
          fontWeight: 600,
          color: '#637381',
          backgroundColor: '#F8FAFC',
          fontSize: '0.85rem'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8
        }
      }
    }
  }
});
