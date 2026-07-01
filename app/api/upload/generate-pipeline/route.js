import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { requireAdmin } from '@/lib/auth-middleware'

export const maxDuration = 10  // Just kick off the job, don't wait for completion

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const configRaw = formData.get('config')

    if (!file || !configRaw) {
      return NextResponse.json({ error: 'file and config required' }, { status: 400 })
    }

    let config
    try { config = JSON.parse(configRaw) } catch {
      return NextResponse.json({ error: 'invalid config JSON' }, { status: 400 })
    }

    const { subjectSlug, subjectName, depth, language, diagramMode, includeImages } = config
    if (!subjectSlug || !/^[a-z0-9_]+$/.test(subjectSlug)) {
      return NextResponse.json({ error: 'invalid subject slug' }, { status: 400 })
    }

    // Save uploaded file
    const uploadDir = path.join(process.cwd(), 'storage', 'subjects', subjectSlug, 'sources')
    await mkdir(uploadDir, { recursive: true })
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Generate job ID
    const jobId = crypto.randomUUID()

    // Spawn Python pipeline (background, detached)
    const pythonArgs = [
      '-m', 'pipeline.orchestrator',
      '--subject', subjectSlug,
      '--name', subjectName || subjectSlug,
      '--input', filePath,
      '--job-id', jobId,
      '--depth', depth || 'exam',
      '--language', language || 'hu',
      '--diagram-mode', diagramMode || 'auto',
      ...(includeImages === false ? ['--no-images'] : []),
    ]

    const jobsDir = path.join(process.cwd(), 'storage', 'jobs')
    await mkdir(jobsDir, { recursive: true })
    const logStream = createWriteStream(path.join(jobsDir, `${jobId}.log`), { flags: 'a' })

    const proc = spawn('python', pythonArgs, {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', logStream, logStream],
    })
    proc.unref()

    return NextResponse.json({ job_id: jobId, status: 'started' })
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 })
  }
}
