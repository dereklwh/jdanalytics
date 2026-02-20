import { useEffect, useMemo, useState } from 'react'
import { FaSearch, FaTh, FaList, FaCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import Nav from '../components/nav'
import PlayerCard from '../components/playerCard'
import BubbleView from '../components/BubbleView'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const POSITIONS = [
  { value: '', label: 'All Positions' },
  { value: 'C', label: 'Center' },
  { value: 'L', label: 'Left Wing' },
  { value: 'R', label: 'Right Wing' },
  { value: 'D', label: 'Defense' },
  { value: 'G', label: 'Goalie' },
]

const SORT_OPTIONS = [
  { value: 'points', label: 'Points' },
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'gamesPlayed', label: 'Games Played' },
  { value: 'firstName', label: 'Name' },
]

export default function Players() {
  const [players, setPlayers] = useState([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statsScope, setStatsScope] = useState('season')

  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  // Filter and sort state
  const [position, setPosition] = useState('')
  const [team, setTeam] = useState('')
  const [sortBy, setSortBy] = useState('points')
  const [sortOrder, setSortOrder] = useState('desc')
  const [teams, setTeams] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  // TODO(#5): Add compare selection state (2-3 players) and action to open `/compare`.

  // small debounce helper
  const debounce = useMemo(() => {
    let t
    return (fn, wait = 250) => {
      clearTimeout(t)
      t = setTimeout(fn, wait)
    }
  }, [])

  const fetchPlayers = async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        q: searchText,
        page: pageNum,
        limit,
        position,
        team,
        sort_by: sortBy,
        sort_order: sortOrder,
        stats_scope: statsScope,
      })
      const res = await fetch(`${API_BASE}/players?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setPlayers(data.data)
      setTotal(data.total)
    } catch (e) {
      console.error('Error fetching players:', e)
      setError('Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  // Fetch teams list on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/teams`)
        if (res.ok) {
          const data = await res.json()
          setTeams(data.teams || [])
        }
      } catch (e) {
        console.error('Error fetching teams:', e)
      }
    }
    fetchTeams()
  }, [])

  // Fetch players when page changes
  useEffect(() => {
    fetchPlayers(page)
  }, [page])

  // Reset to page 1 and fetch when filters/sort/search change
  useEffect(() => {
    debounce(() => {
      setPage(1)
      fetchPlayers(1)
    }, 250)
  }, [searchText, position, team, sortBy, sortOrder, statsScope, debounce])

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
      <Nav />
      <h1 className="mb-3 mt-1 text-3xl sm:text-4xl">Players</h1>

      <div className="relative mt-2 w-full sm:w-2/3 lg:w-1/2">
        <input
          type="text"
          placeholder="Search players…"
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          className="border-b px-10 py-2 text-black w-full"
        />
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3 w-full sm:w-2/3 lg:w-5/6">
        <select
          value={statsScope}
          onChange={(e) => setStatsScope(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="season">Season Stats</option>
          <option value="career">Career Stats</option>
        </select>

        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="border p-2 rounded w-full"
        >
          {POSITIONS.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>

        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border p-2 rounded w-full"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort by {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="p-2 rounded w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      <div className="flex justify-between items-center mt-3 w-full">
        <div>
          {loading && <p className="text-gray-500">Loading…</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Grid view"
          >
            <FaTh />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded ${viewMode === 'compact' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Compact view"
          >
            <FaList />
          </button>
          <button
            onClick={() => setViewMode('bubble')}
            className={`p-2 rounded ${viewMode === 'bubble' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Bubble view"
          >
            <FaCircle />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-3 w-full">
          {players.map((player) => (
            <PlayerCard key={player.id ?? player['Player ID']} player={player} />
          ))}
        </div>
      ) : viewMode === 'bubble' ? (
        <BubbleView players={players} />
      ) : (
        <div className="w-full mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="p-3 w-10">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Pos</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-right">GP</th>
                <th className="p-3 text-right">G</th>
                <th className="p-3 text-right">A</th>
                <th className="p-3 text-right">PTS</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <Link
                  key={player.id ?? player['Player ID']}
                  to={`/players/${player.id ?? player['Player ID']}`}
                  className="contents"
                >
                  <tr className="border-t border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors">
                    <td className="p-3 text-gray-400">{(page - 1) * limit + i + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{player.firstName} {player.lastName}</td>
                    <td className="p-3 text-gray-600">{player.position}</td>
                    <td className="p-3 text-gray-600">{player.teamAbbr}</td>
                    <td className="p-3 text-right text-gray-600">{player.gamesPlayed ?? 0}</td>
                    <td className="p-3 text-right text-gray-600">{player.goals ?? 0}</td>
                    <td className="p-3 text-right text-gray-600">{player.assists ?? 0}</td>
                    <td className="p-3 text-right font-semibold text-gray-800">{player.points ?? 0}</td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > limit && (
        <div className="flex items-center gap-4 mt-8">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(total / limit)}
          </span>

          <button
            disabled={page >= Math.ceil(total / limit) || loading}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
