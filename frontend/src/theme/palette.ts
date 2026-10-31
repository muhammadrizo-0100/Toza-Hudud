import { PaletteOptions, alpha } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#059669', // Emerald 600 (Tozalik & Tabiat)
    light: '#10B981', // Emerald 500
    dark: '#047857', // Emerald 700
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#0284C7', // Sky 600 (Tiniq havo/suv)
    light: '#38BDF8',
    dark: '#0369A1',
    contrastText: '#FFFFFF'
  },
  error: {
    main: '#DC2626', // Red 600 (To'plangan chiqindi / Kritik)
    light: '#EF4444',
    dark: '#B91C1C',
    contrastText: '#FFFFFF'
  },
  warning: {
    main: '#F59E0B', // Amber 500 (Jarayonda / Maxsus texnika)
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#FFFFFF'
  },
  success: {
    main: '#10B981', // Emerald 500 (Bajarildi / Tozalandi)
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF'
  },
  info: {
    main: '#0EA5E9',
    light: '#38BDF8',
    dark: '#0284C7',
    contrastText: '#FFFFFF'
  },
  background: {
    default: '#F8FAFC', // Slate 50 (Havodor toza oq fon)
    paper: '#FFFFFF'
  },
  text: {
    primary: '#0F172A', // Slate 900
    secondary: '#64748B', // Slate 500
    disabled: '#94A3B8'
  },
  divider: '#E2E8F0'
};
