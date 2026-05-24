import { defineStore } from 'pinia'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    // Jerarquía de Ubicaciones: País > Estado > Ciudad
    locations: JSON.parse(localStorage.getItem('catalog_locations')) || [
      { id: 'l1', name: 'Ecuador', type: 'Country', parentId: null },
      { id: 'l2', name: 'Pichincha', type: 'State', parentId: 'l1' },
      { id: 'l3', name: 'Quito', type: 'City', parentId: 'l2' },
      { id: 'l4', name: 'Galápagos', type: 'State', parentId: 'l1' },
      { id: 'l5', name: 'Santa Cruz', type: 'City', parentId: 'l4' },
      { id: 'l6', name: 'Azuay', type: 'State', parentId: 'l1' },
      { id: 'l7', name: 'Cuenca', type: 'City', parentId: 'l6' }
    ],

    // Categorías y Subcategorías
    categories: JSON.parse(localStorage.getItem('catalog_categories')) || [
      { id: 'c1', name: 'Naturaleza & Aventura', slug: 'naturaleza-aventura', icon_url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=100' },
      { id: 'c2', name: 'Historia & Cultura', slug: 'historia-cultura', icon_url: 'https://images.unsplash.com/photo-1400690229341-a8c1790f1e71?w=100' },
      { id: 'c3', name: 'Experiencias Gastronómicas', slug: 'gastronomia', icon_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100' }
    ],
    subcategories: JSON.parse(localStorage.getItem('catalog_subcategories')) || [
      { id: 's1', categoryId: 'c1', slug: 'senderismo', name: 'Senderismo & Trekking' },
      { id: 's2', categoryId: 'c1', slug: 'buceo', name: 'Buceo & Snorkel' },
      { id: 's3', categoryId: 'c2', slug: 'tours-ciudad', name: 'Tours de la Ciudad' },
      { id: 's4', categoryId: 'c2', slug: 'museos', name: 'Museos & Monumentos' },
      { id: 's5', categoryId: 'c3', slug: 'degustacion', name: 'Degustaciones de Comida' }
    ],

    // Catálogo Global de Tags
    tags: JSON.parse(localStorage.getItem('catalog_tags')) || [
      { id: 't1', name: 'Destacado', slug: 'destacado' },
      { id: 't2', name: 'Familiar', slug: 'familiar' },
      { id: 't3', name: 'Todo Incluido', slug: 'todo-incluido' },
      { id: 't4', name: 'Eco-Friendly', slug: 'eco-friendly' },
      { id: 't5', name: 'Grupo Reducido', slug: 'grupo-reducido' }
    ],

    // Catálogo Global de Inclusiones / Exclusiones
    inclusions: JSON.parse(localStorage.getItem('catalog_inclusions')) || [
      { id: 'i1', icon_slug: 'guide', default_text: 'Guía profesional bilingüe certificado' },
      { id: 'i2', icon_slug: 'transport', default_text: 'Transporte de ida y vuelta en minibús premium' },
      { id: 'i3', icon_slug: 'food', default_text: 'Almuerzo gourmet de tres platos con bebidas locales' },
      { id: 'i4', icon_slug: 'ticket', default_text: 'Entradas prioritarias de acceso rápido (sin filas)' },
      { id: 'i5', icon_slug: 'equipment', default_text: 'Equipo completo de snorkel (traje de neopreno y aletas)' },
      { id: 'i6', icon_slug: 'insurance', default_text: 'Seguro de accidentes para pasajeros' }
    ],

    // Base de Atracciones
    attractions: JSON.parse(localStorage.getItem('catalog_attractions')) || [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        location_id: 'l5', // Puerto Ayora, Galápagos
        subcategory_id: 's2', // Buceo
        slug: 'crucero-completo-galapagos',
        name: 'Crucero Premium por las Islas Galápagos',
        is_active: true,
        is_published: true,
        description: 'Embárcate en un yate de lujo para explorar el archipiélago más extraordinario del planeta. Observa de cerca iguanas marinas, tortugas gigantes y leones de mar en una aventura guiada por naturalistas certificados con todas las comodidades.',
        tags: ['t1', 't3', 't4'],
        media: [
          { id: 'm1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80', is_main: true },
          { id: 'm2', url: 'https://images.unsplash.com/photo-1583244532610-2a234e7c3eca?w=800&auto=format&fit=crop&q=80', is_main: false },
          { id: 'm3', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', is_main: false }
        ],
        // Coordenadas Leaflet del punto de encuentro
        location_coords: { lat: -0.7431, lng: -90.3134, placeName: 'Muelle de Pasajeros de Puerto Ayora, Galápagos' },
        
        // Inclusiones y Exclusiones específicas
        inclusions: [
          { inclusion_item_id: 'i1', type: 'included' },
          { inclusion_item_id: 'i3', type: 'included' },
          { inclusion_item_id: 'i5', type: 'included' },
          { inclusion_item_id: 'i6', type: 'included' },
          { inclusion_item_id: 'i2', type: 'excluded', custom_text: 'Vuelos comerciales de Ecuador Continental a Baltra' }
        ],
        // Itinerario Interactivo
        itinerary: [
          { stop_number: 1, name: 'Bienvenida en Baltra y trasbordo al Yate de Lujo', duration: '2h', is_included: true },
          { stop_number: 2, name: 'Snorkel guiado con Tortugas en Bahía Gardner', duration: '3h', is_included: true },
          { stop_number: 3, name: 'Caminata y Avistamiento de Albatros en Isla Española', duration: '4h', is_included: true },
          { stop_number: 4, name: 'Visita opcional al Centro de Crianza Fausto Llerena', duration: '2h', is_included: false }
        ],
        // Opciones de Producto
        product_options: [
          {
            id: 'po1',
            title: 'Tour Compartido en Yate Exclusivo',
            slug: 'tour-compartido',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 350.00 },
              { label: 'Niño', age_min: 4, age_max: 17, price: 220.00 },
              { label: 'Tercera Edad', age_min: 66, age_max: 99, price: 290.00 }
            ]
          },
          {
            id: 'po2',
            title: 'Tour Privado VIP con Catamarán Personalizado',
            slug: 'tour-privado',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 950.00 },
              { label: 'Niño', age_min: 4, age_max: 17, price: 650.00 }
            ]
          }
        ],
        price_base: 350.00,
        rating: 4.95,
        review_count: 48
      },
      {
        id: 'a2222222-2222-2222-2222-222222222222',
        location_id: 'l3', // Quito
        subcategory_id: 's3', // Tours Ciudad
        slug: 'quito-colonial-centro-historico',
        name: 'Quito Colonial y Joyas de la Mitad del Mundo',
        is_active: true,
        is_published: true,
        description: 'Descubre el centro histórico más grande y mejor conservado de América. Recorre la icónica Iglesia de la Compañía, el mirador del Panecillo y pisa simultáneamente el hemisferio norte y sur en el complejo de la Mitad del Mundo.',
        tags: ['t1', 't2'],
        media: [
          { id: 'm4', url: 'https://images.unsplash.com/photo-1599924976787-bc71261d7637?w=800&auto=format&fit=crop&q=80', is_main: true },
          { id: 'm5', url: 'https://images.unsplash.com/photo-1590055531615-f16d36fed8f4?w=800&auto=format&fit=crop&q=80&q=80', is_main: false }
        ],
        location_coords: { lat: -0.2201, lng: -78.5122, placeName: 'Plaza Grande, Frente a la Catedral, Quito Centro Histórico' },
        inclusions: [
          { inclusion_item_id: 'i1', type: 'included' },
          { inclusion_item_id: 'i2', type: 'included' },
          { inclusion_item_id: 'i4', type: 'included' },
          { inclusion_item_id: 'i3', type: 'excluded', custom_text: 'Bebidas alcohólicas adicionales no detalladas' }
        ],
        itinerary: [
          { stop_number: 1, name: 'Reunión en la Plaza de la Independencia', duration: '30m', is_included: true },
          { stop_number: 2, name: 'Recorrido por la Catedral Metropolitana e Iglesias Barrocas', duration: '2h', is_included: true },
          { stop_number: 3, name: 'Almuerzo en restaurante tradicional con vista al Panecillo', duration: '1h 30m', is_included: true },
          { stop_number: 4, name: 'Experiencia científica interactiva en el Museo de Sitio Intiñan', duration: '2h', is_included: true }
        ],
        product_options: [
          {
            id: 'po3',
            title: 'Tour Grupal en Autobús Panorámico',
            slug: 'tour-grupal-bus',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 45.00 },
              { label: 'Niño', age_min: 4, age_max: 17, price: 25.00 },
              { label: 'Tercera Edad', age_min: 66, age_max: 99, price: 30.00 }
            ]
          },
          {
            id: 'po4',
            title: 'Tour Privado con Guía Historiador y Chófer',
            slug: 'tour-privado-historiador',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 120.00 },
              { label: 'Niño', age_min: 4, age_max: 17, price: 80.00 }
            ]
          }
        ],
        price_base: 45.00,
        rating: 4.88,
        review_count: 120
      },
      {
        id: 'a3333333-3333-3333-3333-333333333333',
        location_id: 'l7', // Cuenca
        subcategory_id: 's1', // Senderismo
        slug: 'senderismo-parque-nacional-cajas',
        name: 'Expedición de Senderismo en el Parque Nacional Cajas',
        is_active: true,
        is_published: true,
        description: 'Camina entre lagunas de origen glaciar, bosques mágicos de polylepis (árboles de papel) y páramos andinos a más de 3,500 metros sobre el nivel del mar. Ideal para amantes de la fotografía de naturaleza y el senderismo activo.',
        tags: ['t4', 't5'],
        media: [
          { id: 'm6', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', is_main: true },
          { id: 'm7', url: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=800&auto=format&fit=crop&q=80', is_main: false }
        ],
        location_coords: { lat: -2.8398, lng: -79.2312, placeName: 'Parque Calderón (Plaza Central de Cuenca) junto a las letras gigantes' },
        inclusions: [
          { inclusion_item_id: 'i1', type: 'included' },
          { inclusion_item_id: 'i2', type: 'included' },
          { inclusion_item_id: 'i3', type: 'included' },
          { inclusion_item_id: 'i6', type: 'included' }
        ],
        itinerary: [
          { stop_number: 1, name: 'Salida en vehículo privado desde Cuenca', duration: '45m', is_included: true },
          { stop_number: 2, name: 'Caminata guiada en Laguna Toreadora', duration: '3h', is_included: true },
          { stop_number: 3, name: 'Visita fotográfica al Bosque de Polylepis', duration: '1h', is_included: true },
          { stop_number: 4, name: 'Degustación de trucha andina fresca cocinada al horno', duration: '1h 30m', is_included: true }
        ],
        product_options: [
          {
            id: 'po5',
            title: 'Expedición Estándar Guiada',
            slug: 'expedicion-estandar',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 60.00 },
              { label: 'Niño', age_min: 4, age_max: 17, price: 40.00 }
            ]
          }
        ],
        price_base: 60.00,
        rating: 4.75,
        review_count: 32
      }
    ]
  }),
  getters: {
    publishedAttractions: (state) => state.attractions.filter(a => a.is_published && a.is_active),
    getLocationById: (state) => (id) => state.locations.find(l => l.id === id),
    getSubcategoryById: (state) => (id) => state.subcategories.find(s => s.id === id),
    getCategoryById: (state) => (id) => state.categories.find(c => c.id === id),
    getTagById: (state) => (id) => state.tags.find(t => t.id === id),
    getInclusionById: (state) => (id) => state.inclusions.find(i => i.id === id),
    getAttractionBySlug: (state) => (slug) => state.attractions.find(a => a.slug === slug),
    getAttractionById: (state) => (id) => state.attractions.find(a => a.id === id)
  },
  actions: {
    addAttraction(attractionData) {
      const newAttraction = {
        id: crypto.randomUUID(),
        slug: attractionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        is_active: attractionData.is_active ?? true,
        is_published: attractionData.is_published ?? false,
        media: attractionData.media || [{ id: 'm-default', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
        rating: 5.0,
        review_count: 0,
        price_base: attractionData.product_options?.[0]?.price_tiers?.[0]?.price || 40.00,
        ...attractionData
      };
      this.attractions.push(newAttraction);
      this.saveToStorage();
      return newAttraction;
    },

    updateAttraction(id, updatedData) {
      const index = this.attractions.findIndex(a => a.id === id);
      if (index !== -1) {
        this.attractions[index] = {
          ...this.attractions[index],
          ...updatedData,
          price_base: updatedData.product_options?.[0]?.price_tiers?.[0]?.price || this.attractions[index].price_base
        };
        this.saveToStorage();
        return true;
      }
      return false;
    },

    deleteAttraction(id) {
      const index = this.attractions.findIndex(a => a.id === id);
      if (index !== -1) {
        this.attractions.splice(index, 1);
        this.saveToStorage();
        return true;
      }
      return false;
    },

    togglePublish(id, isPublished) {
      const attraction = this.attractions.find(a => a.id === id);
      if (attraction) {
        attraction.is_published = isPublished;
        this.saveToStorage();
        return true;
      }
      return false;
    },

    toggleActive(id, isActive) {
      const attraction = this.attractions.find(a => a.id === id);
      if (attraction) {
        attraction.is_active = isActive;
        this.saveToStorage();
        return true;
      }
      return false;
    },

    // Gestión del Catálogo de Ubicaciones
    addLocation(name, type, parentId) {
      const newLoc = { id: 'l-' + crypto.randomUUID().substring(0, 8), name, type, parentId };
      this.locations.push(newLoc);
      localStorage.setItem('catalog_locations', JSON.stringify(this.locations));
      return newLoc;
    },
    
    // Gestión del Catálogo de Categorías
    addCategory(name, slug) {
      const newCat = { 
        id: 'c-' + crypto.randomUUID().substring(0, 8), 
        name, 
        slug, 
        icon_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100' 
      };
      this.categories.push(newCat);
      localStorage.setItem('catalog_categories', JSON.stringify(this.categories));
      return newCat;
    },

    // Gestión de Inclusiones Catalogo
    addInclusionItem(text, icon = 'check') {
      const newItem = { id: 'i-' + crypto.randomUUID().substring(0, 8), icon_slug: icon, default_text: text };
      this.inclusions.push(newItem);
      localStorage.setItem('catalog_inclusions', JSON.stringify(this.inclusions));
      return newItem;
    },

    saveToStorage() {
      localStorage.setItem('catalog_attractions', JSON.stringify(this.attractions));
    }
  }
})
