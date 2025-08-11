import { useMemo } from 'react'
import {
  AppBar,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'

type Player = { id: string; name: string }

type Props = {
  roomId: string
  self: Player
  players: Player[]
  revealed: boolean
  votes: Record<string, string | undefined> // playerId -> value
  onVote: (value: string) => void
  onReveal: () => void
  onReset: () => void
  onLeave: () => void
}

const DECK = ['0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?']

export default function Room({ roomId, self, players, revealed, votes, onVote, onReveal, onReset, onLeave }: Props) {
  const votedCount = useMemo(() => Object.values(votes).filter(Boolean).length, [votes])
  const copyInvite = async () => {
    const url = `${location.origin}/r/${encodeURIComponent(roomId)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (_) {
      // ignore
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Room: {roomId}</Typography>
          <Tooltip title="Copy invite link">
            <span>
              <Button onClick={copyInvite} sx={{ mr: 1 }}>
                Copy link
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Reveal all">
            <span>
              <IconButton color="primary" onClick={onReveal} disabled={revealed}>
                <VisibilityIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset round">
            <IconButton onClick={onReset}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Leave room">
            <IconButton color="inherit" onClick={onLeave}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <AvatarGroup total={players.length}>
                  {players.slice(0, 5).map((p) => (
                    <Avatar key={p.id} alt={p.name}>
                      {p.name.slice(0, 1).toUpperCase()}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Typography variant="body2" color="text.secondary">
                  {votedCount}/{players.length} voted
                </Typography>
              </Stack>
              <Typography variant="body2">You: {self.name}</Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography fontWeight={600} gutterBottom>Pick your card</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {DECK.map((v) => (
                <Button key={v} onClick={() => onVote(v)}>{v}</Button>
              ))}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography fontWeight={600} gutterBottom>Results</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {players.map((p) => (
                <Chip
                  key={p.id}
                  label={revealed ? votes[p.id] ?? '—' : votes[p.id] ? '✓' : '…'}
                  avatar={<Avatar>{p.name.slice(0, 1).toUpperCase()}</Avatar>}
                  color={revealed && votes[p.id] ? 'primary' : 'default'}
                  variant={revealed ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}
