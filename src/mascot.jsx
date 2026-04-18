const SRCS = {
  reading:    '/assets/mascot-reading.png',
  whiteboard: '/assets/mascot-whiteboard.png',
  clipboard:  '/assets/mascot-clipboard.png',
  wave:       '/assets/mascot-wave.png',
  plain:      '/assets/mascot-plain.png',
}

export default function Mascot({ variant = 'reading', size = 120, style = {} }) {
  const src = SRCS[variant] ?? SRCS.reading
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{ width: size, height: 'auto', objectFit: 'contain', userSelect: 'none', ...style }}
    />
  )
}
