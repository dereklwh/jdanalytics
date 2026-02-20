import { useMemo, useState } from 'react'

const CHART_WIDTH = 760
const CHART_HEIGHT = 260
const PADDING = { top: 18, right: 18, bottom: 36, left: 44 }

const SKATER_METRICS = [
  { key: 'goals', label: 'G', value: (game) => toNumber(game.goals), format: (value) => `${Math.round(value)}` },
  { key: 'assists', label: 'A', value: (game) => toNumber(game.assists), format: (value) => `${Math.round(value)}` },
  { key: 'points', label: 'PTS', value: (game) => toNumber(game.points), format: (value) => `${Math.round(value)}` },
  { key: 'shots', label: 'Shots', value: (game) => toNumber(game.shots), format: (value) => `${Math.round(value)}` },
]

const GOALIE_METRICS = [
  { key: 'saves', label: 'Saves', value: (game) => toNumber(game.saves), format: (value) => `${Math.round(value)}` },
  { key: 'goals_against', label: 'GA', value: (game) => toNumber(game.goals_against), format: (value) => `${Math.round(value)}` },
  { key: 'save_pct', label: 'SV%', value: (game) => toPercent(game.save_pct), format: (value) => `${value.toFixed(1)}%` },
]

export default function PerformanceTrend({ games = [], isGoalie = false, teamColor = '#4f46e5' }) {
  const metrics = isGoalie ? GOALIE_METRICS : SKATER_METRICS
  const [metricKey, setMetricKey] = useState(metrics[0].key)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const activeMetric = metrics.find((metric) => metric.key === metricKey) ?? metrics[0]

  const data = useMemo(() => {
    const ordered = [...games].reverse()
    return ordered.map((game, index) => ({
      id: game.game_id ?? index,
      dateLabel: formatShortDate(game.game_date),
      gameDate: game.game_date,
      opponent: game.opponent_abbrev ?? '-',
      venue: game.home_road === 'H' ? 'vs' : '@',
      value: activeMetric.value(game),
    }))
  }, [activeMetric, games])

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800">Performance Trend</h3>
        <p className="text-sm text-gray-500 mt-2">No recent game data available.</p>
      </div>
    )
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const maxValue = Math.max(...data.map((point) => point.value), 1)
  const minValue = 0
  const valueRange = Math.max(maxValue - minValue, 1)

  const points = data.map((point, index) => {
    const x = data.length > 1
      ? PADDING.left + (index / (data.length - 1)) * innerWidth
      : PADDING.left + innerWidth / 2
    const yRatio = (point.value - minValue) / valueRange
    const y = PADDING.top + innerHeight - (yRatio * innerHeight)
    return { ...point, x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${(PADDING.top + innerHeight).toFixed(2)} L ${points[0].x.toFixed(2)} ${(PADDING.top + innerHeight).toFixed(2)} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = minValue + (ratio * valueRange)
    const y = PADDING.top + innerHeight - (ratio * innerHeight)
    return { ratio, value, y }
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Performance Trend</h3>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setMetricKey(metric.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${metric.key === activeMetric.key ? 'text-white border-transparent' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              style={metric.key === activeMetric.key ? { backgroundColor: teamColor } : undefined}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Recent game ${activeMetric.label} trend`}
        >
          {yTicks.map((tick) => (
            <g key={tick.ratio}>
              <line
                x1={PADDING.left}
                y1={tick.y}
                x2={PADDING.left + innerWidth}
                y2={tick.y}
                stroke="#e5e7eb"
                strokeDasharray={tick.ratio === 0 ? '0' : '4 4'}
              />
              <text
                x={PADDING.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
              >
                {activeMetric.format(tick.value)}
              </text>
            </g>
          ))}

          <line
            x1={PADDING.left}
            y1={PADDING.top + innerHeight}
            x2={PADDING.left + innerWidth}
            y2={PADDING.top + innerHeight}
            stroke="#9ca3af"
          />

          <path d={areaPath} fill={teamColor} opacity="0.15" />
          <path d={linePath} fill="none" stroke={teamColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {points.map((point, index) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint?.id === point.id ? '6' : '4.5'}
                fill={teamColor}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onFocus={() => setHoveredPoint(point)}
                onBlur={() => setHoveredPoint(null)}
                className="transition-all"
              />
              <text
                x={point.x}
                y={PADDING.top + innerHeight + 16}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {index % 2 === 0 || points.length <= 6 ? point.dateLabel : ''}
              </text>
              <title>
                {`${point.gameDate ?? '-'} ${point.venue} ${point.opponent}: ${activeMetric.format(point.value)} ${activeMetric.label}`}
              </title>
            </g>
          ))}
        </svg>

        {hoveredPoint ? (
          <div
            className="absolute z-10 pointer-events-none rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm text-xs"
            style={{
              left: `${Math.max(8, Math.min(88, (hoveredPoint.x / CHART_WIDTH) * 100))}%`,
              top: `${Math.max(4, ((hoveredPoint.y / CHART_HEIGHT) * 100) - 14)}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-gray-900">
              {hoveredPoint.venue} {hoveredPoint.opponent}
            </p>
            <p className="text-gray-600">
              {hoveredPoint.gameDate ?? '-'} • {activeMetric.label}: {activeMetric.format(hoveredPoint.value)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function toNumber(value) {
  const number = Number(value)
  return Number.isNaN(number) ? 0 : number
}

function toPercent(value) {
  const number = toNumber(value)
  return number <= 1 ? number * 100 : number
}

function formatShortDate(dateString) {
  if (!dateString) return '-'
  const parts = String(dateString).split('-')
  if (parts.length !== 3) return String(dateString)
  return `${parts[1]}/${parts[2]}`
}
