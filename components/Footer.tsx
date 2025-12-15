import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} FuelSoyo. Sistema de monitoramento de combustíveis em Soyo.
        </p>
        <div className="mt-4 flex justify-center space-x-6">
          <a href="#" className="text-slate-500 hover:text-orange-500">Termos</a>
          <a href="#" className="text-slate-500 hover:text-orange-500">Privacidade</a>
          <a href="#" className="text-slate-500 hover:text-orange-500">Contacto</a>
        </div>
      </div>
    </footer>
  );
};