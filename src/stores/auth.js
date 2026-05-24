import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user')) || null,
    token: localStorage.getItem('auth_token') || null,
    // Lista de usuarios semilla para pruebas rápidas
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
    login(email, password, forceRole = null) {
      // Si se pasa forceRole, hacemos login automático por conveniencia de pruebas
      if (forceRole) {
        const found = this.mockUsers.find(u => u.role === forceRole);
        if (found) {
          this.user = { ...found };
          this.token = 'simulated-jwt-token-' + found.id;
          this.saveSession();
          return { success: true, user: this.user };
        }
      }

      // Login convencional por email/password
      const found = this.mockUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (found) {
        this.user = { ...found };
        this.token = 'simulated-jwt-token-' + found.id;
        this.saveSession();
        return { success: true, user: this.user };
      }
      return { success: false, message: 'Credenciales incorrectas' };
    },

    register(registerData) {
      const exists = this.mockUsers.some(u => u.email.toLowerCase() === registerData.email.toLowerCase());
      if (exists) {
        return { success: false, message: 'El correo electrónico ya está registrado' };
      }

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
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    },

    updateProfile(profileData) {
      if (!this.user) return { success: false, message: 'No hay usuario autenticado' };
      
      this.user.firstName = profileData.firstName;
      this.user.lastName = profileData.lastName;
      this.user.phone = profileData.phone;
      this.user.location = profileData.location;
      
      this.saveSession();
      return { success: true, user: this.user };
    },

    changePassword(oldPassword, newPassword) {
      if (!this.user) return { success: false };
      const found = this.mockUsers.find(u => u.id === this.user.id);
      if (found && found.password === oldPassword) {
        found.password = newPassword;
        return { success: true };
      }
      return { success: false, message: 'La contraseña actual es incorrecta' };
    },

    saveSession() {
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      localStorage.setItem('auth_token', this.token);
    }
  }
})
