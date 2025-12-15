import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Truck, Building2, AlertCircle, Lock } from 'lucide-react';

export const Register: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stationCode, setStationCode] = useState('');
  const [error, setError] = useState('');
  
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    const result = await register(name, email, password, role, role === UserRole.OPERATOR ? stationCode : undefined);
    
    if (result.success) {
      if (role === UserRole.ADMIN) navigate('/admin');
      else if (role === UserRole.OPERATOR) navigate('/operator');
      else navigate('/dashboard');
    } else {
      setError(result.message || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-white">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Ou <Link to="/login" className="font-medium text-orange-500 hover:text-orange-400">entre na sua conta existente</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-xl border border-slate-700 sm:rounded-lg sm:px-10">
          
          {/* Role Selection */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole(UserRole.USER)}
              className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all ${
                role === UserRole.USER 
                ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <User className="mb-1" />
              <span className="text-xs font-bold">Motorista</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.OPERATOR)}
              className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-all ${
                role === UserRole.OPERATOR
                ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Truck className="mb-1" />
              <span className="text-xs font-bold">Operador</span>
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Nome Completo
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Endereço de E-mail
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Confirmar Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            {role === UserRole.OPERATOR && (
              <div className="bg-slate-900 p-4 rounded-md border border-slate-600 animate-fade-in">
                <label className="block text-sm font-medium text-orange-500 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Código do Posto (Fornecido pelo Admin)
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: SONA001"
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value.toUpperCase())}
                    className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 bg-slate-800 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm font-mono tracking-widest uppercase"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                        Ainda não cadastrou seu posto? 
                        <Link to="/register-station" className="text-orange-500 hover:text-orange-400 font-bold ml-1 hover:underline">
                            Solicitar cadastro aqui
                        </Link>
                    </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Criando conta...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};