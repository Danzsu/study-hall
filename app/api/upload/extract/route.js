import { verifyIdToken, isAdminEmail } from '@/lib/firebase-admin'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const CHUNK_SIZE = 14000
const OVERLAP = 300

async function requireAdmin(req) {
  const token = req.headers.get('authorization')?.slice(7)
  if (!token) return null
  // Password fallback (when Firebase not configured)
  const adminPw = process.env.ADMIN_PASSWORD
  if (adminPw && token === adminPw) return { email: 'admin', uid: 'local' }
  try {
    const decoded = await verifyIdToken(token)
    return isAdminEmail(decoded.email) ? decoded : null
  } catch {
    return null
  }
}

function detectFileType(fileName, mimeType) {
  const name = (fileName || '').toLowerCase()
  const mime = (mimeType || '').toLowerCase()
  if (name.endsWith('.pdf') || mime.includes('pdf')) return 'pdf'
  if (name.endsWith('.docx') || mime.includes('officedocument.wordprocessingml') || mime.includes('msword')) return 'docx'
  if (name.endsWith('.pptx') || mime.includes('presentationml') || mime.includes('powerpoint')) return 'pptx'
  if (name.endsWith('.md') || mime.includes('markdown')) return 'md'
  if (name.endsWith('.txt') || mime.includes('text/plain')) return 'txt'
  return null
}

async function extractText(arrayBuffer, fileType) {
  switch (fileType) {
    case 'pdf': {
      const pdfParse = (await import('pdf-parse')).default ?? (await import('pdf-parse'))
      const result = await pdfParse(Buffer.from(arrayBuffer))
      return result.text
    }
    case 'docx': {
      const mammoth = (await import('mammoth')).default ?? (await import('mammoth'))
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      return result.value
    }
    case 'pptx': {
      const JSZip = (() => { try { return require('jszip') } catch { return null } })()
      const buf = Buffer.from(arrayBuffer)
      if (JSZip) {
        const zip = await new JSZip().loadAsync(buf)
        const slideFiles = Object.keys(zip.files)
          .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
          .sort((a, b) => a.localeCompare(b))
        const texts = []
        for (const slideFile of slideFiles) {
          const xml = await zip.files[slideFile].async('string')
          const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
          texts.push(matches.map(m => m.replaceAll(/<[^>]+>/g, '')).join(' '))
        }
        return texts.join('\n\n')
      } else {
        // Regex fallback
        const str = buf.toString('latin1')
        const matches = str.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || []
        return matches.map(m => m.replaceAll(/<[^>]+>/g, '')).join(' ')
      }
    }
    case 'md':
    case 'txt':
    default:
      return Buffer.from(arrayBuffer).toString('utf-8')
  }
}

function splitOversized(para, out) {
  let offset = 0
  while (offset < para.length) {
    out.push(para.slice(offset, offset + CHUNK_SIZE))
    offset += CHUNK_SIZE - OVERLAP
  }
}

function appendParagraph(para, chunks, current) {
  if (current.length + para.length + 2 > CHUNK_SIZE && current.length > 0) {
    chunks.push(current)
    return current.slice(-OVERLAP) + '\n\n' + para
  }
  return current ? current + '\n\n' + para : para
}

function chunkText(text) {
  const paragraphs = text.split(/\n\n+/)
  const chunks = []
  let current = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if (trimmed.length > CHUNK_SIZE) {
      if (current.length > 0) { chunks.push(current); current = '' }
      splitOversized(trimmed, chunks)
      continue
    }

    current = appendParagraph(trimmed, chunks, current)
  }

  if (current.trim().length > 0) chunks.push(current)

  return chunks.map((t, index) => ({ index, text: t, charCount: t.length }))
}

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let formData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'file field required' }, { status: 400 })
  }

  const fileName = file.name || 'upload'
  const mimeType = file.type || ''
  const fileType = detectFileType(fileName, mimeType)

  if (!fileType) {
    return Response.json({
      error: 'Unsupported file type. Allowed: pdf, docx, pptx, md, txt',
    }, { status: 415 })
  }

  const arrayBuffer = await file.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    return Response.json({ error: 'File exceeds 20 MB limit' }, { status: 413 })
  }

  let rawText
  try {
    rawText = await extractText(arrayBuffer, fileType)
  } catch (err) {
    console.error('[extract] text extraction failed:', err)
    return Response.json({ error: 'Text extraction failed', detail: err.message }, { status: 502 })
  }

  const chunks = chunkText(rawText)
  const totalChars = rawText.length

  return Response.json({ fileName, fileType, totalChars, chunks })
}
