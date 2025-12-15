import React, { useState, useEffect } from 'react';
import { Search, Map as MapIcon, Bell, List, Building2, Loader2, Navigation, MapPin, Plane, ShoppingCart, Factory, Hotel } from 'lucide-react';
import { useStations } from '../context/StationContext';
import { Station } from '../types';
import { StationCard } from '../components/StationCard';
import { JoinPartnerSection } from '../components/JoinPartnerSection';
import { StationRequestModal } from '../components/StationRequestModal';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { stations, isLoading, refreshStations } = useStations(); // Use Context
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearestStations, setNearestStations] = useState<{station: Station, distance: number}[]>([]);
  const [locatingUser, setLocatingUser] = useState(false);

  // Refresh stations on mount to ensure map is up to date
  useEffect(() => {
    refreshStations();
  }, [refreshStations]);

  const heroImages = [
    'https://picsum.photos/id/111/1920/1080',
    'https://picsum.photos/id/188/1920/1080',
    'https://picsum.photos/id/203/1920/1080'
  ];

  // Static Landmarks for the Map
  const landmarks = [
    // Área Industrial (Topo/Direita perto do rio)
    { id: 'lng', top: '30%', left: '80%', label: 'Angola LNG', icon: <Factory className="w-3 h-3 text-white" />, color: 'bg-slate-700' },
    // Base Kwanda (Esquerda/Centro)
    { id: 'kwanda', top: '42%', left: '30%', label: 'Kwanda Base', icon: <Building2 className="w-3 h-3 text-white" />, color: 'bg-pink-600' },
    // Centro da Cidade
    { id: 'shoprite', top: '58%', left: '52%', label: 'Shoprite Soyo', icon: <ShoppingCart className="w-3 h-3 text-white" />, color: 'bg-blue-500' },
    // Aeroporto (Perto da pista desenhada)
    { id: 'airport', top: '48%', left: '62%', label: 'Aeroporto', icon: <Plane className="w-3 h-3 text-white" />, color: 'bg-blue-600' },
    // Hoteis (Sul)
    { id: 'hotel', top: '75%', left: '48%', label: 'Hotel Oui', icon: <Hotel className="w-3 h-3 text-white" />, color: 'bg-pink-500' },
  ];

  // Dynamic Station Pins
  const stationPins = stations.map(s => {
      // Determine color based on availability
      const isAvailable = s.status.gasoline || s.status.diesel;
      const color = isAvailable ? 'bg-green-600' : 'bg-red-600';
      
      return {
          id: s.id,
          top: `${s.coords.y}%`,
          left: `${s.coords.x}%`,
          label: s.name,
          icon: <MapPin className="w-3 h-3 text-white" />,
          color: color,
          isStation: true
      };
  });

  // Combine for rendering
  const allMapPins = [...landmarks, ...stationPins];

  // Hero Image Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Haversine Formula for Distance (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocalização não é suportada pelo seu navegador.");
        return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setUserLocation({ lat: userLat, lng: userLng });

            // Calculate distances for all stations
            const stationsWithDistance = stations
                // Filter only available stations (Gasoline or Diesel)
                .filter(s => s.status.gasoline || s.status.diesel)
                .map(s => {
                    // Use mock location if available in data, else ignore
                    if (s.location) {
                        return {
                            station: s,
                            distance: calculateDistance(userLat, userLng, s.location.lat, s.location.lng)
                        };
                    }
                    return null;
                })
                .filter((item): item is {station: Station, distance: number} => item !== null)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3); // Top 3

            setNearestStations(stationsWithDistance);
            setLocatingUser(false);
        },
        (error) => {
            console.error("Error getting location", error);
            setLocatingUser(false);
            alert("Não foi possível obter sua localização. Verifique as permissões.");
        }
    );
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[500px] w-full flex items-center justify-center">
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={img} alt="Posto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/70"></div>
          </div>
        ))}

        <div className="relative z-10 max-w-4xl w-full px-4 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Disponibilidade de Combustível <span className="text-orange-500">em Tempo Real</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Encontre gasolina e gasóleo na cidade do Soyo. Monitore postos, receba alertas e evite filas.
            </p>
          </div>

          <div className="relative max-w-xl mx-auto">
            <input 
              type="text" 
              placeholder="Buscar posto por nome ou endereço..." 
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button 
                onClick={handleGetLocation}
                disabled={locatingUser}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-orange-900/30"
            >
                {locatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {userLocation ? 'Atualizar Localização' : 'Postos Próximos'}
            </button>
          </div>
        </div>
      </div>

      {/* Owner Call to Action Strip */}
      <div className="bg-orange-600 border-y border-orange-500 shadow-lg relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center md:text-left">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                    <Building2 className="h-6 w-6" />
                    Você é dono de um posto de combustível?
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                    Cadastre-se para gerenciar a disponibilidade em tempo real.
                </p>
            </div>
            <button
                onClick={() => setIsOwnerModalOpen(true)}
                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-full font-bold shadow-md transition-all transform hover:scale-105 whitespace-nowrap"
            >
                Cadastrar Posto
            </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-slate-900 py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center space-y-3">
                <div className="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-orange-500">
                    <Bell />
                </div>
                <h3 className="text-white font-bold">Notificações em Tempo Real</h3>
                <p className="text-slate-400 text-sm">Receba alertas instantâneos via WhatsApp e E-mail quando houver reabastecimento.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center space-y-3">
                <div className="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-orange-500">
                    <MapIcon />
                </div>
                <h3 className="text-white font-bold">Rotas Otimizadas</h3>
                <p className="text-slate-400 text-sm">Encontre o caminho mais rápido até o posto de combustível disponível mais próximo.</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center space-y-3">
                <div className="bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-orange-500">
                    <List />
                </div>
                <h3 className="text-white font-bold">Histórico e Favoritos</h3>
                <p className="text-slate-400 text-sm">Salve seus postos favoritos e veja o histórico de disponibilidade.</p>
            </div>
        </div>
      </div>

      {/* Partner Section (Maintained for detailed info) */}
      <JoinPartnerSection />

      {/* Stations Grid */}
      <div id="postos" className="max-w-7xl mx-auto px-4 py-16 w-full">
        
        {/* Nearest Stations Section (Conditionally Rendered) */}
        {nearestStations.length > 0 && (
            <div className="mb-12 animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500/20 p-2 rounded-full">
                        <Navigation className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Recomendados para Você</h2>
                        <p className="text-slate-400 text-sm">Postos com combustível disponível mais próximos da sua localização.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nearestStations.map(item => (
                        <div key={`nearest-${item.station.id}`} className="ring-2 ring-green-500/50 rounded-xl">
                            <StationCard station={item.station} distance={item.distance} />
                        </div>
                    ))}
                </div>
                <div className="my-8 border-b border-slate-700"></div>
            </div>
        )}

        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Todos os Postos em Soyo</h2>
                <p className="text-slate-400">
                    {isLoading ? 'Carregando dados...' : `Total de ${filteredStations.length} postos encontrados`}
                </p>
            </div>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-orange-500" />
                <p>Buscando informações em tempo real...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map(station => (
                <StationCard key={station.id} station={station} />
              ))}
              {filteredStations.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                    <p className="text-lg mb-2">Nenhum posto encontrado.</p>
                    <p className="text-sm">Tente buscar por outro nome ou endereço.</p>
                </div>
              )}
            </div>
        )}
      </div>

      {/* Static Image Map Section - Visual Upgrade */}
      <div id="mapa" className="bg-slate-950 py-16 border-t border-slate-800 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8">
              <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Mapa de Monitoramento (Soyo)</h2>
                  <p className="text-slate-400">Visualização detalhada da cidade, Aeroporto e Zona Industrial.</p>
              </div>
              <div className="flex gap-4 text-xs font-medium text-slate-400 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Disponível</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pouco Estoque</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Esgotado</div>
              </div>
            </div>
            
            <div className="relative w-full h-[500px] md:h-[650px] bg-[#bfdbfe] rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl group">
                
                {/* SVG MAP SIMULATION */}
                {/* This simulates the geography of Soyo: River mouth at top, land at bottom/right */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
                    {/* Water Pattern (Subtle) */}
                    <defs>
                        <pattern id="water" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M0 20 Q10 15 20 20 T40 20" stroke="#93c5fd" strokeWidth="0.5" fill="none" opacity="0.3"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#water)" />

                    {/* Land Mass - Abstract Soyo Peninsula */}
                    <path 
                        d="M0,600 L0,300 Q50,280 100,300 T200,250 T350,200 L800,150 L800,600 Z" 
                        fill="#f1f5f9" 
                        stroke="#cbd5e1" 
                        strokeWidth="2"
                    />
                    
                    {/* Industrial Zone (Top Right) */}
                    <path d="M600,600 L600,175 L800,150 L800,600 Z" fill="#e2e8f0" />

                    {/* Main Roads */}
                    {/* Highway from South */}
                    <path d="M150,600 L200,400 L350,200 L600,180" stroke="#cbd5e1" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <path d="M150,600 L200,400 L350,200 L600,180" stroke="#ffffff" strokeWidth="8" fill="none" strokeLinecap="round" />
                    
                    {/* Cross City Road */}
                    <path d="M200,400 L500,500 L800,450" stroke="#cbd5e1" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M200,400 L500,500 L800,450" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" />
                    
                    {/* Secondary Roads */}
                    <path d="M350,200 L400,100" stroke="#cbd5e1" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <path d="M500,500 L550,600" stroke="#cbd5e1" strokeWidth="6" fill="none" strokeLinecap="round" />
                    
                    {/* Airport Runway Simulation */}
                    <rect x="450" y="280" width="140" height="18" fill="#94a3b8" transform="rotate(-10 520 289)" rx="2" />
                    <text x="500" y="320" fontSize="10" fill="#64748b" fontWeight="bold">Soyo Airport</text>
                </svg>
                
                {/* Render Dynamic & Static Pins */}
                {allMapPins.map((pin) => (
                    <div 
                        key={pin.id}
                        className="absolute group-hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center"
                        style={{ top: pin.top, left: pin.left }}
                    >
                        {/* Label Badge */}
                        <div className="bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-md mb-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            {pin.label}
                        </div>
                        
                        {/* Pin Icon */}
                        <div className={`w-8 h-8 ${pin.color} rounded-full border-2 border-white shadow-lg flex items-center justify-center relative z-10 transition-colors hover:bg-orange-500`}>
                            {pin.icon}
                        </div>
                        
                        {/* Pulse Effect */}
                        <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-3 h-3 ${pin.color} rounded-full animate-ping opacity-50`}></div>
                    </div>
                ))}

                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <div className="inline-block bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl max-w-sm pointer-events-auto">
                        <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                            <MapPin className="text-orange-500 w-4 h-4" />
                            Vista de Satélite Simulada
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Mapa digital de referência da área do Soyo, incluindo Aeroporto, Base Kwanda e áreas industriais.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <StationRequestModal isOpen={isOwnerModalOpen} onClose={() => setIsOwnerModalOpen(false)} />
    </div>
  );
};