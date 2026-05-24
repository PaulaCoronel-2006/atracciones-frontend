import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user')) || null,
    token: localStorage.getItem('auth_token') || null,
    // Mantenemos la lista semilla local como respaldo de desarrollo
    mockUsers: [
      { id: '11111111-1111-1111-1111-111111111111', email: 'admin@atracciones.com', password: 'admin', firstName: 'Yanick', lastName: 'Maila', role: 'Admin', phone: '+593 987654321', location: 'Quito, Ecuador' },
      { id: '22222222-2222-2222-2222-222222222222', email: 'partner@atracciones.com', password: 'partner', firstName: 'Juan', lastName: 'Pérez', role: 'Partner', phone: '+593 999999999', location: 'Guayaquil, Ecuador' },
      { id: '33333333-3333-3333-3333-333333333333', email: 'client@atracciones.com', password: 'client', firstName: 'Sofía', lastName: 'Castillo', role: 'Client', phone: '+593 988888888', location: 'Cuenca, Ecuador' }
    ]
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'Admin',
    isPartner: (state) => state.user?.role === 'Partner',
    isClient: (state) => state.user?.role === 'Client',
    hasAdminAccess: (state) => state.user?.role === 'Admin' || state.user?.role === 'Partner'
  },
  actions: {
    async login(email, password, forceRole = null) {
      // Soporte para pruebas rápidas / login automático forzado si se solicita
      if (forceRole) {
        const found = this.mockUsers.find(u => u.role === forceRole);
        if (found) {
          this.user = { ...found };
          this.token = 'simulated-jwt-token-' + found.id;
          this.saveSession();
          return { success: true, user: this.user };
        }
      }

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        
        // Decidir si es login de admin o cliente
        const endpoint = (email.toLowerCase().includes('admin') || email.toLowerCase().includes('partner'))
          ? '/auth/login-admin'
          : '/auth/login';

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const apiData = result.data;
          this.user = {
            id: apiData.user.userId,
            email: apiData.user.email,
            firstName: apiData.user.firstName || '',
            lastName: apiData.user.lastName || '',
            role: apiData.user.roles[0] || 'Client'
          };
          this.token = apiData.accessToken;
          this.saveSession();
          return { success: true, user: this.user };
        } else {
          return { success: false, message: result.message || 'Credenciales incorrectas' };
        }
      } catch (error) {
        // Fallback local si el backend no está disponible en desarrollo
        const found = this.mockUsers.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (found) {
          this.user = { ...found };
          this.token = 'simulated-jwt-token-' + found.id;
          this.saveSession();
          return { success: true, user: this.user };
        }
        return { success: false, message: 'Error de conexión con el servidor.' };
      }
    },

    async register(registerData) {
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
          this.user = {
            id: apiData.user.userId,
            email: apiData.user.email,
            firstName: apiData.user.firstName || '',
            lastName: apiData.user.lastName || '',
            role: apiData.user.roles[0] || 'Client'
          };
          this.token = apiData.accessToken;
          this.saveSession();
          return { success: true, user: this.user };
        } else {
          return { success: false, message: result.message || 'Error al registrar la cuenta' };
        }
      } catch (error) {
        // Fallback local en desarrollo
        const newUser = {
          id: crypto.randomUUID(),
          email: registerData.email,
          password: registerData.password || 'password123',
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: 'Client',
          phone: registerData.phone || '',
          location: registerData.location || 'Ecuador'
        };
        this.mockUsers.push(newUser);
        this.user = newUser;
        this.token = 'simulated-jwt-token-' + newUser.id;
        this.saveSession();
        return { success: true, user: newUser };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    },

    async updateProfile(profileData) {
      if (!this.user) return { success: false, message: 'No hay usuario autenticado' };

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
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
          this.user = {
            ...this.user,
            id: updatedUser.userId,
            email: updatedUser.email,
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            role: updatedUser.roles[0] || 'Client'
          };
          this.saveSession();
          return { success: true, user: this.user };
        }
      } catch (error) {
        // Fallback local
        this.user.firstName = profileData.firstName;
        this.user.lastName = profileData.lastName;
        this.user.phone = profileData.phone;
        this.user.location = profileData.location;
        this.saveSession();
        return { success: true, user: this.user };
      }
      return { success: false };
    },

    async changePassword(oldPassword, newPassword) {
      if (!this.user) return { success: false };

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });

        if (response.ok) {
          return { success: true };
        }
      } catch (error) {
        const found = this.mockUsers.find(u => u.id === this.user.id);
        if (found && found.password === oldPassword) {
          found.password = newPassword;
          return { success: true };
        }
      }
      return { success: false };
    },

    saveSession() {
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      localStorage.setItem('auth_token', this.token);
    }
  }
})
