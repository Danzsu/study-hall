const fs = require('fs')
const { PDFParse } = require('pdf-parse')

async function extractPdfText(pdfPath) {
  const data = fs.readFileSync(pdfPath)
  const parser = new PDFParse({ data })

  try {
    const result = await parser.getText()
    return String(result.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim()
  } finally {
    await parser.destroy()
  }
}

module.exports = { extractPdfText }
