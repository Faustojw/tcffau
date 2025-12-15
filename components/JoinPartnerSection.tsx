import React, { useState } from 'react';
import { CheckCircle2, Fuel } from 'lucide-react';
import { StationRequestModal } from './StationRequestModal';

export const JoinPartnerSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-800 py-16 border-y border-slate-700 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-500 font-semibold text-sm">
                Para Operadores
              </span>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Gerencie Seu Posto de <br />
                <span className="text-slate-400">Combustível</span>
              </h2>
              
              <p className="text-slate-400 text-lg">
                Cadastre seu posto e atualize a disponibilidade de combustíveis em tempo real. 
                Ajude milhares de motoristas a encontrar combustível.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Atualize a disponibilidade instantaneamente",
                  "Alcance mais clientes",
                  "Dashboard completo de gestão",
                  "Relatórios e estatísticas"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-orange-900/20 transition-all transform hover:scale-105"
                >
                  Cadastrar Meu Posto
                </button>
              </div>
            </div>

            {/* Right Visual (Icon based on reference) */}
            <div className="flex justify-center items-center relative">
               {/* Decorative background glow */}
               <div className="absolute w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
               
               <Fuel className="w-64 h-64 text-slate-600/50 rotate-[-10deg] animate-pulse-slow" strokeWidth={1} />
               
               {/* Floating visual element */}
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-32 border-4 border-orange-500/30 rounded-full flex items-center justify-center">
                    <Fuel className="w-16 h-16 text-orange-500" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <StationRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};