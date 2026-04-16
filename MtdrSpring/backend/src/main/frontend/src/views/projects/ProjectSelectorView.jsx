import { useState } from 'react';
import {
    Box, Button, Card, CardContent,
    Dialog, DialogActions, DialogContent, DialogTitle,
    Grid, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { ORANGE_ACCENT, outlinedButtonSx, containedButtonSx } from '../../styles/theme';

export default function ProjectSelectorView({ projects, onCreate, onSelect, isCreating }) {
    const [open, setOpen]               = useState(false);
    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) return;
        await onCreate({ name, description });
        setOpen(false);
        setName('');
        setDescription('');
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#1A1A1A' }}>
                        Select a Project
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#717171', mt: 0.5 }}>
                        Choose a project to start working on its sprints, tasks, and KPIs.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={outlinedButtonSx}
                >
                    New Project
                </Button>
            </Box>

            {projects.length === 0 && (
                <Box sx={{
                    textAlign: 'center', py: 8,
                    border: '2px dashed #e0dedc', borderRadius: '8px',
                }}>
                    <FolderOpenIcon sx={{ fontSize: 48, color: '#c0bdb9', mb: 1 }} />
                    <Typography color="text.secondary">
                        No projects yet. Create one to get started.
                    </Typography>
                </Box>
            )}

            <Grid container spacing={2}>
                {projects.map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                        <Card
                            elevation={0}
                            sx={{
                                border: '1px solid #E8E8E8',
                                borderRadius: '8px',
                                boxShadow: 'none',
                                bgcolor: '#fbf9f8',
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, background-color 0.15s',
                                '&:hover': { borderColor: '#d0cecc', bgcolor: '#f5f3f1' },
                            }}
                            onClick={() => onSelect(project)}
                        >
                            <CardContent sx={{ p: '20px !important' }}>
                                <Box sx={{ height: '3px', bgcolor: ORANGE_ACCENT, borderRadius: '10px', mb: '14px' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '10px' }}>
                                    <FolderOpenIcon sx={{ fontSize: '1rem', color: '#717171' }} />
                                    <Typography sx={{ fontSize: '0.9rem', color: '#1A1A1A' }}>
                                        Project
                                    </Typography>
                                </Box>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
                                        lineHeight: 1.2,
                                        color: '#1A1A1A',
                                        mb: '10px',
                                    }}
                                    noWrap
                                >
                                    {project.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: '#717171' }}>
                                    {project.description || 'No description provided.'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>
                    New Project
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions sx={{ px: '24px', pb: '16px' }}>
                    <Button onClick={() => setOpen(false)} variant="outlined" size="small" sx={outlinedButtonSx}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleCreate}
                        disabled={isCreating || !name.trim()}
                        sx={containedButtonSx}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
