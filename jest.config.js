module.exports = {
	testEnvironment: "node",
	collectCoverageFrom: [
		"**/*.js",
		"!**/node_modules/**",
		"!**/coverage/**",
		"!jest.config.js",
		"!jest.setup.js",
	],
	coverageThreshold: {
		global: {
			statements: 70,
			branches: 70,
			functions: 70,
			lines: 70,
		},
	},
}
