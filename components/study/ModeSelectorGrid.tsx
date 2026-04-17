import Link from 'next/link'
import {
  BookOpen, Play, PenLine, RotateCcw, Layers, List, BookMarked,
} from 'lucide-react'

const MODES = [
  {
    key: 'study',
    label: 'Study',
    description: 'Cheat sheets for quiz',
    Icon: BookOpen,
  },
  {
    key: 'quiz',
    label: 'Quiz',
    description: 'Scored · auto-advance',
    Icon: Play,
  },
  {
    key: 'written',
    label: 'Written Test',
    description: 'AI evaluates your answer',
    Icon: PenLine,
  },
  {
    key: 'wrong-answers',
    label: 'Wrong Answers',
    description: 'Practice mistakes',
    Icon: RotateCcw,
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Tap to flip',
    Icon: Layers,
  },
  {
    key: 'glossary',
    label: 'Glossary',
    description: 'Terms & abbreviations',
    Icon: BookMarked,
  },
  {
    key: 'review',
    label: 'Review',
    description: 'Browse all',
    Icon: List,
  },
]

export function ModeSelectorGrid({ slug }: { slug: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {MODES.map(({ key, label, description, Icon }) => (
        <Link key={key} href={`/subject/${slug}/${key}`}>
          <div className="mode-card p-4 flex items-start gap-3">
            <Icon size={18} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-[var(--foreground)]">{label}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
