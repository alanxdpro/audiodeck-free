import { useEffect, useRef, useState } from "react"
import { Howl, Howler } from "howler"
import { AudioItem } from "../types"
import { fmtTime } from "../lib/time"
import { generateHarmonicPalette, pickAccessibleTextColor } from "../lib/colors"

type Props = {
  item: AudioItem
  onChange: (next: AudioItem) => void
  masterVolume: number
  slotIndex: number
  showArtIcon: boolean
  fadeMs: number
  onRegisterControls: (c: { play:()=>void, stop:()=>void, isPlaying:()=>boolean }) => void
}

export default function AudioCard({ item, onChange, masterVolume, slotIndex, showArtIcon, fadeMs, onRegisterControls }: Props) {
  const howlRef = useRef<typeof Howl | null>(null)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [peak, setPeak] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufferRef = useRef<Uint8Array | null>(null)
  const paletteRef = useRef<string[] | null>(null)
  const textColorsRef = useRef<string[] | null>(null)
  const [rmsDb, setRmsDb] = useState(-60)
  const [peakDb, setPeakDb] = useState(-60)

  useEffect(() => { Howler.volume(masterVolume / 100) }, [masterVolume])

  useEffect(() => {
    if (!item.url) return
    const fmt = (() => {
      if (item.mime?.includes('wav') || /\.wav$/i.test(item.name)) return 'wav'
      return 'mp3'
    })()
    const h = new Howl({ src: [item.url], format: [fmt], loop: item.loop, volume: item.volume / 100 })
    howlRef.current = h
    h.once("load", () => setDuration(Math.round(h.duration())))
    h.on("end", () => setPlaying(false))
    try {
      const ctx = (Howler as any).ctx as AudioContext | undefined
      if (ctx) {
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.8
        analyserRef.current = analyser
        bufferRef.current = new Uint8Array(analyser.frequencyBinCount)
        const sound = (h as any)._sounds?.[0]
        const node: AudioNode | undefined = sound?._node
        if (node && typeof (node as any).connect === "function") {
          try { (node as any).connect(analyser) } catch {}
        }
      }
    } catch {}
    return () => { h.unload(); howlRef.current = null }
  }, [item.url])

  useEffect(() => {
    if (!paletteRef.current) {
      const palette = generateHarmonicPalette(4)
      paletteRef.current = palette
      textColorsRef.current = palette.map(p => pickAccessibleTextColor(p))
    }
  }, [])

  useEffect(() => { onRegisterControls({ play, stop, isPlaying: () => playing }) }, [onRegisterControls, play, stop, playing])

  useEffect(() => {
    const h = howlRef.current
    if (!h) return
    h.loop(item.loop)
    h.volume(item.volume / 100)
    h.stereo(item.pan)
  }, [item.loop, item.volume, item.pan])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const h = howlRef.current
      if (h && playing) {
        setCurrent(Math.floor(h.seek() as number))
        const analyser = analyserRef.current
        if (analyser) {
          const floatBuf = new Float32Array(analyser.fftSize)
          try { analyser.getFloatTimeDomainData(floatBuf) } catch {}
          let sumSq = 0
          let maxAbs = 0
          for (let i = 0; i < floatBuf.length; i++) {
            const s = floatBuf[i]
            sumSq += s * s
            const a = Math.abs(s)
            if (a > maxAbs) maxAbs = a
          }
          const rms = Math.sqrt(sumSq / floatBuf.length)
          const rmsDbCalc = rms > 0 ? 20 * Math.log10(rms) : -Infinity
          const peakDbCalc = maxAbs > 0 ? 20 * Math.log10(maxAbs) : -Infinity
          setRmsDb(Math.max(-60, Math.min(0, rmsDbCalc)))
          setPeakDb(Math.max(-60, Math.min(0, peakDbCalc)))
          const pctPeak = Math.min(100, Math.max(0, Math.round((Math.max(-60, peakDbCalc) + 60) / 60 * 100)))
          setPeak(pctPeak)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  function play() {
    const h = howlRef.current; if (!h) return
    h.volume(0)
    h.play()
    h.fade(0, item.volume / 100, fadeMs)
    setPlaying(true); setPaused(false)
  }
  useEffect(() => {
    const ctx = (Howler as any).ctx as AudioContext | undefined
    if (playing && ctx && ctx.state === 'suspended') { ctx.resume().catch(() => {}) }
  }, [playing])
  function pause() { const h = howlRef.current; if (!h) return; h.pause(); setPlaying(false); setPaused(true) }
  function stop() {
    const h = howlRef.current; if (!h) return
    const from = h.volume()
    h.fade(from, 0, fadeMs)
    setTimeout(() => { h.stop(); setPlaying(false); setPaused(false); setCurrent(0) }, fadeMs)
  }

  function onUpload(file: File) {
    const valid = /audio\/(mpeg|wav)/.test(file.type) || /\.(mp3|wav)$/i.test(file.name)
    if (!valid) return
    const url = URL.createObjectURL(file)
    onChange({ ...item, name: file.name, url, mime: file.type })
  }

  return (
    <div className={"card slot-" + slotIndex + (playing ? " playing" : "") + (paused ? " paused" : "")}> 
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="title">{item.name || "Slot vazio"}</div>
        <svg className="wave teal" viewBox="0 0 24 24"><path d="M3 12h2M7 8v8M11 4v16M15 8v8M19 12h2"/></svg>
      </div>
      <div className="spacer"></div>
      {showArtIcon && (
        <div className="artbox">
          <svg className="articon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 3v12.26A3 3 0 1 0 11 18V8h7V3H9z"/></svg>
        </div>
      )}
      <div className="spacer"></div>
      <div className="row controls">
        <label className="tab" htmlFor={"file-"+item.id}>Upload</label>
        <input id={"file-"+item.id} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" style={{ display:"none" }} onChange={e => e.target.files && onUpload(e.target.files[0])} />
        <button
          className={"pad" + (playing ? " active" : "")}
          style={playing && paletteRef.current ? { background: paletteRef.current[0], color: textColorsRef.current![0], borderColor: paletteRef.current[0] } : undefined}
          onClick={play}
        >▶</button>
        <button
          className={"pad pause" + (!playing && current > 0 ? " paused" : "")}
          onClick={pause}
        >⏸</button>
        <button
          className="pad"
          style={paletteRef.current ? { transition:"background .3s ease, color .3s ease" } : undefined}
          onClick={stop}
        >⏹</button>
        <button
          className={"pad" + (item.loop ? " active" : "")}
          style={item.loop && paletteRef.current ? { background: paletteRef.current[1], color: textColorsRef.current![1], borderColor: paletteRef.current[1] } : undefined}
          onClick={() => onChange({ ...item, loop: !item.loop })}
        >∞</button>
      </div>
      <div className="spacer"></div>
      <div className="progress">
        <input className="range" type="range" min={0} max={Math.max(duration, 1)} value={current} onChange={e => {
          const h = howlRef.current
          if (!h) return
          const t = parseInt(e.target.value)
          h.seek(t)
          setCurrent(t)
        }} />
        <div className="small">{fmtTime(current)} / {fmtTime(duration)}</div>
      </div>
      <div className="spacer"></div>
      <div className="row volume">
        <div className="label">Vol</div>
        <input className="range" type="range" min={0} max={100} value={item.volume} onChange={e => onChange({ ...item, volume: parseInt(e.target.value) })} />
        <div className="small">{item.volume}%</div>
      </div>
      <div className="spacer"></div>
      <div className="row pan">
        <div className="label">Pan</div>
        <input className="range" type="range" min={-1} max={1} step={0.1} value={item.pan} onChange={e => onChange({ ...item, pan: parseFloat(e.target.value) })} />
        <div className="small">{item.pan < 0 ? "L" : item.pan > 0 ? "R" : "C"}</div>
      </div>
      <div className="spacer"></div>
      <div className="meter">
        <span className="rms" style={{ width: playing ? `${Math.round((Math.max(-60, rmsDb) + 60) / 60 * 100)}%` : "0%" }}></span>
        <span className="peak" style={{ transform: playing ? `translateX(${Math.round((Math.max(-60, peakDb) + 60) / 60 * 100)}%)` : "translateX(0%)" }}></span>
      </div>
    </div>
  )
}
