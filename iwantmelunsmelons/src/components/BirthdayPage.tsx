import { useEffect, useRef, useCallback, useState, type CSSProperties } from 'react'

const BOUNCING_IMAGE_SOURCES = [
  `${import.meta.env.BASE_URL}assets/bouncing-object-1.png`,
  `${import.meta.env.BASE_URL}assets/bouncing-object-2.png`,
  `${import.meta.env.BASE_URL}assets/bouncing-object-3.png`,
  `${import.meta.env.BASE_URL}assets/bouncing-object-4.png`,
]

const FLYING_RECTANGLE_COUNT = 44
const FLYING_RECTANGLES_ON_SCREEN = 4

const CURSOR_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/mouse-cursor.png`
const PRESENT_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/present.png`
const MUSIC_SRC = `${import.meta.env.BASE_URL}assets/dancelounge.mp3`
const NYAN_CAT_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/nyancat.png`

const NYAN_CAT_MIN_DELAY_MS = 5_000
const NYAN_CAT_MAX_DELAY_MS = 6_000
const NYAN_CAT_DURATION_MS = 2_000

const PASTEL_COLORS = [
  '#FFB3C6', '#FFD6A5', '#FDFFB6', '#CAFFBF',
  '#9BF6FF', '#BDB2FF', '#FFC6FF', '#FFADAD',
  '#FFD6FF', '#C3F0CA', '#FFE4B5', '#B5EAD7',
]

const NUM_BALLS = 8
const FRONT_BALLS = 3
const BALL_SIZE = 104
const FRONT_BALL_SIZE = BALL_SIZE * 2
const TOTAL_BALLS = NUM_BALLS + FRONT_BALLS
const CURSOR_RADIUS = 10

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  imageSrc: string
  color: string
  rotation: number
  rotationSpeed: number
  spin: number
  touchingMouse: boolean
  size: number
  mouseInteractive: boolean
  frontLayer: boolean
}

interface FlyingImageItem {
  id: number
  src: string
  fromX: string
  fromY: string
  toX: string
  toY: string
  duration: string
  delay: string
  rotation: string
}

interface NyanCatFlyby {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  rotation: number
  flipY: boolean
  active: boolean
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function getFlyingRectangleSrc(i: number) {
  return `${import.meta.env.BASE_URL}assets/flying-rectangle-${i}.png`
}

function getFlyingRectangleIndexes(slot: number) {
  const start = Math.floor((slot * FLYING_RECTANGLE_COUNT) / FLYING_RECTANGLES_ON_SCREEN) + 1
  const end = Math.max(start, Math.floor(((slot + 1) * FLYING_RECTANGLE_COUNT) / FLYING_RECTANGLES_ON_SCREEN))

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function pickFlyingRectangleSrc(slot: number, currentSrc?: string) {
  const choices = getFlyingRectangleIndexes(slot).map(getFlyingRectangleSrc)
  const filtered = choices.length > 1 && currentSrc ? choices.filter(src => src !== currentSrc) : choices

  return filtered[Math.floor(Math.random() * filtered.length)]
}

function createFlyingImageItems(): FlyingImageItem[] {
  return Array.from({ length: FLYING_RECTANGLES_ON_SCREEN }, (_, i) => {
    const paths = [
      {
        fromX: '-35vw',
        fromY: `${12 + i * 19}vh`,
        toX: '135vw',
        toY: `${18 + i * 13}vh`,
      },
      {
        fromX: '135vw',
        fromY: `${18 + i * 18}vh`,
        toX: '-35vw',
        toY: `${8 + i * 14}vh`,
      },
      {
        fromX: `${12 + i * 22}vw`,
        fromY: '-35vh',
        toX: `${75 - i * 12}vw`,
        toY: '135vh',
      },
      {
        fromX: `${80 - i * 16}vw`,
        fromY: '135vh',
        toX: `${15 + i * 20}vw`,
        toY: '-35vh',
      },
    ]

    return {
      id: i,
      src: pickFlyingRectangleSrc(i),
      ...paths[i % paths.length],
      duration: `${(17 + i * 3) / 2}s`,
      delay: `${i * -2}s`,
      rotation: `${i % 2 === 0 ? -7 : 6}deg`,
    }
  })
}

function createBalls(width: number, height: number): Ball[] {
  return Array.from({ length: TOTAL_BALLS }, (_, i) => {
    const frontLayer = i >= NUM_BALLS
    const size = frontLayer ? FRONT_BALL_SIZE : BALL_SIZE
    const speed = frontLayer ? randomBetween(1.1, 2.1) : randomBetween(2.2, 4.5)
    const angle = Math.random() * Math.PI * 2

    return {
      id: i,
      x: randomBetween(0, Math.max(0, width - size)),
      y: randomBetween(0, Math.max(0, height - size)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      imageSrc: BOUNCING_IMAGE_SOURCES[i % BOUNCING_IMAGE_SOURCES.length],
      color: PASTEL_COLORS[i % PASTEL_COLORS.length],
      rotation: Math.random() * 360,
      rotationSpeed: randomBetween(-2, 2),
      spin: 0,
      touchingMouse: false,
      size,
      mouseInteractive: !frontLayer,
      frontLayer,
    }
  })
}

function createNyanCatFlyby(): NyanCatFlyby {
  const w = window.innerWidth
  const h = window.innerHeight
  const angle = randomBetween(-Math.PI, Math.PI)
  const xDir = Math.cos(angle)
  const yDir = Math.sin(angle)
  const travelDistance = Math.sqrt(w * w + h * h) / 2 + 500
  const rotation = Math.atan2(yDir, xDir) * 180 / Math.PI

  return {
    id: Date.now() + Math.random(),
    fromX: w / 2 - xDir * travelDistance,
    fromY: h / 2 - yDir * travelDistance,
    toX: w / 2 + xDir * travelDistance,
    toY: h / 2 + yDir * travelDistance,
    rotation,
    flipY: rotation > 90 || rotation < -90,
    active: false,
  }
}

export default function BirthdayPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const ballsRef = useRef<Ball[]>([])
  const ballElemsRef = useRef<(HTMLDivElement | null)[]>([])
  const cursorRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const openingStartedRef = useRef(false)
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hidePresentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nyanCatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nyanCatEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nyanCatFrameRef = useRef<number | null>(null)
  const [openingStarted, setOpeningStarted] = useState(false)
  const [presentVisible, setPresentVisible] = useState(true)
  const [celebrationStarted, setCelebrationStarted] = useState(false)
  const [flyingImageItems, setFlyingImageItems] = useState<FlyingImageItem[]>([])
  const [nyanCat, setNyanCat] = useState<NyanCatFlyby | null>(null)

  const changeFlyingImage = useCallback((id: number) => {
    setFlyingImageItems(items => items.map(item => (
      item.id === id
        ? { ...item, src: pickFlyingRectangleSrc(id, item.src) }
        : item
    )))
  }, [])

  const playClickSound = useCallback(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}assets/ringsfx.mp3`)
    audio.volume = 0.45
    void audio.play()
  }, [])

  const startMusic = useCallback(() => {
    const audio = musicRef.current ?? new Audio(MUSIC_SRC)
    musicRef.current = audio
    audio.loop = true
    audio.volume = 0.6

    return audio.play()
  }, [])

  const spawnConfetti = useCallback(() => {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        el.className = 'confetti-piece'
        el.style.left = `${Math.random() * 100}vw`
        el.style.top = '-20px'
        el.style.background = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]
        el.style.width = `${randomBetween(8, 16)}px`
        el.style.height = el.style.width
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
        const duration = randomBetween(2500, 5000)
        el.style.animationDuration = `${duration}ms`
        document.body.appendChild(el)
        setTimeout(() => el.remove(), duration + 100)
      }, i * 80)
    }

    confettiTimerRef.current = setTimeout(spawnConfetti, 6000)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }

      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || openingStartedRef.current) return

      e.preventDefault()
      openingStartedRef.current = true
      setOpeningStarted(true)
      void startMusic().catch(() => {})

      spawnTimerRef.current = setTimeout(() => {
        setFlyingImageItems(createFlyingImageItems())
        setCelebrationStarted(true)
      }, 500)

      hidePresentTimerRef.current = setTimeout(() => {
        setPresentVisible(false)
      }, 1000)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)

      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
      }

      if (hidePresentTimerRef.current) {
        clearTimeout(hidePresentTimerRef.current)
      }
    }
  }, [startMusic])

  useEffect(() => {
    if (!celebrationStarted) return

    function scheduleNyanCat() {
      nyanCatTimerRef.current = setTimeout(() => {
        const nextNyanCat = createNyanCatFlyby()
        setNyanCat(nextNyanCat)

        nyanCatFrameRef.current = requestAnimationFrame(() => {
          nyanCatFrameRef.current = requestAnimationFrame(() => {
            setNyanCat(current => (
              current?.id === nextNyanCat.id
                ? { ...current, active: true }
                : current
            ))
          })
        })

        nyanCatEndTimerRef.current = setTimeout(() => {
          setNyanCat(null)
          scheduleNyanCat()
        }, NYAN_CAT_DURATION_MS + 100)
      }, randomBetween(NYAN_CAT_MIN_DELAY_MS, NYAN_CAT_MAX_DELAY_MS))
    }

    scheduleNyanCat()

    return () => {
      if (nyanCatTimerRef.current) {
        clearTimeout(nyanCatTimerRef.current)
      }

      if (nyanCatEndTimerRef.current) {
        clearTimeout(nyanCatEndTimerRef.current)
      }

      if (nyanCatFrameRef.current !== null) {
        cancelAnimationFrame(nyanCatFrameRef.current)
      }
    }
  }, [celebrationStarted])

  useEffect(() => {
    if (!celebrationStarted) return

    const w = window.innerWidth
    const h = window.innerHeight
    ballsRef.current = createBalls(w, h)

    const sparklesEl = document.querySelector('.sparkles')
    if (sparklesEl) {
      sparklesEl.replaceChildren()

      for (let i = 0; i < 28; i++) {
        const s = document.createElement('div')
        s.className = 'sparkle'
        s.style.left = `${Math.random() * 100}%`
        s.style.width = `${randomBetween(3, 8)}px`
        s.style.height = s.style.width
        s.style.animationDuration = `${randomBetween(4, 10)}s`
        s.style.animationDelay = `${Math.random() * 8}s`
        sparklesEl.appendChild(s)
      }
    }

    spawnConfetti()

    window.addEventListener('pointerdown', playClickSound)

    function animate() {
      const w = window.innerWidth
      const h = window.innerHeight
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      ballsRef.current.forEach((ball, i) => {
        if (ball.mouseInteractive) {
          const dx = ball.x + ball.size / 2 - mx
          const dy = ball.y + ball.size / 2 - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          const isTouchingMouse = dist < CURSOR_RADIUS + ball.size / 2

          if (isTouchingMouse && !ball.touchingMouse) {
            const norm = dist || 1
            const nx = dx / norm
            const ny = dy / norm
            const dot = ball.vx * nx + ball.vy * ny

            if (dot < 0) {
              ball.vx -= 2 * dot * nx
              ball.vy -= 2 * dot * ny
            }

            const overlap = CURSOR_RADIUS + ball.size / 2 - dist
            ball.x += nx * overlap
            ball.y += ny * overlap

            const el = ballElemsRef.current[i]
            if (el) {
              el.classList.add('hit')
              setTimeout(() => el.classList.remove('hit'), 300)
            }
          }

          ball.touchingMouse = isTouchingMouse
        }

        ball.x += ball.vx
        ball.y += ball.vy
        ball.rotation += ball.rotationSpeed

        if (ball.x <= 0) {
          ball.x = 0
          ball.vx = Math.abs(ball.vx)
        }

        if (ball.x + ball.size >= w) {
          ball.x = w - ball.size
          ball.vx = -Math.abs(ball.vx)
        }

        if (ball.y <= 0) {
          ball.y = 0
          ball.vy = Math.abs(ball.vy)
        }

        if (ball.y + ball.size >= h) {
          ball.y = h - ball.size
          ball.vy = -Math.abs(ball.vy)
        }

        const el = ballElemsRef.current[i]
        if (el) {
          el.style.transform = `translate(${ball.x}px, ${ball.y}px) rotate(${ball.rotation}deg)`
        }
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('pointerdown', playClickSound)

      if (confettiTimerRef.current) {
        clearTimeout(confettiTimerRef.current)
      }

      if (sparklesEl) {
        sparklesEl.replaceChildren()
      }

      if (musicRef.current) {
        musicRef.current.pause()
        musicRef.current.currentTime = 0
      }
    }
  }, [celebrationStarted, spawnConfetti, playClickSound])

  return (
    <>
      <div className="birthday-bg" />

      {presentVisible && (
        <div
          className="present-screen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            overflow: 'hidden',
          }}
        >
          <img
            src={PRESENT_IMAGE_SRC}
            alt="Press spacebar to open"
            draggable={false}
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              display: 'block',
              transform: openingStarted ? 'scale(12)' : 'scale(1)',
              opacity: openingStarted ? 0 : 1,
              transition:
                'transform 1s linear, opacity 0.45s linear 0.5s',
              transformOrigin: 'center',
            }}
          />
        </div>
      )}

      {celebrationStarted && (
        <>
          <div className="flying-images" aria-hidden="true">
            {flyingImageItems.map((item) => (
              <img
                key={item.id}
                className="flying-image"
                src={item.src}
                alt=""
                onAnimationIteration={() => changeFlyingImage(item.id)}
                style={{
                  '--fly-from-x': item.fromX,
                  '--fly-from-y': item.fromY,
                  '--fly-to-x': item.toX,
                  '--fly-to-y': item.toY,
                  '--fly-duration': item.duration,
                  '--fly-delay': item.delay,
                  '--fly-rotation': item.rotation,
                } as CSSProperties}
              />
            ))}
          </div>

          <div className="sparkles" />

          <div className="birthday-text">
            <div className="birthday-main">Happy Birthday</div>
            <div className="birthday-main" style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', marginTop: '-0.1em' }}>
              to my beautiful
            </div>
            <div className="birthday-main birthday-name">
              meluhhhhhh
            </div>
            <span className="birthday-hearts">👽 💕 👽</span>
            <div className="birthday-sub">love from your very coool alien boyfriend</div>
          </div>

          <div ref={containerRef} className="balls-container">
            {Array.from({ length: NUM_BALLS }, (_, i) => (
              <div
                key={i}
                ref={el => { ballElemsRef.current[i] = el }}
                className="ball"
                style={{
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  willChange: 'transform',
                }}
              >
                <img
                  className="ball-asset"
                  src={BOUNCING_IMAGE_SOURCES[i % BOUNCING_IMAGE_SOURCES.length]}
                  alt=""
                  draggable={false}
                />
              </div>
            ))}
          </div>

          <div className="front-balls-container" aria-hidden="true">
            {Array.from({ length: FRONT_BALLS }, (_, i) => (
              <div
                key={i}
                ref={el => { ballElemsRef.current[NUM_BALLS + i] = el }}
                className="ball ball-front"
                style={{
                  width: FRONT_BALL_SIZE,
                  height: FRONT_BALL_SIZE,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  willChange: 'transform',
                }}
              >
                <img
                  className="ball-asset"
                  src={BOUNCING_IMAGE_SOURCES[(NUM_BALLS + i) % BOUNCING_IMAGE_SOURCES.length]}
                  alt=""
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {nyanCat && (
            <img
              src={NYAN_CAT_IMAGE_SRC}
              alt=""
              draggable={false}
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1000,
                width: 'clamp(160px, 18vw, 320px)',
                height: 'auto',
                pointerEvents: 'none',
                userSelect: 'none',
                imageRendering: 'pixelated',
                transition: nyanCat.active
                  ? `transform ${NYAN_CAT_DURATION_MS}ms linear`
                  : 'none',
                transform: `
                  translate(-50%, -50%)
                  translate(${nyanCat.active ? nyanCat.toX : nyanCat.fromX}px, ${nyanCat.active ? nyanCat.toY : nyanCat.fromY}px)
                  rotate(${nyanCat.rotation}deg)
                  scaleY(${nyanCat.flipY ? -1 : 1})
                `,
              }}
            />
          )}
        </>
      )}

      <div ref={cursorRef} className="cursor" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
        <img src={CURSOR_IMAGE_SRC} alt="" draggable={false} />
      </div>
    </>
  )
}