export type AudioItem = {
  id: string
  name: string
  url?: string
  mime?: string
  loop: boolean
  volume: number
  pan: number
  duration?: number
}
export type Playlist = {
  id: string
  name: string
  items: AudioItem[]
}
export type AppState = {
  playlists: Playlist[]
  activePlaylistId: string | null
  masterVolume: number
  muted: boolean
  padSize?: 'small' | 'medium'
  showArtIcon?: boolean
  fadeMs?: number
}
