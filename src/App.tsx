import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type StepId = 'intro' | 'grounding' | 'breath' | 'reflect' | 'calm' | 'growth'

type Step = {
  id: StepId
  label: string
  subtitle: string
  body: string
}

const COLOR_OPTIONS = [
  { name: 'Kabut Pagi', hex: '#d4e4f7' },
  { name: 'Langit Senja', hex: '#ffd6d9' },
  { name: 'Teh Hangat', hex: '#f5e1c8' },
  { name: 'Hutan Tenang', hex: '#b7d5c4' },
  { name: 'Lavender', hex: '#e4d7ff' },
  { name: 'Karang', hex: '#f5c8c5' },
  { name: 'Ombak', hex: '#c2e3ff' },
  { name: 'Tanah Liat', hex: '#e9d3b5' },
  { name: 'Mawar Pucat', hex: '#f9e0e5' },
  { name: 'Mint', hex: '#d9f2e7' },
] as const

const REFLECTION_PROMPTS = [
  'Bagaimana keadaanmu saat ini?',
  'Apa perasaan yang paling dominan detik ini?',
  'Apa yang sedang kamu bawa hari ini?',
  'Bagian mana dari tubuhmu yang terasa tegang?',
  'Apa pikiran yang berulang sejak pagi?',
  'Jika suasana hatimu adalah cuaca, cuaca apa itu?',
  'Apa hal kecil yang kamu butuhkan sekarang?',
  'Apa yang membuat hari ini berat?',
  'Apa yang ingin kamu lepaskan malam ini?',
  'Jika emosimu bisa berbicara, apa yang ia katakan?',
]

const AUDIO_OPTIONS = [
  {
    id: 'droplet',
    label: 'Tetes Air',
    icon: '💧',
    url: '/audio/dripping-water-in-cave-114694.mp3',
  },
  {
    id: 'bell',
    label: 'Lonceng',
    icon: '🔔',
    url: '/audio/bellding-254774.mp3',
  },
  {
    id: 'wind',
    label: 'Hembusan Angin',
    icon: '〰️',
    url: '/audio/smooth-cold-wind-looped-135538.mp3',
  },
  {
    id: 'leaves',
    label: 'Bisik Daun',
    icon: '🍃',
    url: '/audio/leaves-rustling-236742.mp3',
  },
] as const

const TEXTURE_CARDS = [
  {
    id: 'rough',
    label: 'Kasar Batu',
    description: 'Bayangkan jemarimu menyentuh permukaan batu bertekstur.',
    image:
      'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTZERpmf2fpMVyoT2lPRHUq_csy7Q6pKZs7iVJG_IbhwHx3balvxFko1A8Xo6sU',
  },
  {
    id: 'smooth',
    label: 'Halus Bersih',
    description: 'Rasakan licinnya permukaan tekstil yang halus.',
    image:
      'https://images.unsplash.com/photo-1594734415578-00fc9540929b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aGFsdXN8ZW58MHx8MHx8fDA%3D',
  },
  {
    id: 'soft',
    label: 'Lembut Manis',
    description: 'Bayangkan tekstur marshmallow empuk yang mudah ditekan.',
    image:
      'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcRwhg9hhTS2z6PuKZCjnveuXiHWchTyTgB-HSF0lJ16wnXHoVDhrlxA246jounrF5XObzEVswfoLhrerbzcNxX_CjgMclygjUIGsGCNPlcaY42O1zU',
  },
] as const

const PUZZLE_PIECES = [
  {
    id: 'sphere',
    label: 'Cahaya Lingkaran',
    targetId: 'orbit',
    image:
      'https://images.unsplash.com/photo-1648822850822-7b290212427d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGNhaGF5YSUyMGxpbmdrYXJhbnxlbnwwfHwwfHx8MA%3D%3D',
  },
  {
    id: 'leaf',
    label: 'Daun Terapung',
    targetId: 'nature',
    image:
      'https://images.unsplash.com/photo-1649100245792-1e958b3541c2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZGF1biUyMHRlcmFwdW5nfGVufDB8fDB8fHww',
  },
  {
    id: 'wave',
    label: 'Gelombang Halus',
    targetId: 'water',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'stone',
    label: 'Batu Teratur',
    targetId: 'balance',
    image:
      'https://plus.unsplash.com/premium_photo-1675373033451-23abc8318d5d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmF0dSUyMHRlcmF0dXJ8ZW58MHx8MHx8fDA%3D',
  },
  {
    id: 'petal',
    label: 'Kelopak Lembut',
    targetId: 'bloom',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80',
  },
] as const

const PUZZLE_TARGETS = [
  {
    id: 'orbit',
    label: 'Orbit Lembut',
    hint: 'Tempatkan cahaya bundar di sini.',
  },
  {
    id: 'nature',
    label: 'Kanopi Tenang',
    hint: 'Daun tenang akan cocok di sini.',
  },
  {
    id: 'water',
    label: 'Arus Pelan',
    hint: 'Gelombang air menyatu di area ini.',
  },
  {
    id: 'balance',
    label: 'Keseimbangan Batu',
    hint: 'Susun batu rapi untuk stabil.',
  },
  {
    id: 'bloom',
    label: 'Mekar Hening',
    hint: 'Kelopak lembut membutuhkan ruangnya.',
  },
] as const

const steps: Step[] = [
  {
    id: 'intro',
    label: 'Step 1',
    subtitle: 'Release',
    body:
      'Mulai dengan memberi izin kepada diri sendiri untuk melambat. Hening Steps menghadirkan perjalanan enam tahap yang lembut agar emosi mereda secara bertahap tanpa penilaian.',
  },
  {
    id: 'grounding',
    label: 'Step 2',
    subtitle: 'Grounding',
    body:
      'Permainan sensorik 5-4-3-5-1: memindahkan objek, memilih suara, menyentuh tekstur, meracik warna, dan mengetuk simbol tenang untuk menurunkan intensitas emosi.',
  },
  {
    id: 'breath',
    label: 'Step 3',
    subtitle: 'Breathing',
    body:
      'Ikuti animasi lingkaran untuk mengatur napas 3-1-5. Pernapasan lambat mengaktifkan respon relaksasi dan menurunkan ketegangan fisik.',
  },
  {
    id: 'reflect',
    label: 'Step 4',
    subtitle: 'Reflect',
    body:
      'Jawab beberapa pertanyaan refleksi sederhana. Menulis membantu menyadari emosi tanpa harus mengubahnya secara paksa.',
  },
  {
    id: 'calm',
    label: 'Step 5',
    subtitle: 'Calm Lines',
    body:
      'Gerakkan jari atau kursor untuk membuat pola lembut seperti pasir. Gerakan repetitif menenangkan pikiran yang gelisah.',
  },
  {
    id: 'growth',
    label: 'Step 6',
    subtitle: 'Growth Tree',
    body:
      'Akhiri perjalanan dengan penutup positif. Pohon kecil yang tumbuh mengingatkan bahwa ketenangan datang dari praktik rutin.',
  },
]

function App() {
  const [showOpening, setShowOpening] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [breathPhase, setBreathPhase] = useState('Tarik napas 3 detik')
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioSamplesRef = useRef<Record<string, HTMLAudioElement>>({})
  const calmCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const reflectionPrompts = useMemo(() => {
    const clone = [...REFLECTION_PROMPTS]
    return clone.sort(() => Math.random() - 0.5).slice(0, 3)
  }, [])
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [growthReady, setGrowthReady] = useState(false)
  const [leavesGrown, setLeavesGrown] = useState(0)
  const [currentAffirmation, setCurrentAffirmation] = useState('')
  const [puzzlePlacement, setPuzzlePlacement] = useState<Record<string, string | null>>(
    () =>
      Object.fromEntries(
        PUZZLE_TARGETS.map((target) => [target.id, null])
      )
  )
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null)
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const draggedPieceRef = useRef<HTMLDivElement | null>(null)
  const isTouchDevice = useMemo(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])
  const [selectedAudios, setSelectedAudios] = useState<string[]>([])
  const [touchedTextures, setTouchedTextures] = useState<string[]>([])
  const [symbolTapped, setSymbolTapped] = useState(false)
  const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set())
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; speedX: number; speedY: number }>>([])
  const bubbleContainerRef = useRef<HTMLDivElement | null>(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [activeTexture3D, setActiveTexture3D] = useState<string | null>(null)

  useEffect(() => {
    const phases = [
      { label: 'Tarik napas 3 detik', duration: 3000 },
      { label: 'Tahan 1 detik', duration: 1000 },
      { label: 'Hembuskan 5 detik', duration: 5000 },
    ]
    let index = 0
    setBreathPhase(phases[index].label)
    let timer = setTimeout(function cycle() {
      index = (index + 1) % phases.length
      setBreathPhase(phases[index].label)
      timer = setTimeout(cycle, phases[index].duration)
    }, phases[index].duration)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Only initialize and control audio when on breath step
    const isBreathStep = steps[stepIndex].id === 'breath'
    
    // Initialize audio if not exists
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/smooth-cold-wind-looped-135538.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.25
      audioRef.current.preload = 'auto'
      
      // Set up error handling
      audioRef.current.addEventListener('error', (e) => {
        console.error('Wind audio error:', e)
        setSoundOn(false)
      })
      
      // Set up load event
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Wind audio ready to play')
      }, { once: true })
    }

    // Control audio based on step and soundOn state
    if (!isBreathStep) {
      // Stop audio if we're not on breath step
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      return
    }

    // On breath step: play or pause based on soundOn state
    if (soundOn && isBreathStep) {
      // Play audio when soundOn is true and we're on breath step
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Wind audio playing')
          })
          .catch((err) => {
            console.error('Wind audio play failed:', err)
            setSoundOn(false)
          })
      }
    } else {
      // Pause audio when soundOn is false
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }

    // Cleanup: pause audio when component unmounts or step changes
    return () => {
      if (audioRef.current && !isBreathStep) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [soundOn, stepIndex])

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }, [stepIndex])

  // Global touch handlers for drag
  useEffect(() => {
    if (!draggingPiece || !isTouchDevice) return

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!draggingPiece || !dragOffset) return
      
      const touch = e.touches[0]
      
      if (draggedPieceRef.current) {
        draggedPieceRef.current.style.position = 'fixed'
        draggedPieceRef.current.style.left = `${touch.clientX + dragOffset.x}px`
        draggedPieceRef.current.style.top = `${touch.clientY + dragOffset.y}px`
        draggedPieceRef.current.style.zIndex = '1000'
        draggedPieceRef.current.style.pointerEvents = 'none'
      }
    }

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!draggingPiece) return
      
      const touch = e.changedTouches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      const targetElement = element?.closest('[data-target-id]') as HTMLElement
      const targetId = targetElement?.getAttribute('data-target-id')
      
      if (targetId && draggingPiece) {
        const piece = PUZZLE_PIECES.find((item) => item.id === draggingPiece)
        if (piece && piece.targetId === targetId) {
          setPuzzlePlacement((prev) => {
            const next: Record<string, string | null> = { ...prev }
            Object.keys(next).forEach((key) => {
              if (next[key] === draggingPiece) {
                next[key] = null
              }
            })
            next[targetId] = draggingPiece
            return next
          })
        }
      }
      
      if (draggedPieceRef.current) {
        draggedPieceRef.current.style.position = ''
        draggedPieceRef.current.style.left = ''
        draggedPieceRef.current.style.top = ''
        draggedPieceRef.current.style.zIndex = ''
        draggedPieceRef.current.style.pointerEvents = ''
      }
      
      setDraggingPiece(null)
      setDragOffset(null)
      setSelectedPiece(null)
    }

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [draggingPiece, dragOffset, isTouchDevice])

  // Handle scroll indicator
  useEffect(() => {
    if (!showScrollIndicator || hasScrolled) return

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHasScrolled(true)
        setShowScrollIndicator(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Hide indicator after 5 seconds
    const timeout = setTimeout(() => {
      setShowScrollIndicator(false)
    }, 5000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [showScrollIndicator, hasScrolled])

  // Show scroll indicator when step changes and user is at top
  useEffect(() => {
    // Reset scroll state when step changes
    setHasScrolled(false)
    
    // Check if user is at top of page
    const checkScrollPosition = () => {
      if (window.scrollY < 50) {
        setShowScrollIndicator(true)
      } else {
        setShowScrollIndicator(false)
      }
    }
    
    // Wait for auto-scroll to complete, then check position
    const timeouts: ReturnType<typeof setTimeout>[] = []
    
    // Check after multiple delays to catch scroll completion
    timeouts.push(setTimeout(checkScrollPosition, 100))
    timeouts.push(setTimeout(checkScrollPosition, 500))
    timeouts.push(setTimeout(checkScrollPosition, 1000))
    
    // Also listen for scroll end
    let scrollTimeout: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        checkScrollPosition()
      }, 150)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      timeouts.forEach(clearTimeout)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [stepIndex])

  const paintCanvasBase = useCallback(() => {
    const canvas = calmCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const ratio = window.devicePixelRatio || 1
    const { offsetWidth, offsetHeight } = canvas
    canvas.width = offsetWidth * ratio
    canvas.height = offsetHeight * ratio
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(ratio, ratio)
    ctx.fillStyle = '#f9f5ef'
    ctx.fillRect(0, 0, offsetWidth, offsetHeight)
  }, [])

  useEffect(() => {
    paintCanvasBase()
    window.addEventListener('resize', paintCanvasBase)
    return () => window.removeEventListener('resize', paintCanvasBase)
  }, [paintCanvasBase])

  useEffect(() => {
    if (steps[stepIndex].id === 'growth') {
      setGrowthReady(true)
      setLeavesGrown(0)
      setCurrentAffirmation('')
      
      // Grow leaves one by one with delay (slower animation)
      const leafDelays = [2000, 4500, 7000] // Delay for each leaf in ms (slower)
      const affirmations = [
        'Terima kasih sudah menyelesaikan perjalanan hari ini.',
        'Perubahan kecil tetap berarti.',
        'Terima kasih telah hadir untuk dirimu sendiri.',
      ]
      
      leafDelays.forEach((delay, index) => {
        setTimeout(() => {
          setLeavesGrown(index + 1)
          setCurrentAffirmation(affirmations[index])
          
          // Clear affirmation after 4 seconds (slower)
          setTimeout(() => {
            setCurrentAffirmation('')
          }, 4000)
        }, delay)
      })
    } else {
      // Reset when leaving growth step
      setGrowthReady(false)
      setLeavesGrown(0)
      setCurrentAffirmation('')
    }
  }, [stepIndex])

  // Initialize bubbles for release step
  useEffect(() => {
    if (steps[stepIndex].id === 'intro') {
      // Reset popped bubbles
      setPoppedBubbles(new Set())
      
      // Create bubbles with random positions and sizes
      const bubbleCount = 12
      const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 70 + 10, // 10-80%
        size: Math.random() * 30 + 30, // 50px
        speedX: (Math.random() - 0.5) * 0.5, // -0.25 to 0.25
        speedY: (Math.random() - 0.5) * 0.5, // -0.25 to 0.25
      }))
      setBubbles(newBubbles)
    } else {
      // Clear bubbles when leaving intro step
      setBubbles([])
      setPoppedBubbles(new Set())
    }
  }, [stepIndex])

  // Animate bubbles movement
  useEffect(() => {
    if (bubbles.length === 0 || steps[stepIndex].id !== 'intro') return

    const interval = setInterval(() => {
      setBubbles((prevBubbles) => {
        return prevBubbles.map((bubble) => {
          if (poppedBubbles.has(bubble.id)) return bubble

          let newX = bubble.x + bubble.speedX
          let newY = bubble.y + bubble.speedY
          let newSpeedX = bubble.speedX
          let newSpeedY = bubble.speedY

          // Bounce off walls
          if (newX <= 5 || newX >= 95) {
            newSpeedX = -newSpeedX
            newX = Math.max(5, Math.min(95, newX))
          }
          if (newY <= 5 || newY >= 85) {
            newSpeedY = -newSpeedY
            newY = Math.max(5, Math.min(85, newY))
          }

          return {
            ...bubble,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
          }
        })
      })
    }, 50) // Update every 50ms for smooth animation

    return () => clearInterval(interval)
  }, [bubbles.length, stepIndex, poppedBubbles])

  // Preload audio samples when grounding step is active
  useEffect(() => {
    if (steps[stepIndex].id === 'grounding') {
      AUDIO_OPTIONS.forEach((option) => {
        if (!audioSamplesRef.current[option.id]) {
          const audio = new Audio(option.url)
          audio.volume = 0.6
          audio.preload = 'auto'
          
          // Force load the audio
          audio.load()
          
          // Set up event listeners for debugging
          audio.addEventListener('canplaythrough', () => {
            console.log(`Audio ${option.id} ready to play`)
          }, { once: true })
          
          audio.addEventListener('error', (e) => {
            console.error(`Audio ${option.id} failed to load:`, e)
          }, { once: true })
          
          audioSamplesRef.current[option.id] = audio
        }
      })
    }
  }, [stepIndex])

  const toggleColor = (hex: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(hex)) {
        return prev.filter((color) => color !== hex)
      }
      if (prev.length >= 5) {
        return prev
      }
      return [...prev, hex]
    })
  }

  const handleResponseChange = (prompt: string, value: string) => {
    setResponses((prev) => ({ ...prev, [prompt]: value }))
  }

  const handlePuzzleDrop = (targetId: string, pieceId: string | null) => {
    if (!pieceId) return
    const piece = PUZZLE_PIECES.find((item) => item.id === pieceId)
    if (!piece || piece.targetId !== targetId) {
      return
    }

    setPuzzlePlacement((prev) => {
      const next: Record<string, string | null> = { ...prev }
      Object.keys(next).forEach((key) => {
        if (next[key] === pieceId) {
          next[key] = null
        }
      })
      next[targetId] = pieceId
      return next
    })
    setSelectedPiece(null) // Clear selection after drop
  }

  const handlePieceTap = (pieceId: string, event?: React.TouchEvent | React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // If already selected, deselect
    if (selectedPiece === pieceId) {
      setSelectedPiece(null)
      return
    }
    
    // Select the piece
    setSelectedPiece(pieceId)
    
    // Scroll to correct target if on mobile (only for touch devices)
    if (isTouchDevice) {
      const piece = PUZZLE_PIECES.find((item) => item.id === pieceId)
      if (piece) {
        // Small delay to ensure highlight appears first, then scroll
        setTimeout(() => {
          const targetElement = document.querySelector(`[data-target-id="${piece.targetId}"]`)
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    }
  }

  const handleTargetTap = (targetId: string, event?: React.TouchEvent | React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!selectedPiece) {
      // No piece selected, do nothing
      return
    }
    
    const piece = PUZZLE_PIECES.find((item) => item.id === selectedPiece)
    if (!piece || piece.targetId !== targetId) {
      // Wrong target - deselect and show feedback
      setSelectedPiece(null)
      return
    }

    // Place the piece
    handlePuzzleDrop(targetId, selectedPiece)
  }

  // Mobile drag handlers
  const handleTouchStart = (pieceId: string, e: React.TouchEvent) => {
    if (!isTouchDevice) return
    
    const touch = e.touches[0]
    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    
    setDraggingPiece(pieceId)
    setDragOffset({
      x: touch.clientX - rect.left - rect.width / 2,
      y: touch.clientY - rect.top - rect.height / 2
    })
    setSelectedPiece(pieceId)
  }

  const handleAudioToggle = (optionId: string) => {
    const option = AUDIO_OPTIONS.find((audio) => audio.id === optionId)
    if (!option) return

    // Check if audio is already selected
    setSelectedAudios((prev) => {
      const exists = prev.includes(optionId)
      
      if (exists) {
        // Audio is already selected, unselect it and STOP audio immediately
        const audioElement = audioSamplesRef.current[optionId]
        if (audioElement) {
          // Stop audio immediately and reset
          audioElement.pause()
          audioElement.currentTime = 0
          
          // Remove event listeners and clear reference
          audioElement.src = ''
          audioElement.load()
          
          // Clear the reference so we can create new instance next time
          delete audioSamplesRef.current[optionId]
        }
        return prev.filter((id) => id !== optionId)
      } else {
        // Audio is not selected yet, select it and play audio ONCE
        // First, make sure to stop any previous instance if exists
        if (audioSamplesRef.current[optionId]) {
          audioSamplesRef.current[optionId].pause()
          audioSamplesRef.current[optionId].currentTime = 0
        }
        
        const audio = new Audio(option.url)
        audio.volume = 0.6
        audio.preload = 'auto'
        
        // Store reference for future use
        audioSamplesRef.current[optionId] = audio
        
        // Set up error handling
        audio.addEventListener('error', (e) => {
          console.error(`Audio ${optionId} error:`, e, option.url)
        }, { once: true })
        
        // Set up ended event to clean up when audio finishes naturally
        audio.addEventListener('ended', () => {
          console.log(`Audio ${optionId} finished playing`)
        }, { once: true })
        
        // Play audio only once when selected
        audio.currentTime = 0
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`Audio ${optionId} playing successfully`)
            })
            .catch((err) => {
              console.error(`Audio ${optionId} play failed:`, err)
              // Retry after a short delay
              setTimeout(() => {
                if (audioSamplesRef.current[optionId] === audio) {
                  audio.currentTime = 0
                  audio.play().catch((retryErr) => {
                    console.error(`Audio ${optionId} retry failed:`, retryErr)
                  })
                }
              }, 200)
            })
        }
        
        return [...prev, optionId]
      }
    })
  }

  const markTextureTouched = (textureId: string) => {
    // Show 3D object
    setActiveTexture3D(textureId)
    
    // Mark as touched after 3D interaction
    setTimeout(() => {
      setTouchedTextures((prev) => {
        if (prev.includes(textureId)) return prev
        return [...prev, textureId]
      })
      setActiveTexture3D(null)
    }, 2000) // Show 3D object for 2 seconds
  }

  const handleSymbolTap = () => {
    setSymbolTapped(true)
  }

  const popBubble = (bubbleId: number) => {
    if (poppedBubbles.has(bubbleId)) return

    // Add to popped bubbles
    setPoppedBubbles((prev) => new Set(prev).add(bubbleId))

    // Play pop sound
    try {
      const popSound = new Audio('/audio/bubble-pop-06-351337.mp3')
      popSound.volume = 0.3
      popSound.play().catch(() => {})
    } catch (err) {
      // Silent fail if audio not available
    }
  }

  const canProceed = () => {
    const current = steps[stepIndex]
    if (current.id === 'intro') {
      // At least 12 bubbles should be popped to proceed
      return poppedBubbles.size >= 12
    }
    if (current.id === 'grounding') {
      const puzzleComplete = Object.values(puzzlePlacement).every(Boolean)
      const audioComplete = selectedAudios.length === AUDIO_OPTIONS.length
      const textureComplete = touchedTextures.length === TEXTURE_CARDS.length
      const colorComplete = selectedColors.length === 5
      return puzzleComplete && audioComplete && textureComplete && colorComplete && symbolTapped
    }
    if (current.id === 'reflect') {
      return Object.values(responses).some((text) => text.trim().length > 0)
    }
    return true
  }

  // Function to stop all grounding audio samples
  const stopAllGroundingAudio = () => {
    Object.keys(audioSamplesRef.current).forEach((audioId) => {
      const audio = audioSamplesRef.current[audioId]
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        audio.load()
        delete audioSamplesRef.current[audioId]
      }
    })
  }

  const goNext = () => {
    if (!canProceed()) return
    
    // Stop all grounding audio when leaving grounding step
    const currentStep = steps[stepIndex]
    if (currentStep.id === 'grounding') {
      stopAllGroundingAudio()
      setSelectedPiece(null)
    }
    
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const goBack = () => {
    // Stop all grounding audio when leaving grounding step
    const currentStep = steps[stepIndex]
    if (currentStep.id === 'grounding') {
      stopAllGroundingAudio()
      setSelectedPiece(null)
    }
    
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const toggleWindAudio = () => {
    setSoundOn((prev) => {
      const newState = !prev
      // Audio will be controlled by useEffect based on soundOn state
      return newState
    })
  }

  const clearCanvas = () => {
    paintCanvasBase()
  }

  const resetJourney = () => {
    // Stop all audio before resetting
    stopAllGroundingAudio()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    
    setStepIndex(0)
    setSelectedColors([])
    setResponses({})
    setSoundOn(false)
    setGrowthReady(false)
    setLeavesGrown(0)
    setCurrentAffirmation('')
    setPuzzlePlacement(
      Object.fromEntries(PUZZLE_TARGETS.map((target) => [target.id, null]))
    )
    setSelectedAudios([])
    setTouchedTextures([])
    setSymbolTapped(false)
    setSelectedPiece(null)
    setPoppedBubbles(new Set())
    setBubbles([])
    clearCanvas()
  }

  const currentStep = steps[stepIndex]

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const rect = event.currentTarget.getBoundingClientRect()
    lastPoint.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const stopDrawing = () => {
    drawing.current = false
    lastPoint.current = null
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = calmCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPoint.current) return
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    ctx.strokeStyle = 'rgba(120, 98, 89, 0.55)'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
  }

  // Handle opening screen
  useEffect(() => {
    if (showOpening) {
      // Auto close after 3 seconds or on click
      const timer = setTimeout(() => {
        setShowOpening(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [showOpening])

  if (showOpening) {
    return (
      <div className="opening-screen" onClick={() => setShowOpening(false)}>
        <div className="opening-content">
          <div className="opening-logo-wrapper">
            <img 
              src="/Logo mindfulness.jpg" 
              alt="Hening Steps Logo" 
              className="opening-logo"
            />
          </div>
          <div className="opening-text">
            <h1 className="opening-title">Hening Steps</h1>
            <p className="opening-subtitle">Safe Space Digital</p>
            <p className="opening-message">
              Setiap napas adalah kesempatan baru untuk kembali ke diri sendiri.
            </p>
          </div>
          <div className="opening-hint">
            <p>Ketuk untuk memulai</p>
            <span className="opening-arrow">↓</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Hening Steps • Safe Space Digital</p>
          <h1>Perjalanan Mindfulness Bertahap untuk Meredakan Emosi</h1>
          <p className="hero-copy">
            PKM Project Hening Steps, website ini mengajakmu melewati
            enam tahap lembut: melepaskan emosi, memilih warna nyaman,
            menstabilkan napas, menuliskan perasaan, bergerak perlahan, dan
            menutup dengan afirmasi positif.
          </p>
        </div>
        <div className="progress-card">
          <span>{currentStep.label}</span>
          <strong>{currentStep.subtitle}</strong>
          <p>{currentStep.body}</p>
          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-indicator"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="progress-caption">
            {stepIndex + 1} dari {steps.length} tahap
          </p>
        </div>
        {showScrollIndicator && (
          <div className="scroll-indicator-wrapper">
            <div className="scroll-indicator">
              <div className="scroll-indicator-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="scroll-indicator-content">
                <p className="scroll-indicator-title">
                  {stepIndex === 0 ? 'Mulai Perjalanan' : currentStep.label}
                </p>
                <p className="scroll-indicator-text">Scroll ke bawah untuk melanjutkan</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="step-area">
        {currentStep.id === 'intro' && (
          <section className="card intro-card">
            <h2>Release - Melepaskan Emosi</h2>
            <p>
              Ketuk gelembung satu per satu hingga pecah. Setiap gelembung yang pecah
              akan membantumu melepaskan beban emosi secara perlahan.
            </p>
            <div className="bubble-container" ref={bubbleContainerRef}>
              {bubbles.map((bubble) => (
                <button
                  key={bubble.id}
                  className={`bubble ${poppedBubbles.has(bubble.id) ? 'popped' : ''}`}
                  style={{
                    left: `${bubble.x}%`,
                    top: `${bubble.y}%`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                  }}
                  onClick={() => popBubble(bubble.id)}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    popBubble(bubble.id)
                  }}
                  aria-label={`Gelembung ${bubble.id + 1}`}
                >
                  {!poppedBubbles.has(bubble.id) && (
                    <span className="bubble-shine" />
                  )}
                </button>
              ))}
            </div>
            <div className="bubble-progress">
              <p>
                {poppedBubbles.size}/{bubbles.length} gelembung telah dipecahkan
              </p>
              {poppedBubbles.size >= 12 && (
                <p className="affirmation-note">
                  Terima kasih. Kamu telah melepaskan beban emosi dengan lembut.
                </p>
              )}
            </div>
          </section>
        )}

        {currentStep.id === 'grounding' && (
          <section className="card grounding-card">
            <header className="grounding-head">
              <div>
                <h2>Grounding 5 • 4 • 3 • 5 • 1</h2>
                <p>
                  Sentuh lima indera secara bertahap: gerakkan objek, dengarkan suara,
                  rasakan tekstur, pilih warna nyaman, lalu ketuk simbol penutup.
                </p>
              </div>
              <div className="selection-indicator">
                {Object.values(puzzlePlacement).filter(Boolean).length}/5 objek ·{' '}
                {selectedAudios.length}/4 audio · {touchedTextures.length}/3 tekstur ·{' '}
                {selectedColors.length}/5 warna · {symbolTapped ? 1 : 0}/1 simbol

              </div>
            </header>

            <div className="grounding-grid">
              <div className="grounding-block">
                <div className="block-title">
                  <h3>1. Pindahkan 5 Objek</h3>
                  <p>
                    {selectedPiece 
                      ? 'Pilih slot yang tepat untuk menempatkan objek yang dipilih.'
                      : 'Ketuk objek untuk memilih, lalu ketuk slot yang tepat. Atau seret gambar ke slot yang sesuai.'}
                  </p>
                </div>
                <div className="puzzle-area">
                  <div className="puzzle-pieces">
                    {PUZZLE_PIECES.filter(
                      (piece) => !Object.values(puzzlePlacement).includes(piece.id)
                    ).map((piece) => (
                      <div
                        key={piece.id}
                        ref={draggingPiece === piece.id ? draggedPieceRef : null}
                        className={`puzzle-piece ${selectedPiece === piece.id ? 'selected' : ''} ${draggingPiece === piece.id ? 'dragging' : ''}`}
                        draggable={!isTouchDevice}
                        onDragStart={(event) => {
                          if (!isTouchDevice) {
                            event.dataTransfer.setData('text/plain', piece.id)
                          }
                        }}
                        onTouchStart={(e) => {
                          if (isTouchDevice) {
                            handleTouchStart(piece.id, e)
                          }
                        }}
                        onPointerDown={(e) => {
                          // For mobile/touch devices - only if not dragging
                          if ((e.pointerType === 'touch' || isTouchDevice) && !draggingPiece) {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePieceTap(piece.id, e)
                          }
                        }}
                        onClick={(e) => {
                          // For desktop/mouse - only if not touch device
                          if (!isTouchDevice && e.detail === 1) {
                            handlePieceTap(piece.id, e)
                          }
                        }}
                      >
                        <img src={piece.image} alt={piece.label} loading="lazy" />
                        <span>{piece.label}</span>
                      </div>
                    ))}
                    {Object.values(puzzlePlacement).every(Boolean) && (
                      <p className="mini-note">Semua objek sudah berada di tempatnya.</p>
                    )}
                  </div>
                  <div className="puzzle-targets">
                    {PUZZLE_TARGETS.map((target) => {
                      const pieceId = puzzlePlacement[target.id]
                      const piece = PUZZLE_PIECES.find((item) => item.id === pieceId)
                      const selectedPieceData = selectedPiece ? PUZZLE_PIECES.find((item) => item.id === selectedPiece) : null
                      const isCorrectTarget = selectedPiece && selectedPieceData && selectedPieceData.targetId === target.id && !piece
                      return (
                        <div
                          key={target.id}
                          data-target-id={target.id}
                          className={`puzzle-target ${piece ? 'filled' : ''} ${selectedPiece && !piece ? 'ready-for-drop' : ''} ${isCorrectTarget ? 'correct-target' : ''}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault()
                            const id = event.dataTransfer.getData('text/plain')
                            handlePuzzleDrop(target.id, id)
                          }}
                          onPointerDown={(e) => {
                            // For mobile/touch devices
                            if (e.pointerType === 'touch' || isTouchDevice) {
                              e.preventDefault()
                              e.stopPropagation()
                              handleTargetTap(target.id, e)
                            }
                          }}
                          onClick={(e) => {
                            // For desktop/mouse - only if not touch device
                            if (!isTouchDevice && e.detail === 1) {
                              handleTargetTap(target.id, e)
                            }
                          }}
                        >
                          <div>
                            <strong>{target.label}</strong>
                            <small>{target.hint}</small>
                          </div>
                          {piece && (
                            <img src={piece.image} alt={piece.label} loading="lazy" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grounding-block">
                <div className="block-title">
                  <h3>2. Pilih 4 Suara</h3>
                  <p>Klik ikon bergelombang untuk mendengarkan cuplikan audio.</p>
                </div>
                <div className="audio-grid">
                  {AUDIO_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`audio-option ${
                        selectedAudios.includes(option.id) ? 'selected' : ''
                      }`}
                      onClick={() => handleAudioToggle(option.id)}
                    >
                      <span className="audio-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                      <div>
                        <strong>{option.label}</strong>
                        <small>Dengarkan dan tandai sebagai favorit.</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grounding-block">
                <div className="block-title">
                  <h3>3. Sentuh 3 Tekstur</h3>
                  <p>Bayangkan sensasinya saat mengetuk setiap kartu.</p>
                </div>
                <div className="texture-grid">
                  {TEXTURE_CARDS.map((card) => (
                    <button
                      key={card.id}
                      className={`texture-card ${
                        touchedTextures.includes(card.id) ? 'touched' : ''
                      }`}
                      style={{ backgroundImage: `url(${card.image})` }}
                      onClick={() => markTextureTouched(card.id)}
                    >
      <div>
                        <strong>{card.label}</strong>
                        <p>{card.description}</p>
      </div>
        </button>
                  ))}
                </div>
                {activeTexture3D && (
                  <div className="texture-3d-overlay" onClick={() => setActiveTexture3D(null)}>
                    <div className="texture-3d-container">
                      {activeTexture3D === 'rough' && (
                        <div className="texture-3d-object stone-3d">
                          <div className="stone-surface"></div>
                          <div className="stone-surface"></div>
                          <div className="stone-surface"></div>
                          <p>Rasakan tekstur batu yang kasar</p>
                        </div>
                      )}
                      {activeTexture3D === 'smooth' && (
                        <div className="texture-3d-object fabric-3d">
                          <div className="fabric-layer"></div>
                          <div className="fabric-layer"></div>
                          <p>Rasakan tekstil yang halus</p>
                        </div>
                      )}
                      {activeTexture3D === 'soft' && (
                        <div className="texture-3d-object marshmallow-3d">
                          <div className="marshmallow-body"></div>
                          <div className="marshmallow-shine"></div>
                          <p>Rasakan marshmallow yang lembut</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grounding-block">
                <div className="block-title">
                  <h3>4. Rangkai 5 Warna</h3>
                  <p>
                    Pilih lima warna pastel yang terasa paling nyaman. Bayangkan mereka
                    berpadu harmonis.
        </p>
      </div>
                <div className="color-grid">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.hex}
                      className={`swatch ${
                        selectedColors.includes(color.hex) ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => toggleColor(color.hex)}
                      aria-pressed={selectedColors.includes(color.hex)}
                    >
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
                <p className="selection-indicator secondary">
                  {selectedColors.length}/5 warna dipilih
                </p>
                {selectedColors.length === 5 && (
                  <p className="affirmation-note">
                    Terima kasih. Kombinasi warnamu menghadirkan rasa aman.
                  </p>
                )}
              </div>

              <div className="grounding-block">
                <div className="block-title">
                  <h3>5. Ketuk Simbol Tenang</h3>
                  <p>Sentuh ikon daun untuk menutup grounding dengan lembut.</p>
                </div>
                <button
                  className={`symbol-pad ${symbolTapped ? 'active' : ''}`}
                  onClick={handleSymbolTap}
                >
                  <img 
                    src="/image/pohon.jpeg" 
                    alt="Pohon tenang" 
                    className="symbol-image"
                  />
                  <p>{symbolTapped ? 'Simbol tersentuh. Tarik napas lega.' : 'Sentuh sekali.'}</p>
                </button>
              </div>
            </div>

            <div className="task-progress">
              <div>
                <strong>5 objek</strong>
                <span>{Object.values(puzzlePlacement).every(Boolean) ? 'selesai' : 'belum'}</span>
              </div>
              <div>
                <strong>4 audio</strong>
                <span>
                  {selectedAudios.length}/{AUDIO_OPTIONS.length}
                </span>
              </div>
              <div>
                <strong>3 tekstur</strong>
                <span>
                  {touchedTextures.length}/{TEXTURE_CARDS.length}
                </span>
              </div>
              <div>
                <strong>5 warna</strong>
                <span>
                  {selectedColors.length}/5
                </span>
              </div>
              <div>
                <strong>1 simbol</strong>
                <span>{symbolTapped ? 'selesai' : 'sentuh'}</span>
              </div>
            </div>
          </section>
        )}

        {currentStep.id === 'breath' && (
          <section className="card breath-card">
            <div className="breath-visual">
              <div className="breath-circle" aria-hidden="true" />
              <p className="breath-phase">{breathPhase}</p>
            </div>
            <div className="breath-details">
              <h2>Panduan Napas 3 • 1 • 5</h2>
              <p>
                Tarik napas melalui hidung selama 3 detik, tahan 1 detik, lalu
                hembuskan selama 5 detik. Ikuti ritme lingkaran untuk membantu
                tubuh menemukan tempo yang stabil.
              </p>
              <button
                className="sound-toggle"
                onClick={toggleWindAudio}
                aria-pressed={soundOn}
              >
                {soundOn ? 'Matikan suara angin lembut' : 'Aktifkan suara angin lembut'}
              </button>
            </div>
          </section>
        )}

        {currentStep.id === 'reflect' && (
          <section className="card reflect-card">
            <h2>Catatan Singkat untuk Dirimu</h2>
            <p>
              Ketik jawaban sesingkat mungkin. Tidak harus rapi, cukup jujur pada
              apa yang hadir saat ini.
            </p>
            <div className="prompt-grid">
              {reflectionPrompts.map((prompt) => (
                <label key={prompt} className="prompt-card">
                  <span>{prompt}</span>
                  <textarea
                    value={responses[prompt] ?? ''}
                    onChange={(event) =>
                      handleResponseChange(prompt, event.target.value)
                    }
                    placeholder="Tuliskan apa yang kamu rasakan..."
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {currentStep.id === 'calm' && (
          <section className="card calm-card">
            <h2>Gerakan Lembut</h2>
            <p>
              Gerakkan kursor atau sentuhanmu membentuk garis lembut di area
              pasir digital berikut. Ikuti ritme tubuh tanpa tujuan tertentu.
            </p>
            <canvas
              ref={calmCanvasRef}
              className="calm-canvas"
              onPointerDown={startDrawing}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerMove={draw}
            />
            <button className="clear-canvas" onClick={clearCanvas}>
              Bersihkan pola lembut
            </button>
          </section>
        )}

        {currentStep.id === 'growth' && (
          <section className="card growth-card">
            <h2>Pohon Pertumbuhan</h2>
            <p>
              Nikmati momen senyap selama beberapa napas sembari melihat daun baru
              tumbuh. Rasakan apresiasi atas langkah kecil yang sudah kamu ambil.
            </p>
            <div className={`tree-wrapper ${growthReady ? 'show' : ''}`}>
              <svg
                viewBox="0 0 200 200"
                role="img"
                aria-label="Ilustrasi pohon tumbuh"
              >
                {/* Trunk */}
                <line x1="100" y1="150" x2="100" y2="90" className="trunk" />
                
                {/* Branches */}
                <line x1="100" y1="110" x2="140" y2="80" className="branch" />
                <line x1="100" y1="120" x2="60" y2="90" className="branch" />
                <line x1="100" y1="105" x2="120" y2="75" className="branch" />
                <line x1="100" y1="115" x2="80" y2="85" className="branch" />
                
                {/* Leaves - grow one by one */}
                {leavesGrown >= 1 && (
                  <circle cx="140" cy="80" r="8" className="leaf leaf-right" />
                )}
                {leavesGrown >= 2 && (
                  <circle cx="60" cy="90" r="8" className="leaf leaf-left" />
                )}
                {leavesGrown >= 3 && (
                  <circle cx="100" cy="70" r="8" className="leaf leaf-top" />
                )}
                {leavesGrown >= 3 && (
                  <circle cx="120" cy="75" r="7" className="leaf leaf-right" />
                )}
                {leavesGrown >= 3 && (
                  <circle cx="80" cy="85" r="7" className="leaf leaf-left" />
                )}
              </svg>
            </div>
            <div className="affirmation-area">
              {currentAffirmation && (
                <p className="current-affirmation">{currentAffirmation}</p>
              )}
              {leavesGrown >= 3 && !currentAffirmation && (
                <p className="final-affirmation">
                  Terima kasih telah menyelesaikan perjalanan mindfulness hari ini.
                </p>
              )}
            </div>
            <button className="primary" onClick={resetJourney}>
              Ulangi Perjalanan
            </button>
          </section>
        )}
      </main>

      <footer className="controls">
        <button onClick={goBack} disabled={stepIndex === 0}>
          Kembali
        </button>
        {currentStep.id !== 'growth' && (
          <button
            className="primary"
            onClick={goNext}
            disabled={!canProceed()}
          >
            Lanjut
          </button>
        )}
      </footer>
    </div>
  )
}

export default App
