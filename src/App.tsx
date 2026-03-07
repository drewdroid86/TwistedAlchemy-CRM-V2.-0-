import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  LayoutDashboard, 
  Package, 
  Hammer, 
  Users, 
  LogOut, 
  LogIn,
  Menu,
  X,
  FileText,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Views
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import Projects from './views/Projects';
import Customers from './views/Customers';
import Reports from './views/Reports';
import Purchasing from './views/Purchasing';
import Help from './views/Help';

type View = 'dashboard' | 'inventory' | 'projects' | 'customers' | 'reports' | 'purchasing' | 'help';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-stone-200 border-t-olive-accent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-bg p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-12 text-center border border-stone-100"
        >
          <div className="w-20 h-20 bg-olive-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Hammer className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-serif italic text-stone-900 mb-4">Twisted Alchemy CRM</h1>
          <p className="text-stone-500 mb-10 leading-relaxed">
            Twisted Twig & Wood Grain Alchemist Management System
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-olive-accent text-white rounded-2xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'projects', label: 'Projects', icon: Hammer },
    { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-warm-bg flex">
        {/* Sidebar */}
        <aside 
          className={`bg-dark-olive transition-all duration-300 flex flex-col shadow-2xl z-20 ${
            isSidebarOpen ? 'w-72' : 'w-20'
          }`}
        >
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-olive-accent rounded-lg flex items-center justify-center">
                  <Hammer size={16} className="text-white" />
                </div>
                <span className="font-serif italic font-bold text-white">Twisted Alchemy</span>
              </motion.div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-stone-400 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                  activeView === item.id 
                    ? 'bg-olive-accent text-white shadow-lg' 
                    : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={22} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-white/5">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 p-3 rounded-xl text-stone-400 hover:bg-white/5 hover:text-white transition-all`}
            >
              <LogOut size={22} />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="text-2xl font-serif italic text-stone-900 capitalize">
              {activeView}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-stone-900">{user.displayName}</p>
                <p className="text-xs text-stone-500">{user.email}</p>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-stone-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'inventory' && <Inventory />}
                {activeView === 'projects' && <Projects />}
                {activeView === 'purchasing' && <Purchasing />}
                {activeView === 'customers' && <Customers />}
                {activeView === 'reports' && <Reports />}
                {activeView === 'help' && <Help />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
