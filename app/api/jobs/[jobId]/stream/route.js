import fs from 'node:fs'
import path from 'node:path'

const JOB_DIR = path.join(process.cwd(), 'storage', 'jobs')

export async function GET(req, { params }) {
  const { jobId } = await params
  if (!jobId || !/^[\w-]+$/.test(jobId)) {
    return new Response('invalid job id', { status: 400 })
  }

  const filePath = path.join(JOB_DIR, `${jobId}.json`)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let lastPayload = ''
      let closed = false

      function send(data) {
        if (closed) return
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        lastPayload = JSON.stringify(data)
      }

      function close() {
        if (closed) return
        closed = true
        controller.close()
      }

      function tick() {
        if (closed) return
        if (!fs.existsSync(filePath)) {
          send({ error: 'not found' })
          close()
          return
        }
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          const payload = JSON.stringify(data)
          if (payload !== lastPayload) send(data)
          if (data.status === 'done' || data.status === 'failed') { close(); return }
        } catch { /* skip malformed write — retry next tick */ }
        setTimeout(tick, 1000)
      }

      tick()
      req.signal.addEventListener('abort', close)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
