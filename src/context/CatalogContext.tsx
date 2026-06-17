import React, { createContext, useContext, useState, useEffect } from 'react';
import { AttractionSummary, AttractionProductOption } from './CartContext';
import { HubConnectionBuilder, HubConnection, HubConnectionState } from '@microsoft/signalr';

const mapMockIdToDbGuid = (id: string | undefined): string => {
  if (!id) return '33333333-3333-3333-3333-333333333333'; // Default to Quito
  const cleanId = id.trim().toLowerCase();

  // If it's already a valid Guid, return it
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (guidRegex.test(cleanId)) {
    return cleanId;
  }
  
  // Mapping Locations (just in case legacy IDs are still used somewhere)
  if (cleanId === 'l1') return '11111111-1111-1111-1111-111111111111'; // Ecuador
  if (cleanId === 'l2') return '22222222-2222-2222-2222-222222222222'; // Pichincha
  if (cleanId === 'l3') return '33333333-3333-3333-3333-333333333333'; // Quito
  if (cleanId === 'l4' || cleanId === 'l5') return '33333333-3333-3333-3333-333333333333';
  if (cleanId === 'l6' || cleanId === 'l7') return '33333333-3333-3333-3333-333333333333';

  // Mapping Subcategories
  if (cleanId === 's1' || cleanId === 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1') return 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1'; // Senderismo & Trekking
  if (cleanId === 's2' || cleanId === 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3') return 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1'; // Buceo mapped to Senderismo to prevent FK errors
  if (cleanId === 's3' || cleanId === 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4') return 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3'; // Tours de la Ciudad
  if (cleanId === 's4' || cleanId === 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4') return 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4'; // Museos & Monumentos
  if (cleanId === 's5' || cleanId === 'd5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5') return 'd5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5'; // Degustaciones de Comida

  return '33333333-3333-3333-3333-333333333333'; // Default to Quito
};

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
  fetchCompleteAttraction: (id: string, token: string) => Promise<AttractionDetail | undefined>;
  addAttraction: (attractionData: Partial<AttractionDetail>, token: string) => Promise<{ success: boolean; attraction?: AttractionDetail }>;
  updateAttraction: (id: string, updatedData: Partial<AttractionDetail>, token: string) => Promise<{ success: boolean }>;
  deleteAttraction: (id: string, token: string) => Promise<{ success: boolean }>;
  togglePublish: (id: string, isPublished: boolean, token: string) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean, token: string) => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations] = useState<LocationItem[]>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Ecuador', type: 'Country', parentId: null },
    { id: 'a27b94f1-11f3-4235-a287-4b92b547a9fc', name: 'Azuay', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '3999c4d8-149b-4325-adad-7aba5a57560f', name: 'Cuenca', type: 'City', parentId: 'a27b94f1-11f3-4235-a287-4b92b547a9fc' },
    { id: '09d57d09-a9b8-4026-a1f0-3e120b229744', name: 'Bolívar', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'd8db0fbc-098a-403f-a203-bfa8ac3c074d', name: 'Guaranda', type: 'City', parentId: '09d57d09-a9b8-4026-a1f0-3e120b229744' },
    { id: 'b6dd93f0-233a-41a8-a53d-bd6e99ca6ced', name: 'Cañar', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'c978c3a1-0a87-47cb-aa3b-f80d428d5523', name: 'Azogues', type: 'City', parentId: 'b6dd93f0-233a-41a8-a53d-bd6e99ca6ced' },
    { id: 'e120df3f-fd63-4a0d-a0b0-ece808faccd2', name: 'Carchi', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'c8bdff63-f5bc-4544-a33c-dbde955aa91a', name: 'Tulcán', type: 'City', parentId: 'e120df3f-fd63-4a0d-a0b0-ece808faccd2' },
    { id: '52b4b598-5d5f-4d4b-a04c-e411a6a1ae12', name: 'Chimborazo', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'f64e80dc-4078-4d3f-ab68-966cc0aeb6ab', name: 'Riobamba', type: 'City', parentId: '52b4b598-5d5f-4d4b-a04c-e411a6a1ae12' },
    { id: 'a1362e4c-4666-414b-a597-ae86457f5579', name: 'Cotopaxi', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '0a2c3ee7-f83e-42a5-a670-1f5351d211b1', name: 'Latacunga', type: 'City', parentId: 'a1362e4c-4666-414b-a597-ae86457f5579' },
    { id: 'ddeb08a8-2308-4091-a8b4-9a1e4630a69b', name: 'El Oro', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '0f8780d0-3242-40d0-ab99-7288fee16226', name: 'Machala', type: 'City', parentId: 'ddeb08a8-2308-4091-a8b4-9a1e4630a69b' },
    { id: 'd6959391-0931-438c-a0ed-2d015223d2b3', name: 'Esmeraldas', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'b3eeaafc-cca7-4ee7-a9ae-c80ff09634dd', name: 'Esmeraldas', type: 'City', parentId: 'd6959391-0931-438c-a0ed-2d015223d2b3' },
    { id: '591620e9-2ced-44c1-a358-fdafd4efb4f6', name: 'Galápagos', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '873d55dd-9450-4bcc-ab88-b577e6ef5c69', name: 'Santa Cruz', type: 'City', parentId: '591620e9-2ced-44c1-a358-fdafd4efb4f6' },
    { id: 'bb498111-63cb-4568-a1de-711847963cac', name: 'Guayas', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'c7ae4f4e-6f1a-476e-acdf-9cc804c7c732', name: 'Guayaquil', type: 'City', parentId: 'bb498111-63cb-4568-a1de-711847963cac' },
    { id: '492abe4e-88bc-4e3b-a643-3b40e6570660', name: 'Imbabura', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '10b7cfad-715d-406e-a06b-9775f9a3007a', name: 'Ibarra', type: 'City', parentId: '492abe4e-88bc-4e3b-a643-3b40e6570660' },
    { id: 'b951008c-7308-4b39-a6a1-d6f0603b96ab', name: 'Loja', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '56756c11-2b85-4a03-a579-1aa9d02e47e3', name: 'Loja', type: 'City', parentId: 'b951008c-7308-4b39-a6a1-d6f0603b96ab' },
    { id: '9e539471-b567-41ec-a554-88c457dd94e2', name: 'Los Ríos', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'f50e8f62-ba6f-4464-adf8-ef3e6169f6b6', name: 'Babahoyo', type: 'City', parentId: '9e539471-b567-41ec-a554-88c457dd94e2' },
    { id: 'b9d265c0-2869-4214-a5d8-69ea8e86ba07', name: 'Manabí', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'c3f2b096-1314-444e-a91e-29f6e817419a', name: 'Portoviejo', type: 'City', parentId: 'b9d265c0-2869-4214-a5d8-69ea8e86ba07' },
    { id: 'bae6f5ae-4970-46ac-a5cf-87f788f3cd30', name: 'Morona Santiago', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '0e08e35a-e86a-40c3-abb3-54dcac77a80d', name: 'Macas', type: 'City', parentId: 'bae6f5ae-4970-46ac-a5cf-87f788f3cd30' },
    { id: '2416c43c-7390-4bb6-af00-20253ed030ce', name: 'Napo', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'c1824b72-32d6-4f03-a63e-45e491843f81', name: 'Tena', type: 'City', parentId: '2416c43c-7390-4bb6-af00-20253ed030ce' },
    { id: '514c5b47-faf7-4d29-a77f-774d3778152f', name: 'Orellana', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'b0fa319c-cefe-425a-ac2d-370daa7a06da', name: 'El Coca', type: 'City', parentId: '514c5b47-faf7-4d29-a77f-774d3778152f' },
    { id: '81533417-4b84-4142-aaa4-5912427761ba', name: 'Pastaza', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'f386daea-b280-438a-a076-9dbd7a75b775', name: 'Puyo', type: 'City', parentId: '81533417-4b84-4142-aaa4-5912427761ba' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Pichincha', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Quito', type: 'City', parentId: '22222222-2222-2222-2222-222222222222' },
    { id: 'b5ee7cda-800f-4072-afed-70f58ad59c98', name: 'Santa Elena', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '1f683858-aa19-4928-adaf-42ab9a205568', name: 'Santa Elena', type: 'City', parentId: 'b5ee7cda-800f-4072-afed-70f58ad59c98' },
    { id: 'eefd334f-7fb7-4b57-a045-e279f02acd26', name: 'Santo Domingo de los Tsáchilas', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '6941c0d0-0daf-498f-a4b0-f1fe6492c9d2', name: 'Santo Domingo', type: 'City', parentId: 'eefd334f-7fb7-4b57-a045-e279f02acd26' },
    { id: '82a4eac5-0cf8-4c0e-a32a-2618d36a58c8', name: 'Sucumbíos', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'df1e1e3d-bef8-4f3d-ae57-fdd4cd1234dd', name: 'Lago Agrio', type: 'City', parentId: '82a4eac5-0cf8-4c0e-a32a-2618d36a58c8' },
    { id: '84e7eed4-9880-4278-ad65-2e3a7ee64ec7', name: 'Tungurahua', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: 'be375bb5-ad93-47ba-ae0b-d144c1db3e1a', name: 'Ambato', type: 'City', parentId: '84e7eed4-9880-4278-ad65-2e3a7ee64ec7' },
    { id: '738868b7-a1a4-4df4-ae5a-75ac0c20928f', name: 'Zamora Chinchipe', type: 'State', parentId: '11111111-1111-1111-1111-111111111111' },
    { id: '682b18b8-9366-4dea-a596-f8fc7809d938', name: 'Zamora', type: 'City', parentId: '738868b7-a1a4-4df4-ae5a-75ac0c20928f' }
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const graphqlUrl = baseUrl.endsWith('/') ? `${baseUrl}graphql` : `${baseUrl}/graphql`;

      console.log('CatalogContext: fetchAttractions vía GraphQL de:', graphqlUrl);

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetAttractions {
              attractions {
                id
                nombre
                descripcion
                precio
                moneda
                ubicacion
                imagenUrl
                slug
              }
            }
          `
        })
      });

      const result = await response.json();
      if (response.ok && result.data && Array.isArray(result.data.attractions)) {
        const mapped = result.data.attractions.map((item: any) => {
          const loc = locations.find(l => l.name.toLowerCase() === item.ubicacion?.toLowerCase());
          const locationId = loc ? loc.id : '33333333-3333-3333-3333-333333333333';

          const existing = attractions.find(a => a.id === item.id);

          return {
            id: item.id,
            name: item.nombre,
            slug: item.slug || item.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            price_base: item.precio || 0.0,
            rating: existing?.rating || 5.0,
            review_count: existing?.review_count || 0,
            media: [{ id: 'm-default', url: item.imagenUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', is_main: true }],
            is_active: existing?.is_active ?? true,
            is_published: existing?.is_published ?? true,
            description: item.descripcion || '',
            location_id: locationId,
            subcategory_id: existing?.subcategory_id || 's3',
            tags: existing?.tags || [],
            inclusions: existing?.inclusions || [],
            itinerary: existing?.itinerary || [],
            product_options: existing?.product_options || [
              {
                id: 'po-' + item.id,
                title: 'Entrada Estándar',
                price_tiers: [{ label: 'Adulto', price: item.precio || 40.0 }]
              }
            ]
          };
        });
        saveToStorage(mapped);
        return { success: true };
      }
    } catch (graphqlError) {
      console.warn('GraphQL de catálogo falló. Intentando fallback mediante REST.', graphqlError);
    }

    // Fallback REST original
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
          const locationId = loc ? loc.id : '33333333-3333-3333-3333-333333333333';

          const subcat = subcategories.find(s => s.name.toLowerCase() === item.subcategoryName?.toLowerCase());
          const subcategoryId = subcat ? subcat.id : 's3';

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
      console.warn('Backend de catálogo REST tampoco disponible. Usando datos simulados de respaldo.', error);
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
        const locationId = loc ? loc.id : '33333333-3333-3333-3333-333333333333';

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

  const fetchCompleteAttraction = async (id: string, token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/catalog/attraction/${id}/complete`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        const detail = result.success ? result.data : result;
        
        const loc = locations.find(l => l.name.toLowerCase() === detail.locationName?.toLowerCase());
        const locationId = loc ? loc.id : detail.locationId || '33333333-3333-3333-3333-333333333333';

        const subcat = subcategories.find(s => s.name.toLowerCase() === detail.subcategoryName?.toLowerCase());
        const subcategoryId = subcat ? subcat.id : detail.subcategoryId || 's3';

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

        return item;
      }
    } catch (error) {
      console.error('Error fetching complete attraction:', error);
    }
    return undefined;
  };

  const buildCompletePayload = (attractionData: Partial<AttractionDetail>) => {
    const parseDuration = (dur: string | undefined): number => {
      if (!dur) return 30;
      const clean = dur.toLowerCase().trim();
      if (clean.includes('h')) {
        const hours = parseFloat(clean) || 1;
        return Math.round(hours * 60);
      }
      return parseInt(clean) || 30;
    };

    return {
      name: attractionData.name || '',
      locationId: mapMockIdToDbGuid(attractionData.location_id),
      subcategoryId: mapMockIdToDbGuid(attractionData.subcategory_id),
      descriptionShort: attractionData.description || '',
      descriptionFull: attractionData.description || '',
      address: attractionData.location_coords?.placeName || 'Quito, Ecuador',
      latitude: attractionData.location_coords?.lat || -0.2201,
      longitude: attractionData.location_coords?.lng || -78.5122,
      meetingPoint: attractionData.location_coords?.placeName || 'Quito, Ecuador',
      difficultyLevel: 'moderate',
      translations: [
        {
          languageId: 1,
          name: attractionData.name || '',
          descriptionShort: attractionData.description || '',
          descriptionFull: attractionData.description || '',
          meetingPoint: attractionData.location_coords?.placeName || 'Quito, Ecuador'
        }
      ],
      guideLanguages: [
        {
          languageId: 1,
          guideType: 'live'
        }
      ],
      media: (attractionData.media || []).map((m, idx) => ({
        mediaTypeId: 1,
        url: m.url,
        title: attractionData.name || '',
        isMain: m.is_main,
        sortOrder: idx
      })),
      tags: (attractionData.tags || []).map(t => mapMockIdToDbGuid(t)),
      inclusions: (attractionData.inclusions || []).map(inc => ({
        inclusionItemId: inc.inclusion_item_id,
        type: inc.type === 'excluded' ? 'not_included' : inc.type
      })),
      products: (attractionData.product_options || []).map(opt => ({
        title: opt.title,
        description: opt.title,
        durationMinutes: 120,
        durationDescription: '2h',
        cancelPolicyHours: 24,
        cancelPolicyText: 'Cancelación gratuita hasta 24 horas antes',
        maxGroupSize: 20,
        minParticipants: 1,
        isPrivate: false,
        priceTiers: (opt.price_tiers || []).map((pt: any) => {
          let ticketCategoryId = '77777777-7777-7777-7777-777777777777'; // Default a Adulto
          const lbl = (pt.label || '').toLowerCase();
          if (lbl.includes('niño') || lbl.includes('child') || lbl.includes('nino')) {
            ticketCategoryId = '88888888-8888-8888-8888-888888888888';
          }
          return {
            ticketCategoryId: ticketCategoryId,
            price: pt.price === '' ? 0.0 : Number(pt.price),
            currencyCode: 'USD'
          };
        })
      })),
      itinerary: attractionData.itinerary && attractionData.itinerary.length > 0 ? {
        languageId: 1,
        overview: attractionData.description || '',
        stops: attractionData.itinerary.map((s, idx) => ({
          name: s.name,
          description: s.name,
          stayTimeMinutes: parseDuration(s.duration),
          latitude: attractionData.location_coords?.lat || -0.2201,
          longitude: attractionData.location_coords?.lng || -78.5122,
          stopNumber: s.stop_number || (idx + 1),
          admissionType: s.is_included ? 'included' : 'optional'
        }))
      } : null
    };
  };

  const addAttraction = async (attractionData: Partial<AttractionDetail>, token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const payload = buildCompletePayload(attractionData);
      
      console.log('CatalogContext: addAttraction enviando payload completo:', payload);

      const response = await fetch(`${baseUrl}/catalog/attraction/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        await fetchAttractions();
        return { success: true };
      }
      return { success: false, message: result.message || 'Error al guardar en el servidor.' };
    } catch (error) {
      console.error('Error in addAttraction backend post, applying fallback:', error);
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
        location_id: attractionData.location_id || '33333333-3333-3333-3333-333333333333',
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
  };

  const updateAttraction = async (id: string, updatedData: Partial<AttractionDetail>, token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const payload = buildCompletePayload(updatedData);

      console.log(`CatalogContext: updateAttraction(${id}) enviando payload completo:`, payload);

      const response = await fetch(`${baseUrl}/catalog/attraction/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        await fetchAttractions();
        return { success: true };
      }
      return { success: false, message: result.message || 'Error al actualizar en el servidor.' };
    } catch (error) {
      console.error('Error in updateAttraction backend put, applying fallback:', error);
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

  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const hubUrl = baseUrl.endsWith('/') 
      ? `${baseUrl}hub/notifications` 
      : `${baseUrl}/hub/notifications`;

    console.log('CatalogContext: Inicializando conexión SignalR a:', hubUrl);

    const newConnection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (!connection) return;

    const startConnection = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
          console.log('CatalogContext: Conectado exitosamente al Hub de SignalR');
        }
      } catch (err) {
        console.error('CatalogContext: Error al conectar a SignalR Hub:', err);
      }
    };

    startConnection();

    // Escuchar eventos de actualización en tiempo real
    connection.on('CatalogUpdated', (data: any) => {
      console.log('SignalR: CatalogUpdated recibido', data);
      fetchAttractions();
    });

    connection.on('SlotUpdated', (data: any) => {
      console.log('SignalR: SlotUpdated recibido', data);
      // Actualizar attractions locales si viene el ID de atracción
      if (data && data.attractionId) {
        setAttractions(prev => prev.map(attr => {
          if (attr.id === data.attractionId) {
            return {
              ...attr,
              // Forzar actualización incrementando review_count o cambiando algo visual
              // o simplemente dejamos que fetchAttractions actualice
            };
          }
          return attr;
        }));
      }
      fetchAttractions();
    });

    connection.on('CapacityChanged', (data: any) => {
      console.log('SignalR: CapacityChanged recibido', data);
      fetchAttractions();
    });

    connection.on('LocationUpdated', (data: any) => {
      console.log('SignalR: LocationUpdated recibido', data);
      fetchAttractions();
    });

    return () => {
      connection.off('CatalogUpdated');
      connection.off('SlotUpdated');
      connection.off('CapacityChanged');
      connection.off('LocationUpdated');
      if (connection.state === HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [connection]);

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
      fetchCompleteAttraction,
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
