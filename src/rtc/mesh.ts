import { SignalingClient } from './signaling'
import type { IncomingSignal, PeerInfo } from '../shared/types'

type Handlers = {
  onPeer?: (peer: PeerInfo, connected: boolean) => void
  onMessage?: (from: string, data: any) => void
}

type PeerEntry = {
  pc: RTCPeerConnection
  dc?: RTCDataChannel
}

export class RtcMesh {
  private signaling: SignalingClient
  private peers = new Map<string, PeerEntry>()
  private self: PeerInfo | null = null
  private handlers: Handlers
  private iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]

  constructor(signaling: SignalingClient, handlers: Handlers = {}) {
    this.signaling = signaling
    this.handlers = handlers
    this.signaling.onmessage = (msg) => this.onSignal(msg)
  }

  async join(roomId: string, name: string) {
    await this.signaling.connect()
    this.signaling.join(roomId, name)
  }

  destroy() {
    this.signaling.close()
    for (const [id, entry] of this.peers) {
      try { entry.dc?.close() } catch {}
      try { entry.pc.close() } catch {}
    }
    this.peers.clear()
  }

  broadcast(obj: any) {
    for (const [, entry] of this.peers) {
      if (entry.dc && entry.dc.readyState === 'open') {
        entry.dc.send(JSON.stringify(obj))
      }
    }
  }

  private onSignal(msg: IncomingSignal) {
    if (msg.type === 'joined') {
      this.self = msg.self
      for (const peer of msg.peers) this.connectToPeer(peer.id)
      return
    }
    if (msg.type === 'peer:join') {
      this.connectToPeer(msg.peer.id)
      return
    }
    if (msg.type === 'peer:leave') {
      const entry = this.peers.get(msg.id)
      if (entry) {
        try { entry.dc?.close() } catch {}
        try { entry.pc.close() } catch {}
      }
      this.peers.delete(msg.id)
      this.handlers.onPeer?.({ id: msg.id, name: '' }, false)
      return
    }
    if (msg.type === 'signal:offer') {
      this.handleOffer(msg.from, msg.data)
      return
    }
    if (msg.type === 'signal:answer') {
      this.handleAnswer(msg.from, msg.data)
      return
    }
    if (msg.type === 'signal:ice') {
      this.handleIce(msg.from, msg.data)
      return
    }
  }

  private ensurePeer(id: string): PeerEntry {
    let entry = this.peers.get(id)
    if (entry) return entry
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })
    pc.onicecandidate = (e) => {
      if (e.candidate) this.signaling.send('signal:ice', id, e.candidate)
    }
    pc.ondatachannel = (ev) => {
      const dc = ev.channel
      this.attachDataChannel(id, dc)
    }
    entry = { pc }
    this.peers.set(id, entry)
    return entry
  }

  private attachDataChannel(id: string, dc: RTCDataChannel) {
    const entry = this.ensurePeer(id)
    entry.dc = dc
    dc.onopen = () => {
      this.handlers.onPeer?.({ id, name: '' }, true)
    }
    dc.onclose = () => {
      this.handlers.onPeer?.({ id, name: '' }, false)
    }
    dc.onmessage = (ev) => {
      try { this.handlers.onMessage?.(id, JSON.parse(ev.data)) } catch { this.handlers.onMessage?.(id, ev.data) }
    }
  }

  private async connectToPeer(id: string) {
    if (this.peers.has(id)) return
    const entry = this.ensurePeer(id)
    const dc = entry.pc.createDataChannel('poker')
    this.attachDataChannel(id, dc)
    const offer = await entry.pc.createOffer()
    await entry.pc.setLocalDescription(offer)
    this.signaling.send('signal:offer', id, offer)
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    const entry = this.ensurePeer(from)
    await entry.pc.setRemoteDescription(offer)
    const answer = await entry.pc.createAnswer()
    await entry.pc.setLocalDescription(answer)
    this.signaling.send('signal:answer', from, answer)
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
    const entry = this.ensurePeer(from)
    await entry.pc.setRemoteDescription(answer)
  }

  private async handleIce(from: string, ice: RTCIceCandidateInit) {
    const entry = this.ensurePeer(from)
    try { await entry.pc.addIceCandidate(ice) } catch {}
  }
}

