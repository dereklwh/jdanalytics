import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '../components/nav'
import PerformanceTrend from '../components/PerformanceTrend'
import PlayerRadarChart from '../components/PlayerRadarChart'
import { getTeamColors, isLightColor } from '../utils/teamColors'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function PlayerDetail() {
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [radarContext, setRadarContext] = useState(null)
  const [radarLoading, setRadarLoading] = useState(false)
  const [radarError, setRadarError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/players/${id}/detail`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Player not found')
          }
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setDetail(data)
      } catch (e) {
        console.error('Error fetching player detail:', e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayer()
  }, [id])

  useEffect(() => {
    const seasonType = detail?.season_type
    if (!seasonType) return

    const controller = new AbortController()

    const fetchRadarContext = async () => {
      try {
        setRadarLoading(true)
        setRadarError(null)
        setRadarContext(null)

        const params = new URLSearchParams({ season_type: seasonType })
        const res = await fetch(`${API_BASE}/player-radar-context?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setRadarContext(data)
      } catch (e) {
        if (e.name === 'AbortError') return
        console.error('Error fetching radar context:', e)
        setRadarError('Unable to load radar context')
      } finally {
        if (!controller.signal.aborted) {
          setRadarLoading(false)
        }
      }
    }

    fetchRadarContext()
    return () => controller.abort()
  }, [detail?.season_type, id])

  if (loading) {
    return (
      <div className="flex flex-col items-center max-w-5xl mx-auto p-4">
        <Nav />
        <p className="mt-8 text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !detail?.player) {
    return (
      <div className="flex flex-col items-center max-w-5xl mx-auto p-4">
        <Nav />
        <div className="mt-8 text-center">
          <p className="text-red-600 mb-4">{error ?? 'Player not found'}</p>
          <Link to="/players" className="text-indigo-600 hover:text-indigo-800 underline">
            &larr; Back to Players
          </Link>
        </div>
      </div>
    )
  }

  const { player, season_type, season, form_last_5, home_away_splits, recent_games } = detail
  const isGoalie = season_type === 'goalie'
  const { primary, secondary } = getTeamColors(player.teamAbbr)
  const textColor = isLightColor(primary) ? '#111827' : '#ffffff'

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-4">
      <Nav />

      <Link to="/players" className="self-start mt-4 text-indigo-600 hover:text-indigo-800 transition-colors">
        &larr; Back to Players
      </Link>

      <div className="w-full mt-6 rounded-xl p-6 shadow-sm relative" style={{ backgroundColor: primary, color: textColor }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            })
          }}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: `${textColor}15` }}
          title="Copy link to share"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        {copied && (
          <div
            className="absolute top-14 right-4 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg animate-fade-in"
            style={{ backgroundColor: secondary, color: isLightColor(secondary) ? '#111827' : '#ffffff' }}
          >
            Link copied!
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {player.headshot && (
            <div
              className="rounded-lg overflow-hidden bg-white border-2"
              style={{ borderColor: secondary }}
            >
              <img
                src={player.headshot}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-36 h-36 object-cover block"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${textColor}20`, color: textColor }}
              >
                {player.position}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: secondary, color: isLightColor(secondary) ? '#111827' : '#ffffff' }}
              >
                {player.teamAbbr}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Season Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Games Played" value={season?.games_played} color={primary} />
          {isGoalie ? (
            <>
              <StatCard label="Save %" value={formatDec(season?.save_pct, 3)} color={primary} />
              <StatCard label="GAA" value={formatDec(season?.goals_against_average, 2)} color={primary} />
              <StatCard label="Record" value={goalieRecord(season)} color={primary} />
            </>
          ) : (
            <>
              <StatCard label="Points" value={season?.points} color={primary} />
              <StatCard label="Goals" value={season?.goals} color={primary} />
              <StatCard label="Assists" value={season?.assists} color={primary} />
            </>
          )}
        </div>
      </div>

      <div className="w-full mt-6">
        <Panel title="Advanced Season Stats">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {(isGoalie ? getAdvancedGoalieMetrics(season) : getAdvancedSkaterMetrics(season)).map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="w-full mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Last 5 Form">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Games" value={form_last_5?.games} />
            {isGoalie ? (
              <>
                <Metric label="Record" value={`${form_last_5?.wins ?? 0}-${form_last_5?.losses ?? 0}-${form_last_5?.ot_losses ?? 0}`} />
                <Metric label="Save %" value={formatDec(form_last_5?.save_pct, 3)} />
                <Metric label="GAA" value={formatDec(form_last_5?.gaa, 2)} />
              </>
            ) : (
              <>
                <Metric label="Goals" value={form_last_5?.goals} />
                <Metric label="Assists" value={form_last_5?.assists} />
                <Metric label="Points" value={form_last_5?.points} />
                <Metric label="P/GP" value={formatDec(form_last_5?.points_per_game, 2)} />
              </>
            )}
          </div>
        </Panel>

        <Panel title="Home / Away Splits">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Home GP" value={home_away_splits?.home?.games} />
            <Metric label="Away GP" value={home_away_splits?.away?.games} />
            {isGoalie ? (
              <>
                <Metric label="Home SV%" value={formatDec(home_away_splits?.home?.save_pct, 3)} />
                <Metric label="Away SV%" value={formatDec(home_away_splits?.away?.save_pct, 3)} />
                <Metric label="Home GAA" value={formatDec(home_away_splits?.home?.gaa, 2)} />
                <Metric label="Away GAA" value={formatDec(home_away_splits?.away?.gaa, 2)} />
              </>
            ) : (
              <>
                <Metric label="Home P/GP" value={formatDec(home_away_splits?.home?.points_per_game, 2)} />
                <Metric label="Away P/GP" value={formatDec(home_away_splits?.away?.points_per_game, 2)} />
                <Metric label="Home Points" value={home_away_splits?.home?.points} />
                <Metric label="Away Points" value={home_away_splits?.away?.points} />
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="w-full mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Bio">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Birth Date" value={player.birthDate ?? '-'} />
            <Metric label="Birth Place" value={birthPlace(player)} />
            <Metric label="Height (cm)" value={player.heightCm ?? '-'} />
            <Metric label="Weight (kg)" value={player.weightKg ?? '-'} />
            <Metric label="Shoots/Catches" value={player.shootsCatches ?? '-'} />
          </div>
        </Panel>

        <Panel title="Draft">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Draft Year" value={player.draftYear ?? '-'} />
            <Metric label="Draft Round" value={player.draftRound ?? '-'} />
            <Metric label="Overall Pick" value={player.draftOverallPick ?? '-'} />
          </div>
        </Panel>
      </div>

      <div className="w-full mt-6">
        <PerformanceTrend games={recent_games ?? []} isGoalie={isGoalie} teamColor={primary} />
      </div>

      <div className="w-full mt-6">
        <PlayerRadarChart
          season={season}
          seasonType={season_type}
          leaguePlayers={radarContext?.players ?? []}
          seasonId={radarContext?.season_id}
          teamColor={primary}
          loading={radarLoading}
          error={radarError}
        />
      </div>

      {/* TODO(#8): Add season game heatmap/timeline below trend/radar when backend supports configurable game-log window. */}
      <div className="w-full mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">Recent Games</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Opp</th>
                <th className="text-left p-3">H/A</th>
                {isGoalie ? (
                  <>
                    <th className="text-left p-3">GA</th>
                    <th className="text-left p-3">Saves</th>
                    <th className="text-left p-3">SV%</th>
                    <th className="text-left p-3">Decision</th>
                  </>
                ) : (
                  <>
                    <th className="text-left p-3">G</th>
                    <th className="text-left p-3">A</th>
                    <th className="text-left p-3">PTS</th>
                    <th className="text-left p-3">Shots</th>
                  </>
                )}
                <th className="text-left p-3">TOI</th>
              </tr>
            </thead>
            <tbody>
              {(recent_games ?? []).map((g) => (
                <tr key={g.game_id} className="border-t border-gray-100">
                  <td className="p-3">{g.game_date ?? '-'}</td>
                  <td className="p-3">{g.opponent_abbrev ?? '-'}</td>
                  <td className="p-3">{g.home_road ?? '-'}</td>
                  {isGoalie ? (
                    <>
                      <td className="p-3">{g.goals_against ?? 0}</td>
                      <td className="p-3">{g.saves ?? 0}</td>
                      <td className="p-3">{formatDec(g.save_pct, 3)}</td>
                      <td className="p-3">{g.decision ?? '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{g.goals ?? 0}</td>
                      <td className="p-3">{g.assists ?? 0}</td>
                      <td className="p-3">{g.points ?? 0}</td>
                      <td className="p-3">{g.shots ?? 0}</td>
                    </>
                  )}
                  <td className="p-3">{g.toi ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
      <p className="text-2xl font-bold" style={{ color: color ?? '#4f46e5' }}>{value ?? 0}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="text-gray-800 font-medium">{value ?? '-'}</p>
    </div>
  )
}

function formatDec(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toFixed(digits)
}

function goalieRecord(season) {
  if (!season) return '0-0-0'
  return `${season.wins ?? 0}-${season.losses ?? 0}-${season.ot_losses ?? 0}`
}

function birthPlace(player) {
  const parts = [player.birthCity, player.birthCountry].filter(Boolean)
  return parts.length ? parts.join(', ') : '-'
}

function getAdvancedSkaterMetrics(season) {
  return [
    { label: 'Plus/Minus', value: formatSigned(season?.plus_minus) },
    { label: 'Shooting %', value: formatPercent(season?.shooting_pct, 1) },
    { label: 'TOI / GP', value: formatDec(season?.toi_per_game, 2) },
    { label: 'Faceoff Win %', value: formatPercent(season?.faceoff_win_pct, 1) },
    { label: 'PP Goals', value: season?.power_play_goals ?? 0 },
    { label: 'PP Points', value: season?.pp_points ?? 0 },
    { label: 'SH Goals', value: season?.sh_goals ?? 0 },
    { label: 'SH Points', value: season?.sh_points ?? 0 },
    { label: 'EV Goals', value: season?.ev_goals ?? 0 },
    { label: 'EV Points', value: season?.ev_points ?? 0 },
    { label: 'GWG', value: season?.game_winning_goals ?? 0 },
    { label: 'Shots', value: season?.shots ?? 0 },
  ]
}

function getAdvancedGoalieMetrics(season) {
  return [
    { label: 'Shutouts', value: season?.shutouts ?? 0 },
    { label: 'Record', value: goalieRecord(season) },
    { label: 'Games Started', value: season?.games_started ?? 0 },
    { label: 'Save %', value: formatPercent(season?.save_pct, 1) },
    { label: 'GAA', value: formatDec(season?.goals_against_average, 2) },
    { label: 'Shots Against', value: season?.shots_against ?? 0 },
    { label: 'Goals Against', value: season?.goals_against ?? 0 },
    { label: 'TOI', value: season?.toi ?? '-' },
  ]
}

function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  const pct = n <= 1 ? n * 100 : n
  return `${pct.toFixed(digits)}%`
}

function formatSigned(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  if (n > 0) return `+${n}`
  return `${n}`
}
