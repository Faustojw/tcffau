import React, { useState } from 'react';
import { Station } from '../types';
import { MapPin, Phone, Clock, Navigation, Eye, Wand2, Loader2, Heart } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Link } from 'react-router-dom';
import { generateStationImage, updateStationImage } from '../services/mockData';
import { useAuth } from '../context/AuthContext';

interface Props {
  station: Station;
  distance?: number; // Distance in km
}

export const StationCard: React.FC<Props> = ({ station, distance }) => {
  const [imgSrc, setImgSrc] = useState(station.imageUrl);
  const [generating, setGenerating] = useState(false);
  const { user, toggleFavorite } = useAuth();

  const isFavorite = user?.favorites?.includes(station.id);

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setGenerating(true);
    const newImage = await generateStationImage(station);
    if (newImage) {
        setImgSrc(newImage);
        updateStationImage(station.id, newImage);
    }
    setGenerating(false);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Impede que o clique propague para o Link do card principal
    
    // Abre o Google Maps ou app nativo com as direções para o destino
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`;
    window.open(url, '_blank');
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          alert("Por favor, faça login para favoritar postos.");
          return;
      }
      toggleFavorite(station.id);
  };

  return (
    <div className="group bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-orange-500/80 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
      <Link to={`/stations/${station.id}`} className="block h-32 w-full overflow-hidden relative">
        <img 
            src={imgSrc} 
            alt={station.name} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-2 left-4 right-16 z-10">
             <h3 className="text-white font-bold text-lg leading-tight group-hover:text-orange-400 transition-colors duration-300 truncate">{station.name}</h3>
        </div>
        
        {/* Loading Overlay */}
        {generating && (
            <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-sm z-30">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )}
      </Link>
      
      {/* Action Buttons Overlay */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
         {distance !== undefined && (
             <div className="px-2 py-1 bg-slate-900/90 text-orange-400 text-xs font-bold rounded-md border border-slate-700 shadow-lg backdrop-blur-sm flex items-center gap-1">
                 <Navigation className="w-3 h-3" />
                 {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
             </div>
         )}
        <button 
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 border shadow-lg ${
                isFavorite 
                ? 'bg-red-500 text-white border-red-500 scale-110' 
                : 'bg-slate-900/60 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-red-400 hover:border-red-400'
            }`}
            title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
        >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button 
            onClick={handleGenerateImage}
            disabled={generating}
            className="p-2 bg-slate-900/60 hover:bg-orange-600 text-slate-300 hover:text-white rounded-full backdrop-blur-sm transition-colors border border-slate-600 hover:border-orange-500 shadow-lg"
            title="Gerar Nova Imagem com IA"
        >
            <Wand2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-grow relative bg-slate-800">
        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0 group-hover:animate-bounce" />
            <span className="group-hover:text-slate-300 transition-colors">{station.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-orange-500 shrink-0" />
            <span>{station.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500 shrink-0" />
            <span>{station.openHours}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatusBadge type="Gasolina" available={station.status.gasoline} />
          <StatusBadge type="Gasóleo" available={station.status.diesel} />
        </div>
      </div>

      <div className="p-4 pt-2 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500 mt-auto bg-slate-800/50 group-hover:bg-slate-800 transition-colors">
        <span>
            Atualizado {formatDistanceToNow(new Date(station.status.lastUpdated), { addSuffix: true, locale: ptBR } as any)}
        </span>
        <div className="flex gap-3">
             <Link to={`/stations/${station.id}`} className="flex items-center gap-1 text-slate-300 hover:text-white font-medium transition-colors group-hover:translate-x-1 duration-300">
                <Eye className="h-3 w-3" />
                Detalhes
            </Link>
            <button 
                onClick={handleNavigate}
                className="flex items-center gap-1 text-orange-500 hover:text-orange-400 font-medium transition-colors"
                title="Abrir navegação no mapa"
            >
                <Navigation className="h-3 w-3" />
                Rota
            </button>
        </div>
      </div>
    </div>
  );
};