import { notFound } from 'next/navigation'
import { getSubject, getGlossary } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { GlossaryClient } from '@/components/study/GlossaryClient'

interface Props { params: { slug: string } }

export default function GlossaryPage({ params }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const terms = getGlossary(params.slug)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[
        { label: 'Tantárgyak', href: '/' },
        { label: subject.name, href: `/subject/${params.slug}` },
        { label: 'Szójegyzék' },
      ]} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 16px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Szójegyzék</h1>
          <span className="pill pill-muted">{terms.length} fogalom</span>
        </div>
        <GlossaryClient terms={terms} />
      </div>
      <TabBar />
    </div>
  )
}
