import { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

const PAGE_BG = '#f4e7bf';
const CARD_BG = '#fbf9f8';
const TEXT_MAIN = '#312d2a';
const TEXT_SUBTLE = '#6f6a66';

function BackgroundOrnament({ sx }) {
    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                opacity: 0.35,
                pointerEvents: 'none',
                backgroundImage: `
                    repeating-radial-gradient(circle at center, transparent 0 12px, rgba(97, 89, 76, 0.18) 12px 15px, transparent 15px 28px),
                    repeating-radial-gradient(circle at center, transparent 0 16px, rgba(97, 89, 76, 0.12) 16px 19px, transparent 19px 32px)
                `,
                ...sx,
            }}
        />
    );
}

export default function CreateUserView() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    const handleCreateAccount = () => {
        setSubmitError('');
        setSubmitSuccess('');

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setSubmitError('Enter an email to create your account.');
            return;
        }

        if (!password.trim()) {
            setSubmitError('Enter a password to create your account.');
            return;
        }

        setSubmitSuccess('Account details captured. Connect this screen to your user-creation API when the endpoint is ready.');
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                aria-label="Back"
                                onClick={() => navigate('/auth/sign-in')}
                                sx={{ color: TEXT_MAIN, border: '1px solid #e3ddd6' }}
                            >
                                <ArrowBackRoundedIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.92rem', fontWeight: 500 }}>
                                Create your account
                            </Typography>
                        </Box>

                        <Typography
                            align="center"
                            sx={{
                                color: TEXT_MAIN,
                                fontWeight: 700,
                                fontSize: { xs: '2rem', sm: '3rem' },
                                letterSpacing: '-0.03em',
                                lineHeight: 1.05,
                            }}
                        >
                            Create Account
                        </Typography>

                        <Box>
                            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.98rem', mb: 1.2 }}>
                                Email
                            </Typography>
                            <TextField
                                fullWidth
                                type="email"
                                variant="standard"
                                value={email}
                                placeholder="name@example.com"
                                onChange={(event) => setEmail(event.target.value)}
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

                        <Box>
                            <Typography sx={{ color: TEXT_SUBTLE, fontSize: '0.98rem', mb: 1.2 }}>
                                Password
                            </Typography>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                variant="standard"
                                value={password}
                                placeholder="Create password"
                                onChange={(event) => setPassword(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleCreateAccount();
                                    }
                                }}
                                InputProps={{
                                    disableUnderline: false,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                onClick={() => setShowPassword((value) => !value)}
                                                edge="end"
                                                sx={{ color: TEXT_SUBTLE }}
                                            >
                                                {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
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

                        {submitSuccess && (
                            <Alert severity="success">
                                {submitSuccess}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleCreateAccount}
                            sx={{
                                minHeight: 60,
                                bgcolor: TEXT_MAIN,
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': { bgcolor: '#1f1c1a' },
                            }}
                        >
                            Create Account
                        </Button>
                    </Stack>
                </Card>
            </Stack>
        </Box>
    );
}
