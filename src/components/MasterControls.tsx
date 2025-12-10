type Props = {
  masterVolume: number
  muted: boolean
  onChangeVolume: (v: number) => void
  onToggleMute: () => void
  onReset: () => void
}
export default function MasterControls({ masterVolume, muted, onChangeVolume, onToggleMute, onReset }: Props) {
  return (
    <div className="master">
      <div className="title">Master</div>
      <input className="range" type="range" min={0} max={100} value={muted ? 0 : masterVolume} onChange={e => onChangeVolume(parseInt(e.target.value))} />
      <div className="small">{muted ? "Mudo" : `${masterVolume}%`}</div>
      <button className={"tab" + (!muted ? "" : " active")} onClick={onToggleMute}>{muted ? "Desmutar" : "Mutar"}</button>
      <button className="tab" onClick={onReset}>Reset</button>
    </div>
  )
}

