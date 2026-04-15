import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#312d2a',
        },
        secondary: {
            main: '#E05A00',
        },
        background: {
            default: '#F5F4F2',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#403A37',
            secondary: '#717171',
        },
        divider: '#E0DBD7',
    },
    typography: {
        fontFamily: "'OracleSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 6,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#F5F4F2',
                    color: '#1A1A1A',
                    boxShadow: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #E8E3DF',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '6px',
                },
                containedPrimary: {
                    '&:hover': { backgroundColor: '#111111' },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
            },
        },
    },
});

export default theme;
