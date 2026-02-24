import { useEffect, useState } from 'react'
import Nav from '../components/nav'
import TeamScatterPlot from '../components/TeamScatterPlot'
import { getTeamLogoUrl, teamAbbrFromName } from '../utils/teamColors'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function Teams() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/standings`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        setStandings(data.standings ?? [])
      } catch (e) {
        console.error('Error fetching standings:', e)
        setError('Failed to load team standings')
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [])

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
      <Nav />

      <h1 className="mb-6">Teams</h1>

      {loading ? <p className="mt-8 text-gray-500">Loading standings...</p> : null}
      {error ? <p className="mt-8 text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="w-full mt-6">
            <TeamScatterPlot standings={standings} />
          </div>

          <div className="w-full mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">Standings Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-right p-3">#</th>
                    <th className="text-left p-3">Team</th>
                    <th className="text-right p-3">GP</th>
                    <th className="text-right p-3">Record</th>
                    <th className="text-right p-3">Pts</th>
                    <th className="text-right p-3">GF/GP</th>
                    <th className="text-right p-3">GA/GP</th>
                    <th className="text-right p-3">PP%</th>
                    <th className="text-right p-3">PK%</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr key={team.id ?? `${team.team_full_name}-${index}`} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="text-right p-3 text-gray-500">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-2">
                          <img src={getTeamLogoUrl(teamAbbrFromName(team.team_full_name))} alt="" className="h-5 w-5" />
                          {team.team_full_name}
                        </span>
                      </td>
                      <td className="text-right p-3 text-gray-600">{team.games_played ?? 0}</td>
                      <td className="text-right p-3 text-gray-600">
                        {(team.wins ?? 0)}-{(team.losses ?? 0)}-{(team.ot_losses ?? 0)}
                      </td>
                      <td className="text-right p-3 font-semibold text-gray-900">{team.points ?? 0}</td>
                      <td className="text-right p-3 text-gray-600">{formatNum(team.goals_for_per_game, 2)}</td>
                      <td className="text-right p-3 text-gray-600">{formatNum(team.goals_against_per_game, 2)}</td>
                      <td className="text-right p-3 text-gray-600">{formatPercent(team.power_play_pct, 1)}</td>
                      <td className="text-right p-3 text-gray-600">{formatPercent(team.penalty_kill_pct, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function formatNum(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toFixed(digits)
}

function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  const pct = n <= 1 ? n * 100 : n
  return `${pct.toFixed(digits)}%`
}
