/**
 * @jest-environment jsdom
 */

describe("Frontend JavaScript", () => {
	beforeEach(() => {
		// Set up the DOM
		document.body.innerHTML = `
            <form id="url-form">
                <input id="url-input" type="text">
                <button type="submit">Submit</button>
            </form>
            <div id="loading" class="hidden">Loading...</div>
            <div id="error-message" class="hidden"></div>
            <div id="result-container" class="hidden">
                <a id="original-url" href=""></a>
                <h2 id="page-title"></h2>
                <div id="content-display"></div>
            </div>
        `

		// Mock fetch
		global.fetch = jest.fn()

		// Load and execute the script
		require("../public/script.js")

		// Trigger DOMContentLoaded
		document.dispatchEvent(new Event("DOMContentLoaded"))
	})

	afterEach(() => {
		jest.resetAllMocks()
		document.body.innerHTML = ""
		jest.restoreAllMocks()
	})

	test("form submission with empty URL shows error", () => {
		// Get form elements
		const form = document.getElementById("url-form")
		const urlInput = document.getElementById("url-input")
		const errorMessage = document.getElementById("error-message")

		// Submit form with empty URL
		urlInput.value = ""
		form.dispatchEvent(new Event("submit"))

		// Check error message
		expect(errorMessage.textContent).toBe("Please enter a valid URL")
		expect(errorMessage.classList.contains("hidden")).toBe(false)
	})

	test("successful form submission updates UI", async () => {
		// Mock successful fetch response
		global.fetch.mockImplementationOnce(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						title: "Test Title",
						content: "<html><body><h1>Test Content</h1></body></html>",
					}),
			})
		)

		// Get form elements
		const form = document.getElementById("url-form")
		const urlInput = document.getElementById("url-input")
		const resultContainer = document.getElementById("result-container")
		const pageTitle = document.getElementById("page-title")
		const originalUrl = document.getElementById("original-url")

		// Submit form with valid URL
		urlInput.value = "https://example.com"
		form.dispatchEvent(new Event("submit"))

		// Wait for async operations
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Check UI updates
		expect(resultContainer.classList.contains("hidden")).toBe(false)
		expect(pageTitle.textContent).toBe("Test Title")
		expect(originalUrl.href).toBe("https://example.com/")
		expect(originalUrl.textContent).toBe("https://example.com")

		// Get the iframe and trigger onload
		const iframe = document.querySelector("iframe")
		const iframeDocument = iframe.contentDocument

		// Set up the iframe document
		iframeDocument.write(
			'<html><body><a href="test">Test Link</a></body></html>'
		)
		iframeDocument.close()

		// Mock scrollHeight
		Object.defineProperty(iframeDocument.body, "scrollHeight", {
			configurable: true,
			value: 500,
		})

		// Trigger onload
		iframe.onload()

		// Check iframe updates
		expect(iframe.style.height).toBe("500px")
		const iframeLink = iframeDocument.querySelector("a")
		expect(iframeLink.target).toBe("_blank")
		expect(iframeLink.rel).toBe("noopener noreferrer")
	})

	test("failed fetch shows error message", async () => {
		// Mock failed fetch response
		global.fetch.mockImplementationOnce(() =>
			Promise.resolve({
				ok: false,
				json: () => Promise.resolve({ error: "Failed to fetch content" }),
			})
		)

		// Get form elements
		const form = document.getElementById("url-form")
		const urlInput = document.getElementById("url-input")
		const errorMessage = document.getElementById("error-message")

		// Submit form with valid URL
		urlInput.value = "https://example.com"
		form.dispatchEvent(new Event("submit"))

		// Wait for async operations
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Check error message
		expect(errorMessage.textContent).toBe("Failed to fetch content")
		expect(errorMessage.classList.contains("hidden")).toBe(false)
	})
})
