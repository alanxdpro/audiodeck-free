import { render, fireEvent, waitFor } from "@testing-library/react"
import AudioCard from "../AudioCard"

jest.mock("howler", () => {
  let seekPos = 0
  let isPlaying = false
  const handlers: Record<string, Function[]> = {}
  class MockHowl {
    _sounds = [{ _node: { connect: () => {} } }]
    _duration = 120
    _loop = false
    _volume = 1
    constructor(_opts: any) {}
    once(evt: string, cb: Function) { cb() }
    on(evt: string, cb: Function) { (handlers[evt] ||= []).push(cb) }
    duration() { return this._duration }
    play() { isPlaying = true }
    pause() { isPlaying = false }
    stop() { isPlaying = false; seekPos = 0 }
    seek(v?: number) { if (typeof v === "number") seekPos = v; return seekPos }
    loop(v?: boolean) { if (typeof v === "boolean") this._loop = v; return this._loop }
    volume(v?: number) { if (typeof v === "number") this._volume = v; return this._volume }
    stereo(_v?: number) {}
    fade(_from: number, _to: number, _ms: number) {}
    unload() {}
  }
  return { Howl: MockHowl, Howler: { volume: () => {}, ctx: { createAnalyser: () => ({ fftSize: 512, smoothingTimeConstant: 0.8, getFloatTimeDomainData: () => {} }) } } }
})

global.URL.createObjectURL = () => "blob:test"

const item = { id: "t-1", name: "Teste", loop: false, volume: 100, pan: 0, url: "blob:test" }

test("play/pause/seek altera estados", async () => {
  const { getByText, container } = render(
    <AudioCard
      item={item}
      onChange={() => {}}
      masterVolume={100}
      slotIndex={0}
      showArtIcon={true}
      fadeMs={300}
      onRegisterControls={() => {}}
    />
  )

  // item já possui URL, então não precisamos fazer upload no teste

  const play = getByText("▶")
  const pause = getByText("⏸")
  const stop = getByText("⏹")

  fireEvent.click(play)
  await waitFor(() => expect(container.querySelector(".card.playing")).toBeTruthy())

  fireEvent.click(pause)
  await waitFor(() => expect(container.querySelector(".card.playing")).toBeFalsy())

  fireEvent.click(play)
  const range = container.querySelector("input[type=range]") as HTMLInputElement
  fireEvent.change(range, { target: { value: "30" } })
  expect(range.value).toBe("30")

  fireEvent.click(stop)
  await waitFor(() => expect(container.querySelector(".card.playing")).toBeFalsy())
})
