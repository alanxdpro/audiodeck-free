import { fmtTime } from "../time"

test("formata tempo mm:ss", () => {
  expect(fmtTime(0)).toBe("00:00")
  expect(fmtTime(5)).toBe("00:05")
  expect(fmtTime(65)).toBe("01:05")
  expect(fmtTime(600)).toBe("10:00")
})

