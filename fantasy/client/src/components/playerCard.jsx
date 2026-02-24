import { Link } from 'react-router-dom'
import { getTeamLogoUrl } from '../utils/teamColors'

export default function PlayerCard({ player }) {
  const playerId = player.id ?? player['Player ID']

  return (
    <Link
      to={`/players/${playerId}`}
      className="btn-shine w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer p-2 sm:p-0"
    >
      <div className="flex items-center gap-3 sm:block">
        {player.headshot && (
          <img
            src={player.headshot}
            alt={`${player.firstName} ${player.lastName}`}
            className="h-16 w-16 sm:h-auto sm:w-full rounded-md sm:rounded-none object-cover shrink-0"
            loading="lazy"
          />
        )}

        <div className="min-w-0 flex-1 sm:p-2 sm:text-center">
          <p className="font-medium text-gray-800 truncate sm:truncate-none">
            {player.firstName} {player.lastName}
          </p>
          <div className="mt-1 flex items-center gap-2 sm:hidden text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{player.position}</span>
            <span className="text-[11px] bg-gray-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
              {player.teamAbbr && <img src={getTeamLogoUrl(player.teamAbbr)} alt="" className="h-3.5 w-3.5" />}
              {player.teamAbbr}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-gray-600 sm:hidden">
        <span>GP {player.gamesPlayed}</span>
        <span>PTS {player.points}</span>
        <span>G {player.goals}</span>
        <span>A {player.assists}</span>
      </div>

      <div className="hidden sm:block p-2 bg-gray-50 w-full rounded-b-lg text-sm text-gray-600">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-gray-800">{player.position}</span>
          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
            {player.teamAbbr && <img src={getTeamLogoUrl(player.teamAbbr)} alt="" className="h-3.5 w-3.5" />}
            {player.teamAbbr}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span>GP: {player.gamesPlayed}</span>
          <span>PTS: {player.points}</span>
          <span>G: {player.goals}</span>
          <span>A: {player.assists}</span>
        </div>
      </div>
    </Link>
  )
}
