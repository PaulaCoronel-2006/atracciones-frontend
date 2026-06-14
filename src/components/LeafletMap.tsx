import React, { useEffect, useRef, useState } from 'react';

interface LeafletMapProps {
  lat: number;
  lng: number;
  placeName?: string;
  isEditable?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

const svgIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230058bc" width="40" height="40">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
`);

export const LeafletMap: React.FC<LeafletMapProps> = ({
  lat,
  lng,
  placeName = 'Punto de Encuentro Exacto',
  isEditable = false,
  onCoordinatesChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);
  const isDraggingRef = useRef(false);

  // 1. Inicialización del mapa al montar
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        const L = await import('leaflet');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(mapInstanceRef.current);

        const customIcon = L.icon({
          iconUrl: svgIcon,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -35]
        });

        markerInstanceRef.current = L.marker([lat, lng], { 
          icon: customIcon,
          draggable: isEditable 
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div style="font-weight: 600; font-size: 13px; color: #1a1c1c; font-family: 'Open Sans', sans-serif;">${placeName}</div>`);

        if (isEditable) {
          markerInstanceRef.current.on('dragstart', () => {
            isDraggingRef.current = true;
          });
          
          markerInstanceRef.current.on('dragend', () => {
            const position = markerInstanceRef.current.getLatLng();
            isDraggingRef.current = false;
            if (onCoordinatesChange) {
              onCoordinatesChange(position.lat, position.lng);
            }
          });
        } else {
          markerInstanceRef.current.openPopup();
        }

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 400);

      } catch (error) {
        console.error('Error al inicializar Leaflet:', error);
        setLoadError(true);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Actualizar pin y centrar mapa cuando cambien las coordenadas externamente
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      if (!isDraggingRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng]);
      }
      markerInstanceRef.current.setPopupContent(
        `<div style="font-weight: 600; font-size: 13px; color: #1a1c1c; font-family: 'Open Sans', sans-serif;">${placeName}</div>`
      );
    }
  }, [lat, lng, placeName]);

  return (
    <div className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-surface-variant shadow-sm">
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full z-10 ${loadError ? 'hidden' : 'block'}`}
      ></div>

      {loadError && (
        <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/35 flex items-center justify-center text-secondary mb-4">
            <span className="material-symbols-outlined text-3xl">location_on</span>
          </div>
          <h4 className="text-primary font-bold text-lg mb-1">Mapa de Ubicación</h4>
          <p className="text-on-surface-variant text-sm max-w-sm mb-4">
            {placeName}
          </p>
          <div className="px-4 py-2 rounded-lg bg-surface border border-surface-variant inline-flex items-center gap-2 text-xs text-primary font-mono font-bold">
            <span>Lat: {lat.toFixed(4)}</span>
            <span className="text-outline">|</span>
            <span>Lng: {lng.toFixed(4)}</span>
          </div>
          <p className="text-[10px] text-outline mt-6 uppercase tracking-wider font-semibold">
            Modo Simulado Activo / Coordenadas de la Atracción
          </p>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
