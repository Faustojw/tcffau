import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStations, updateStationStatus } from '../services/mockData';
import { Station } from '../types';
import { Save, Settings, Mail, Droplets, AlertTriangle, History, Fuel } from 'lucide-react';

const TANK_CAPACITY = 20000; // Capacidade simulada do tanque em Litros
const MIN_LEVEL_THRESHOLD = 1000; // Nível mínimo para alerta

export const DashboardOperator: React.FC = () => {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  
  // Estados para controle numérico de estoque
  const [gasolineLitres, setGasolineLitres] = useState<number>(0);
  const [dieselLitres, setDieselLitres] = useState<number>(0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'warning' | 'error', text: string} | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadStation = async () => {
      if (user?.stationId) {
        const stations = await getStations();
        const myStation = stations.find(s => s.id === user.stationId);
        if (myStation) {
          setStation(myStation);
          // Simula níveis baseados no status booleano se for a primeira carga
          // Se estiver disponível, assume 50% do tanque, se não, 0.
          setGasolineLitres(myStation.status.gasoline ? 10000 : 0);
          setDieselLitres(myStation.status.diesel ? 10000 : 0);
        }
      }
    };
    loadStation();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station) return;

    // Validação final antes de salvar (impede envio se negativo)
    if (gasolineLitres < 0 || dieselLitres < 0) {
        setMessage({ type: 'error', text: 'Os valores de estoque não podem ser negativos.' });
        return;
    }

    setIsSaving(true);
    setNotificationCount(0);
    setMessage(null);
    
    // Determina disponibilidade baseada nos litros (> 0)
    const isGasolineAvailable = gasolineLitres > 0;
    const isDieselAvailable = dieselLitres > 0;

    // Lógica de alerta de nível baixo
    const warnings: string[] = [];
    if (isGasolineAvailable && gasolineLitres < MIN_LEVEL_THRESHOLD) {
        warnings.push("Estoque de Gasolina baixo!");
    }
    if (isDieselAvailable && dieselLitres < MIN_LEVEL_THRESHOLD) {
        warnings.push("Estoque de Gasóleo baixo!");
    }

    // Chama API para atualizar status
    const result = await updateStationStatus(station.id, {
        gasoline: isGasolineAvailable,
        diesel: isDieselAvailable
    });
    
    setIsSaving(false);
    
    if (result.success) {
        setNotificationCount(result.notifiedCount);
        
        if (warnings.length > 0) {
            setMessage({
                type: 'warning',
                text: `Atualizado. Alerta: ${warnings.join(' ')} Notificações de nível crítico enviadas.`
            });
        } else {
            setMessage({
                type: 'success',
                text: 'Controle de estoque atualizado com sucesso!'
            });
        }
    } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar estoque.' });
    }
  };

  const calculatePercentage = (litres: number) => Math.min((litres / TANK_CAPACITY) * 100, 100);

  const getBarColor = (litres: number) => {
      if (litres <= 0) return 'bg-slate-600';
      if (litres < MIN_LEVEL_THRESHOLD) return 'bg-red-500';
      if (litres < TANK_CAPACITY * 0.3) return 'bg-yellow-500';
      return 'bg-green-500';
  };

  // Helper para lidar com mudanças no input com validação de máximo
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
      let numValue = Number(value);
      
      // Limita ao máximo
      if (numValue > TANK_CAPACITY) {
          numValue = TANK_CAPACITY;
      }
      
      setter(numValue);
  };

  if (!station) return <div className="p-8 text-white flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header do Posto */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl mb-8">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" /> Área do Operador
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">{station.name}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
                ID Operacional: <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-200">{station.stationCode}</span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 uppercase">Data do Sistema</p>
            <p className="text-white font-mono text-lg">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
            <div className={`mb-6 p-4 rounded-lg animate-fade-in flex flex-col gap-1 border ${
                message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' :
                message.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' :
                'bg-green-500/10 border-green-500/50 text-green-500'
            }`}>
                <div className="flex items-center gap-2 font-bold">
                    {message.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                    {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                    {message.text}
                </div>
                {notificationCount > 0 && (
                    <span className="text-sm flex items-center gap-1 opacity-90 ml-7">
                        <Mail className="w-3 h-3" />
                        {notificationCount} notificações enviadas aos clientes.
                    </span>
                )}
            </div>
      )}

      {/* FORMULÁRIO DE CONTROLE DE ESTOQUE (Figura 8) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-orange-500" />
                Controle de Estoque de Combustível
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <History className="w-4 h-4" />
                <span>Última atualização: {new Date(station.status.lastUpdated).toLocaleTimeString()}</span>
            </div>
        </div>

        <form onSubmit={handleSave} className="p-6">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                
                {/* GASOLINA CONTROL */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-bold text-white flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-orange-500" /> Gasolina
                        </label>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${gasolineLitres > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {gasolineLitres > 0 ? 'Disponível' : 'Esgotado'}
                        </span>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nível Atual (Litros)</label>
                        <input 
                            type="number"
                            min="0"
                            max={TANK_CAPACITY}
                            value={gasolineLitres}
                            onChange={(e) => handleInputChange(setGasolineLitres, e.target.value)}
                            className={`w-full bg-slate-800 rounded-lg px-4 py-3 text-white text-lg font-mono focus:outline-none transition-colors ${
                                gasolineLitres < 0 
                                ? 'border-2 border-red-500 focus:ring-red-500 focus:ring-1' 
                                : 'border border-slate-600 focus:ring-2 focus:ring-orange-500'
                            }`}
                        />
                        {gasolineLitres < 0 && <span className="text-xs text-red-500 mt-1 block">O valor não pode ser negativo.</span>}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden mb-2 relative">
                        <div 
                            className={`h-full transition-all duration-500 ${getBarColor(gasolineLitres)}`}
                            style={{ width: `${gasolineLitres < 0 ? 0 : calculatePercentage(gasolineLitres)}%` }}
                        ></div>
                         {/* Min Threshold Marker */}
                         <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: `${(MIN_LEVEL_THRESHOLD/TANK_CAPACITY)*100}%` }} title="Nível Mínimo"></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>0L</span>
                        <span className={gasolineLitres < MIN_LEVEL_THRESHOLD && gasolineLitres > 0 ? "text-red-400 font-bold animate-pulse" : ""}>
                            {gasolineLitres < MIN_LEVEL_THRESHOLD && gasolineLitres > 0 ? 'NÍVEL CRÍTICO' : `${Math.round(calculatePercentage(Math.max(0, gasolineLitres)))}%`}
                        </span>
                        <span>{TANK_CAPACITY/1000}k L</span>
                    </div>
                </div>

                {/* DIESEL CONTROL */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-bold text-white flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-yellow-500" /> Gasóleo
                        </label>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${dieselLitres > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {dieselLitres > 0 ? 'Disponível' : 'Esgotado'}
                        </span>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nível Atual (Litros)</label>
                        <input 
                            type="number"
                            min="0"
                            max={TANK_CAPACITY}
                            value={dieselLitres}
                            onChange={(e) => handleInputChange(setDieselLitres, e.target.value)}
                            className={`w-full bg-slate-800 rounded-lg px-4 py-3 text-white text-lg font-mono focus:outline-none transition-colors ${
                                dieselLitres < 0 
                                ? 'border-2 border-red-500 focus:ring-red-500 focus:ring-1' 
                                : 'border border-slate-600 focus:ring-2 focus:ring-orange-500'
                            }`}
                        />
                        {dieselLitres < 0 && <span className="text-xs text-red-500 mt-1 block">O valor não pode ser negativo.</span>}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden mb-2 relative">
                        <div 
                            className={`h-full transition-all duration-500 ${getBarColor(dieselLitres)}`}
                            style={{ width: `${dieselLitres < 0 ? 0 : calculatePercentage(dieselLitres)}%` }}
                        ></div>
                        {/* Min Threshold Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: `${(MIN_LEVEL_THRESHOLD/TANK_CAPACITY)*100}%` }} title="Nível Mínimo"></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                        <span>0L</span>
                        <span className={dieselLitres < MIN_LEVEL_THRESHOLD && dieselLitres > 0 ? "text-red-400 font-bold animate-pulse" : ""}>
                             {dieselLitres < MIN_LEVEL_THRESHOLD && dieselLitres > 0 ? 'NÍVEL CRÍTICO' : `${Math.round(calculatePercentage(Math.max(0, dieselLitres)))}%`}
                        </span>
                        <span>{TANK_CAPACITY/1000}k L</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-700 gap-4">
                <div className="text-sm text-slate-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>Atualizações são registradas com data/hora automaticamente.</span>
                </div>
                <button 
                    type="submit"
                    disabled={isSaving || gasolineLitres < 0 || dieselLitres < 0}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20"
                >
                    {isSaving ? 'Salvando...' : (
                        <>
                            <Save className="w-5 h-5" />
                            Atualizar Estoque
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 className="text-slate-400 text-sm mb-1">Status do Sistema</h4>
            <p className="text-green-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
            </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 className="text-slate-400 text-sm mb-1">Notificações Disparadas</h4>
            <p className="text-white font-mono text-lg">
                {notificationCount}
            </p>
        </div>
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 className="text-slate-400 text-sm mb-1">Alertas de Nível Baixo</h4>
            <p className="text-white font-mono text-lg">
                {(gasolineLitres < MIN_LEVEL_THRESHOLD && gasolineLitres > 0 ? 1 : 0) + (dieselLitres < MIN_LEVEL_THRESHOLD && dieselLitres > 0 ? 1 : 0)}
            </p>
        </div>
      </div>
    </div>
  );
};