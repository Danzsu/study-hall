import './globals.css'

export const metadata = {
  title: 'Study Hall',
  description: 'AI-powered study companion',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
