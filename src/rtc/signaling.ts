import type { IncomingSignal, PeerInfo } from '../shared/types'

export class SignalingClient {
  private ws: WebSocket | null = null
  private url: string
  private joined: boolean = false
  onmessage?: (msg: IncomingSignal) => void

  constructor(url?: string) {
    this.url = url || (import.meta.env.VITE_SIGNALING_URL as string) || 'ws://localhost:3001'
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url)
      ws.onopen = () => resolve()
      ws.onerror = (ev) => reject(ev)
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as IncomingSignal
          this.onmessage?.(msg)
        } catch {}
      }
      this.ws = ws
    })
  }

  join(roomId: string, name: string) {
    if (!this.ws) throw new Error('ws not connected')
    if (this.joined) return
    this.ws.send(JSON.stringify({ type: 'join', roomId, name }))
    this.joined = true
  }

  send(type: 'signal:offer' | 'signal:answer' | 'signal:ice', to: string, data: any) {
    this.ws?.send(JSON.stringify({ type, to, data }))
  }

  close() {
    this.ws?.close()
    this.ws = null
    this.joined = false
  }
}

