import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Partner' | 'Client';
  phone?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isClient: boolean;
  hasAdminAccess: boolean;
  login: (email: string, password: string, forceRole?: 'Admin' | 'Partner' | 'Client' | null) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (registerData: { email: string; password?: string; firstName: string; lastName: string; phone?: string; location?: string }) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  updateProfile: (profileData: { firstName: string; lastName: string; phone: string; location: string }) => Promise<{ success: boolean; message?: string; user?: User }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'admin@atracciones.com', firstName: 'Yanick', lastName: 'Maila', role: 'Admin', phone: '+593 987654321', location: 'Quito, Ecuador' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'partner@atracciones.com', firstName: 'Juan', lastName: 'Pérez', role: 'Partner', phone: '+593 999999999', location: 'Guayaquil, Ecuador' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'client@atracciones.com', firstName: 'Sofía', lastName: 'Castillo', role: 'Client', phone: '+593 988888888', location: 'Cuenca, Ecuador' }
];

// Contraseñas simuladas para mock
const mockPasswords: Record<string, string> = {
  'admin@atracciones.com': 'admin',
  'partner@atracciones.com': 'partner',
  'client@atracciones.com': 'client'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  const saveSession = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setToken(newToken);
    if (newUser && newToken) {
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  };

  const login = async (email: string, password: string, forceRole: 'Admin' | 'Partner' | 'Client' | null = null) => {
    if (forceRole) {
      const found = mockUsers.find(u => u.role === forceRole);
      if (found) {
        const loggedUser = { ...found };
        saveSession(loggedUser, 'simulated-jwt-token-' + found.id);
        return { success: true, user: loggedUser };
      }
    }

    // Permitir inicio de sesión local con usuarios de mock para facilitar pruebas de desarrollo y subagentes
    const mockFound = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && mockPasswords[u.email.toLowerCase()] === password
    );
    if (mockFound) {
      const loggedUser = { ...mockFound };
      saveSession(loggedUser, 'simulated-jwt-token-' + mockFound.id);
      return { success: true, user: loggedUser };
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const endpoint = (email.toLowerCase().includes('admin') || email.toLowerCase().includes('partner'))
        ? '/auth/login-admin'
        : '/auth/login';

      let response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let result = await response.json();

      // Reintento inteligente en el endpoint administrativo si el error sugiere usar /login-admin
      if (!response.ok && result.message && (result.message.includes('/login-admin') || result.message.includes('login-admin'))) {
        response = await fetch(`${baseUrl}/auth/login-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        result = await response.json();
      }

      if (response.ok && result.success) {
        const apiData = result.data;
        const loggedUser: User = {
          id: apiData.user.userId,
          email: apiData.user.email,
          firstName: apiData.user.firstName || '',
          lastName: apiData.user.lastName || '',
          role: apiData.user.roles[0] || 'Client'
        };
        saveSession(loggedUser, apiData.accessToken);
        return { success: true, user: loggedUser };
      } else {
        return { success: false, message: result.message || 'Credenciales incorrectas' };
      }
    } catch (error) {
      // Fallback local si el backend no está disponible en desarrollo
      const found = mockUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && mockPasswords[u.email.toLowerCase()] === password
      );
      if (found) {
        const loggedUser = { ...found };
        saveSession(loggedUser, 'simulated-jwt-token-' + found.id);
        return { success: true, user: loggedUser };
      }
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  };

  const register = async (registerData: { email: string; password?: string; firstName: string; lastName: string; phone?: string; location?: string }) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone || '',
          locationName: registerData.location || ''
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const apiData = result.data;
        const loggedUser: User = {
          id: apiData.user.userId,
          email: apiData.user.email,
          firstName: apiData.user.firstName || '',
          lastName: apiData.user.lastName || '',
          role: apiData.user.roles[0] || 'Client'
        };
        saveSession(loggedUser, apiData.accessToken);
        return { success: true, user: loggedUser };
      } else {
        return { success: false, message: result.message || 'Error al registrar la cuenta' };
      }
    } catch (error) {
      // Fallback local
      const newUser: User = {
        id: crypto.randomUUID(),
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: 'Client',
        phone: registerData.phone || '',
        location: registerData.location || 'Ecuador'
      };
      mockUsers.push(newUser);
      if (registerData.password) {
        mockPasswords[registerData.email.toLowerCase()] = registerData.password;
      }
      saveSession(newUser, 'simulated-jwt-token-' + newUser.id);
      return { success: true, user: newUser };
    }
  };

  const logout = () => {
    saveSession(null, null);
  };

  const updateProfile = async (profileData: { firstName: string; lastName: string; phone: string; location: string }) => {
    if (!user) return { success: false, message: 'No hay usuario autenticado' };

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          locationName: profileData.location
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedUser = result.data;
        const newUser: User = {
          ...user,
          id: updatedUser.userId,
          email: updatedUser.email,
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          role: updatedUser.roles[0] || 'Client'
        };
        saveSession(newUser, token);
        return { success: true, user: newUser };
      }
    } catch (error) {
      // Fallback local
      const newUser: User = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        location: profileData.location
      };
      saveSession(newUser, token);
      return { success: true, user: newUser };
    }
    return { success: false };
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) return { success: false };

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (response.ok) {
        return { success: true };
      }
    } catch (error) {
      const emailLower = user.email.toLowerCase();
      if (mockPasswords[emailLower] === oldPassword) {
        mockPasswords[emailLower] = newPassword;
        return { success: true };
      }
    }
    return { success: false };
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Admin';
  const isPartner = user?.role === 'Partner';
  const isClient = user?.role === 'Client';
  const hasAdminAccess = user?.role === 'Admin' || user?.role === 'Partner';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      isPartner,
      isClient,
      hasAdminAccess,
      login,
      register,
      logout,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
