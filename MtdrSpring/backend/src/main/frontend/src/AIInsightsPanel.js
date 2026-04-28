/*
 * AI Insights chat panel — RAG-backed Q&A over project data.
 * Calls POST /api/ai/ask and renders answer + source chips.
 */
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { API_AI } from './API';

const SUGGESTIONS = [
  '¿Cuál es el sprint activo?',
  '¿Quién tiene más tareas BLOCKED?',
  'Resumen de KPIs del proyecto',
  '¿Cuántos incidentes CRITICAL hay este mes?'
];

function AIInsightsPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content, sources?}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = (q) => {
    const question = (q !== undefined ? q : input).trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    fetch(API_AI + '/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        setLoading(false);
        if (!ok) {
          setError(body.error || 'Error desconocido');
          return;
        }
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: body.answer, sources: body.sources || [] }
        ]);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Network error');
      });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Preguntale al proyecto
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Haz preguntas en lenguaje natural sobre sprints, tareas, miembros, KPIs, deploys e incidentes.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {SUGGESTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              size="small"
              clickable
              disabled={loading}
              onClick={() => send(s)}
            />
          ))}
        </Stack>

        <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No has hecho ninguna pregunta todavia.
            </Typography>
          )}
          {messages.map((m, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="caption" color={m.role === 'user' ? 'primary' : 'secondary'}>
                {m.role === 'user' ? 'Tu' : 'IA'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {m.content}
              </Typography>
              {m.sources && m.sources.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                  {m.sources.map((s, j) => (
                    <Chip
                      key={j}
                      label={`${s.sourceType} #${s.sourceId}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">pensando...</Typography>
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Escribe tu pregunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            Preguntar
          </Button>
        </Stack>
      </CardContent>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default AIInsightsPanel;
