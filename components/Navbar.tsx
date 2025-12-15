import React, { useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useStations } from '../context/StationContext';
import { Fuel, LogOut, User as UserIcon, LayoutDashboard, Menu, X, Bell, Check, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { refreshStations, isLoading: isStationsLoading } = useStations();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case UserRole.ADMIN: return '/admin';
      case UserRole.OPERATOR: return '/operator';
      default: return '/dashboard';
    }
  };

  const handleScrollTo = (id: string) => {
    setIsMenuOpen(false);
    
    const scrollToElement = () => {
        if (id === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const element = document.getElementById(id);
            if (element) {
                const headerOffset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    };

    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(scrollToElement, 300); // Wait for navigation/render
    } else {
        scrollToElement();
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" onClick={() => handleScrollTo('top')} className="flex-shrink-0 flex items-center gap-2">
              <Fuel className="h-8 w-8 text-orange-500" />
              <span className="font-bold text-xl text-white tracking-tight">Fuel<span className="text-orange-500">Soyo</span></span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => handleScrollTo('top')} className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Início</button>
            <button onClick={() => handleScrollTo('postos')} className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Postos</button>
            <button onClick={() => handleScrollTo('mapa')} className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Mapa</button>
            
            <button 
                onClick={refreshStations} 
                disabled={isStationsLoading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-orange-500 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
                title="Atualizar lista de postos"
            >
                <RefreshCw className={`h-4 w-4 ${isStationsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">Atualizar</span>
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 ml-4">
                
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors relative"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                                <h3 className="text-sm font-bold text-white">Notificações</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllRead}
                                        className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Marcar lidas
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-slate-500 text-sm">
                                        Nenhuma notificação recente.
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => {
                                                markAsRead(n.id);
                                                if (n.link) {
                                                    navigate(n.link);
                                                    setIsNotifOpen(false);
                                                }
                                            }}
                                            className={`p-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors ${!n.read ? 'bg-slate-700/20' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm ${!n.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                                    {n.title}
                                                </h4>
                                                {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></span>}
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                                            <span className="text-[10px] text-slate-500 mt-1 block">
                                                {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: ptBR } as any)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-700"></div>

                <Link 
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center gap-2 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-sm">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-orange-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/login" className="text-white hover:text-orange-400 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link to="/register" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile button */}
          <div className="flex md:hidden items-center gap-2">
            <button 
                onClick={refreshStations} 
                disabled={isStationsLoading}
                className="p-2 text-orange-500 hover:text-orange-400"
            >
                <RefreshCw className={`h-5 w-5 ${isStationsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <button onClick={() => handleScrollTo('top')} className="text-slate-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium">Início</button>
             <button onClick={() => handleScrollTo('postos')} className="text-slate-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium">Postos</button>
             <button onClick={() => handleScrollTo('mapa')} className="text-slate-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium">Mapa</button>
             
             {user ? (
               <>
                <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                {/* Mobile Notification Link */}
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="text-left w-full text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2">
                    Notificações 
                    {unreadCount > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-left w-full text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Sair</button>
               </>
             ) : (
               <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-orange-500 hover:text-orange-400 block px-3 py-2 rounded-md text-base font-medium">Cadastrar</Link>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};