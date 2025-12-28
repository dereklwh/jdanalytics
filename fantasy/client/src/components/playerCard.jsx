

export default function PlayerCard({ player }) {
    return (
        <div className="border p-4 w-full">
            <h2 className="text-xl font-bold">{player.name}</h2>
            <p>Position: {player.position}</p>
            <p>Team: {player.team}</p>
            <p>Points: {player.points}</p>
        </div>
    );
}