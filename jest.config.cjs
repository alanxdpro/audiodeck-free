module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
}
