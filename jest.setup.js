const { TextEncoder, TextDecoder } = require("util")
const { JSDOM } = require("jsdom")

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost",
	runScripts: "dangerously",
	resources: "usable",
	pretendToBeVisual: true,
})

global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
global.fetch = jest.fn()
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
