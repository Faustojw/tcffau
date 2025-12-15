import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, User, Phone, Mail, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { addStationRequest } from '../services/mockData';

export const RegisterStation: React.FC = () => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    stationName: '',
    address: '',
    managerName: '',
    phone: '',
    email: ''
  });

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

  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/register" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para Cadastro de Usuário
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white">
          Solicitar Cadastro de Posto
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Preencha os dados do estabelecimento para análise
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800 py-8 px-4 shadow-xl border border-slate-700 sm:rounded-lg sm:px-10">
          
          {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <p className="mt-1 text-xs text-slate-500">
                    O código do posto será enviado para este e-mail após aprovação do administrador.
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Enviando Solicitação...
                        </>
                    ) : 'Enviar Solicitação'}
                  </button>
                </div>
              </form>
          ) : (
            <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Solicitação Recebida!</h3>
                <p className="text-slate-400 mb-6">
                    Seus dados foram enviados para nossa equipe administrativa.<br/>
                    Em breve você receberá o <strong>Código do Posto</strong> no e-mail <strong>{formData.email}</strong> para finalizar seu cadastro como Operador.
                </p>
                <Link
                    to="/"
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-white hover:bg-slate-600 focus:outline-none sm:text-sm w-full transition-colors"
                >
                    Voltar para o Início
                </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};