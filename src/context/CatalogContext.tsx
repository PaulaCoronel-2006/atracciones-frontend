import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttractionSummary, AttractionProductOption } from './CartContext';

export interface LocationItem {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
}

export interface SubcategoryItem {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export interface InclusionItem {
  id: string;
  icon_slug: string;
  default_text: string;
}

export interface AttractionDetail extends AttractionSummary {
  description: string;
  is_active: boolean;
  is_published: boolean;
  media: Array<{ id?: string; url: string; is_main: boolean }>;
  location_coords?: { lat: number; lng: number; placeName: string };
  inclusions: Array<{ inclusion_item_id: string; type: string }>;
  itinerary: Array<{ stop_number: number; name: string; duration: string; is_included: boolean }>;
  product_options: AttractionProductOption[];
  tags: string[];
}

interface CatalogContextType {
  locations: LocationItem[];
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  tags: TagItem[];
  inclusions: InclusionItem[];
  attractions: AttractionDetail[];
  publishedAttractions: AttractionDetail[];
  getLocationById: (id: string) => LocationItem | undefined;
  getSubcategoryById: (id: string) => SubcategoryItem | undefined;
  getCategoryById: (id: string) => CategoryItem | undefined;
  getTagById: (id: string) => TagItem | undefined;
  getInclusionById: (id: string) => InclusionItem | undefined;
  getAttractionBySlug: (slug: string) => AttractionDetail | undefined;
  getAttractionById: (id: string) => AttractionDetail | undefined;
  fetchAttractions: () => Promise<{ success: boolean }>;
  fetchAttractionBySlug: (slug: string) => Promise<AttractionDetail | undefined>;
  addAttraction: (attractionData: Partial<AttractionDetail>, token: string) => Promise<{ success: boolean; attraction?: AttractionDetail }>;
  updateAttraction: (id: string, updatedData: Partial<AttractionDetail>, token: string) => Promise<{ success: boolean }>;
  deleteAttraction: (id: string, token: string) => Promise<{ success: boolean }>;
  togglePublish: (id: string, isPublished: boolean, token: string) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean, token: string) => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations] = useState<LocationItem[]>([
    { id: 'l1', name: 'Ecuador', type: 'Country', parentId: null },
    { id: 'l2', name: 'Pichincha', type: 'State', parentId: 'l1' },
    { id: 'l3', name: 'Quito', type: 'City', parentId: 'l2' },
    { id: 'l4', name: 'Galápagos', type: 'State', parentId: 'l1' },
    { id: 'l5', name: 'Santa Cruz', type: 'City', parentId: 'l4' },
    { id: 'l6', name: 'Azuay', type: 'State', parentId: 'l1' },
    { id: 'l7', name: 'Cuenca', type: 'City', parentId: 'l6' }
  ]);

  const [categories] = useState<CategoryItem[]>([
    { id: 'c1', name: 'Naturaleza & Aventura', slug: 'naturaleza-aventura', icon_url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=100' },
    { id: 'c2', name: 'Historia & Cultura', slug: 'historia-cultura', icon_url: 'https://images.unsplash.com/photo-1400690229341-a8c1790f1e71?w=100' },
    { id: 'c3', name: 'Experiencias Gastronómicas', slug: 'gastronomia', icon_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100' }
  ]);

  const [subcategories] = useState<SubcategoryItem[]>([
    { id: 's1', categoryId: 'c1', slug: 'senderismo', name: 'Senderismo & Trekking' },
    { id: 's2', categoryId: 'c1', slug: 'buceo', name: 'Buceo & Snorkel' },
    { id: 's3', categoryId: 'c2', slug: 'tours-ciudad', name: 'Tours de la Ciudad' },
    { id: 's4', categoryId: 'c2', slug: 'museos', name: 'Museos & Monumentos' },
    { id: 's5', categoryId: 'c3', slug: 'degustacion', name: 'Degustaciones de Comida' }
  ]);

  const [tags] = useState<TagItem[]>([
    { id: 't1', name: 'Destacado', slug: 'destacado' },
    { id: 't2', name: 'Familiar', slug: 'familiar' },
    { id: 't3', name: 'Todo Incluido', slug: 'todo-incluido' },
    { id: 't4', name: 'Eco-Friendly', slug: 'eco-friendly' },
    { id: 't5', name: 'Grupo Reducido', slug: 'grupo-reducido' }
  ]);

  const [inclusions] = useState<InclusionItem[]>([
    { id: 'i1', icon_slug: 'guide', default_text: 'Guía profesional bilingüe certificado' },
    { id: 'i2', icon_slug: 'transport', default_text: 'Transporte de ida y vuelta en minibús premium' },
    { id: 'i3', icon_slug: 'food', default_text: 'Almuerzo gourmet de tres platos con bebidas locales' },
    { id: 'i4', icon_slug: 'ticket', default_text: 'Entradas prioritarias de acceso rápido (sin filas)' },
    { id: 'i5', icon_slug: 'equipment', default_text: 'Equipo completo de snorkel (traje de neopreno y aletas)' },
    { id: 'i6', icon_slug: 'insurance', default_text: 'Seguro de accidentes para pasajeros' }
  ]);

  const [attractions, setAttractions] = useState<AttractionDetail[]>([]);

  const saveToStorage = (newAttractions: AttractionDetail[]) => {
    setAttractions(newAttractions);
    localStorage.setItem('catalog_attractions', JSON.stringify(newAttractions));
  };

  const getLocationById = (id: string) => locations.find(l => l.id === id);
  const getSubcategoryById = (id: string) => subcategories.find(s => s.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getTagById = (id: string) => tags.find(t => t.id === id);
  const getInclusionById = (id: string) => inclusions.find(i => i.id === id);
  const getAttractionBySlug = (slug: string) => attractions.find(a => a.slug === slug);
  const getAttractionById = (id: string) => attractions.find(a => a.id === id);

  const fetchAttractions = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/catalog/attraction`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const mapped = result.data.items.map((item: any) => {
          const loc = locations.find(l => l.name.toLowerCase() === item.locationName?.toLowerCase());
          const locationId = loc ? loc.id : 'l3';

          const subcat = subcategories.find(s => s.name.toLowerCase() === item.subcategoryName?.toLowerCase());
          const subcategoryId = subcat ? subcat.id : 's3';

          // Buscar si ya tenemos un detalle más completo guardado localmente
          const existing = attractions.find(a => a.id === item.id);

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
            tags: existing?.tags || [],
            inclusions: existing?.inclusions || [],
            itinerary: existing?.itinerary || [],
            product_options: existing?.product_options || [
              {
                id: 'po-' + item.id,
                title: 'Entrada Estándar',
                price_tiers: [{ label: 'Adulto', price: item.startingPrice || 40.0 }]
              }
            ]
          };
        });
        saveToStorage(mapped);
        return { success: true };
      }
    } catch (error) {
      console.warn('Backend de catálogo no disponible. Usando datos simulados de respaldo.', error);
    }
    return { success: false };
  };

  const fetchAttractionBySlug = async (slug: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/catalog/attraction/${slug}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const detail = result.data;
        
        const loc = locations.find(l => l.name.toLowerCase() === detail.locationName?.toLowerCase());
        const locationId = loc ? loc.id : 'l3';

        const subcat = subcategories.find(s => s.name.toLowerCase() === detail.subcategoryName?.toLowerCase());
        const subcategoryId = subcat ? subcat.id : 's3';

        const item: AttractionDetail = {
          id: detail.id,
          name: detail.name,
          slug: detail.slug,
          description: detail.descriptionFull || detail.descriptionShort || '',
          price_base: detail.products?.[0]?.priceTiers?.[0]?.price || 0.0,
          rating: detail.ratingAverage || 5.0,
          review_count: detail.ratingCount || 0,
          location_id: locationId,
          subcategory_id: subcategoryId,
          media: detail.gallery?.map((m: any) => ({
            url: m.url,
            is_main: m.isMain
          })) || [{ id: 'm-default', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
          inclusions: detail.inclusions?.map((inc: any) => ({
            inclusion_item_id: inc.inclusionItemId || inc.id,
            type: inc.type === 'not_included' ? 'excluded' : inc.type
          })) || [],
          itinerary: detail.itinerary?.stops?.map((stop: any) => ({
            stop_number: stop.stopNumber,
            name: stop.name,
            duration: stop.durationMinutes ? `${stop.durationMinutes}m` : '30m',
            is_included: stop.admissionType === 'included'
          })) || [],
          product_options: detail.products?.map((po: any) => ({
            id: po.id,
            title: po.title,
            price_tiers: po.priceTiers?.map((pt: any) => ({
              label: pt.categoryName || 'Adulto',
              price: pt.price
            })) || []
          })) || [],
          location_coords: {
            lat: detail.latitude ? Number(detail.latitude) : -0.1807,
            lng: detail.longitude ? Number(detail.longitude) : -78.4678,
            placeName: detail.meetingPoint || detail.address || 'Quito, Ecuador'
          },
          tags: detail.tags?.map((t: any) => t.id) || [],
          is_active: detail.isActive ?? true,
          is_published: detail.isPublished ?? true
        };

        const newAttractions = attractions.map(a => a.slug === slug ? item : a);
        if (!attractions.some(a => a.slug === slug)) {
          newAttractions.push(item);
        }
        saveToStorage(newAttractions);
        return item;
      }
    } catch (error) {
      console.warn('Detalle de atracción no disponible en backend. Usando respaldo local.', error);
    }
    return getAttractionBySlug(slug);
  };

  const addAttraction = async (attractionData: Partial<AttractionDetail>, token: string) => {
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
        await fetchAttractions();
        return { success: true };
      }
    } catch (error) {
      // Fallback local
      const newAttraction: AttractionDetail = {
        id: crypto.randomUUID(),
        slug: (attractionData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        is_active: attractionData.is_active ?? true,
        is_published: attractionData.is_published ?? false,
        media: attractionData.media || [{ id: 'm-default', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
        rating: 5.0,
        review_count: 0,
        price_base: attractionData.product_options?.[0]?.price_tiers?.[0]?.price || 40.00,
        description: attractionData.description || '',
        location_id: attractionData.location_id || 'l3',
        subcategory_id: attractionData.subcategory_id || 's3',
        tags: attractionData.tags || [],
        inclusions: attractionData.inclusions || [],
        itinerary: attractionData.itinerary || [],
        product_options: attractionData.product_options || [
          {
            id: 'po-' + crypto.randomUUID(),
            title: 'Entrada Estándar',
            price_tiers: [{ label: 'Adulto', price: 40.0 }]
          }
        ],
        name: attractionData.name || 'Sin nombre'
      };
      
      const newAttractions = [...attractions, newAttraction];
      saveToStorage(newAttractions);
      return { success: true, attraction: newAttraction };
    }
    return { success: false };
  };

  const updateAttraction = async (id: string, updatedData: Partial<AttractionDetail>, token: string) => {
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
        await fetchAttractions();
        return { success: true };
      }
    } catch (error) {
      // Fallback local
      const newAttractions = attractions.map(a => {
        if (a.id === id) {
          return { ...a, ...updatedData } as AttractionDetail;
        }
        return a;
      });
      saveToStorage(newAttractions);
      return { success: true };
    }
    return { success: false };
  };

  const deleteAttraction = async (id: string, token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/catalog/attraction/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchAttractions();
        return { success: true };
      }
    } catch (error) {
      // Fallback local
      const newAttractions = attractions.filter(a => a.id !== id);
      saveToStorage(newAttractions);
      return { success: true };
    }
    return { success: false };
  };

  const togglePublish = async (id: string, isPublished: boolean, token: string) => {
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
        await fetchAttractions();
        return true;
      }
    } catch (error) {
      const newAttractions = attractions.map(a => {
        if (a.id === id) {
          return { ...a, is_published: isPublished };
        }
        return a;
      });
      saveToStorage(newAttractions);
      return true;
    }
    return false;
  };

  const toggleActive = async (id: string, isActive: boolean, token: string) => {
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
        await fetchAttractions();
        return true;
      }
    } catch (error) {
      const newAttractions = attractions.map(a => {
        if (a.id === id) {
          return { ...a, is_active: isActive };
        }
        return a;
      });
      saveToStorage(newAttractions);
      return true;
    }
    return false;
  };

  const publishedAttractions = attractions.filter(a => a.is_published && a.is_active);

  useEffect(() => {
    fetchAttractions();
  }, []);

  return (
    <CatalogContext.Provider value={{
      locations,
      categories,
      subcategories,
      tags,
      inclusions,
      attractions,
      publishedAttractions,
      getLocationById,
      getSubcategoryById,
      getCategoryById,
      getTagById,
      getInclusionById,
      getAttractionBySlug,
      getAttractionById,
      fetchAttractions,
      fetchAttractionBySlug,
      addAttraction,
      updateAttraction,
      deleteAttraction,
      togglePublish,
      toggleActive
    }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog debe usarse dentro de un CatalogProvider');
  }
  return context;
};
