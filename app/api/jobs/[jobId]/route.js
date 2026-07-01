import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export async function GET(req, { params }) {
  const { jobId } = await params
  if (!jobId || !/^[\w-]+$/.test(jobId)) {
    return NextResponse.json({ error: 'invalid job id' }, { status: 400 })
  }
  const filePath = path.join(process.cwd(), 'storage', 'jobs', `${jobId}.json`)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'failed to read job' }, { status: 500 })
  }
}
