import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import Swal from 'sweetalert2';

const AdminCatalogView: React.FC = () => {
  const { 
    locations, 
    categories, 
    inclusions
  } = useCatalog();

  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'categories' | 'inclusions'>('locations');

  // --- ESTADOS FORMULARIO UBICACIONES ---
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'Country' | 'State' | 'City'>('Country');
  const [newLocParentId, setNewLocParentId] = useState('');

  // Local state for dynamically added catalog items to display alongside context ones
  const [localLocations, setLocalLocations] = useState(() => {
    const saved = localStorage.getItem('catalog_locations_local');
    return saved ? JSON.parse(saved) : [];
  });

  const [localCategories, setLocalCategories] = useState(() => {
    const saved = localStorage.getItem('catalog_categories_local');
    return saved ? JSON.parse(saved) : [];
  });

  const [localInclusions, setLocalInclusions] = useState(() => {
    const saved = localStorage.getItem('catalog_inclusions_local');
    return saved ? JSON.parse(saved) : [];
  });

  const allLocations = useMemo(() => [...locations, ...localLocations], [locations, localLocations]);
  const allCategories = useMemo(() => [...categories, ...localCategories], [categories, localCategories]);
  const allInclusions = useMemo(() => [...inclusions, ...localInclusions], [inclusions, localInclusions]);

  const countries = useMemo(() => allLocations.filter(l => l.type === 'Country'), [allLocations]);
  const states = useMemo(() => allLocations.filter(l => l.type === 'State'), [allLocations]);

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const parentId = newLocType === 'Country' ? null : newLocParentId;
    
    if (newLocType !== 'Country' && !parentId) {
      Swal.fire({
        title: 'Elemento Padre Requerido',
        text: 'Debes vincular un país o estado superior.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    const newLoc = {
      id: 'l-local-' + crypto.randomUUID(),
      name: newLocName.trim(),
      type: newLocType,
      parentId
    };

    const updated = [...localLocations, newLoc];
    setLocalLocations(updated);
    localStorage.setItem('catalog_locations_local', JSON.stringify(updated));
    
    Swal.fire({
      title: 'Ubicación Registrada',
      text: `"${newLocName}" se añadió exitosamente al catálogo.`,
      icon: 'success',
      confirmButtonColor: '#0058bc'
    });

    setNewLocName('');
    setNewLocParentId('');
  };

  // --- ESTADOS FORMULARIO CATEGORÍAS ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat = {
      id: 'c-local-' + crypto.randomUUID(),
      name: newCatName.trim(),
      slug,
      icon_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100'
    };

    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    localStorage.setItem('catalog_categories_local', JSON.stringify(updated));

    Swal.fire({
      title: 'Categoría Registrada',
      text: `Se añadió la categoría "${newCatName}" con éxito.`,
      icon: 'success',
      confirmButtonColor: '#0058bc'
    });

    setNewCatName('');
    setNewCatSlug('');
  };

  // --- ESTADOS FORMULARIO INCLUSIONES ---
  const [newIncText, setNewIncText] = useState('');
  const [newIncIcon, setNewIncIcon] = useState('check');

  const handleAddInclusion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncText.trim()) return;

    const newInc = {
      id: 'i-local-' + crypto.randomUUID(),
      icon_slug: newIncIcon,
      default_text: newIncText.trim()
    };

    const updated = [...localInclusions, newInc];
    setLocalInclusions(updated);
    localStorage.setItem('catalog_inclusions_local', JSON.stringify(updated));

    Swal.fire({
      title: 'Inclusión Registrada',
      text: 'Se incorporó el servicio al catálogo global con éxito.',
      icon: 'success',
      confirmButtonColor: '#0058bc'
    });

    setNewIncText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-surface-variant pb-4">
        <Link to="/admin" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Volver al Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Gestión de Catálogos Globales</h1>
      </div>

      {/* Sub-Pestañas */}
      <div className="flex items-center gap-2 border-b border-surface-variant pb-px overflow-x-auto">
        {[
          { id: 'locations', label: 'Jerarquía Geográfica', icon: 'public' },
          { id: 'categories', label: 'Categorías & Slugs', icon: 'folder_open' },
          { id: 'inclusions', label: 'Servicios e Inclusiones', icon: 'check_circle' }
        ].map(subTab => (
          <button 
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id as any)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
              activeSubTab === subTab.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{subTab.icon}</span>
            <span>{subTab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Formulario (Izquierda) */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 text-xs h-fit shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add_box</span>
            <span>Añadir al Catálogo</span>
          </h3>

          {/* Formulario UBICACIONES */}
          {activeSubTab === 'locations' && (
            <form onSubmit={handleAddLocation} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Tipo de Ubicación</label>
                <select 
                  value={newLocType} 
                  onChange={(e) => setNewLocType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary"
                >
                  <option value="Country">País</option>
                  <option value="State">Provincia / Estado</option>
                  <option value="City">Ciudad</option>
                </select>
              </div>

              {newLocType !== 'Country' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-outline font-semibold">Vincular a Superior (Padre)</label>
                  <select 
                    value={newLocParentId} 
                    onChange={(e) => setNewLocParentId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary"
                  >
                    <option value="">Seleccionar Padre...</option>
                    {newLocType === 'State' && countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (País)</option>
                    ))}
                    {newLocType === 'City' && states.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Estado)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Nombre del Lugar</label>
                <input 
                  type="text" 
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="Ej: Pichincha" 
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant focus:outline-none focus:border-secondary" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Registrar Ubicación
              </button>
            </form>
          )}

          {/* Formulario CATEGORÍAS */}
          {activeSubTab === 'categories' && (
            <form onSubmit={handleAddCategory} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Nombre de la Categoría</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej: Aventura Extrema" 
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant focus:outline-none focus:border-secondary" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Slug (Opcional)</label>
                <input 
                  type="text" 
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="Ej: aventura-extrema" 
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant focus:outline-none focus:border-secondary" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Registrar Categoría
              </button>
            </form>
          )}

          {/* Formulario INCLUSIONES */}
          {activeSubTab === 'inclusions' && (
            <form onSubmit={handleAddInclusion} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Descripción de Inclusión</label>
                <input 
                  type="text" 
                  value={newIncText}
                  onChange={(e) => setNewIncText(e.target.value)}
                  placeholder="Ej: Seguro médico de viaje básico" 
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant focus:outline-none focus:border-secondary" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-outline font-semibold">Ícono Visual</label>
                <select 
                  value={newIncIcon}
                  onChange={(e) => setNewIncIcon(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary"
                >
                  <option value="check">✓ Checkmark</option>
                  <option value="guide">👤 Guía profesional</option>
                  <option value="transport">🚌 Minibús / Transporte</option>
                  <option value="food">🍽️ Comida Gourmet</option>
                  <option value="ticket">🎫 Ticket de Entrada</option>
                  <option value="equipment">🤿 Equipamiento snorkel</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Registrar Inclusión
              </button>
            </form>
          )}

        </div>

        {/* Columna Catálogo Registrado (Derecha) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 text-xs shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">list_alt</span>
            <span>Elementos en Catálogo</span>
          </h3>

          {/* Lista UBICACIONES */}
          {activeSubTab === 'locations' && (
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
              {allLocations.map((loc, idx) => {
                let icon = 'public';
                if (loc.type === 'State') icon = 'map';
                if (loc.type === 'City') icon = 'location_city';

                const parent = loc.parentId ? allLocations.find(l => l.id === loc.parentId) : null;

                return (
                  <div 
                    key={loc.id || idx}
                    className="p-3.5 rounded-xl bg-background border border-surface-variant flex items-center justify-between hover:border-outline transition-all"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="material-symbols-outlined text-secondary text-lg">
                        {icon}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-primary">{loc.name}</span>
                        <span className="text-[9px] text-outline font-bold uppercase tracking-wider">
                          Nivel: {loc.type} | ID: {loc.id}
                        </span>
                      </div>
                    </div>
                    
                    {parent && (
                      <span className="text-[10px] text-outline font-semibold">
                        Padre: {parent.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista CATEGORÍAS */}
          {activeSubTab === 'categories' && (
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
              {allCategories.map((cat, idx) => (
                <div 
                  key={cat.id || idx}
                  className="p-3.5 rounded-xl bg-background border border-surface-variant flex items-center justify-between hover:border-outline transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center border border-surface-variant" style={{ backgroundImage: `url(${cat.icon_url})` }}></div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-primary">{cat.name}</span>
                      <span className="text-[9px] font-mono text-secondary">Slug: /category/{cat.slug}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista INCLUSIONES */}
          {activeSubTab === 'inclusions' && (
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
              {allInclusions.map((inc, idx) => {
                let mIcon = 'check_circle';
                if (inc.icon_slug === 'guide') mIcon = 'person';
                if (inc.icon_slug === 'transport') mIcon = 'directions_bus';
                if (inc.icon_slug === 'food') mIcon = 'restaurant';
                if (inc.icon_slug === 'ticket') mIcon = 'local_activity';
                if (inc.icon_slug === 'equipment') mIcon = 'scuba_diving';

                return (
                  <div 
                    key={inc.id || idx}
                    className="p-3.5 rounded-xl bg-background border border-surface-variant flex items-center justify-between hover:border-outline transition-all"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="material-symbols-outlined text-secondary text-base p-1.5 rounded-lg bg-white border border-surface-variant">
                        {mIcon}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-primary">{inc.default_text}</span>
                        <span className="text-[9px] text-outline uppercase tracking-wider font-semibold">Identificador: {inc.icon_slug}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AdminCatalogView;
