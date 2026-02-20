import { Link } from 'react-router-dom'

export default function Nav() {
    return (
        <nav className="w-full top-0">
            <div className='flex content-center'>
                {/* get logo */}
                <Link to="/" className='text-3xl sm:text-4xl font-bold py-2 sm:py-3 text-black hover:text-gray-600 transition-colors'>
                    jdanalytics
                </Link>
            </div>
        </nav>

    );
}
