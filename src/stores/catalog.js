import { defineStore } from 'pinia'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    locations: JSON.parse(localStorage.getItem('catalog_locations')) || [
      { id: 'l1', name: 'Ecuador', type: 'Country', parentId: null },
      { id: 'l2', name: 'Pichincha', type: 'State', parentId: 'l1' },
      { id: 'l3', name: 'Quito', type: 'City', parentId: 'l2' },
      { id: 'l4', name: 'Galápagos', type: 'State', parentId: 'l1' },
      { id: 'l5', name: 'Santa Cruz', type: 'City', parentId: 'l4' },
      { id: 'l6', name: 'Azuay', type: 'State', parentId: 'l1' },
      { id: 'l7', name: 'Cuenca', type: 'City', parentId: 'l6' }
    ],
    categories: JSON.parse(localStorage.getItem('catalog_categories')) || [
      { id: 'c1', name: 'Naturaleza & Aventura', slug: 'naturaleza-aventura', icon_url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=100' },
      { id: 'c2', name: 'Historia & Culture', slug: 'historia-cultura', icon_url: 'https://images.unsplash.com/photo-1400690229341-a8c1790f1e71?w=100' },
      { id: 'c3', name: 'Experiencias Gastronómicas', slug: 'gastronomia', icon_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100' }
    ],
    subcategories: JSON.parse(localStorage.getItem('catalog_subcategories')) || [
      { id: 's1', categoryId: 'c1', slug: 'senderismo', name: 'Senderismo & Trekking' },
      { id: 's2', categoryId: 'c1', slug: 'buceo', name: 'Buceo & Snorkel' },
      { id: 's3', categoryId: 'c2', slug: 'tours-ciudad', name: 'Tours de la Ciudad' },
      { id: 's4', categoryId: 'c2', slug: 'museos', name: 'Museos & Monumentos' },
      { id: 's5', categoryId: 'c3', slug: 'degustacion', name: 'Degustaciones de Comida' }
    ],
    tags: JSON.parse(localStorage.getItem('catalog_tags')) || [
      { id: 't1', name: 'Destacado', slug: 'destacado' },
      { id: 't2', name: 'Familiar', slug: 'familiar' },
      { id: 't3', name: 'Todo Incluido', slug: 'todo-incluido' },
      { id: 't4', name: 'Eco-Friendly', slug: 'eco-friendly' },
      { id: 't5', name: 'Grupo Reducido', slug: 'grupo-reducido' }
    ],
    inclusions: JSON.parse(localStorage.getItem('catalog_inclusions')) || [
      { id: 'i1', icon_slug: 'guide', default_text: 'Guía profesional bilingüe certificado' },
      { id: 'i2', icon_slug: 'transport', default_text: 'Transporte de ida y vuelta en minibús premium' },
      { id: 'i3', icon_slug: 'food', default_text: 'Almuerzo gourmet de tres platos con bebidas locales' },
      { id: 'i4', icon_slug: 'ticket', default_text: 'Entradas prioritarias de acceso rápido (sin filas)' },
      { id: 'i5', icon_slug: 'equipment', default_text: 'Equipo completo de snorkel (traje de neopreno y aletas)' },
      { id: 'i6', icon_slug: 'insurance', default_text: 'Seguro de accidentes para pasajeros' }
    ],
    attractions: JSON.parse(localStorage.getItem('catalog_attractions')) || [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        location_id: 'l5',
        subcategory_id: 's2',
        slug: 'crucero-completo-galapagos',
        name: 'Crucero Premium por las Islas Galápagos',
        is_active: true,
        is_published: true,
        description: 'Embárcate en un yate de lujo para explorar el archipiélago más extraordinario del planeta. Observa de cerca iguanas marinas, tortugas gigantes y leones de mar en una aventura guiada por naturalistas certificados con todas las comodidades.',
        tags: ['t1', 't3', 't4'],
        media: [
          { id: 'm1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80', is_main: true }
        ],
        location_coords: { lat: -0.7431, lng: -90.3134, placeName: 'Muelle de Pasajeros de Puerto Ayora, Galápagos' },
        inclusions: [
          { inclusion_item_id: 'i1', type: 'included' },
          { inclusion_item_id: 'i3', type: 'included' }
        ],
        itinerary: [
          { stop_number: 1, name: 'Bienvenida en Baltra y trasbordo al Yate de Lujo', duration: '2h', is_included: true }
        ],
        product_options: [
          {
            id: 'po1',
            title: 'Tour Compartido en Yate Exclusivo',
            slug: 'tour-compartido',
            price_tiers: [
              { label: 'Adulto', age_min: 18, age_max: 65, price: 350.00 }
            ]
          }
        ],
        price_base: 350.00,
        rating: 4.95,
        review_count: 48
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
    async fetchAttractions() {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          // Si el backend responde con éxito, mapeamos sus datos a la estructura que el front espera
          this.attractions = result.data.items.map(item => {
            // Mapear locationName a location_id local
            const loc = this.locations.find(l => l.name.toLowerCase() === item.locationName?.toLowerCase())
            const locationId = loc ? loc.id : 'l3' // default a Quito 'l3'

            // Mapear subcategoryName a subcategory_id local
            const subcat = this.subcategories.find(s => s.name.toLowerCase() === item.subcategoryName?.toLowerCase())
            const subcategoryId = subcat ? subcat.id : 's3' // default a Tours 's3'

            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              price_base: item.startingPrice || 0.0,
              rating: item.ratingAverage || 5.0,
              review_count: item.ratingCount || 0,
              media: [{ id: 'm-default', url: item.mainImageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
              is_active: item.isActive ?? true,
              is_published: item.isPublished ?? true,
              description: item.descriptionShort || '',
              location_id: locationId,
              subcategory_id: subcategoryId,
              tags: []
            };
          });
          this.saveToStorage();
          return { success: true };
        }
      } catch (error) {
        console.warn('Backend de catálogo no disponible. Usando datos simulados de respaldo.', error);
      }
      return { success: false };
    },

    async fetchAttractionBySlug(slug) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction/${slug}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          const detail = result.data;
          
          // Mapear locationName a location_id local
          const loc = this.locations.find(l => l.name.toLowerCase() === detail.locationName?.toLowerCase())
          const locationId = loc ? loc.id : 'l3' // default a Quito 'l3'

          // Mapear subcategoryName a subcategory_id local
          const subcat = this.subcategories.find(s => s.name.toLowerCase() === detail.subcategoryName?.toLowerCase())
          const subcategoryId = subcat ? subcat.id : 's3' // default a Tours 's3'

          // Actualizar o añadir la atracción detallada en el estado
          const item = {
            id: detail.id,
            name: detail.name,
            slug: detail.slug,
            description: detail.descriptionFull || detail.descriptionShort || '',
            price_base: detail.products?.[0]?.priceTiers?.[0]?.price || 0.0,
            rating: detail.ratingAverage || 5.0,
            review_count: detail.ratingCount || 0,
            location_id: locationId,
            subcategory_id: subcategoryId,
            media: detail.gallery?.map(m => ({
              url: m.url,
              is_main: m.isMain
            })) || [{ id: 'm-default', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
            inclusions: detail.inclusions?.map(inc => ({
              inclusion_item_id: inc.inclusionItemId || inc.id,
              type: inc.type === 'not_included' ? 'excluded' : inc.type
            })) || [],
            itinerary: detail.itinerary?.stops?.map(stop => ({
              stop_number: stop.stopNumber,
              name: stop.name,
              duration: stop.durationMinutes ? `${stop.durationMinutes}m` : '30m',
              is_included: stop.admissionType === 'included'
            })) || [],
            product_options: detail.products?.map(po => ({
              id: po.id,
              title: po.title,
              price_tiers: po.priceTiers?.map(pt => ({
                label: pt.categoryName || 'Adulto',
                price: pt.price
              }))
            })) || [],
            location_coords: {
              lat: detail.latitude ? Number(detail.latitude) : -0.1807,
              lng: detail.longitude ? Number(detail.longitude) : -78.4678,
              placeName: detail.meetingPoint || detail.address || 'Quito, Ecuador'
            },
            tags: detail.tags?.map(t => t.id) || []
          };
          const index = this.attractions.findIndex(a => a.slug === slug);
          if (index !== -1) {
            this.attractions[index] = { ...this.attractions[index], ...item };
          } else {
            this.attractions.push(item);
          }
          this.saveToStorage();
          return item;
        }
      } catch (error) {
        console.warn('Detalle de atracción no disponible en backend. Usando respaldo local.', error);
      }
      return this.getAttractionBySlug(slug);
    },

    async addAttraction(attractionData, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: attractionData.name,
            locationId: attractionData.location_id,
            subcategoryId: attractionData.subcategory_id,
            description: attractionData.description
          })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          await this.fetchAttractions();
          return { success: true };
        }
      } catch (error) {
        // Fallback local
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
        return { success: true, attraction: newAttraction };
      }
      return { success: false };
    },

    async updateAttraction(id, updatedData, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        if (response.ok) {
          await this.fetchAttractions();
          return { success: true };
        }
      } catch (error) {
        // Fallback local
        const index = this.attractions.findIndex(a => a.id === id);
        if (index !== -1) {
          this.attractions[index] = {
            ...this.attractions[index],
            ...updatedData
          };
          this.saveToStorage();
          return { success: true };
        }
      }
      return { success: false };
    },

    async deleteAttraction(id, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          await this.fetchAttractions();
          return { success: true };
        }
      } catch (error) {
        // Fallback local
        const index = this.attractions.findIndex(a => a.id === id);
        if (index !== -1) {
          this.attractions.splice(index, 1);
          this.saveToStorage();
          return { success: true };
        }
      }
      return { success: false };
    },

    async togglePublish(id, isPublished, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isPublished })
        });
        if (response.ok) {
          await this.fetchAttractions();
          return true;
        }
      } catch (error) {
        const attraction = this.attractions.find(a => a.id === id);
        if (attraction) {
          attraction.is_published = isPublished;
          this.saveToStorage();
          return true;
        }
      }
      return false;
    },

    async toggleActive(id, isActive, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/catalog/attraction/${id}/active`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isActive })
        });
        if (response.ok) {
          await this.fetchAttractions();
          return true;
        }
      } catch (error) {
        const attraction = this.attractions.find(a => a.id === id);
        if (attraction) {
          attraction.is_active = isActive;
          this.saveToStorage();
          return true;
        }
      }
      return false;
    },

    saveToStorage() {
      localStorage.setItem('catalog_attractions', JSON.stringify(this.attractions));
    }
  }
})
