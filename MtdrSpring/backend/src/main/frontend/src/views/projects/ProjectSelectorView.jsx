import { useState } from 'react';
import {
    Box, Button, Card, CardActionArea, CardContent,
    Dialog, DialogActions, DialogContent, DialogTitle,
    Grid, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

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
            {/* Header */}
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
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{ fontWeight: 600 }}
                >
                    New Project
                </Button>
            </Box>

            {/* Empty state */}
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

            {/* Project cards */}
            <Grid container spacing={2}>
                {projects.map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                        <Card
                            elevation={0}
                            sx={{
                                border: '1px solid #e8e5e2',
                                borderRadius: '8px',
                                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                                '&:hover': {
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                    borderColor: '#E8A535',
                                },
                            }}
                        >
                            <CardActionArea onClick={() => onSelect(project)} sx={{ p: 0 }}>
                                {/* Accent bar */}
                                <Box sx={{ height: '4px', bgcolor: '#E05A00', borderRadius: '8px 8px 0 0' }} />
                                <CardContent sx={{ p: 3 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        sx={{ color: '#1A1A1A', mb: 0.5, fontSize: '1rem' }}
                                        noWrap
                                    >
                                        {project.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#717171',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            minHeight: '2.5em',
                                        }}
                                    >
                                        {project.description || 'No description provided.'}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'inline-block',
                                            mt: 2,
                                            color: '#E05A00',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Open Project →
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create project dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>New Project</DialogTitle>
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
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={isCreating || !name.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
