import React, { createContext, useContext, useState } from 'react';

export interface Passenger {
  id: number;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  priceTierLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface AttractionProductOption {
  id: string;
  title: string;
  slug?: string;
  price_tiers: Array<{
    label: string;
    age_min?: number;
    age_max?: number;
    price: number;
  }>;
}

export interface AttractionSlot {
  id: string;
  productId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacityTotal: number;
  capacityAvailable: number;
  isActive: boolean;
}

export interface AttractionSummary {
  id: string;
  name: string;
  slug: string;
  price_base: number;
  rating: number;
  review_count: number;
  location_id: string;
  subcategory_id: string;
  tags?: string[];
  media?: Array<{ id?: string; url: string; is_main: boolean }>;
}

interface CartContextType {
  attraction: AttractionSummary | null;
  option: AttractionProductOption | null;
  slot: AttractionSlot | null;
  passengers: Passenger[];
  step: number;
  hasSelection: boolean;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  setBookingSelection: (attraction: AttractionSummary, option: AttractionProductOption, slot: AttractionSlot, passengerCount?: number) => void;
  updatePassenger: (id: number, updatedFields: Partial<Passenger>) => void;
  updatePassengerPriceByTier: (id: number, tierLabel: string) => void;
  setStep: (newStep: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(() => {
    const savedCart = localStorage.getItem('cart_state');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        // ignore
      }
    }
    return {
      attraction: null,
      option: null,
      slot: null,
      passengers: [],
      step: 1
    };
  });

  const saveState = (newState: typeof state) => {
    setState(newState);
    localStorage.setItem('cart_state', JSON.stringify(newState));
  };

  const setBookingSelection = (attraction: AttractionSummary, option: AttractionProductOption, slot: AttractionSlot, passengerCount = 1) => {
    const defaultPrice = option.price_tiers[0]?.price || 40.0;
    const defaultTierLabel = option.price_tiers[0]?.label || 'Adulto';

    const newPassengers: Passenger[] = Array.from({ length: passengerCount }, (_, i) => ({
      id: i + 1,
      firstName: '',
      lastName: '',
      documentType: 'Cédula',
      documentNumber: '',
      priceTierLabel: defaultTierLabel,
      unitPrice: defaultPrice,
      quantity: 1
    }));

    saveState({
      attraction,
      option,
      slot,
      passengers: newPassengers,
      step: 1
    });
  };

  const updatePassenger = (id: number, updatedFields: Partial<Passenger>) => {
    const newPassengers = state.passengers.map((p: Passenger) => {
      if (p.id === id) {
        return { ...p, ...updatedFields };
      }
      return p;
    });

    saveState({
      ...state,
      passengers: newPassengers
    });
  };

  const updatePassengerPriceByTier = (id: number, tierLabel: string) => {
    if (!state.option) return;
    const tier = state.option.price_tiers.find((t: any) => t.label === tierLabel);
    if (tier) {
      const newPassengers = state.passengers.map((p: Passenger) => {
        if (p.id === id) {
          return {
            ...p,
            priceTierLabel: tier.label,
            unitPrice: tier.price
          };
        }
        return p;
      });

      saveState({
        ...state,
        passengers: newPassengers
      });
    }
  };

  const setStep = (newStep: number) => {
    saveState({
      ...state,
      step: newStep
    });
  };

  const clearCart = () => {
    const cleared = {
      attraction: null,
      option: null,
      slot: null,
      passengers: [],
      step: 1
    };
    setState(cleared);
    localStorage.removeItem('cart_state');
  };

  const hasSelection = !!state.attraction && !!state.option && !!state.slot;
  const totalAmount = state.passengers.reduce((sum: number, p: Passenger) => sum + (p.unitPrice * (p.quantity || 1)), 0);
  const taxAmount = totalAmount * 0.15; // 15% IVA impuesto estándar en Ecuador
  const grandTotal = totalAmount + taxAmount;

  return (
    <CartContext.Provider value={{
      attraction: state.attraction,
      option: state.option,
      slot: state.slot,
      passengers: state.passengers,
      step: state.step,
      hasSelection,
      totalAmount,
      taxAmount,
      grandTotal,
      setBookingSelection,
      updatePassenger,
      updatePassengerPriceByTier,
      setStep,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
