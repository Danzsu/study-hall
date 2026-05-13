import './globals.css'
import {
  Fraunces,
  Newsreader,
  Bricolage_Grotesque,
  Caveat,
  JetBrains_Mono,
  Montserrat,
  Archivo_Black,
  Alfa_Slab_One,
} from 'next/font/google'
import { SvgFilters } from '@/src/components/study'

export const metadata = {
  title: 'Study Hall',
  description: 'AI-powered study companion',
}

const fraunces    = Fraunces({    subsets: ['latin', 'latin-ext'], variable: '--font-fraunces',    axes: ['SOFT', 'WONK', 'opsz'], display: 'swap' })
const newsreader  = Newsreader({  subsets: ['latin', 'latin-ext'], variable: '--font-serif',       display: 'swap' })
const bricolage   = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' })
const caveat      = Caveat({      subsets: ['latin', 'latin-ext'], variable: '--font-handwritten', display: 'swap' })
const mono        = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-mono',    display: 'swap' })
const montserrat  = Montserrat({  subsets: ['latin', 'latin-ext'], variable: '--font-montserrat',  weight: '900',  display: 'swap' })
const archivoBlack = Archivo_Black({ subsets: ['latin', 'latin-ext'], variable: '--font-archivo', weight: '400',  display: 'swap' })
const alfaSlabOne  = Alfa_Slab_One({ subsets: ['latin', 'latin-ext'], variable: '--font-alfaslab', weight: '400', display: 'swap' })

export default function RootLayout({ children }) {
  const fontVars = [
    fraunces.variable,
    newsreader.variable,
    bricolage.variable,
    caveat.variable,
    mono.variable,
    montserrat.variable,
    archivoBlack.variable,
    alfaSlabOne.variable,
  ].join(' ')

  return (
    <html lang="hu" className={fontVars}>
      <body>
        <SvgFilters />
        {children}
      </body>
    </html>
  )
}
