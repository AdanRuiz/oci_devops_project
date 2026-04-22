import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    Link,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

const PAGE_BG = '#f4e7bf';
const CARD_BG = '#fbf9f8';
const TEXT_MAIN = '#312d2a';
const TEXT_SUBTLE = '#6f6a66';
const LINK_COLOR = '#00688c';

function BackgroundOrnament({ sx }) {
    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.35,
                pointerEvents: 'none',
            }}
        />
    );
}

export function AuthCallbackRoute() {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [auth.isAuthenticated, navigate]);

    if (auth.error) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 3, bgcolor: '#F5F4F2' }}>
                <Alert severity="error" sx={{ maxWidth: 520 }}>
                    Authentication error: {auth.error.message}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 3, bgcolor: '#F5F4F2' }}>
            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.95rem' }}>
                Completing sign in...
            </Typography>
        </Box>
    );
}

export default function AuthView() {
    const auth = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [submitError, setSubmitError] = useState('');

    const authorityUrl = useMemo(() => {
        try {
            return new URL(auth.settings.authority);
        } catch (_error) {
            return null;
        }
    }, [auth.settings.authority]);

    const supportLink = authorityUrl ? `${authorityUrl.origin}/` : '#';

    const handleSignIn = async () => {
        setSubmitError('');

        try {
            await auth.signinRedirect({
                login_hint: identifier.trim() || undefined,
            });
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Unable to start sign in.');
        }
    };

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                overflow: 'hidden',
                bgcolor: PAGE_BG,
                px: 2,
                py: { xs: 4, md: 7 },
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.32), transparent 34%), radial-gradient(circle at left center, rgba(255,255,255,0.12), transparent 38%)',
                }}
            />
            <BackgroundOrnament sx={{ width: 280, height: 280, left: -40, bottom: -24 }} />
            <BackgroundOrnament sx={{ width: 320, height: 320, right: -24, bottom: -36 }} />
            <BackgroundOrnament sx={{ width: 120, height: 120, top: 18, left: '58%' }} />

            <Stack
                spacing={3.5}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: 650,
                    mx: 'auto',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        bgcolor: CARD_BG,
                        borderRadius: '8px',
                        border: '1px solid #ebe8e3',
                        boxShadow: '0 16px 48px rgba(70, 58, 46, 0.08)',
                        px: { xs: 3, sm: 5.5 },
                        py: { xs: 4, sm: 5 },
                    }}
                >
                    <Stack spacing={3}>
                        <Typography
                            align="center"
                            sx={{
                                color: TEXT_MAIN,
                                fontWeight: 700,
                                fontSize: { xs: '2rem', sm: '3.1rem' },
                                letterSpacing: '-0.03em',
                                lineHeight: 1.05,
                            }}
                        >
                            Sign in to Oracle
                        </Typography>

                        <Box>
                            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.98rem', mb: 1.2 }}>
                                Username or email
                            </Typography>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={identifier}
                                placeholder="Username"
                                onChange={(event) => setIdentifier(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleSignIn();
                                    }
                                }}
                                InputProps={{
                                    disableUnderline: false,
                                    sx: {
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: TEXT_MAIN,
                                        pb: 0.5,
                                        '&:before': { borderBottomColor: '#bdb6af' },
                                        '&:after': { borderBottomColor: TEXT_MAIN },
                                    },
                                }}
                            />
                        </Box>

                        {submitError && (
                            <Alert severity="error">
                                {submitError}
                            </Alert>
                        )}

                        {auth.error && (
                            <Alert severity="error">
                                Authentication error: {auth.error.message}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleSignIn}
                            disabled={auth.isLoading}
                            sx={{
                                minHeight: 60,
                                bgcolor: TEXT_MAIN,
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': { bgcolor: '#1f1c1a' },
                            }}
                        >
                            {auth.isLoading ? 'Loading...' : 'Next'}
                        </Button>

                        <Link
                            href={supportLink}
                            underline="none"
                            sx={{
                                color: LINK_COLOR,
                                textAlign: 'center',
                                fontSize: '0.98rem',
                                fontWeight: 500,
                            }}
                        >
                            Forgot username?
                        </Link>
                    </Stack>
                </Card>

                <Card
                    elevation={0}
                    sx={{
                        bgcolor: CARD_BG,
                        borderRadius: '8px',
                        border: '1px solid #ebe8e3',
                        boxShadow: '0 16px 48px rgba(70, 58, 46, 0.08)',
                        px: { xs: 3, sm: 5.5 },
                        py: { xs: 4, sm: 4.5 },
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        <Typography
                            align="center"
                            sx={{
                                color: TEXT_MAIN,
                                fontWeight: 700,
                                fontSize: { xs: '1.8rem', sm: '2.2rem' },
                                letterSpacing: '-0.025em',
                                lineHeight: 1.1,
                            }}
                        >
                            Don&apos;t have an Oracle Account?
                        </Typography>

                        <Button
                            fullWidth
                            variant="outlined"
                            href={supportLink}
                            sx={{
                                minHeight: 58,
                                borderColor: '#4a423d',
                                color: '#171412',
                                fontWeight: 700,
                                fontSize: '0.98rem',
                                '&:hover': {
                                    borderColor: '#2f2a27',
                                    bgcolor: 'rgba(49, 45, 42, 0.03)',
                                },
                            }}
                        >
                            Create Account
                        </Button>

                        <Typography align="center" sx={{ color: TEXT_MAIN, fontSize: '0.92rem' }}>
                            © Oracle | Terms of Use | Privacy Policy
                        </Typography>
                    </Stack>
                </Card>
            </Stack>
        </Box>
    );
}
