import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => {
    const savedCart = JSON.parse(localStorage.getItem('cart_state')) || {}
    return {
      attraction: savedCart.attraction || null,
      option: savedCart.option || null,
      slot: savedCart.slot || null,
      passengers: savedCart.passengers || [],
      step: savedCart.step || 1
    }
  },
  getters: {
    hasSelection: (state) => !!state.attraction && !!state.option && !!state.slot,
    totalAmount: (state) => {
      if (!state.passengers.length) return 0
      return state.passengers.reduce((sum, p) => sum + (p.unitPrice * (p.quantity || 1)), 0)
    },
    taxAmount() {
      return this.totalAmount * 0.15 // 15% IVA impuesto estándar en Ecuador
    },
    grandTotal() {
      return this.totalAmount + this.taxAmount
    }
  },
  actions: {
    setBookingSelection(attraction, option, slot, passengerCount = 1) {
      this.attraction = attraction
      this.option = option
      this.slot = slot
      this.step = 1

      // Inicializar el formulario con pasajeros en blanco pero configurando precios
      const defaultPrice = option.price_tiers[0]?.price || 40.0
      const defaultTierLabel = option.price_tiers[0]?.label || 'Adulto'
      
      this.passengers = Array.from({ length: passengerCount }, (_, i) => ({
        id: i + 1,
        firstName: '',
        lastName: '',
        documentType: 'Cédula',
        documentNumber: '',
        priceTierLabel: defaultTierLabel,
        unitPrice: defaultPrice,
        quantity: 1
      }))

      this.saveState()
    },

    updatePassenger(id, updatedFields) {
      const index = this.passengers.findIndex(p => p.id === id)
      if (index !== -1) {
        this.passengers[index] = { ...this.passengers[index], ...updatedFields }
        this.saveState()
      }
    },

    updatePassengerPriceByTier(id, tierLabel) {
      const passenger = this.passengers.find(p => p.id === id)
      if (passenger && this.option) {
        const tier = this.option.price_tiers.find(t => t.label === tierLabel)
        if (tier) {
          passenger.priceTierLabel = tier.label
          passenger.unitPrice = tier.price
          this.saveState()
        }
      }
    },

    setStep(newStep) {
      this.step = newStep
      this.saveState()
    },

    clearCart() {
      this.attraction = null
      this.option = null
      this.slot = null
      this.passengers = []
      this.step = 1
      localStorage.removeItem('cart_state')
    },

    saveState() {
      localStorage.setItem('cart_state', JSON.stringify({
        attraction: this.attraction,
        option: this.option,
        slot: this.slot,
        passengers: this.passengers,
        step: this.step
      }))
    }
  }
})
