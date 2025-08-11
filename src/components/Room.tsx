import { useEffect, useMemo, useRef, useState } from 'react'
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
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import SendIcon from '@mui/icons-material/Send'
import TextField from '@mui/material/TextField'
import { SignalingClient } from '../rtc/signaling'
import { RtcMesh } from '../rtc/mesh'

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
  const [rtcReady, setRtcReady] = useState(false)
  const [peerCount, setPeerCount] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>()
  const meshRef = useRef<RtcMesh | null>(null)

  useEffect(() => {
    const signaling = new SignalingClient()
    const mesh = new RtcMesh(signaling, {
      onPeer: (_peer, connected) => {
        setPeerCount((c) => Math.max(0, c + (connected ? 1 : -1)))
        setRtcReady(true)
      },
      onMessage: (_from, data) => {
        setLog((l) => [
          `[recv] ${typeof data === 'string' ? data : JSON.stringify(data)}`,
          ...l,
        ])
      },
    })
    meshRef.current = mesh
    mesh.join(roomId, self.name).catch(() => setRtcReady(false))
    return () => {
      mesh.destroy()
      meshRef.current = null
    }
  }, [roomId, self.name])

  const sendTest = () => {
    const msg = inputRef.current?.value || `hello from ${self.name}`
    meshRef.current?.broadcast({ kind: 'test', msg, at: Date.now() })
    setLog((l) => [`[send] ${msg}`, ...l])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Room: {roomId}</Typography>
          <Tooltip title={rtcReady ? `${peerCount} peer(s) connected` : 'RTC connecting...'}>
            <Chip icon={rtcReady ? <WifiIcon /> : <WifiOffIcon />} label={rtcReady ? `${peerCount}` : '—'} sx={{ mr: 1 }} />
          </Tooltip>
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

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography fontWeight={600} gutterBottom>RTC Demo</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField inputRef={inputRef} placeholder="message..." size="small" sx={{ flex: 1 }} />
              <Button onClick={sendTest} endIcon={<SendIcon />}>Send</Button>
            </Stack>
            <Stack spacing={0.5} sx={{ maxHeight: 180, overflow: 'auto' }}>
              {log.map((line, i) => (
                <Typography key={i} variant="caption" sx={{ fontFamily: 'monospace' }}>{line}</Typography>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}
