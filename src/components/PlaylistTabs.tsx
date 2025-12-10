import { Playlist } from "../types"
type Props = {
  playlists: Playlist[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}
export default function PlaylistTabs({ playlists, activeId, onSelect, onCreate, onRename, onDelete }: Props) {
  return (
    <div>
      <div className="tabs">
        {playlists.map(p => (
          <button key={p.id} className={"tab" + (p.id === activeId ? " active" : "")} onClick={() => onSelect(p.id)}>
            {p.name}
          </button>
        ))}
        <button className="tab" onClick={onCreate} disabled={playlists.length >= 2}>Nova</button>
      </div>
      {activeId && (
        <div className="row">
          <div className="badge">Playlists {playlists.length}/2</div>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="Renomear playlist"
              onKeyDown={e => {
                if (e.key === "Enter" && activeId) {
                  const name = (e.target as HTMLInputElement).value.trim()
                  if (name) onRename(activeId, name)
                }
              }}
            />
            <button className="tab" onClick={() => activeId && onDelete(activeId)}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  )
}

