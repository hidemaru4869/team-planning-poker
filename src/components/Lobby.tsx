import { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, TextField, Typography } from '@mui/material'

type Props = {
  onJoin: (roomId: string, name: string) => void
  initialRoomId?: string
}

export default function Lobby({ onJoin, initialRoomId }: Props) {
  const [roomId, setRoomId] = useState(initialRoomId ?? 'team-demo')
  const [name, setName] = useState('')

  const canJoin = roomId.trim().length > 0 && name.trim().length > 0

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3} alignItems="center">
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700}>Planning Poker</Typography>
          <Typography color="text.secondary">Estimate collaboratively via WebRTC</Typography>
        </Box>
        <Card sx={{ width: '100%' }}>
          <CardHeader title="Join a room" />
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. sprint-42"
                fullWidth
              />
              <TextField
                label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                fullWidth
              />
              <Button size="large" disabled={!canJoin} onClick={() => onJoin(roomId.trim(), name.trim())}>Join</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
