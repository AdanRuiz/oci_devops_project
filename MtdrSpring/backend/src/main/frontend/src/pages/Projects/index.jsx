import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, List, ListItem, ListItemButton, ListItemText, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import client from '../../api/client';

const fetchProjects = () => client.get('/projects').then(r => r.data);
const createProject  = (data) => client.post('/projects', data);

export default function Projects() {
    const navigate    = useNavigate();
    const queryClient = useQueryClient();

    const [open, setOpen]               = useState(false);
    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');

    const { data: projects = [], isLoading, isError } = useQuery({
        queryKey: ['projects'],
        queryFn: fetchProjects,
    });

    const create = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setOpen(false);
            setName('');
            setDescription('');
        },
    });

    const handleCreate = () => {
        if (!name.trim()) return;
        create.mutate({ name, description });
    };

    if (isLoading) return <CircularProgress />;
    if (isError)   return <Typography color="error">Failed to load projects.</Typography>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Projects</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                    New Project
                </Button>
            </Box>

            <List>
                {projects.length === 0 && (
                    <Typography color="text.secondary">No projects yet. Create one to get started.</Typography>
                )}
                {projects.map(p => (
                    <ListItem key={p.id} disablePadding>
                        <ListItemButton onClick={() => navigate(`/projects/${p.id}`)}>
                            <ListItemText primary={p.name} secondary={p.description} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>New Project</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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
                        disabled={create.isPending || !name.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
