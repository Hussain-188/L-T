import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX, HiPlus, HiLogout, HiUser } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-white text-xl font-bold tracking-tight">
            FocusFeed
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/create"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <HiPlus className="w-4 h-4" />
              Create Post
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              {user?.displayName || user?.username}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <HiLogout className="w-4 h-4" />
              Logout
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 cursor-pointer"
          >
            {menuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/create"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-white/90 hover:text-white px-2 py-2 rounded transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Create Post
            </Link>
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-white/90 hover:text-white px-2 py-2 rounded transition-colors"
            >
              <HiUser className="w-4 h-4" /> Profile
            </Link>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-2 text-white/80 hover:text-white px-2 py-2 rounded transition-colors w-full cursor-pointer"
            >
              <HiLogout className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
