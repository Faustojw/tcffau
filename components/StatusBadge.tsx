import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  available: boolean;
  type: 'Gasolina' | 'Gasóleo';
}

export const StatusBadge: React.FC<Props> = ({ available, type }) => {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
      available 
        ? 'bg-green-500/10 border-green-500/30 text-green-500' 
        : 'bg-red-500/10 border-red-500/30 text-red-500'
    }`}>
      <span className="font-medium text-sm">{type}</span>
      {available ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
    </div>
  );
};