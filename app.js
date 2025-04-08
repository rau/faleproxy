const express = require("express")
const axios = require("axios")
const cheerio = require("cheerio")
const path = require("path")

const app = express()
const PORT = 3001

// Middleware to parse request bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

// Route to serve the main page
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Function to replace Yale with Fale while preserving case
function replaceYaleWithFale(text) {
	// Skip if no Yale variants are found
	if (!text.match(/yale|Yale|YALE/i)) {
		return text
	}

	// Replace each case variant separately to preserve case
	return text
		.replace(/YALE(?![^<>]*>)/g, "FALE") // Don't replace inside HTML tags
		.replace(/Yale(?![^<>]*>)/g, "Fale")
		.replace(/yale(?![^<>]*>)/g, "fale")
}

// API endpoint to fetch and modify content
app.post("/fetch", async (req, res) => {
	try {
		const { url } = req.body

		if (!url) {
			return res.status(400).json({ error: "URL is required" })
		}

		// Validate URL format
		try {
			new URL(url)
		} catch (error) {
			return res.status(500).json({ error: "Invalid URL format" })
		}

		// Fetch the content from the provided URL
		const response = await axios.get(url)
		const html = response.data

		// Use cheerio to parse HTML and selectively replace text content
		const $ = cheerio.load(html)

		// Process all text nodes
		$("*")
			.contents()
			.filter(function () {
				return this.nodeType === 3 // Text nodes only
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		// Process title and headings separately to ensure complete replacement
		$("title, h1, h2, h3, h4, h5, h6").each(function () {
			const text = $(this).text()
			const newText = replaceYaleWithFale(text)
			if (text !== newText) {
				$(this).text(newText)
			}
		})

		// Process link text but preserve URLs
		$("a").each(function () {
			const text = $(this).text()
			const newText = replaceYaleWithFale(text)
			if (text !== newText) {
				$(this).text(newText)
			}

			// Preserve href attributes
			const href = $(this).attr("href")
			if (href) {
				$(this).attr("href", href)
			}
		})

		return res.json({
			success: true,
			content: $.html(),
			title: $("title").text(),
			originalUrl: url,
		})
	} catch (error) {
		console.error("Error fetching URL:", error.message)
		return res.status(500).json({
			error: `Failed to fetch content: ${error.message}`,
		})
	}
})

// Export for testing
module.exports = app

// Start the server if not being required as a module
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Faleproxy server running at http://localhost:${PORT}`)
	})
}
