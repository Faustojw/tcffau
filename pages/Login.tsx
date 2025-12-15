import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    
    if (result.success) {
      // Navigation is actually handled by updated User state, but we can force redirect based on stored user
      // However, we need the user role. Let's fetch the user from localstorage after login
      const userStr = localStorage.getItem('fuelSoyo_session');
      if (userStr) {
          const u = JSON.parse(userStr);
          if (u.role === UserRole.ADMIN) navigate('/admin');
          else if (u.role === UserRole.OPERATOR) navigate('/operator');
          else navigate('/dashboard');
      }
    } else {
        setError(result.message || 'Login falhou.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-white">
          Bem-vindo de volta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Acesse para monitorar combustíveis em Soyo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-xl border border-slate-700 sm:rounded-lg sm:px-10">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                E-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-900 text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
             <Link to="/register" className="text-sm font-medium text-orange-500 hover:text-orange-400">
                Não tem uma conta? Cadastre-se
             </Link>
          </div>

          <div className="mt-6 border-t border-slate-700 pt-4">
            <p className="text-xs text-center text-slate-500">
                Credenciais de Teste:<br/>
                Admin: <span className="text-slate-300">admin@fuelsoyo.com</span> / <span className="text-slate-300">123</span><br/>
                Operador: <span className="text-slate-300">op@sonangol.com</span> / <span className="text-slate-300">123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};