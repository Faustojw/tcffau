import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Station } from '../types';
import { getStationById } from '../services/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { MapPin, Phone, Clock, ArrowLeft, Send, Star, Navigation, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Comment {
    id: number;
    user: string;
    text: string;
    rating: number;
    date: string;
}

const MOCK_COMMENTS: Comment[] = [
    { id: 1, user: 'João Silva', text: 'Sempre tem combustível aqui! Ótimo atendimento.', rating: 5, date: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, user: 'Maria Oliveira', text: 'A fila estava grande hoje de manhã.', rating: 3, date: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 3, user: 'Carlos Mendes', text: 'Gasóleo disponível, abasteci rápido.', rating: 4, date: new Date(Date.now() - 3600000 * 48).toISOString() },
];

export const StationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [station, setStation] = useState<Station | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const fetchStation = async () => {
            if (id) {
                const data = await getStationById(id);
                setStation(data || null);
            }
            setLoading(false);
        };
        fetchStation();
    }, [id]);

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: Date.now(),
            user: 'Usuário (Você)',
            text: newComment,
            rating: 5,
            date: new Date().toISOString()
        };

        setComments([comment, ...comments]);
        setNewComment('');
    };

    if (loading) return (
        <div className="min-h-screen pt-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    if (!station) return (
        <div className="min-h-screen pt-20 flex flex-col justify-center items-center text-slate-400">
            <h2 className="text-2xl font-bold text-white mb-2">Posto não encontrado</h2>
            <Link to="/" className="text-orange-500 hover:underline">Voltar para o início</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Hero Image */}
            <div className="relative h-64 md:h-80 w-full">
                <img src={station.imageUrl} alt={station.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute top-4 left-4 z-10">
                    <Link to="/" className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors border border-slate-700">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                    
                    {/* Header Info */}
                    <div className="p-6 md:p-8 border-b border-slate-700">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{station.name}</h1>
                                <div className="flex flex-col gap-2 text-slate-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-orange-500" /> {station.address}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-500" /> {station.openHours}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-orange-500" /> {station.phone}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                    <Share2 className="w-4 h-4" /> Compartilhar
                                </button>
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                                    <Navigation className="w-4 h-4" /> Rota
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">Disponibilidade Atual</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <StatusBadge type="Gasolina" available={station.status.gasoline} />
                                    <StatusBadge type="Gasóleo" available={station.status.diesel} />
                                </div>
                                <p className="text-xs text-slate-500 mt-3 text-right">
                                    Atualizado {formatDistanceToNow(new Date(station.status.lastUpdated), { addSuffix: true, locale: ptBR } as any)}
                                </p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Soyo_Angola_map.png')] bg-cover bg-center opacity-30 grayscale group-hover:grayscale-0 transition-all"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-orange-500 drop-shadow-lg animate-bounce" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="p-6 md:p-8 bg-slate-800/50">
                        <h2 className="text-xl font-bold text-white mb-6">Comentários Recentes</h2>
                        
                        <div className="space-y-6 mb-8">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700/50">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-slate-300 font-bold">
                                        {comment.user.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-sm">{comment.user}</h4>
                                            <span className="text-xs text-slate-500">
                                                {formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: ptBR } as any)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < comment.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                                            ))}
                                        </div>
                                        <p className="text-slate-300 text-sm">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="mt-8 bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Adicionar um comentário</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Como está a situação neste posto?"
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                                >
                                    <Send className="w-4 h-4" /> Enviar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};