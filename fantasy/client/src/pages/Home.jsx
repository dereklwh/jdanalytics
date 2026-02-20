import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-12 px-6">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">jdanalytics</h1>
        <p className="text-gray-500 text-lg">NHL stats, elegantly.</p>
      </div>
      <div className="flex gap-6 w-full max-w-xl">
        <Link
          to="/players"
          className="btn-shine-light flex-1 flex flex-col items-center gap-2 py-10 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 hover:border-yellow-400 hover:shadow-md"
        >
          <span className="text-gray-900 text-2xl font-semibold">Players</span>
          <span className="text-gray-500 text-sm">Browse skaters &amp; goalies</span>
        </Link>
        <Link
          to="/teams"
          className="btn-shine-light flex-1 flex flex-col items-center gap-2 py-10 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 hover:border-yellow-400 hover:shadow-md"
        >
          <span className="text-gray-900 text-2xl font-semibold">Teams</span>
          <span className="text-gray-500 text-sm">League standings</span>
        </Link>
      </div>
    </div>
  )
}
