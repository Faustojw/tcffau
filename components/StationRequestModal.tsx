import React, { useState } from 'react';
import { X, Building2, MapPin, User, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { addStationRequest } from '../services/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StationRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    stationName: '',
    address: '',
    managerName: '',
    phone: '',
    email: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await addStationRequest({
        stationName: formData.stationName,
        address: formData.address,
        managerName: formData.managerName,
        phone: formData.phone,
        email: formData.email
    });
    
    setIsLoading(false);
    setStep('success');
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ stationName: '', address: '', managerName: '', phone: '', email: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-slate-900/80 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-slate-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-slate-700">
          
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-slate-800 rounded-md text-slate-400 hover:text-white focus:outline-none"
              onClick={handleClose}
            >
              <span className="sr-only">Fechar</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {step === 'form' ? (
            <div>
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-500/10 sm:mx-0 sm:h-10 sm:w-10">
                  <Building2 className="h-6 w-6 text-orange-500" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                    Solicitar Cadastro de Posto
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-slate-400">
                      Preencha os dados abaixo. Nossa equipe administrativa analisará o pedido e enviará o <strong>Código do Posto</strong> para criar sua conta de operador.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Nome do Posto</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-slate-600 block w-full pl-10 sm:text-sm rounded-md text-white focus:ring-orange-500 focus:border-orange-500 py-2 placeholder-slate-500"
                      placeholder="Ex: Posto Sonangol Bairro X"
                      value={formData.stationName}
                      onChange={e => setFormData({...formData, stationName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Endereço Completo</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-slate-600 block w-full pl-10 sm:text-sm rounded-md text-white focus:ring-orange-500 focus:border-orange-500 py-2 placeholder-slate-500"
                      placeholder="Rua, Bairro, Ponto de referência"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Nome do Responsável</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                            type="text"
                            required
                            className="bg-slate-900 border border-slate-600 block w-full pl-10 sm:text-sm rounded-md text-white focus:ring-orange-500 focus:border-orange-500 py-2 placeholder-slate-500"
                            placeholder="Seu nome"
                            value={formData.managerName}
                            onChange={e => setFormData({...formData, managerName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Telefone</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                            type="tel"
                            required
                            className="bg-slate-900 border border-slate-600 block w-full pl-10 sm:text-sm rounded-md text-white focus:ring-orange-500 focus:border-orange-500 py-2 placeholder-slate-500"
                            placeholder="9XX XXX XXX"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">E-mail para Contato</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      className="bg-slate-900 border border-slate-600 block w-full pl-10 sm:text-sm rounded-md text-white focus:ring-orange-500 focus:border-orange-500 py-2 placeholder-slate-500"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Enviando...
                        </>
                    ) : 'Enviar Solicitação'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h3>
                <p className="text-slate-400 mb-6">
                    Obrigado pelo interesse. O administrador do sistema recebeu seus dados.<br/>
                    Em breve você receberá um e-mail com o <strong>Código do Posto</strong> para finalizar seu cadastro como Operador.
                </p>
                <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-white hover:bg-slate-600 focus:outline-none sm:text-sm w-full"
                >
                    Fechar e Voltar ao Início
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};