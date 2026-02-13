import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forceSimulation, forceCollide, forceCenter, forceManyBody, forceX, forceY } from 'd3-force'
import { getTeamColors, isLightColor } from '../utils/teamColors'

const MIN_RADIUS = 30
const MAX_RADIUS = 80
const PUSH_RADIUS = 100
const PUSH_STRENGTH = 2
const HELP_STORAGE_KEY = 'bubble_view_help_hidden'

// Hockey stick emoji cursor
const STICK_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ctext x='0' y='28' font-size='28'%3E%F0%9F%8F%92%3C/text%3E%3C/svg%3E") 16 28, auto`

// Exponential scale: normalize to [0,1] against page max, then apply power curve
// t^2 makes high-point players dramatically larger
function getRadius(points, maxPoints) {
  const t = Math.max(points ?? 0, 1) / Math.max(maxPoints, 1)
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.pow(t, 2)
}

function getInitials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str
}

function getBubbleLabel(node) {
  if (node.radius > 50) return truncate(`${node.firstName} ${node.lastName}`, 18)
  if (node.radius > 35) return truncate(node.lastName, 10)
  return getInitials(node.firstName, node.lastName)
}

export default function BubbleView({ players }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const nodesRef = useRef([])
  const dragRef = useRef(null)
  const [nodes, setNodes] = useState([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [pressedId, setPressedId] = useState(null)
  const [showHelp, setShowHelp] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const hidden = window.localStorage.getItem(HELP_STORAGE_KEY)
    setShowHelp(hidden !== '1')
  }, [])

  // Responsive height: clamp between 480–720 based on width
  const height = Math.min(720, Math.max(480, Math.round(dimensions.width * 0.6)))

  // Track container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setDimensions(prev => ({ ...prev, width: w }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Run simulation when players or dimensions change
  useEffect(() => {
    if (!players.length) {
      setNodes([])
      nodesRef.current = []
      return
    }

    if (simRef.current) simRef.current.stop()

    const { width } = dimensions
    const maxPoints = Math.max(...players.map(p => p.points ?? 0), 1)

    const simNodes = players.map(p => ({
      id: p.id ?? p['Player ID'],
      firstName: p.firstName,
      lastName: p.lastName,
      teamAbbr: p.teamAbbr,
      position: p.position,
      points: p.points ?? 0,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      gamesPlayed: p.gamesPlayed ?? 0,
      radius: getRadius(p.points, maxPoints),
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: height / 2 + (Math.random() - 0.5) * height * 0.3,
    }))

    nodesRef.current = simNodes

    const sim = forceSimulation(simNodes)
      .force('collide', forceCollide(d => d.radius + 4).iterations(3))
      .force('center', forceCenter(width / 2, height / 2))
      .force('charge', forceManyBody().strength(-8))
      .force('x', forceX(width / 2).strength(0.05))
      .force('y', forceY(height / 2).strength(0.05))
      .alphaDecay(0.03)
      .on('tick', () => {
        for (const d of simNodes) {
          d.x = Math.max(d.radius, Math.min(width - d.radius, d.x))
          d.y = Math.max(d.radius, Math.min(height - d.radius, d.y))
        }
        setNodes([...simNodes])
      })

    simRef.current = sim

    return () => { sim.stop() }
  }, [players, dimensions, height])

  // Push nearby bubbles away from cursor (hockey stick guide)
  const onSvgPointerMove = useCallback((e) => {
    if (dragRef.current) return
    const svgRect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - svgRect.left
    const my = e.clientY - svgRect.top

    let pushed = false
    for (const node of nodesRef.current) {
      const dx = node.x - mx
      const dy = node.y - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < PUSH_RADIUS && dist > 0) {
        const force = PUSH_STRENGTH * (1 - dist / PUSH_RADIUS)
        node.vx += (dx / dist) * force
        node.vy += (dy / dist) * force
        pushed = true
      }
    }

    if (pushed) simRef.current?.alpha(0.1).restart()
  }, [])

  // Drag via pointer events on individual bubbles
  const onPointerDown = useCallback((e, node) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setPressedId(node.id)
    const svgRect = svgRef.current.getBoundingClientRect()
    dragRef.current = { id: node.id, startX: e.clientX, startY: e.clientY, moved: false }
    node.fx = e.clientX - svgRect.left
    node.fy = e.clientY - svgRect.top
    simRef.current?.alpha(0.3).restart()
  }, [])

  const onPointerMove = useCallback((e, node) => {
    if (!dragRef.current || dragRef.current.id !== node.id) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
    const svgRect = svgRef.current.getBoundingClientRect()
    node.fx = e.clientX - svgRect.left
    node.fy = e.clientY - svgRect.top
  }, [])

  const onPointerUp = useCallback((e, node) => {
    if (!dragRef.current || dragRef.current.id !== node.id) return
    const wasDrag = dragRef.current.moved
    node.fx = null
    node.fy = null
    dragRef.current = null
    setPressedId(null)
    simRef.current?.alpha(0.15).restart()
    if (!wasDrag) navigate(`/players/${node.id}`)
  }, [navigate])

  const onKeyDown = useCallback((e, node) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/players/${node.id}`)
    }
  }, [navigate])

  const showTooltip = useCallback((e, node) => {
    setHoveredId(node.id)
    const svgRect = svgRef.current.getBoundingClientRect()
    setTooltip({
      x: e.clientX - svgRect.left,
      y: node.y - node.radius - 10,
      node,
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setHoveredId(null)
    setTooltip(null)
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full mt-4 relative rounded-xl bg-gray-50/50 shadow-sm"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {showHelp ? (
        <div className="absolute left-3 top-3 z-10 max-w-xs rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-700 shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">Bubble View Controls</p>
              <p>Hold and drag a bubble to move it.</p>
              <p>Release to let bubbles settle.</p>
              <p>Click a bubble to open player details.</p>
              <p>Press Tab + Enter to open with keyboard.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => {
                setShowHelp(false)
                window.localStorage.setItem(HELP_STORAGE_KEY, '1')
              }}
              aria-label="Dismiss bubble view help"
            >
              x
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="absolute left-3 top-3 z-10 rounded-md border border-gray-200 bg-white/95 px-2 py-1 text-xs text-gray-600 shadow hover:bg-white"
          onClick={() => {
            setShowHelp(true)
            window.localStorage.removeItem(HELP_STORAGE_KEY)
          }}
        >
          Show bubble help
        </button>
      )}

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={height}
        className="w-full touch-none"
        style={{ cursor: STICK_CURSOR }}
        role="img"
        aria-label="Player bubbles sized by points"
        onPointerMove={onSvgPointerMove}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.map(node => {
          const colors = getTeamColors(node.teamAbbr)
          const textColor = isLightColor(colors.primary) ? '#111' : '#fff'
          const isHovered = hoveredId === node.id
          const isPressed = pressedId === node.id
          const label = getBubbleLabel(node)
          const showPoints = node.radius > 35

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              tabIndex={0}
              role="button"
              aria-label={`${node.firstName} ${node.lastName}, ${node.points} points`}
              onPointerDown={e => onPointerDown(e, node)}
              onPointerMove={e => onPointerMove(e, node)}
              onPointerUp={e => onPointerUp(e, node)}
              onPointerEnter={e => showTooltip(e, node)}
              onPointerLeave={hideTooltip}
              onKeyDown={e => onKeyDown(e, node)}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              style={{
                cursor: 'pointer',
                filter: isHovered ? 'url(#glow)' : undefined,
              }}
            >
              <circle
                r={node.radius * (isPressed ? 0.95 : 1)}
                fill={colors.primary}
                stroke={colors.secondary}
                strokeWidth={isHovered ? 5 : 3}
                opacity={0.9}
              />
              <text
                textAnchor="middle"
                dy={showPoints ? '-0.3em' : '0.35em'}
                fill={textColor}
                fontSize={node.radius > 50 ? 11 : 13}
                fontWeight="600"
                pointerEvents="none"
              >
                {label}
              </text>
              {showPoints && (
                <text
                  textAnchor="middle"
                  dy="1em"
                  fill={textColor}
                  fontSize={14}
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {node.points} pts
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg -translate-x-1/2"
          style={{ left: tooltip.x, top: Math.max(0, tooltip.y - 8) }}
        >
          <p className="font-semibold">{tooltip.node.firstName} {tooltip.node.lastName}</p>
          <p className="text-gray-300">{tooltip.node.position} &middot; {tooltip.node.teamAbbr}</p>
          <p>{tooltip.node.goals}G {tooltip.node.assists}A &middot; {tooltip.node.gamesPlayed} GP</p>
        </div>
      )}
    </div>
  )
}
