import { Link } from 'react-router-dom'

export default function PlayerCard({ player }) {
  const playerId = player.id ?? player['Player ID']

  return (
    <Link
      to={`/players/${playerId}`}
      className="group flex flex-col items-center rounded-lg border border-gray-200 bg-white
                 transition-all duration-300 ease-out
                 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-400
                 cursor-pointer"
    >
      <p className="p-2 font-medium text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
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

      <div className="p-2 bg-gray-50 w-full rounded-b-lg text-sm text-gray-600">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-gray-800">{player.position}</span>
          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{player.teamAbbr}</span>
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
