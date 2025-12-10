import { useEffect, useMemo, useRef, useState } from "react"
import { AppState, AudioItem, Playlist } from "../types"
import { loadState, saveState, loadElectronState } from "../lib/persist"
import { Howler } from "howler"
import PlaylistTabs from "./PlaylistTabs"
import MasterControls from "./MasterControls"
import AudioCard from "./AudioCard"

function createEmptyPlaylist(id: string, name: string): Playlist {
  const items: AudioItem[] = Array.from({ length: 6 }).map((_, i) => ({
    id: `${id}-${i}`,
    name: "",
    loop: false,
    volume: 100,
    pan: 0
  }))
  return { id, name, items }
}

export default function AudioDeck() {
  const initial = loadState<AppState>()
  const [state, setState] = useState<AppState>(initial ?? {
    playlists: [createEmptyPlaylist("pl-1", "Playlist 1")],
    activePlaylistId: "pl-1",
    masterVolume: 100,
    muted: false,
    padSize: 'medium',
    showArtIcon: true,
    fadeMs: 300
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const controlsRef = useRef<Array<{ play:()=>void, stop:()=>void, isPlaying:()=>boolean } | null>>([])
  const lastSlotRef = useRef<number | null>(null)

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    let mounted = true
    loadElectronState<AppState>().then(s => { if (mounted && s) setState(s) })
    return () => { mounted = false }
  }, [])

  useEffect(() => { Howler.volume(state.muted ? 0 : state.masterVolume / 100) }, [state.masterVolume, state.muted])

  const active = useMemo(() => state.playlists.find(p => p.id === state.activePlaylistId) ?? null, [state.playlists, state.activePlaylistId])

  function updateItem(idx: number, next: AudioItem) {
    if (!active) return
    const nextItems = active.items.slice()
    nextItems[idx] = next
    setState(s => ({
      ...s,
      playlists: s.playlists.map(p => p.id === active.id ? { ...p, items: nextItems } : p)
    }))
  }

  function onCreatePlaylist() {
    if (state.playlists.length >= 2) return
    const id = `pl-${Date.now()}`
    const p = createEmptyPlaylist(id, `Playlist ${state.playlists.length + 1}`)
    setState(s => ({ ...s, playlists: [...s.playlists, p], activePlaylistId: id }))
  }

  function onRenamePlaylist(id: string, name: string) {
    setState(s => ({ ...s, playlists: s.playlists.map(p => p.id === id ? { ...p, name } : p) }))
  }

  function onDeletePlaylist(id: string) {
    const filtered = state.playlists.filter(p => p.id !== id)
    setState({
      ...state,
      playlists: filtered.length ? filtered : [createEmptyPlaylist("pl-1", "Playlist 1")],
      activePlaylistId: filtered.length ? filtered[0].id : "pl-1"
    })
  }

  function onReset() {
    setState({
      playlists: [createEmptyPlaylist("pl-1", "Playlist 1")],
      activePlaylistId: "pl-1",
      masterVolume: 100,
      muted: false
    })
  }

  return (
    <div className={(state.padSize === 'small' ? 'pad-sm cards-sm' : 'pad-md cards-md')}>
      <div className="header">
        <div className="brand">AudioDeck FREE</div>
        <div className="row" style={{ gap: 8 }}>
          <div className="badge teal">{active ? active.name : "Sem playlist"}</div>
          <button className="tab" onClick={() => setSettingsOpen(v => !v)}>⚙</button>
        </div>
      </div>
      { /* keyboard shortcuts */ }
      {(() => {
        useEffect(() => {
          const onKey = (e: KeyboardEvent) => {
            const key = e.key
            if (key >= '1' && key <= '6') {
              const idx = parseInt(key) - 1
              lastSlotRef.current = idx
              const c = controlsRef.current[idx]
              if (c) { c.isPlaying() ? c.stop() : c.play() }
            } else if (key === ' ') {
              e.preventDefault()
              const idx = lastSlotRef.current ?? 0
              const c = controlsRef.current[idx]
              if (c) { c.isPlaying() ? c.stop() : c.play() }
            }
          }
          window.addEventListener('keydown', onKey)
          return () => window.removeEventListener('keydown', onKey)
        }, [])
        return null
      })()}
      <div className={"overlay" + (settingsOpen ? " show" : "")} onClick={() => setSettingsOpen(false)}></div>
      <aside className={"sidebar" + (settingsOpen ? " open" : "")}> 
        <div className="title">Configurações</div>
        <div className="spacer"></div>
        <div className="settings-section">
          <div className="settings-title">Tamanho</div>
          <div className="spacer"></div>
          <div className="row" style={{ gap: 8 }}>
          <button className={"tab" + (state.padSize === 'small' ? " active" : "")} onClick={() => setState(s => ({ ...s, padSize: 'small' }))}>Pequeno</button>
          <button className={"tab" + (state.padSize === 'medium' ? " active" : "")} onClick={() => setState(s => ({ ...s, padSize: 'medium' }))}>Médio</button>
          </div>
          <div className="spacer"></div>
          <div className="settings-desc">Define o tamanho dos botões e dos cards. Pequeno aumenta a quantidade de colunas; Médio prioriza conforto visual.</div>
        </div>
        <div className="settings-section">
          <div className="settings-title">Ícone de Capa</div>
          <div className="spacer"></div>
          <div className="row" style={{ gap: 8 }}>
          <button className={"tab" + (state.showArtIcon !== false ? " active" : "")} onClick={() => setState(s => ({ ...s, showArtIcon: true }))}>Mostrar Ícone</button>
          <button className={"tab" + (state.showArtIcon === false ? " active" : "")} onClick={() => setState(s => ({ ...s, showArtIcon: false }))}>Ocultar Ícone</button>
          </div>
          <div className="spacer"></div>
          <div className="settings-desc">Exibe ou oculta o ícone de capa dentro de cada card. Útil para foco em controles quando o espaço é reduzido.</div>
        </div>
        <div className="settings-section">
          <div className="settings-title">Transições (Fade)</div>
          <div className="spacer"></div>
          <div className="settings-desc">Define a duração do fade in/out por slot. Recomenda-se entre 200ms e 500ms para transições suaves.</div>
          <div className="spacer"></div>
          <input className="range" type="range" min={200} max={500} value={state.fadeMs ?? 300} onChange={e => setState(s => ({ ...s, fadeMs: parseInt(e.target.value) }))} />
          <div className="small">{state.fadeMs}ms</div>
        </div>
        <div className="settings-section">
          <div className="settings-title">Visual e Acessibilidade</div>
          <div className="spacer"></div>
          <div className="settings-desc">Cada slot usa uma paleta pastel dedicada. Ao tocar, o card recebe gradiente; ao pausar, o card fica amarelo para rápida identificação. As cores dos controles seguem contraste mínimo de 4.5:1.</div>
        </div>
        <div className="settings-section">
          <div className="settings-title">Persistência</div>
          <div className="spacer"></div>
          <div className="settings-desc">As preferências são salvas automaticamente. Em desktop (Electron), ficam em AppData; no navegador, em localStorage.</div>
        </div>
      </aside>
      <PlaylistTabs
        playlists={state.playlists}
        activeId={state.activePlaylistId}
        onSelect={id => setState(s => ({ ...s, activePlaylistId: id }))}
        onCreate={onCreatePlaylist}
        onRename={onRenamePlaylist}
        onDelete={onDeletePlaylist}
      />
      <div className="spacer"></div>
      <MasterControls
        masterVolume={state.masterVolume}
        muted={state.muted}
        onChangeVolume={v => setState(s => ({ ...s, masterVolume: v }))}
        onToggleMute={() => setState(s => ({ ...s, muted: !s.muted }))}
        onReset={onReset}
      />
      <div className="spacer"></div>
      <div className="grid">
        {active?.items.map((it, idx) => (
          <AudioCard
            key={it.id}
            item={it}
            masterVolume={state.muted ? 0 : state.masterVolume}
            onChange={next => updateItem(idx, next)}
            slotIndex={idx}
            showArtIcon={state.showArtIcon !== false}
            fadeMs={state.fadeMs ?? 300}
            onRegisterControls={(controls) => { controlsRef.current[idx] = controls }}
          />
        ))}
      </div>
    </div>
  )
}
