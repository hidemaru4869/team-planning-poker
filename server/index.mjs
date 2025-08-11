// Minimal WebSocket signaling server for WebRTC rooms
// Start: npm run signal (ws://localhost:3001)
import { WebSocketServer } from 'ws'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001

// rooms: roomId -> Map<clientId, { ws, name }>
const rooms = new Map()
const wss = new WebSocketServer({ port: PORT })
console.log(`[signal] listening on ws://localhost:${PORT}`)

const genId = () => Math.random().toString(36).slice(2, 10)

function broadcast(roomId, payload, excludeId) {
  const room = rooms.get(roomId)
  if (!room) return
  for (const [id, client] of room) {
    if (excludeId && id === excludeId) continue
    try { client.ws.send(JSON.stringify(payload)) } catch {}
  }
}

wss.on('connection', (ws) => {
  let clientId = null
  let roomId = null
  let name = null

  function safeSend(obj) {
    try { ws.send(JSON.stringify(obj)) } catch {}
  }

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    const { type } = msg || {}

    if (type === 'join') {
      roomId = String(msg.roomId || '').trim()
      name = String(msg.name || '').trim()
      if (!roomId || !name) return safeSend({ type: 'error', reason: 'invalid_join' })
      clientId = genId()
      if (!rooms.has(roomId)) rooms.set(roomId, new Map())
      const room = rooms.get(roomId)
      room.set(clientId, { ws, name })

      const peers = [...room.entries()].filter(([id]) => id !== clientId).map(([id, v]) => ({ id, name: v.name }))
      safeSend({ type: 'joined', self: { id: clientId, name }, peers })
      broadcast(roomId, { type: 'peer:join', peer: { id: clientId, name } }, clientId)
      return
    }

    if (!roomId || !clientId) return

    if (type === 'signal:offer' || type === 'signal:answer' || type === 'signal:ice') {
      const { to, data } = msg
      const room = rooms.get(roomId)
      const target = room && room.get(to)
      if (target) {
        try { target.ws.send(JSON.stringify({ type, from: clientId, data })) } catch {}
      }
      return
    }
  })

  ws.on('close', () => {
    if (roomId && clientId) {
      const room = rooms.get(roomId)
      if (room) {
        room.delete(clientId)
        broadcast(roomId, { type: 'peer:leave', id: clientId })
        if (room.size === 0) rooms.delete(roomId)
      }
    }
  })
})

