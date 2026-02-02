import { useState, useEffect } from 'react';
import { Layout, Sparkles } from 'lucide-react';
import Home from './pages/Home';
import api from './api/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('register/', { username });
      const newToken = res.data.token;

      localStorage.setItem('token', newToken);
      localStorage.setItem('username', res.data.username);

      setToken(newToken);
      // We don't strictly need to set username state here if we rely on localStorage for the UI checks, 
      // but let's keep it consistent
      setUsername(res.data.username);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername('');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20 transform rotate-3">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Welcome to Playto</h1>
          <p className="text-slate-500 mb-8">Join the community conversation.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Pick a username"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Entering...' : 'Enter Community'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">Playto<span className="font-extralight opacity-70">Feed</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <Home />
    </div>
  );
}

export default App;
