import { useMemo } from 'react'
import { getTeamColors, isLightColor, getTeamLogoUrl, teamAbbrFromName } from '../utils/teamColors'

const CHART_WIDTH = 860
const CHART_HEIGHT = 460
const PADDING = { top: 28, right: 28, bottom: 52, left: 62 }


export default function TeamScatterPlot({ standings = [] }) {
  const points = useMemo(() => {
    const hasPerGame = standings.every((team) =>
      hasNumericValue(team.goals_for_per_game) && hasNumericValue(team.goals_against_per_game)
    )

    return standings.map((team, index) => {
      const gf = hasPerGame ? toNumber(team.goals_for_per_game) : toNumber(team.goals_for)
      const ga = hasPerGame ? toNumber(team.goals_against_per_game) : toNumber(team.goals_against)
      const pts = toNumber(team.points)
      const teamName = team.team_full_name ?? 'Unknown Team'
      const abbr = (team.team_abbrev || teamAbbrFromName(teamName) || shortCode(teamName)).toUpperCase()
      const record = `${team.wins ?? 0}-${team.losses ?? 0}-${team.ot_losses ?? 0}`
      return {
        id: team.id ?? `${teamName}-${index}`,
        teamName,
        abbr,
        gf,
        ga,
        pts,
        record,
      }
    })
  }, [standings])

  if (!points.length) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800">Offense vs Defense Scatter</h3>
        <p className="text-sm text-gray-500 mt-2">No standings data available.</p>
      </div>
    )
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const minX = Math.min(...points.map((p) => p.gf))
  const maxX = Math.max(...points.map((p) => p.gf))
  const minY = Math.min(...points.map((p) => p.ga))
  const maxY = Math.max(...points.map((p) => p.ga))
  const minPts = Math.min(...points.map((p) => p.pts))
  const maxPts = Math.max(...points.map((p) => p.pts))
  const avgX = points.reduce((sum, p) => sum + p.gf, 0) / points.length
  const avgY = points.reduce((sum, p) => sum + p.ga, 0) / points.length

  const xDomain = normalizeDomain(minX, maxX)
  const yDomain = normalizeDomain(minY, maxY)
  const ptsDomain = normalizeDomain(minPts, maxPts)

  const xScale = (value) => PADDING.left + ((value - xDomain.min) / xDomain.range) * innerWidth
  const yScale = (value) => PADDING.top + ((yDomain.max - value) / yDomain.range) * innerHeight
  const radiusScale = (value) => 9 + ((value - ptsDomain.min) / ptsDomain.range) * 14

  const xAxisLabel = standings.every((team) => hasNumericValue(team.goals_for_per_game))
    ? 'Goals For per Game'
    : 'Goals For'
  const yAxisLabel = standings.every((team) => hasNumericValue(team.goals_against_per_game))
    ? 'Goals Against per Game'
    : 'Goals Against'

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800">Offense vs Defense Scatter</h3>
        <p className="text-xs text-gray-500">Bubble size = points</p>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto mt-4"
        role="img"
        aria-label="Team offense versus defense scatter plot"
      >
        <rect x={PADDING.left} y={PADDING.top} width={innerWidth} height={innerHeight} fill="#f9fafb" />

        <line x1={xScale(avgX)} y1={PADDING.top} x2={xScale(avgX)} y2={PADDING.top + innerHeight} stroke="#d1d5db" strokeDasharray="6 6" />
        <line x1={PADDING.left} y1={yScale(avgY)} x2={PADDING.left + innerWidth} y2={yScale(avgY)} stroke="#d1d5db" strokeDasharray="6 6" />

        <text x={xScale(avgX) + 6} y={PADDING.top + 14} fontSize="11" fill="#6b7280">
          Avg GF
        </text>
        <text x={PADDING.left + 6} y={yScale(avgY) - 6} fontSize="11" fill="#6b7280">
          Avg GA
        </text>

        <line x1={PADDING.left} y1={PADDING.top + innerHeight} x2={PADDING.left + innerWidth} y2={PADDING.top + innerHeight} stroke="#9ca3af" />
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + innerHeight} stroke="#9ca3af" />

        {points.map((point) => {
          const { primary } = getTeamColors(point.abbr)
          const radius = radiusScale(point.pts)
          const x = xScale(point.gf)
          const y = yScale(point.ga)
          const logoUrl = getTeamLogoUrl(point.abbr)
          const logoSize = radius * 1.3
          return (
            <g key={point.id}>
              <circle cx={x} cy={y} r={radius} fill={primary} fillOpacity="0.8" stroke="#111827" strokeOpacity="0.14" strokeWidth="1.5" />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={isLightColor(primary) ? '#111827' : '#ffffff'}
              >
                {point.abbr}
              </text>
              {logoUrl ? (
                <image href={logoUrl} x={x - logoSize / 2} y={y - logoSize / 2} width={logoSize} height={logoSize} />
              ) : null}
              <title>{`${point.teamName} (${point.record}) | Points: ${point.pts} | GF: ${point.gf.toFixed(2)} | GA: ${point.ga.toFixed(2)}`}</title>
            </g>
          )
        })}

        <text x={PADDING.left + innerWidth / 2} y={CHART_HEIGHT - 14} textAnchor="middle" fontSize="13" fill="#4b5563">
          {xAxisLabel}
        </text>
        <text
          x={18}
          y={PADDING.top + innerHeight / 2}
          transform={`rotate(-90 18 ${PADDING.top + innerHeight / 2})`}
          textAnchor="middle"
          fontSize="13"
          fill="#4b5563"
        >
          {yAxisLabel}
        </text>
      </svg>
    </div>
  )
}

function toNumber(value) {
  const number = Number(value)
  return Number.isNaN(number) ? 0 : number
}

function normalizeDomain(min, max) {
  if (min === max) {
    return { min: min - 1, max: max + 1, range: 2 }
  }
  const margin = (max - min) * 0.12
  const domainMin = min - margin
  const domainMax = max + margin
  return { min: domainMin, max: domainMax, range: domainMax - domainMin }
}

function shortCode(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
}

function hasNumericValue(value) {
  if (value === null || value === undefined || value === '') return false
  return Number.isFinite(Number(value))
}
