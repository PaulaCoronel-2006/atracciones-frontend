import React, { useState, useEffect, useMemo } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { Link } from 'react-router-dom';

const ExploreView: React.FC = () => {
  const { 
    publishedAttractions, 
    categories, 
    getLocationById, 
    getSubcategoryById, 
    getTagById, 
    fetchAttractions 
  } = useCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchAttractions();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtrar atracciones
  const filteredAttractions = useMemo(() => {
    return publishedAttractions.filter(attr => {
      // Filtro por Categoría
      if (selectedCategoryId) {
        const subcat = getSubcategoryById(attr.subcategory_id);
        if (!subcat || subcat.categoryId !== selectedCategoryId) {
          return false;
        }
      }

      // Filtro por buscador (nombre o ubicación)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = attr.name.toLowerCase().includes(query);
        
        const loc = getLocationById(attr.location_id);
        const matchesLocation = loc ? loc.name.toLowerCase().includes(query) : false;

        return matchesName || matchesLocation;
      }

      return true;
    });
  }, [publishedAttractions, selectedCategoryId, searchQuery, getSubcategoryById, getLocationById]);

  const selectCategory = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId('');
    } else {
      setSelectedCategoryId(categoryId);
    }
  };

  const getLocationLabel = (locationId: string) => {
    const city = getLocationById(locationId);
    if (!city) return '';
    const state = getLocationById(city.parentId || '');
    return `${city.name}, ${state ? state.name : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
      
      {/* Cabecera de la página */}
      <div className="text-left max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary font-sans sm:text-4xl">
          Explorar Atracciones y Experiencias
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
          Encuentra y reserva las mejores aventuras en Ecuador. Filtra por tus categorías preferidas o busca tu destino ideal.
        </p>
      </div>

      {/* Buscador Global y Filtro Rápido */}
      <section className="bg-white rounded-2xl border border-surface-variant p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex w-full md:flex-grow rounded-xl bg-surface-container border border-outline-variant p-2.5 transition-all duration-300 focus-within:border-primary">
          <div className="flex items-center pl-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">search</span>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o ubicación (ej: Galápagos, Quito...)" 
            className="w-full bg-transparent border-none text-primary placeholder-on-surface-variant/60 pl-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        
        {selectedCategoryId && (
          <button
            onClick={() => setSelectedCategoryId('')}
            className="w-full md:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-surface-container border border-outline-variant text-primary hover:bg-surface-variant transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Limpiar Categoría</span>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </section>

      {/* Bento Grid de Categorías */}
      <section className="flex flex-col gap-4 text-left">
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Filtrar por Categoría</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`relative h-28 rounded-2xl overflow-hidden text-left p-5 border transition-all duration-300 group flex items-end cursor-pointer ${
                selectedCategoryId === cat.id 
                  ? 'border-secondary ring-2 ring-secondary/35 shadow-lg scale-[1.02]' 
                  : 'border-outline-variant hover:border-secondary hover:scale-[1.02]'
              }`}
            >
              {/* Imagen de fondo */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                style={{ backgroundImage: `url(${cat.icon_url})` }}
              ></div>
              {/* Degradado oscuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent"></div>
              
              <span className="relative z-10 font-bold text-sm text-white group-hover:text-tertiary-fixed-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">explore</span>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Catálogo de Atracciones */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex items-center justify-between border-b border-surface-variant pb-3">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            Resultados del Catálogo
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant font-normal">
              {filteredAttractions.length} encontradas
            </span>
          </h2>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mb-2"></div>
            <h3 className="text-primary font-bold text-base">Conectando con la base de datos...</h3>
            <p className="text-on-surface-variant text-xs">Recuperando aventuras desde Supabase. Por favor, espera un momento.</p>
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && filteredAttractions.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">search_off</span>
            <h3 className="text-primary font-bold text-lg">No se encontraron atracciones</h3>
            <p className="text-on-surface-variant text-sm mt-1">Prueba a buscar con otros términos o cambia la categoría de filtro.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategoryId(''); }} 
              className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Limpiar Filtros
            </button>
          </div>
        )}

        {/* Grilla de Tarjetas Premium */}
        {!isLoading && filteredAttractions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAttractions.map(attr => (
              <div 
                key={attr.id}
                className="rounded-2xl overflow-hidden bg-white border border-surface-variant flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Imagen Principal */}
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={attr.media?.find(m => m.is_main)?.url || attr.media?.[0]?.url} 
                    alt={attr.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Puntuación */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary/95 border border-primary-container flex items-center gap-1 text-xs font-bold text-tertiary-fixed-dim">
                    <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim">star</span>
                    <span>{attr.rating.toFixed(2)}</span>
                  </div>

                  {/* Ubicación */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-primary/95 border border-primary-container text-[10px] font-bold text-tertiary-fixed-dim uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    <span>{getLocationLabel(attr.location_id)}</span>
                  </div>
                </div>

                {/* Contenido Informativo */}
                <div className="p-5 flex-grow flex flex-col gap-3">
                  
                  {/* Tags */}
                  {attr.tags && attr.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attr.tags.map((tagId: string) => (
                        <span 
                          key={tagId}
                          className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface-variant"
                        >
                          #{getTagById(tagId)?.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Título */}
                  <h3 className="font-extrabold text-base md:text-lg text-primary group-hover:text-secondary transition-colors leading-snug">
                    {attr.name}
                  </h3>

                  {/* Descripción Corta */}
                  <p className="text-on-surface-variant text-xs line-clamp-3 leading-relaxed">
                    {attr.description}
                  </p>

                  {/* Separador */}
                  <div className="h-px bg-surface-variant my-2"></div>

                  {/* Compra */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">Desde</span>
                      <span className="text-base font-black text-primary">
                        ${attr.price_base.toFixed(2)} <span className="text-[10px] font-normal text-on-surface-variant">/ pers</span>
                      </span>
                    </div>

                    {/* Enlace Detalle */}
                    <Link 
                      to={`/attraction/${attr.slug}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <span>Ver Detalle</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default ExploreView;
