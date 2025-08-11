export type PeerInfo = { id: string; name: string }

export type SignalJoined = { type: 'joined'; self: PeerInfo; peers: PeerInfo[] }
export type SignalPeerJoin = { type: 'peer:join'; peer: PeerInfo }
export type SignalPeerLeave = { type: 'peer:leave'; id: string }
export type SignalOffer = { type: 'signal:offer'; from: string; data: any }
export type SignalAnswer = { type: 'signal:answer'; from: string; data: any }
export type SignalIce = { type: 'signal:ice'; from: string; data: any }
export type SignalError = { type: 'error'; reason: string }

export type IncomingSignal =
  | SignalJoined
  | SignalPeerJoin
  | SignalPeerLeave
  | SignalOffer
  | SignalAnswer
  | SignalIce
  | SignalError

