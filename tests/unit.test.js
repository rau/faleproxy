const cheerio = require("cheerio")
const { sampleHtmlWithYale } = require("./test-utils")

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

describe("Yale to Fale replacement logic", () => {
	test("should replace Yale with Fale in text content", () => {
		const $ = cheerio.load(sampleHtmlWithYale)

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

		// Process title and headings separately
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

		const modifiedHtml = $.html()

		// Check text replacements
		expect(modifiedHtml).toContain("Fale University Test Page")
		expect(modifiedHtml).toContain("Welcome to Fale University")
		expect(modifiedHtml).toContain("Fale University is a private Ivy League")
		expect(modifiedHtml).toContain("Fale was founded in 1701")

		// Check that URLs remain unchanged
		expect(modifiedHtml).toContain("https://www.yale.edu/about")
		expect(modifiedHtml).toContain("https://www.yale.edu/admissions")
		expect(modifiedHtml).toContain("https://www.yale.edu/images/logo.png")
		expect(modifiedHtml).toContain("mailto:info@yale.edu")

		// Check href attributes remain unchanged
		expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/about"/)
		expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/admissions"/)

		// Check that link text is replaced
		expect(modifiedHtml).toContain(">About Fale<")
		expect(modifiedHtml).toContain(">Fale Admissions<")

		// Check that alt attributes are not changed
		expect(modifiedHtml).toContain('alt="Yale Logo"')
	})

	test("should handle text that has no Yale references", () => {
		const htmlWithoutYale = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test page with no references.</p>
      </body>
      </html>
    `

		const $ = cheerio.load(htmlWithoutYale)

		// Process all text nodes
		$("*")
			.contents()
			.filter(function () {
				return this.nodeType === 3
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		const modifiedHtml = $.html()

		// Content should remain unchanged since there's no Yale
		expect(modifiedHtml).toContain("<title>Test Page</title>")
		expect(modifiedHtml).toContain("<h1>Hello World</h1>")
		expect(modifiedHtml).toContain("This is a test page with no references")
	})

	test("should handle case-insensitive replacements", () => {
		const mixedCaseHtml = `
      <p>YALE University, Yale College, and yale medical school are all part of the same institution.</p>
    `

		const $ = cheerio.load(mixedCaseHtml)

		// Process all text nodes
		$("*")
			.contents()
			.filter(function () {
				return this.nodeType === 3
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		const modifiedHtml = $.html()

		// Check that case is preserved in replacements
		expect(modifiedHtml).toContain("FALE University")
		expect(modifiedHtml).toContain("Fale College")
		expect(modifiedHtml).toContain("fale medical school")
	})
})
