const axios = require("axios")
const cheerio = require("cheerio")
const { exec } = require("child_process")
const { promisify } = require("util")
const execAsync = promisify(exec)
const { sampleHtmlWithYale } = require("./test-utils")
const nock = require("nock")
const app = require("../app")

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099
let server

describe("Integration Tests", () => {
	beforeAll(async () => {
		// Mock external HTTP requests but allow localhost
		nock.disableNetConnect()
		nock.enableNetConnect("127.0.0.1")
		nock.enableNetConnect("localhost")

		// Start the server directly
		return new Promise((resolve) => {
			server = app.listen(TEST_PORT, () => {
				console.log(`Test server running on port ${TEST_PORT}`)
				resolve()
			})
		})
	})

	afterEach(() => {
		nock.cleanAll()
	})

	afterAll(async () => {
		// Close the server
		if (server) {
			await new Promise((resolve) => server.close(resolve))
		}
		nock.enableNetConnect()
	})

	test("Should replace Yale with Fale in fetched content", async () => {
		// Setup mock for example.com
		const scope = nock("https://example.com")
			.get("/")
			.reply(200, sampleHtmlWithYale)

		// Make a request to our proxy app
		const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
			url: "https://example.com/",
		})

		expect(response.status).toBe(200)
		expect(response.data.success).toBe(true)

		// Verify Yale has been replaced with Fale in text
		const $ = cheerio.load(response.data.content)
		expect($("title").text()).toBe("Fale University Test Page")
		expect($("h1").text()).toBe("Welcome to Fale University")
		expect($("p").first().text()).toContain("Fale University is a private")

		// Verify URLs remain unchanged
		const links = $("a")
		let hasYaleUrl = false
		links.each((i, link) => {
			const href = $(link).attr("href")
			if (href && href.includes("yale.edu")) {
				hasYaleUrl = true
			}
		})
		expect(hasYaleUrl).toBe(true)

		// Verify link text is changed
		expect($("a").first().text()).toBe("About Fale")

		// Verify that the mock was called
		expect(scope.isDone()).toBe(true)
	}, 10000) // Increase timeout for this test

	test("Should handle invalid URLs", async () => {
		try {
			await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
				url: "not-a-valid-url",
			})
			// Should not reach here
			fail("Expected request to fail")
		} catch (error) {
			expect(error.response?.status).toBe(500)
			expect(error.response?.data?.error).toBe("Invalid URL format")
		}
	})

	test("Should handle missing URL parameter", async () => {
		try {
			await axios.post(`http://localhost:${TEST_PORT}/fetch`, {})
			// Should not reach here
			fail("Expected request to fail")
		} catch (error) {
			expect(error.response?.status).toBe(400)
			expect(error.response?.data?.error).toBe("URL is required")
		}
	})
})
