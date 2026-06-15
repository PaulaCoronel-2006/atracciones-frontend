import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatalog, AttractionDetail } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { LeafletMap } from '../components/LeafletMap';
import Swal from 'sweetalert2';

interface PriceTier {
  label: string;
  age_min?: number | '';
  age_max?: number | '';
  price: number | '';
}

interface ProductOption {
  id: string;
  title: string;
  price_tiers: PriceTier[];
}

const steps = [
  { step: 1, label: 'Detalles Básicos', desc: 'Información general de la atracción' },
  { step: 2, label: 'Ubicación & Mapa', desc: 'Mapa y coordenadas de encuentro' },
  { step: 3, label: 'Precios & Tarifas', desc: 'Variantes y precios por edad' },
  { step: 4, label: 'Galería de Fotos', desc: 'Imágenes y portada del anuncio' },
  { step: 5, label: 'Itinerario de Viaje', desc: 'Paradas de la experiencia' },
  { step: 6, label: 'Fechas & Horarios', desc: 'Configurar slots e inventario' },
  { step: 7, label: 'Revisión & Calidad', desc: 'Previsualización y publicación' }
];

const initialFormState: Partial<AttractionDetail> = {
  name: '',
  subcategory_id: '',
  description: '',
  is_active: true,
  is_published: false,
  location_coords: { lat: -0.2201, lng: -78.5122, placeName: '' },
  tags: [],
  inclusions: [],
  media: [],
  itinerary: [],
  product_options: [
    {
      id: 'po-temp-1',
      title: 'Tour Compartido Estándar',
      price_tiers: [
        { label: 'Adulto', age_min: 18, age_max: 99, price: 45.00 },
        { label: 'Niño', age_min: 5, age_max: 17, price: 25.00 }
      ]
    }
  ]
};

const AdminAttractionEditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const { 
    attractions, 
    locations, 
    subcategories, 
    tags, 
    inclusions, 
    getCategoryById, 
    addAttraction, 
    updateAttraction 
  } = useCatalog();

  const { slots, generateScheduleMassive, bulkDeleteSlots } = useBooking();

  const isEditing = !!id;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const hasCheckedDraft = React.useRef(false);

  // Estados de Ubicación Jerárquica
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  // Formulario reactivo principal
  const [form, setForm] = useState<Partial<AttractionDetail>>({
    name: '',
    subcategory_id: '',
    description: '',
    is_active: true,
    is_published: false,
    location_coords: { lat: -0.2201, lng: -78.5122, placeName: '' },
    tags: [],
    inclusions: [],
    media: [],
    itinerary: [],
    product_options: [
      {
        id: 'po-temp-1',
        title: 'Tour Compartido Estándar',
        price_tiers: [
          { label: 'Adulto', age_min: 18, age_max: 99, price: 45.00 },
          { label: 'Niño', age_min: 5, age_max: 17, price: 25.00 }
        ]
      }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos al editar o creación limpia
  useEffect(() => {
    if (isEditing && id) {
      const attraction = attractions.find(a => a.id === id);
      if (attraction) {
        setForm(JSON.parse(JSON.stringify(attraction))); // Copia profunda
        
        // Reconstruir cascada
        const city = locations.find(l => l.id === attraction.location_id);
        if (city) {
          setSelectedCityId(city.id);
          const state = locations.find(l => l.id === city.parentId);
          if (state) {
            setSelectedStateId(state.id);
            const country = locations.find(l => l.id === state.parentId);
            if (country) {
              setSelectedCountryId(country.id);
            }
          }
        }
      } else {
        Swal.fire({
          title: 'Atracción no encontrada',
          text: 'La atracción especificada no existe en el sistema.',
          icon: 'error',
          confirmButtonColor: '#0058bc'
        });
        navigate('/admin');
      }
    } else {
      if (hasCheckedDraft.current) return;
      hasCheckedDraft.current = true;

      const savedDraft = localStorage.getItem('hospedate_attraction_draft');
      const resetToCleanForm = () => {
        setForm({
          ...initialFormState,
          subcategory_id: subcategories[0]?.id || ''
        });
        const ecuador = locations.find(l => l.name === 'Ecuador' && l.type === 'Country');
        if (ecuador) {
          setSelectedCountryId(ecuador.id);
        }
        setSelectedStateId('');
        setSelectedCityId('');
        setCurrentStep(1);
      };

      if (savedDraft) {
        Swal.fire({
          title: '¿Continuar con el borrador anterior?',
          text: 'Hemos detectado un borrador de atracción sin guardar. ¿Deseas recuperarlo?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#0058bc',
          cancelButtonColor: '#747782',
          confirmButtonText: 'Sí, recuperar',
          cancelButtonText: 'No, empezar de cero'
        }).then((result) => {
          if (result.isConfirmed) {
            try {
              const parsed = JSON.parse(savedDraft);
              setForm(parsed.form);
              setSelectedCountryId(parsed.country || '');
              setSelectedStateId(parsed.state || '');
              setSelectedCityId(parsed.city || '');
              setCurrentStep(parsed.step || 1);
            } catch (e) {
              resetToCleanForm();
            }
          } else {
            localStorage.removeItem('hospedate_attraction_draft');
            resetToCleanForm();
          }
        });
      } else {
        resetToCleanForm();
      }
    }
  }, [id, isEditing, attractions, locations, subcategories, navigate]);

  // Autoguardado dinámico de borrador local
  useEffect(() => {
    if (!isEditing && !isSaved) {
      const draftData = {
        form,
        country: selectedCountryId,
        state: selectedStateId,
        city: selectedCityId,
        step: currentStep
      };
      localStorage.setItem('hospedate_attraction_draft', JSON.stringify(draftData));
    }
  }, [form, selectedCountryId, selectedStateId, selectedCityId, currentStep, isEditing, isSaved]);

  const cleanDraft = () => {
    localStorage.removeItem('hospedate_attraction_draft');
  };

  // Selectores en cascada
  const countries = useMemo(() => locations.filter(l => l.type === 'Country'), [locations]);
  
  const states = useMemo(() => {
    if (!selectedCountryId) return [];
    return locations.filter(l => l.type === 'State' && l.parentId === selectedCountryId);
  }, [locations, selectedCountryId]);

  const cities = useMemo(() => {
    if (!selectedStateId) return [];
    return locations.filter(l => l.type === 'City' && l.parentId === selectedStateId);
  }, [locations, selectedStateId]);

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedStateId('');
    setSelectedCityId('');
  };

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedCityId('');
  };

  // --- MAPA EDITABLE CALLBACK ---
  const handleMapCoordsChange = (lat: number, lng: number) => {
    setForm(prev => ({
      ...prev,
      location_coords: {
        lat,
        lng,
        placeName: prev.location_coords?.placeName || ''
      }
    }));
  };

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        setForm(prev => ({
          ...prev,
          location_coords: {
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon),
            placeName: first.display_name
          }
        }));
      } else {
        Swal.fire({
          title: 'Destino no encontrado',
          text: 'No logramos ubicar el lugar en el mapa. Intenta con un término más general.',
          icon: 'info',
          confirmButtonColor: '#0058bc'
        });
      }
    } catch (error) {
      console.warn('Fallo en el servicio de geocodificación externa.', error);
    }
  };

  // --- TARIFAS Y OPCIONES ---
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [newOptionTitle, setNewOptionTitle] = useState('');

  const currentOption = useMemo<ProductOption | null>(() => {
    const opts = form.product_options || [];
    if (opts.length === 0) return null;
    return opts[selectedOptionIndex] || opts[0];
  }, [form.product_options, selectedOptionIndex]);

  const addProductOption = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newOptionTitle.trim()) return;

    const newOpt: ProductOption = {
      id: 'po-temp-' + Date.now(),
      title: newOptionTitle.trim(),
      price_tiers: [
        { label: 'Adulto', age_min: 18, age_max: 99, price: 50.00 }
      ]
    };

    setForm(prev => ({
      ...prev,
      product_options: [...(prev.product_options || []), newOpt] as any
    }));

    setSelectedOptionIndex((form.product_options || []).length);
    setNewOptionTitle('');
  };

  const removeProductOption = (index: number) => {
    const opts = form.product_options || [];
    if (opts.length <= 1) {
      Swal.fire({
        title: 'Acción inválida',
        text: 'La atracción debe tener por lo menos una modalidad de tarifa disponible.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }
    const updated = opts.filter((_, idx) => idx !== index);
    setForm(prev => ({ ...prev, product_options: updated as any }));
    setSelectedOptionIndex(0);
  };

  const updatePriceTier = (tierIndex: number, field: keyof PriceTier, value: any) => {
    const opts = [...(form.product_options || [])];
    const opt = opts[selectedOptionIndex];
    if (!opt) return;

    let parsedValue = value;
    if (field === 'price' || field === 'age_min' || field === 'age_max') {
      if (value === '') {
        parsedValue = '';
      } else {
        parsedValue = Math.max(0, Number(value));
      }
    }

    const updatedTiers = [...opt.price_tiers];
    updatedTiers[tierIndex] = {
      ...updatedTiers[tierIndex],
      [field]: parsedValue
    };

    opts[selectedOptionIndex] = {
      ...opt,
      price_tiers: updatedTiers
    };

    // Actualizar también el precio base del catálogo con el precio más bajo de adultos si existe
    const adultTier = updatedTiers.find(t => t.label.toLowerCase().includes('adulto'));
    const rawPrice = adultTier ? adultTier.price : (updatedTiers[0]?.price || 0.0);
    const priceBase = (rawPrice as any) === '' ? 0.0 : Number(rawPrice);

    setForm(prev => ({
      ...prev,
      product_options: opts as any,
      price_base: priceBase
    }));
  };

  const addPriceTier = () => {
    const opts = [...(form.product_options || [])];
    const opt = opts[selectedOptionIndex];
    if (!opt) return;

    const newTier: PriceTier = { label: 'Nueva Categoría', age_min: 0, age_max: 99, price: 30.00 };
    opts[selectedOptionIndex] = {
      ...opt,
      price_tiers: [...opt.price_tiers, newTier] as any
    };

    setForm(prev => ({ ...prev, product_options: opts as any }));
  };

  const removePriceTier = (tierIndex: number) => {
    const opts = [...(form.product_options || [])];
    const opt = opts[selectedOptionIndex];
    if (!opt) return;

    if (opt.price_tiers.length <= 1) {
      Swal.fire({
        title: 'Acción inválida',
        text: 'Debes tener al menos una categoría de precio para la modalidad.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    const updatedTiers = opt.price_tiers.filter((_, idx) => idx !== tierIndex);
    opts[selectedOptionIndex] = {
      ...opt,
      price_tiers: updatedTiers
    };

    setForm(prev => ({ ...prev, product_options: opts as any }));
  };

  // --- MULTIMEDIA Y GALERÍA ---
  const [newImageUrl, setNewImageUrl] = useState('');

  const addImageToGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const currentMedia = form.media || [];
    const isMain = currentMedia.length === 0;

    const newImg = {
      id: 'm-' + Date.now(),
      url: newImageUrl.trim(),
      is_main: isMain
    };

    setForm(prev => ({
      ...prev,
      media: [...(prev.media || []), newImg]
    }));

    setNewImageUrl('');
  };

  const setMainImage = (index: number) => {
    const updated = (form.media || []).map((img, idx) => ({
      ...img,
      is_main: idx === index
    }));
    setForm(prev => ({ ...prev, media: updated }));
  };

  const removeImage = (index: number) => {
    const media = form.media || [];
    const imageToBeRemoved = media[index];
    let updated = media.filter((_, idx) => idx !== index);

    // Si borramos la principal, marcar la primera restante como principal
    if (imageToBeRemoved?.is_main && updated.length > 0) {
      updated[0] = { ...updated[0], is_main: true };
    }

    setForm(prev => ({ ...prev, media: updated }));
  };

  // Carga rápida de imágenes de Unsplash de demostración
  const loadDemoImages = () => {
    const demoPhotos = [
      { id: 'demo-1', url: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800', is_main: true },
      { id: 'demo-2', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', is_main: false },
      { id: 'demo-3', url: 'https://images.unsplash.com/photo-1627914589224-b152e0078b66?w=800', is_main: false }
    ];
    setForm(prev => ({ ...prev, media: demoPhotos }));
  };

  // --- ITINERARIO ---
  const [newStopName, setNewStopName] = useState('');
  const [newStopDuration, setNewStopDuration] = useState('1h');

  const addItineraryStop = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newStopName.trim()) return;

    const stopNumber = (form.itinerary || []).length + 1;
    const newStop = {
      stop_number: stopNumber,
      name: newStopName.trim(),
      duration: newStopDuration,
      is_included: true
    };

    setForm(prev => ({
      ...prev,
      itinerary: [...(prev.itinerary || []), newStop]
    }));

    setNewStopName('');
    setNewStopDuration('1h');
  };

  const removeItineraryStop = (index: number) => {
    const updated = (form.itinerary || []).filter((_, idx) => idx !== index);
    const reordered = updated.map((stop, idx) => ({
      ...stop,
      stop_number: idx + 1
    }));
    setForm(prev => ({ ...prev, itinerary: reordered }));
  };

  const toggleStopInclusion = (index: number) => {
    const updated = (form.itinerary || []).map((stop, idx) => {
      if (idx === index) {
        return { ...stop, is_included: !stop.is_included };
      }
      return stop;
    });
    setForm(prev => ({ ...prev, itinerary: updated }));
  };

  const moveItineraryStop = (index: number, direction: 'up' | 'down') => {
    const itinerary = form.itinerary || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= itinerary.length) return;

    const updated = [...itinerary];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((stop, idx) => ({
      ...stop,
      stop_number: idx + 1
    }));

    setForm(prev => ({ ...prev, itinerary: reordered }));
  };

  // --- INCLUSIONES ---
  const toggleInclusion = (inclusionId: string, type: 'included' | 'excluded') => {
    const currentInclusions = form.inclusions || [];
    const index = currentInclusions.findIndex(i => i.inclusion_item_id === inclusionId);

    let updated = [...currentInclusions];

    if (index !== -1) {
      if (currentInclusions[index].type === type) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], type };
      }
    } else {
      updated.push({ inclusion_item_id: inclusionId, type });
    }

    setForm(prev => ({ ...prev, inclusions: updated }));
  };

  const isInclusionActive = (inclusionId: string, type: string) => {
    return (form.inclusions || []).some(i => i.inclusion_item_id === inclusionId && i.type === type);
  };

  // --- TAGS ---
  const [customTagInput, setCustomTagInput] = useState('');

  const addCustomTag = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/^#/, ''); // Quitar '#' si lo escribe
    if (!cleanTag) return;

    const currentTags = form.tags || [];
    if (!currentTags.includes(cleanTag)) {
      setForm(prev => ({
        ...prev,
        tags: [...currentTags, cleanTag]
      }));
    }
    setCustomTagInput('');
  };

  const toggleTag = (tagId: string) => {
    const currentTags = form.tags || [];
    const index = currentTags.indexOf(tagId);
    let updated = [...currentTags];

    if (index !== -1) {
      updated.splice(index, 1);
    } else {
      updated.push(tagId);
    }

    setForm(prev => ({ ...prev, tags: updated }));
  };

  // --- PASO 6: FECHAS, HORARIOS E INVENTARIO (SLOTS) ---
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [genStartTime, setGenStartTime] = useState('09:00');
  const [genEndTime, setGenEndTime] = useState('14:00');
  const [genCapacity, setGenCapacity] = useState<number | ''>(15);
  const [genDaysOfWeek, setGenDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]); // Lunes a Domingo

  const activeOptionId = useMemo(() => {
    return currentOption?.id || '';
  }, [currentOption]);

  const activeSlots = useMemo(() => {
    if (!activeOptionId) return [];
    return slots
      .filter(s => s.productId === activeOptionId)
      .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime));
  }, [slots, activeOptionId]);

  const toggleGenDay = (dayVal: number) => {
    setGenDaysOfWeek(prev => 
      prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleGenerateSlots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOptionId) {
      Swal.fire({
        title: 'Modalidad requerida',
        text: 'Debes definir una opción de producto en el Paso 3 antes de generar horarios.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (!genStartDate || !genEndDate) {
      Swal.fire({
        title: 'Fechas incompletas',
        text: 'Por favor, selecciona el rango de fecha de inicio y fin.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (genDaysOfWeek.length === 0) {
      Swal.fire({
        title: 'Selecciona días',
        text: 'Marca por lo menos un día de la semana para habilitar la plantilla.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (genCapacity === '' || genCapacity <= 0) {
      Swal.fire({
        title: 'Capacidad inválida',
        text: 'Por favor, ingresa una capacidad de cupos válida (mínimo 1).',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    const created = generateScheduleMassive(activeOptionId, {
      startDate: genStartDate,
      endDate: genEndDate,
      startTime: genStartTime,
      endTime: genEndTime,
      capacity: genCapacity,
      daysOfWeek: genDaysOfWeek
    });

    Swal.fire({
      title: 'Disponibilidad Generada',
      text: `Se crearon con éxito ${created} nuevos slots de horarios en el sistema.`,
      icon: 'success',
      confirmButtonColor: '#0058bc'
    });
  };

  const [delStartDate, setDelStartDate] = useState('');
  const [delEndDate, setDelEndDate] = useState('');

  const handleDeleteSlots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOptionId) return;

    if (!delStartDate || !delEndDate) {
      Swal.fire({
        title: 'Rango de fechas requerido',
        text: 'Ingresa las fechas de inicio y fin para ejecutar la depuración.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar depuración?',
      text: 'Esta acción eliminará de forma permanente todos los slots vacíos sin reservas en este rango. ¡No se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#747782',
      confirmButtonText: 'Sí, depurar slots',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = bulkDeleteSlots(activeOptionId, delStartDate, delEndDate);
        Swal.fire({
          title: 'Slots Depurados',
          text: `Se eliminaron ${deleted} slots de disponibilidad libres de reservas.`,
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });
        setDelStartDate('');
        setDelEndDate('');
      }
    });
  };

  // --- CALIDAD DEL ANUNCIO ---
  const qualityScore = useMemo(() => {
    let score = 0;
    if (form.name?.trim()) score += 15;
    if (form.description?.trim() && form.description.length > 50) score += 15;
    if (selectedCityId) score += 15;
    if (form.location_coords?.lat !== -0.2201) score += 10;
    if ((form.media || []).length >= 2) score += 15;
    if ((form.itinerary || []).length >= 2) score += 15;
    if ((form.product_options || []).length > 0) score += 15;
    return Math.min(score, 100);
  }, [form, selectedCityId]);

  // --- VALIDACIÓN DE PASOS ---
  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.name?.trim()) stepErrors.name = 'El nombre de la atracción es obligatorio.';
      if (!form.description?.trim()) stepErrors.description = 'La descripción es obligatoria.';
      if (form.description && form.description.length < 20) {
        stepErrors.description = 'Escribe una descripción más detallada (mínimo 20 caracteres).';
      }
    }
    if (step === 2) {
      if (!selectedCityId) stepErrors.city = 'Debes especificar una Ciudad en la jerarquía geográfica.';
      if (!form.location_coords?.placeName?.trim()) {
        stepErrors.placeName = 'El punto de encuentro exacto o punto de encuentro es requerido.';
      }
    }
    if (step === 3) {
      const opts = form.product_options || [];
      if (opts.length === 0) {
        stepErrors.options = 'Debes configurar al menos una modalidad de producto.';
      }
    }
    if (step === 4) {
      const media = form.media || [];
      if (media.length === 0) {
        stepErrors.media = 'Te sugerimos agregar al menos una imagen para tu publicación.';
      }
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      setCurrentStep(prev => Math.min(prev + 1, 7));
    } else {
      Swal.fire({
        title: 'Verifica los campos',
        text: 'Por favor, completa los campos requeridos marcados en rojo antes de avanzar.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
    }
  };

  // --- GUARDADO DEFINITIVO EN SUPABASE ---
  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      Swal.fire({
        title: 'Datos Incompletos',
        text: 'Por favor, revisa la información de los pasos 1 y 2 antes de publicar.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    const sanitizedOptions = (form.product_options || []).map(opt => ({
      ...opt,
      price_tiers: opt.price_tiers.map((tier: any) => ({
        label: tier.label,
        age_min: tier.age_min === '' ? undefined : Number(tier.age_min),
        age_max: tier.age_max === '' ? undefined : Number(tier.age_max),
        price: tier.price === '' ? 0.0 : Number(tier.price)
      }))
    }));

    const finalForm: Partial<AttractionDetail> = {
      ...form,
      location_id: selectedCityId,
      product_options: sanitizedOptions as any
    };

    let success = false;
    const currentToken = token || '';

    try {
      if (isEditing && id) {
        const res = await updateAttraction(id, finalForm, currentToken);
        success = res.success;
      } else {
        const res = await addAttraction(finalForm, currentToken);
        success = res.success;
      }

      if (success) {
        setIsSaved(true);
        cleanDraft();
        Swal.fire({
          title: isEditing ? '¡Atracción Actualizada!' : '¡Atracción Creada!',
          text: `El registro de "${form.name}" y sus slots de disponibilidad se guardaron con éxito.`,
          icon: 'success',
          confirmButtonColor: '#0058bc'
        }).then(() => {
          navigate('/admin');
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error de Red',
        text: 'No fue posible sincronizar el producto con el servidor de Supabase.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-surface-variant pb-4">
        <Link to="/admin" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Volver al Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
          {isEditing ? 'Editar Atracción' : 'Crear Nueva Atracción'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* PANEL LATERAL: Stepper Navigation */}
        <aside className="lg:col-span-1 bg-white border border-surface-variant rounded-3xl p-5 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Pasos de Anuncio</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-primary">
              {currentStep}/7
            </span>
          </div>

          <nav className="flex flex-col gap-2.5">
            {steps.map((item) => {
              const isDone = currentStep > item.step;
              const isActive = currentStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (isEditing || isDone || validateStep(currentStep)) {
                      setCurrentStep(item.step);
                    }
                  }}
                  className={`w-full flex items-start gap-3 text-left p-3 rounded-2xl transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-secondary/10 border-secondary/35 text-primary scale-[1.01] font-semibold'
                      : isDone
                      ? 'bg-surface-container border-outline-variant text-outline hover:border-secondary'
                      : 'bg-white border-transparent text-outline hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : isDone 
                      ? 'bg-success-green/20 text-success-green' 
                      : 'bg-surface text-outline'
                  }`}>
                    {isDone ? <span className="material-symbols-outlined text-xs">check</span> : item.step}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                    <span className="text-[9px] text-outline font-normal leading-tight mt-0.5">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Calidad del anuncio */}
          <div className="border-t border-surface-variant pt-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-primary">Calidad de Publicación</span>
              <span className="font-bold text-secondary">{qualityScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-500" 
                style={{ width: `${qualityScore}%` }}
              ></div>
            </div>
          </div>
        </aside>

        {/* CONTENEDOR PRINCIPAL: Formulario Dinámico */}
        <main className="lg:col-span-3 bg-white border border-surface-variant rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[550px]">
          
          {/* CONTENIDOS POR PASO */}
          <div className="flex-grow">
            
            {/* PASO 1: GENERAL */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Información Básica</h3>
                  <p className="text-xs text-outline mt-0.5">Define los aspectos centrales del servicio turístico.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold uppercase tracking-wider">Nombre del Tour / Atracción</label>
                    <input 
                      type="text" 
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Tour de Ciclismo Cotopaxi"
                      className={`px-4 py-2.5 rounded-xl bg-background border ${errors.name ? 'border-error ring-1 ring-error' : 'border-outline-variant'} text-sm text-primary focus:outline-none focus:border-secondary`}
                    />
                    {errors.name && <span className="text-error text-[10px] font-bold">{errors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold uppercase tracking-wider">Subcategoría del Catálogo</label>
                    <select 
                      value={form.subcategory_id}
                      onChange={(e) => setForm(prev => ({ ...prev, subcategory_id: e.target.value }))}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-primary focus:outline-none focus:border-secondary"
                    >
                      {subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {getCategoryById(sub.categoryId)?.name} &gt; {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs text-outline font-semibold uppercase tracking-wider">Descripción del Producto</label>
                    <textarea 
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Escribe una reseña comercial atractiva detallando lo que incluye y la aventura..."
                      className={`h-36 px-4 py-3 rounded-xl bg-background border ${errors.description ? 'border-error ring-1 ring-error' : 'border-outline-variant'} text-sm text-primary focus:outline-none focus:border-secondary leading-relaxed`}
                    ></textarea>
                    {errors.description && <span className="text-error text-[10px] font-bold">{errors.description}</span>}
                  </div>

                  {/* Selector de Etiquetas / Tags */}
                  <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-xs text-outline font-semibold uppercase tracking-wider">Etiquetas / Tags de la Atracción</label>
                    
                    {/* Input para etiquetas personalizadas */}
                    <div className="flex gap-2 max-w-md">
                      <input 
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Crear etiqueta personalizada (ej: AventuraExtrema)..."
                        className="w-full px-3 py-2 rounded-xl bg-background border border-outline-variant text-xs focus:outline-none focus:border-secondary"
                      />
                      <button
                        type="button"
                        onClick={addCustomTag}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer flex-shrink-0"
                      >
                        Crear Tag
                      </button>
                    </div>

                    {/* Etiquetas seleccionadas actualmente */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(form.tags || []).map((tagId) => {
                        const catalogTag = tags.find(t => t.id === tagId);
                        const displayName = catalogTag ? catalogTag.name : tagId;
                        return (
                          <button
                            key={tagId}
                            type="button"
                            onClick={() => toggleTag(tagId)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-secondary/20 border-secondary text-primary cursor-pointer flex items-center gap-1"
                            title="Haz clic para quitar"
                          >
                            <span>#{displayName}</span>
                            <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                          </button>
                        );
                      })}
                      {(form.tags || []).length === 0 && (
                        <span className="text-xs text-outline italic">No has seleccionado ninguna etiqueta aún.</span>
                      )}
                    </div>

                    {/* Sugerencias del Catálogo */}
                    {tags.filter(t => !(form.tags || []).includes(t.id)).length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-[10px] text-outline font-bold uppercase text-left">Sugerencias del Catálogo</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags
                            .filter(t => !(form.tags || []).includes(t.id))
                            .map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-outline-variant bg-background text-outline hover:border-secondary/50 cursor-pointer"
                              >
                                + {tag.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado Operativo Dual */}
                  <div className="md:col-span-2 border-t border-surface-variant pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-background border border-surface-variant flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">Publicar Inmediatamente</span>
                        <span className="text-[9px] text-outline">Si está inactivo, se guardará como borrador.</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_published: !prev.is_published }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          form.is_published ? 'bg-secondary/20 border-secondary text-primary' : 'bg-white border-outline-variant text-outline'
                        }`}
                      >
                        {form.is_published ? 'Publicado' : 'Borrador'}
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-background border border-surface-variant flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">Estado de Operación</span>
                        <span className="text-[9px] text-outline">Define si el producto acepta reservas.</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          form.is_active ? 'bg-success-green/15 border-success-green/35 text-success-green' : 'bg-white border-outline-variant text-outline'
                        }`}
                      >
                        {form.is_active ? 'Operativo' : 'Pausado'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: UBICACIÓN Y MAPA */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Geolocalización del Anuncio</h3>
                  <p className="text-xs text-outline mt-0.5">Selecciona el destino y ubica el punto de encuentro exacto para los viajeros en el mapa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">País</label>
                    <select 
                      value={selectedCountryId}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-primary focus:outline-none focus:border-secondary"
                    >
                      <option value="">Selecciona País...</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Provincia / Estado</label>
                    <select 
                      value={selectedStateId}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={states.length === 0}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-primary focus:outline-none focus:border-secondary disabled:opacity-50"
                    >
                      <option value="">Selecciona Estado...</option>
                      {states.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Ciudad</label>
                    <select 
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      disabled={cities.length === 0}
                      className={`px-4 py-2.5 rounded-xl bg-background border ${errors.city ? 'border-error ring-1 ring-error' : 'border-outline-variant'} text-sm text-primary focus:outline-none focus:border-secondary disabled:opacity-50`}
                    >
                      <option value="">Selecciona Ciudad...</option>
                      {cities.map(ci => (
                        <option key={ci.id} value={ci.id}>{ci.name}</option>
                      ))}
                    </select>
                    {errors.city && <span className="text-error text-[10px] font-bold">{errors.city}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-outline font-semibold uppercase tracking-wider">Dirección Escrita / Punto de Encuentro</label>
                    <input 
                      type="text" 
                      value={form.location_coords?.placeName || ''}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        location_coords: { ...prev.location_coords!, placeName: e.target.value }
                      }))}
                      placeholder="Ej: Boletería del Parque Nacional Cotopaxi, Pichincha"
                      className={`px-4 py-2.5 rounded-xl bg-background border ${errors.placeName ? 'border-error ring-1 ring-error' : 'border-outline-variant'} text-sm text-primary focus:outline-none focus:border-secondary`}
                    />
                    {errors.placeName && <span className="text-error text-[10px] font-bold">{errors.placeName}</span>}
                  </div>

                  {/* Buscador de mapa interactivo */}
                  <form onSubmit={handleMapSearch} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      placeholder="Buscar un sitio en el mapa (ej. Cotopaxi, Quito...)"
                      className="w-full px-4 py-2 rounded-xl bg-background border border-outline-variant text-xs focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0058bc] text-white hover:bg-blue-700 cursor-pointer"
                    >
                      Buscar
                    </button>
                  </form>

                  {/* Render de mapa Leaflet editable */}
                  <div className="w-full h-80 rounded-2xl overflow-hidden border border-outline-variant">
                    <LeafletMap 
                      lat={form.location_coords?.lat || -0.2201}
                      lng={form.location_coords?.lng || -78.5122}
                      placeName={form.location_coords?.placeName || 'Punto de encuentro'}
                      isEditable={true}
                      onCoordinatesChange={handleMapCoordsChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-background border border-outline-variant p-2.5 rounded-xl">
                      <span className="text-outline">Latitud:</span> {form.location_coords?.lat.toFixed(6)}
                    </div>
                    <div className="bg-background border border-outline-variant p-2.5 rounded-xl">
                      <span className="text-outline">Longitud:</span> {form.location_coords?.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: PRECIOS Y TARIFAS (MATRIZ DINÁMICA) */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Modalidades y Estructura Financiera</h3>
                  <p className="text-xs text-outline mt-0.5">Configura variantes de tour y define los precios para cada rango de edad.</p>
                </div>

                {/* Constructor de opciones de producto */}
                <div className="p-4 rounded-2xl bg-background border border-surface-variant flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-grow flex flex-col gap-1 text-left w-full">
                    <label className="text-[10px] text-outline font-bold uppercase">Nueva Modalidad de Venta</label>
                    <input 
                      type="text" 
                      value={newOptionTitle}
                      onChange={(e) => setNewOptionTitle(e.target.value)}
                      placeholder="Ej: Tour Privado VIP"
                      className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={addProductOption}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer flex items-center justify-center gap-1 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Añadir Modalidad</span>
                  </button>
                </div>

                {/* Tabs de Modalidades */}
                <div className="flex items-center gap-2 border-b border-surface-variant overflow-x-auto pb-px">
                  {(form.product_options || []).map((opt, idx) => (
                    <div key={opt.id || idx} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedOptionIndex(idx)}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex-shrink-0 ${
                          selectedOptionIndex === idx ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-primary'
                        }`}
                      >
                        {opt.title}
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeProductOption(idx)}
                        className="p-1 text-outline hover:text-error transition-colors"
                        title="Eliminar esta modalidad"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Matriz de tarifas de la opción activa */}
                {currentOption && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                      <h4 className="text-xs font-bold text-primary uppercase">Categorías de Edad y Precios</h4>
                      <button 
                        type="button"
                        onClick={addPriceTier}
                        className="text-xs font-bold text-secondary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Nueva Tarifa de Edad</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-surface-variant text-[10px] font-bold text-outline uppercase tracking-wider">
                            <th className="py-2.5 px-3">Categoría / Rango</th>
                            <th className="py-2.5 px-3 w-20">Edad Mín</th>
                            <th className="py-2.5 px-3 w-20">Edad Máx</th>
                            <th className="py-2.5 px-3 w-32">Precio ($ USD)</th>
                            <th className="py-2.5 px-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentOption.price_tiers.map((tier, idx) => (
                            <tr key={idx} className="border-b border-surface-variant hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3">
                                <input 
                                  type="text" 
                                  value={tier.label}
                                  onChange={(e) => updatePriceTier(idx, 'label', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-outline text-xs text-primary focus:outline-none py-1"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number" 
                                  value={tier.age_min ?? ''}
                                  onChange={(e) => updatePriceTier(idx, 'age_min', e.target.value)}
                                  min="0"
                                  className="w-full bg-background border border-outline-variant text-center rounded-lg p-1 text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input 
                                  type="number" 
                                  value={tier.age_max ?? ''}
                                  onChange={(e) => updatePriceTier(idx, 'age_max', e.target.value)}
                                  min="0"
                                  className="w-full bg-background border border-outline-variant text-center rounded-lg p-1 text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="relative rounded-lg border border-outline-variant bg-background px-2.5 py-1 flex items-center">
                                  <span className="text-[10px] text-outline mr-1 font-bold">$</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={tier.price ?? ''}
                                    onChange={(e) => updatePriceTier(idx, 'price', e.target.value)}
                                    min="0"
                                    className="w-full bg-transparent text-xs text-primary font-bold focus:outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button 
                                  type="button"
                                  onClick={() => removePriceTier(idx)}
                                  className="p-1 rounded hover:bg-error/10 text-outline hover:text-error transition-colors"
                                  title="Eliminar tarifa"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4: GALERÍA MULTIMEDIA */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Galería Multimedia</h3>
                  <p className="text-xs text-outline mt-0.5">Sube imágenes en alta calidad. La primera imagen marcada como principal será la portada.</p>
                </div>

                {/* Subidor de fotos por URL (Dropzone simulado) */}
                <form onSubmit={addImageToGallery} className="p-6 rounded-2xl border border-dashed border-outline-variant bg-background flex flex-col items-center justify-center text-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-outline">add_photo_alternate</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-primary">Ingresa la URL de la Imagen</span>
                    <span className="text-[9px] text-outline">Ingresa enlaces web de Unsplash o similares.</span>
                  </div>
                  
                  <div className="flex gap-2 w-full max-w-lg mt-2">
                    <input 
                      type="url" 
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container cursor-pointer flex-shrink-0"
                    >
                      Añadir Foto
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={loadDemoImages}
                    className="mt-2 text-xs font-semibold text-secondary hover:underline cursor-pointer"
                  >
                    Usar fotos de demostración del Cotopaxi/Ecuador
                  </button>
                </form>

                {/* Grid de imágenes */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-primary uppercase border-b border-surface-variant pb-2">Fotos del Anuncio</h4>
                  
                  {(form.media || []).length === 0 ? (
                    <div className="text-center py-12 text-outline text-xs">
                      No has subido ninguna imagen para esta atracción.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {(form.media || []).map((img, idx) => (
                        <div key={img.id || idx} className="relative rounded-2xl overflow-hidden border border-surface-variant group shadow-sm bg-background">
                          <img 
                            src={img.url} 
                            alt={`Galería ${idx + 1}`} 
                            className="w-full h-40 object-cover"
                          />
                          
                          {/* Botón de Portada (Estrella) */}
                          <button
                            type="button"
                            onClick={() => setMainImage(idx)}
                            className={`absolute top-2 left-2 p-1.5 rounded-lg border transition-all ${
                              img.is_main 
                                ? 'bg-primary border-primary-container text-tertiary-fixed-dim' 
                                : 'bg-white/90 border-surface-variant text-outline hover:text-primary'
                            }`}
                            title={img.is_main ? 'Foto de Portada' : 'Marcar como Portada'}
                          >
                            <span className="material-symbols-outlined text-sm">star</span>
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-surface-variant text-outline hover:text-error transition-colors"
                            title="Eliminar Foto"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>

                          <div className="p-3 text-center bg-white text-[9px] text-outline font-semibold uppercase tracking-wider border-t border-surface-variant">
                            {img.is_main ? 'Imagen de Portada' : `Foto #${idx + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 5: ITINERARIO REORDENABLE */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Itinerario y Línea de Tiempo</h3>
                  <p className="text-xs text-outline mt-0.5">Describe las paradas del viaje. Puedes reordenar cronológicamente las actividades.</p>
                </div>

                {/* Agregar parada */}
                <div className="p-4 rounded-xl bg-background border border-surface-variant grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5 md:col-span-2 text-left w-full">
                    <label className="text-[10px] text-outline font-semibold uppercase">Nombre del Sitio / Parada</label>
                    <input 
                      type="text" 
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      placeholder="Ej: Caminata hacia el refugio..."
                      className="px-3 py-2 rounded-lg bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-left w-full">
                    <label className="text-[10px] text-outline font-semibold uppercase">Duración de la Actividad</label>
                    <input 
                      type="text" 
                      value={newStopDuration}
                      onChange={(e) => setNewStopDuration(e.target.value)}
                      placeholder="Ej: 1h 30m"
                      className="px-3 py-2 rounded-lg bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={addItineraryStop}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-secondary text-white hover:bg-secondary-container cursor-pointer flex items-center justify-center gap-1 w-full"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Añadir Parada</span>
                  </button>
                </div>

                {/* Timeline de paradas */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-primary uppercase border-b border-surface-variant pb-2">Itinerario de Actividades</h4>
                  
                  {(form.itinerary || []).length === 0 ? (
                    <div className="text-center py-12 text-outline text-xs">
                      No has agregado paradas en el itinerario.
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l border-outline-variant flex flex-col gap-6 ml-3">
                      {(form.itinerary || []).map((stop, index) => (
                        <div key={index} className="relative bg-white border border-surface-variant rounded-2xl p-4 flex items-center justify-between text-xs hover:border-outline transition-all">
                          {/* Indicador de la línea de tiempo */}
                          <span className="absolute -left-[35px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-[10px] border-4 border-white shadow-sm">
                            {stop.stop_number}
                          </span>

                          <div className="flex flex-col text-left gap-0.5">
                            <span className="font-bold text-primary">{stop.name}</span>
                            <span className="text-[10px] text-outline font-semibold">Duración: {stop.duration}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => toggleStopInclusion(index)}
                              className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all border ${
                                stop.is_included 
                                  ? 'bg-success-green/10 border-success-green/20 text-success-green' 
                                  : 'bg-error/10 border-error/20 text-error'
                              }`}
                            >
                              {stop.is_included ? 'Incluido' : 'Opcional'}
                            </button>

                            {/* Control reordenar */}
                            <div className="flex items-center border border-surface-variant rounded-lg bg-background overflow-hidden">
                              <button
                                type="button"
                                onClick={() => moveItineraryStop(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 text-outline hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-40"
                                title="Subir parada"
                              >
                                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItineraryStop(index, 'down')}
                                disabled={index === (form.itinerary || []).length - 1}
                                className="p-1.5 text-outline hover:bg-surface-variant hover:text-primary transition-colors border-l border-surface-variant disabled:opacity-40"
                                title="Bajar parada"
                              >
                                <span className="material-symbols-outlined text-xs">arrow_downward</span>
                              </button>
                            </div>

                            <button 
                              type="button"
                              onClick={() => removeItineraryStop(index)}
                              className="p-1.5 rounded border border-surface-variant hover:bg-error/10 text-outline hover:text-error transition-all"
                              title="Eliminar parada"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inclusiones e exclusiones (Servicios) */}
                <div className="border-t border-surface-variant pt-6 mt-4 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-primary uppercase">Servicios Incluidos / Excluidos</h3>
                    <p className="text-[10px] text-outline mt-0.5">Asigna qué servicios básicos del catálogo se cubren con el valor pagado.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {inclusions.map(item => (
                      <div key={item.id} className="p-3.5 rounded-xl bg-background border border-surface-variant flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">{item.default_text}</span>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => toggleInclusion(item.id, 'included')}
                            className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              isInclusionActive(item.id, 'included') ? 'bg-success-green/10 border-success-green/20 text-success-green' : 'bg-white border-outline-variant text-outline'
                            }`}
                          >
                            Sí
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleInclusion(item.id, 'excluded')}
                            className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              isInclusionActive(item.id, 'excluded') ? 'bg-error/10 border-error/20 text-error' : 'bg-white border-outline-variant text-outline'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 6: FECHAS, HORARIOS E INVENTARIO (SLOTS) */}
            {currentStep === 6 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Disponibilidad, Horarios e Inventario</h3>
                  <p className="text-xs text-outline mt-0.5">Programa los días, horas de salida y capacidad de cupos permitidos por salida.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Generador Masivo */}
                  <form onSubmit={handleGenerateSlots} className="p-5 rounded-2xl border border-surface-variant bg-background flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-primary uppercase border-b border-surface-variant pb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">date_range</span>
                      <span>Generación Masiva de Slots</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Fecha Inicio</label>
                        <input 
                          type="date" 
                          value={genStartDate}
                          onChange={(e) => setGenStartDate(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Fecha Fin</label>
                        <input 
                          type="date" 
                          value={genEndDate}
                          onChange={(e) => setGenEndDate(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Hora Salida</label>
                        <input 
                          type="time" 
                          value={genStartTime}
                          onChange={(e) => setGenStartTime(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Hora Retorno</label>
                        <input 
                          type="time" 
                          value={genEndTime}
                          onChange={(e) => setGenEndTime(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Cupos Máx</label>
                        <input 
                          type="number" 
                          value={genCapacity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGenCapacity(val === '' ? '' : Math.max(0, Number(val)));
                          }}
                          min="0"
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary text-center font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] text-outline font-semibold uppercase">Días Operativos</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Lu', val: 1 },
                          { label: 'Ma', val: 2 },
                          { label: 'Mi', val: 3 },
                          { label: 'Ju', val: 4 },
                          { label: 'Vi', val: 5 },
                          { label: 'Sa', val: 6 },
                          { label: 'Do', val: 0 }
                        ].map(d => {
                          const active = genDaysOfWeek.includes(d.val);
                          return (
                            <button
                              key={d.val}
                              type="button"
                              onClick={() => toggleGenDay(d.val)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                active ? 'bg-secondary border-secondary text-white' : 'bg-white border-outline-variant text-outline'
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleGenerateSlots}
                      className="w-full mt-2 py-3 rounded-xl text-xs font-bold bg-[#0058bc] text-white hover:bg-blue-700 transition-all cursor-pointer"
                    >
                      Generar Plantilla de Slots
                    </button>
                  </form>

                  {/* Depuración en Lote */}
                  <form onSubmit={handleDeleteSlots} className="p-5 rounded-2xl border border-surface-variant bg-background flex flex-col gap-4 h-fit">
                    <h4 className="text-xs font-bold text-primary uppercase border-b border-surface-variant pb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                      <span>Limpieza y Depuración de Slots</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Desde</label>
                        <input 
                          type="date" 
                          value={delStartDate}
                          onChange={(e) => setDelStartDate(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-semibold uppercase">Hasta</label>
                        <input 
                          type="date" 
                          value={delEndDate}
                          onChange={(e) => setDelEndDate(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white border border-outline-variant text-xs text-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleDeleteSlots}
                      className="w-full py-3 rounded-xl text-xs font-bold bg-error/15 border border-error/20 text-error hover:bg-error/20 transition-all cursor-pointer"
                    >
                      Eliminar Slots Vacíos
                    </button>
                  </form>
                </div>

                {/* Listado de slots ya programados */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-primary uppercase border-b border-surface-variant pb-2">Slots Generados para esta Atracción</h4>
                  
                  {activeSlots.length === 0 ? (
                    <div className="text-center py-12 text-outline text-xs bg-slate-50 border border-surface-variant rounded-2xl">
                      No has programado disponibilidad para este producto todavía.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-surface-variant rounded-2xl bg-white">
                      <table className="min-w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-surface-variant text-[10px] font-bold text-outline uppercase">
                            <th className="py-2.5 px-4">Fecha</th>
                            <th className="py-2.5 px-4">Hora</th>
                            <th className="py-2.5 px-4">Capacidad Total</th>
                            <th className="py-2.5 px-4">Reservas Activas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSlots.map((slot, idx) => {
                            const bookingsCount = slot.capacityTotal - slot.capacityAvailable;
                            return (
                              <tr key={slot.id || idx} className="border-b border-surface-variant hover:bg-slate-50">
                                <td className="py-2.5 px-4 font-mono font-semibold">{slot.slotDate}</td>
                                <td className="py-2.5 px-4 font-mono">{slot.startTime}</td>
                                <td className="py-2.5 px-4">{slot.capacityTotal} personas</td>
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    bookingsCount > 0 ? 'bg-success-green/15 text-success-green' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {bookingsCount} ocupados
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASO 7: REVISIÓN Y PUBLICACIÓN */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-sans">Revisión Final del Anuncio</h3>
                  <p className="text-xs text-outline mt-0.5">Valida el resumen comercial de tu atracción antes de guardarla en la base de datos.</p>
                </div>

                <div className="border border-surface-variant rounded-3xl p-6 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Vista Previa de la tarjeta */}
                  <div className="md:col-span-1 rounded-2xl overflow-hidden bg-white border border-surface-variant flex flex-col shadow-sm">
                    <div className="relative h-44 bg-slate-100">
                      {(form.media || []).length > 0 ? (
                        <img 
                          src={(form.media || []).find(m => m.is_main)?.url || (form.media || [])[0]?.url} 
                          alt={form.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-outline text-xs gap-1">
                          <span className="material-symbols-outlined text-2xl">image</span>
                          <span>Sin imagen</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-tertiary-fixed-dim text-[9px] font-bold">
                        ★ 5.00
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-grow text-xs">
                      <h4 className="font-bold text-primary line-clamp-1">{form.name || 'Sin nombre asignado'}</h4>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-relaxed">{form.description || 'Sin descripción'}</p>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <div className="flex justify-between items-center mt-auto font-bold text-primary">
                        <span className="text-[9px] text-outline font-semibold">Desde</span>
                        <span>${(form.price_base || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Datos */}
                  <div className="md:col-span-2 flex flex-col gap-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-surface-variant flex flex-col">
                        <span className="text-[10px] text-outline uppercase font-semibold">Ubicación Seleccionada</span>
                        <span className="font-bold text-primary mt-1">
                          {locations.find(l => l.id === selectedCityId)?.name || 'No seleccionada'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-variant flex flex-col">
                        <span className="text-[10px] text-outline uppercase font-semibold">Modalidades Disponibles</span>
                        <span className="font-bold text-primary mt-1">
                          {(form.product_options || []).length} opciones
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-variant flex flex-col">
                        <span className="text-[10px] text-outline uppercase font-semibold">Paradas de Itinerario</span>
                        <span className="font-bold text-primary mt-1">
                          {(form.itinerary || []).length} paradas
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-variant flex flex-col">
                        <span className="text-[10px] text-outline uppercase font-semibold">Tags Asignados</span>
                        <span className="font-bold text-primary mt-1">
                          {(form.tags || []).length} hashtags
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-surface-variant flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-primary text-sm">Disponibilidad Horaria</span>
                        <span className="text-[10px] text-outline">Se han configurado {activeSlots.length} slots de salida en el calendario.</span>
                      </div>
                      <Link 
                        to="/admin/schedule" 
                        className="text-xs font-bold text-secondary hover:underline flex items-center gap-0.5"
                      >
                        <span>Gestionar slots</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>

                    {qualityScore < 75 && (
                      <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-[11px] leading-relaxed">
                        <strong>Recomendación:</strong> Tu anuncio tiene un puntaje de calidad del {qualityScore}%. Para captar más clientes, te aconsejamos completar la galería con al menos 2 fotos e ingresar un itinerario más detallado en el paso 5.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* CONTROLES DE NAVEGACIÓN INFERIORES */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Atrás
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">cloud_done</span>
                <span>Guardar y Publicar Anuncio</span>
              </button>
            )}
          </div>

        </main>

      </div>

    </div>
  );
};

export default AdminAttractionEditView;
