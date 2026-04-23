import { useEffect } from 'react';
import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
const PAGE_BG     = '#f4e7bf';
const CARD_BG     = '#fbf9f8';
const TEXT_MAIN   = '#312d2a';
const TEXT_SUBTLE = '#6f6a66';

export function AuthCallbackRoute() {
    const auth = useAuth();

    useEffect(() => {}, []);

    if (auth.error) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 3, bgcolor: PAGE_BG }}>
                <Alert severity="error" sx={{ maxWidth: 520 }}>
                    Authentication error: {auth.error.message}
                </Alert>
            </Box>
        );
    }

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: PAGE_BG }}>
            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.95rem' }}>
                Completing sign in...
            </Typography>
        </Box>
    );
}

export default function AuthView() {
    const auth = useAuth();

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <Box sx={{
            position: 'relative',
            minHeight: '100vh',
            overflow: 'hidden',
            bgcolor: PAGE_BG,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Subtle radial gradient overlay */}
            <Box aria-hidden sx={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top right, rgba(255,255,255,0.32), transparent 34%), radial-gradient(circle at left center, rgba(255,255,255,0.12), transparent 38%)',
                pointerEvents: 'none',
            }} />

            <Stack spacing={2.5} sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: 400,
                py: 4,
            }}>

                {/* Sign in card */}
                <Card elevation={0} sx={{
                    bgcolor: CARD_BG,
                    borderRadius: '8px',
                    border: '1px solid #ebe8e3',
                    boxShadow: '0 16px 48px rgba(70,58,46,0.08)',
                    px: { xs: 3, sm: 4 },
                    py: { xs: 3, sm: 3.5 },
                }}>
                    <Stack spacing={2}>
                        <Typography align="center" sx={{
                            color: TEXT_MAIN,
                            fontWeight: 700,
                            fontSize: { xs: '1.5rem', sm: '1.8rem' },
                            letterSpacing: '-0.03em',
                            lineHeight: 1.05,
                        }}>
                            Sign in to Oracle
                        </Typography>

                        {auth.error && (
                            <Alert severity="error">Authentication error: {auth.error.message}</Alert>
                        )}

                        <Button
                            variant="contained"
                            onClick={() => auth.signinRedirect()}
                            disabled={auth.isLoading}
                            sx={{
                                minHeight: 44,
                                bgcolor: TEXT_MAIN,
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#1f1c1a' },
                            }}
                        >
                            {auth.isLoading ? 'Loading...' : 'Next'}
                        </Button>
                    </Stack>
                </Card>

                {/* Footer */}
                <Typography align="center" sx={{ color: TEXT_SUBTLE, fontSize: '0.82rem' }}>
                    © Oracle | Terms of Use | Privacy Policy
                </Typography>

            </Stack>
        </Box>
    );
}
