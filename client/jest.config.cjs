module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleFileExtensions: ["js", "json"],
  transform: {
    "^.+\\.js$": ["babel-jest", {
      presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]]
    }]
  }
};
