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
import Financials from './views/Financials';
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
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-border border-t-accent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-card-bg rounded-xl shadow-sm p-12 text-center border border-border"
        >
          <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Hammer className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Twisted Alchemy CRM</h1>
          <p className="text-text-secondary mb-8">
            Management System
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 bg-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
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
    { id: 'reports', label: 'Financials', icon: FileText },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-app-bg flex">
        {/* Sidebar */}
        <aside 
          className={`bg-white border-r border-border transition-all duration-300 flex flex-col z-20 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Hammer size={16} className="text-white" />
                </div>
                <span className="font-bold text-text-primary">Twisted Alchemy</span>
              </motion.div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-app-bg rounded-lg text-text-secondary transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  activeView === item.id 
                    ? 'bg-blue-50 text-accent' 
                    : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-border">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-text-secondary hover:bg-app-bg hover:text-text-primary transition-all`}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-text-primary capitalize">
              {activeView}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{user.displayName}</p>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-border"
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
                {activeView === 'reports' && <Financials />}
                {activeView === 'help' && <Help />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
