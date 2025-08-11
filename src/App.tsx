import { useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import Lobby from './components/Lobby'
import Room from './components/Room'
import './App.css'

type Player = { id: string; name: string }

function AppInner() {
  const [view, setView] = useState<'lobby' | 'room'>('lobby')
  const [roomId, setRoomId] = useState('')
  const [self, setSelf] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [revealed, setRevealed] = useState(false)
  const [votes, setVotes] = useState<Record<string, string | undefined>>({})
  const navigate = useNavigate()
  const params = useParams()

  const handleJoin = (rid: string, name: string) => {
    const me: Player = { id: crypto.randomUUID(), name }
    setRoomId(rid)
    setSelf(me)
    setPlayers([me])
    setRevealed(false)
    setVotes({})
    setView('room')
    navigate(`/r/${encodeURIComponent(rid)}`)
  }

  const handleLeave = () => {
    setRoomId('')
    setSelf(null)
    setPlayers([])
    setVotes({})
    setRevealed(false)
    setView('lobby')
    navigate(`/`)
  }

  const onVote = (value: string) => {
    if (!self) return
    setVotes((v) => ({ ...v, [self.id]: value }))
  }

  const onReveal = () => setRevealed(true)
  const onReset = () => {
    setVotes({})
    setRevealed(false)
  }

  // For demo: derive players list (self only). In the future, sync via WebRTC.
  const displayPlayers = useMemo(() => players, [players])

  const ridFromUrl = (params.roomId as string | undefined) || (params.rid as string | undefined)

  // If entering a room URL without having joined, show Lobby prefilled.
  const RoomRoute = () => {
    if (!self || !roomId || roomId !== ridFromUrl) {
      return <Lobby onJoin={handleJoin} initialRoomId={ridFromUrl} />
    }
    return (
      <Room
        roomId={roomId}
        self={self}
        players={displayPlayers}
        revealed={revealed}
        votes={votes}
        onVote={onVote}
        onReveal={onReveal}
        onReset={onReset}
        onLeave={handleLeave}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Lobby onJoin={handleJoin} />} />
      <Route path="/r/:roomId" element={<RoomRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppInner />
}
