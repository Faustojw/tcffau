import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useStations } from '../context/StationContext';
import { updateUserPreferences } from '../services/mockData';
import { StationCard } from '../components/StationCard';
import { Bell, Mail, MessageCircle, Check, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle, Clock, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Link } from 'react-router-dom';

export const DashboardUser: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllRead } = useNotifications();
  const { stations } = useStations(); // Get real stations from context
  const [notifEmail, setNotifEmail] = useState(user?.preferences?.email ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(user?.preferences?.whatsapp ?? true);

  useEffect(() => {
    if (user?.preferences) {
        setNotifEmail(user.preferences.email);
        setNotifWhatsapp(user.preferences.whatsapp);
    }
  }, [user]);

  const handleTogglePreference = async (type: 'email' | 'whatsapp') => {
      if (!user) return;
      
      let newEmail = notifEmail;
      let newWhatsapp = notifWhatsapp;

      if (type === 'email') {
          newEmail = !notifEmail;
          setNotifEmail(newEmail);
      } else {
          newWhatsapp = !notifWhatsapp;
          setNotifWhatsapp(newWhatsapp);
      }

      await updateUserPreferences(user.id, { email: newEmail, whatsapp: newWhatsapp });
  };

  // Filter stations based on user favorites
  const myStations = stations.filter(station => user?.favorites?.includes(station.id));

  const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
        default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Profile Info */}
        <div className="md:w-1/3 space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-2">Olá, {user?.name}</h2>
                <p className="text-slate-400 text-sm">Gerencie suas preferências e postos favoritos.</p>
                
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Mail className={`w-5 h-5 ${notifEmail ? 'text-orange-500' : 'text-slate-500'}`} />
                            <span className="text-slate-300">Notificações por E-mail</span>
                        </div>
                        <button 
                            onClick={() => handleTogglePreference('email')}
                            className={`w-10 h-6 rounded-full p-1 transition-colors ${notifEmail ? 'bg-orange-500' : 'bg-slate-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifEmail ? 'translate-x-4' : ''}`}></div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <MessageCircle className={`w-5 h-5 ${notifWhatsapp ? 'text-green-500' : 'text-slate-500'}`} />
                            <span className="text-slate-300">Alertas WhatsApp</span>
                        </div>
                        <button 
                            onClick={() => handleTogglePreference('whatsapp')}
                            className={`w-10 h-6 rounded-full p-1 transition-colors ${notifWhatsapp ? 'bg-green-500' : 'bg-slate-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifWhatsapp ? 'translate-x-4' : ''}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Dica Rápida
                </h3>
                <p className="text-slate-400 text-sm">
                    Adicione mais postos aos seus favoritos clicando no ícone de coração <Heart className="w-3 h-3 inline text-red-500 fill-current" /> na lista principal para receber alertas específicos deles.
                </p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="md:w-2/3 space-y-8">
            
            {/* Notifications Area */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-bold text-white">Central de Notificações</h2>
                        {unreadCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} nova(s)
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllRead}
                            className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
                
                <div className="max-h-80 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Você não tem notificações no momento.</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={`flex gap-4 p-4 rounded-lg border transition-all ${
                                    notification.read 
                                    ? 'bg-slate-800/50 border-slate-700 opacity-60' 
                                    : 'bg-slate-700/30 border-slate-600 shadow-md'
                                }`}
                            >
                                <div className="shrink-0 pt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 whitespace-nowrap ml-2">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR } as any)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                                    
                                    {!notification.read && (
                                        <button 
                                            onClick={() => markAsRead(notification.id)}
                                            className="mt-2 text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1 font-medium"
                                        >
                                            <Check className="w-3 h-3" /> Marcar como lida
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Favorites List */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-red-500 fill-current" />
                    Meus Postos Favoritos
                </h2>
                
                {myStations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myStations.map(station => (
                            <StationCard key={station.id} station={station} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 border-dashed">
                        <Heart className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-500 text-lg">Você ainda não favoritou nenhum posto.</p>
                        <Link to="/" className="text-orange-500 hover:text-orange-400 text-sm mt-2 inline-block">
                            Ver todos os postos
                        </Link>
                    </div>
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
};