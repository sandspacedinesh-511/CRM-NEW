import { createTheme } from '@mui/material/styles';

// Color palette
const colors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
    disabled: '#a0aec0',
  },
};

// Typography
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.025em',
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
};

// Component overrides
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        backgroundColor: colors.background.default,
      },
      '#root': {
        height: '100%',
        width: '100%',
      },
      'input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px white inset',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
      elevation2: {
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary[400],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary[500],
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '4px 8px',
        '&:hover': {
          backgroundColor: colors.primary[50],
        },
        '&.Mui-selected': {
          backgroundColor: colors.primary[100],
          '&:hover': {
            backgroundColor: colors.primary[200],
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 6,
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    },
  },
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
    },
    grey: colors.grey,
    background: colors.background,
    text: colors.text,
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
    '0 24px 48px rgba(0, 0, 0, 0.35), 0 20px 14px rgba(0, 0, 0, 0.22)',
    '0 29px 58px rgba(0, 0, 0, 0.40), 0 25px 16px rgba(0, 0, 0, 0.22)',
    '0 34px 68px rgba(0, 0, 0, 0.45), 0 30px 18px rgba(0, 0, 0, 0.22)',
    '0 39px 78px rgba(0, 0, 0, 0.50), 0 35px 20px rgba(0, 0, 0, 0.22)',
    '0 44px 88px rgba(0, 0, 0, 0.55), 0 40px 22px rgba(0, 0, 0, 0.22)',
    '0 49px 98px rgba(0, 0, 0, 0.60), 0 45px 24px rgba(0, 0, 0, 0.22)',
    '0 54px 108px rgba(0, 0, 0, 0.65), 0 50px 26px rgba(0, 0, 0, 0.22)',
    '0 59px 118px rgba(0, 0, 0, 0.70), 0 55px 28px rgba(0, 0, 0, 0.22)',
    '0 64px 128px rgba(0, 0, 0, 0.75), 0 60px 30px rgba(0, 0, 0, 0.22)',
    '0 69px 138px rgba(0, 0, 0, 0.80), 0 65px 32px rgba(0, 0, 0, 0.22)',
    '0 74px 148px rgba(0, 0, 0, 0.85), 0 70px 34px rgba(0, 0, 0, 0.22)',
    '0 79px 158px rgba(0, 0, 0, 0.90), 0 75px 36px rgba(0, 0, 0, 0.22)',
    '0 84px 168px rgba(0, 0, 0, 0.95), 0 80px 38px rgba(0, 0, 0, 0.22)',
    '0 89px 178px rgba(0, 0, 0, 1.00), 0 85px 40px rgba(0, 0, 0, 0.22)',
    '0 94px 188px rgba(0, 0, 0, 1.00), 0 90px 42px rgba(0, 0, 0, 0.22)',
    '0 99px 198px rgba(0, 0, 0, 1.00), 0 95px 44px rgba(0, 0, 0, 0.22)',
    '0 104px 208px rgba(0, 0, 0, 1.00), 0 100px 46px rgba(0, 0, 0, 0.22)',
    '0 109px 218px rgba(0, 0, 0, 1.00), 0 105px 48px rgba(0, 0, 0, 0.22)',
    '0 114px 228px rgba(0, 0, 0, 1.00), 0 110px 50px rgba(0, 0, 0, 0.22)',
    '0 119px 238px rgba(0, 0, 0, 1.00), 0 115px 52px rgba(0, 0, 0, 0.22)',
    '0 124px 248px rgba(0, 0, 0, 1.00), 0 120px 54px rgba(0, 0, 0, 0.22)',
    '0 129px 258px rgba(0, 0, 0, 1.00), 0 125px 56px rgba(0, 0, 0, 0.22)',
    '0 134px 268px rgba(0, 0, 0, 1.00), 0 130px 58px rgba(0, 0, 0, 0.22)',
  ],
});

export default theme; 