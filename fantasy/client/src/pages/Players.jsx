import { useEffect, useMemo, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import Nav from '../components/nav'

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

  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  // Filter and sort state
  const [position, setPosition] = useState('')
  const [team, setTeam] = useState('')
  const [sortBy, setSortBy] = useState('points')
  const [sortOrder, setSortOrder] = useState('desc')
  const [teams, setTeams] = useState([])

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
  }, [searchText, position, team, sortBy, sortOrder, debounce])

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
      <Nav />
      <h1 className="mb-6">Players</h1>

      <div className="relative mt-4 w-full sm:w-2/3 lg:w-1/2">
        <input
          type="text"
          placeholder="Search players…"
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          className="border-b px-10 py-2 text-black w-full"
        />
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
      </div>

      <div className="flex flex-wrap gap-4 mt-4 w-full sm:w-2/3 lg:w-1/2">
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="border p-2 rounded flex-1 min-w-[120px]"
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
          className="border p-2 rounded flex-1 min-w-[120px]"
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
          className="border p-2 rounded flex-1 min-w-[120px]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort by {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="border p-2 rounded min-w-[60px] hover:bg-gray-100"
          title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 w-full">
        {players.map((player) => (
          <div
            key={player.id ?? player['Player ID']}
            className="flex flex-col items-center rounded-lg border hover:bg-indigo-200 transition-colors duration-300"
          >
            <p className="p-2 font-medium">
              {player.firstName} {player.lastName}
            </p>

            {player.headshot && (
              <img
                src={player.headshot}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-full object-cover"
                loading="lazy"
              />
            )}

            <div className="p-2 bg-gray-100 w-full rounded-b-lg text-sm text-gray-700">
              <p className="font-bold text-black">Career Stats</p>
              <p>Games Played: {player.gamesPlayed}</p>
              <p>Goals: {player.goals}</p>
              <p>Assists: {player.assists}</p>
              <p>Points: {player.points}</p>
              <p>Position: {player.position}</p>
              <p>Team: {player.teamAbbr}</p>
            </div>
          </div>
        ))}
      </div>
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
