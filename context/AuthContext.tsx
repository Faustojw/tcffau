import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { findUserByEmail, createUser, validateStationCode, toggleUserFavorite } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, stationCode?: string) => Promise<{success: boolean, message?: string}>;
  toggleFavorite: (stationId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for active session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('fuelSoyo_session');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    
    try {
        const dbUser = await findUserByEmail(email);

        if (!dbUser) {
            setIsLoading(false);
            return { success: false, message: 'Usuário não encontrado.' };
        }

        // In a real backend, we would hash compare. Here we compare plain text for demo.
        if (password && dbUser.password !== password) {
            setIsLoading(false);
            return { success: false, message: 'Senha incorreta.' };
        }

        // Remove password from session object
        const { password: _, ...safeUser } = dbUser;
        
        setUser(safeUser);
        localStorage.setItem('fuelSoyo_session', JSON.stringify(safeUser));
        setIsLoading(false);
        return { success: true };

    } catch (error) {
        setIsLoading(false);
        return { success: false, message: 'Erro ao conectar ao servidor.' };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, stationCode?: string) => {
    setIsLoading(true);

    try {
        // 1. Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            setIsLoading(false);
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }

        let stationId: string | undefined;

        // 2. Validate Station Code for Operators
        if (role === UserRole.OPERATOR) {
            if (!stationCode) {
                setIsLoading(false);
                return { success: false, message: 'O código do posto é obrigatório para operadores.' };
            }

            const validStation = await validateStationCode(stationCode);
            
            if (!validStation) {
                setIsLoading(false);
                return { success: false, message: 'Código do posto inválido.' };
            }

            stationId = validStation.id;
        }

        // 3. Create User
        const newUser = await createUser({
            name,
            email,
            password, // Storing purely for simulation. In real DB use password_hash
            role,
            stationId,
            favorites: []
        });

        // 4. Auto Login
        const { password: _, ...safeUser } = newUser;
        setUser(safeUser);
        localStorage.setItem('fuelSoyo_session', JSON.stringify(safeUser));
        
        setIsLoading(false);
        return { success: true };

    } catch (error) {
        setIsLoading(false);
        return { success: false, message: 'Erro ao criar conta.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fuelSoyo_session');
  };

  const toggleFavorite = async (stationId: string) => {
      if (!user) return;
      
      const newFavorites = await toggleUserFavorite(user.id, stationId);
      
      // Update local state and storage
      const updatedUser = { ...user, favorites: newFavorites };
      setUser(updatedUser);
      localStorage.setItem('fuelSoyo_session', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, toggleFavorite, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};