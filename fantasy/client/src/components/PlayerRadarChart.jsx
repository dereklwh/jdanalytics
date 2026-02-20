import { useMemo } from 'react'

const CHART_SIZE = 380
const CENTER = CHART_SIZE / 2
const OUTER_RADIUS = 124
const RING_COUNT = 5

const SKATER_AXES = [
  { key: 'goals', label: 'Goals', higherIsBetter: true, get: (row) => toNumber(row?.goals), format: (v) => `${Math.round(v)}` },
  { key: 'assists', label: 'Assists', higherIsBetter: true, get: (row) => toNumber(row?.assists), format: (v) => `${Math.round(v)}` },
  { key: 'shooting_pct', label: 'Shooting %', higherIsBetter: true, get: (row) => toNumber(row?.shooting_pct), format: (v) => `${toPercent(v).toFixed(1)}%` },
  { key: 'toi_per_game', label: 'TOI/GP', higherIsBetter: true, get: (row) => toNumber(row?.toi_per_game), format: (v) => `${v.toFixed(2)}` },
  { key: 'pp_points', label: 'PP Points', higherIsBetter: true, get: (row) => toNumber(row?.pp_points), format: (v) => `${Math.round(v)}` },
  { key: 'plus_minus', label: 'Plus/Minus', higherIsBetter: true, get: (row) => toNumber(row?.plus_minus), format: (v) => formatSigned(v) },
]

const GOALIE_AXES = [
  { key: 'wins', label: 'Wins', higherIsBetter: true, get: (row) => toNumber(row?.wins), format: (v) => `${Math.round(v)}` },
  { key: 'save_pct', label: 'Save %', higherIsBetter: true, get: (row) => toNumber(row?.save_pct), format: (v) => `${toPercent(v).toFixed(1)}%` },
  { key: 'goals_against_average', label: 'GAA', higherIsBetter: false, get: (row) => toNumber(row?.goals_against_average), format: (v) => `${v.toFixed(2)}` },
  { key: 'shutouts', label: 'Shutouts', higherIsBetter: true, get: (row) => toNumber(row?.shutouts), format: (v) => `${Math.round(v)}` },
  { key: 'games_started', label: 'Starts', higherIsBetter: true, get: (row) => toNumber(row?.games_started), format: (v) => `${Math.round(v)}` },
  { key: 'shots_against', label: 'Shots Against', higherIsBetter: true, get: (row) => toNumber(row?.shots_against), format: (v) => `${Math.round(v)}` },
]

export default function PlayerRadarChart({
  season,
  seasonType = 'skater',
  leaguePlayers = [],
  seasonId = null,
  teamColor = '#4f46e5',
  loading = false,
  error = null,
}) {
  const axes = seasonType === 'goalie' ? GOALIE_AXES : SKATER_AXES

  const metrics = useMemo(() => {
    return axes.map((axis) => {
      const playerValue = axis.get(season)
      const leagueValues = leaguePlayers
        .map((row) => axis.get(row))
        .filter((value) => Number.isFinite(value))
      const percentile = percentileRank(playerValue, leagueValues, axis.higherIsBetter)
      return { ...axis, playerValue, percentile }
    })
  }, [axes, leaguePlayers, season])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800">Player Profile Radar</h3>
        <p className="text-sm text-gray-500 mt-2">Loading league context...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800">Player Profile Radar</h3>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!season || !leaguePlayers.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800">Player Profile Radar</h3>
        <p className="text-sm text-gray-500 mt-2">Not enough league data to calculate percentiles.</p>
      </div>
    )
  }

  const axisPoints = metrics.map((metric, index) => {
    const angle = (-Math.PI / 2) + (index * (2 * Math.PI) / metrics.length)
    const axisX = CENTER + Math.cos(angle) * OUTER_RADIUS
    const axisY = CENTER + Math.sin(angle) * OUTER_RADIUS
    const radius = OUTER_RADIUS * (metric.percentile / 100)
    const valueX = CENTER + Math.cos(angle) * radius
    const valueY = CENTER + Math.sin(angle) * radius
    const labelRadius = OUTER_RADIUS + 24
    const labelX = CENTER + Math.cos(angle) * labelRadius
    const labelY = CENTER + Math.sin(angle) * labelRadius
    return { ...metric, axisX, axisY, valueX, valueY, labelX, labelY }
  })

  const polygonPath = axisPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.valueX.toFixed(2)} ${point.valueY.toFixed(2)}`)
    .join(' ') + ' Z'

  const rings = Array.from({ length: RING_COUNT }, (_, i) => ((i + 1) / RING_COUNT) * OUTER_RADIUS)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Player Profile Radar</h3>
          <p className="text-sm text-gray-500">
            Percentiles vs {leaguePlayers.length} {seasonType === 'goalie' ? 'goalies' : 'skaters'} in season {seasonId ?? '-'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
            className="w-full max-w-md mx-auto h-auto"
            role="img"
            aria-label="Player radar profile"
          >
            {rings.map((radius, ringIndex) => {
              const ringPoints = axisPoints.map((point, pointIndex) => {
                const angle = (-Math.PI / 2) + (pointIndex * (2 * Math.PI) / axisPoints.length)
                const x = CENTER + Math.cos(angle) * radius
                const y = CENTER + Math.sin(angle) * radius
                return `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
              }).join(' ')
              return (
                <path
                  key={radius}
                  d={`${ringPoints} Z`}
                  fill={ringIndex % 2 === 0 ? '#f9fafb' : '#ffffff'}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              )
            })}

            {axisPoints.map((point) => (
              <line
                key={point.key}
                x1={CENTER}
                y1={CENTER}
                x2={point.axisX}
                y2={point.axisY}
                stroke="#d1d5db"
                strokeWidth="1"
              />
            ))}

            <path d={polygonPath} fill={teamColor} fillOpacity="0.24" stroke={teamColor} strokeWidth="2.5" />

            {axisPoints.map((point) => (
              <g key={`${point.key}-point`}>
                <circle cx={point.valueX} cy={point.valueY} r="4.2" fill={teamColor} />
                <title>{`${point.label}: ${point.format(point.playerValue)} (${point.percentile}th percentile)`}</title>
              </g>
            ))}

            {axisPoints.map((point) => (
              <text
                key={`${point.key}-label`}
                x={point.labelX}
                y={point.labelY}
                textAnchor={labelAnchor(point.labelX)}
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                {point.label}
              </text>
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={`${metric.key}-metric`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">{metric.label}</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{metric.format(metric.playerValue)}</p>
              <div className="mt-2 h-2 rounded bg-gray-200 overflow-hidden">
                <div className="h-full rounded" style={{ width: `${metric.percentile}%`, backgroundColor: teamColor }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{metric.percentile}th percentile</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function percentileRank(value, sample, higherIsBetter) {
  if (!Number.isFinite(value) || !sample.length) return 0

  let better = 0
  let equal = 0

  for (const sampleValue of sample) {
    if (!Number.isFinite(sampleValue)) continue
    if (sampleValue === value) {
      equal += 1
      continue
    }

    if (higherIsBetter) {
      if (sampleValue < value) better += 1
    } else if (sampleValue > value) {
      better += 1
    }
  }

  const rank = (better + (equal * 0.5)) / sample.length
  return Math.max(0, Math.min(100, Math.round(rank * 100)))
}

function toNumber(value) {
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

function toPercent(value) {
  return value <= 1 ? value * 100 : value
}

function formatSigned(value) {
  if (value > 0) return `+${Math.round(value)}`
  return `${Math.round(value)}`
}

function labelAnchor(x) {
  if (Math.abs(x - CENTER) < 10) return 'middle'
  return x > CENTER ? 'start' : 'end'
}
