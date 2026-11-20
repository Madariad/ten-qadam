import { createTheme } from '@mui/material/styles';

const fontStack = '"Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const headingStack = '"Rubik", "Noto Sans", "Segoe UI", Roboto, Arial, sans-serif';

export const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', dark: '#121d51', light: '#eaf1ff' },
    secondary: { main: '#7c3aed' },
    success: { main: '#16a34a' },
    background: { default: '#eef2fa', paper: '#ffffff' },
    text: { primary: '#141b41', secondary: '#4b5675' },
  },
  typography: {
    fontFamily: fontStack,
    h1: { fontFamily: headingStack, fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontFamily: headingStack, fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontFamily: headingStack, fontWeight: 700, letterSpacing: '-0.01em' },
    button: { fontFamily: fontStack, textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 11, boxShadow: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 18 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: fontStack, fontWeight: 600 },
      },
    },
  },
});
