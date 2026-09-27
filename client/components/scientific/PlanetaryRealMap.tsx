'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Minus, Crosshair, AlertTriangle, RefreshCw } from 'lucide-react';
import type { GlobalEventItem } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

interface PlanetaryRealMapProps {
  events: GlobalEventItem[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  caseGeometry?: any;
  loading?: boolean;
}

export function PlanetaryRealMap({
  events,
  selectedCaseId,
  onSelectCase,
  caseGeometry,
  loading = false,
}: PlanetaryRealMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const geometryLayerRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState<boolean>(false);
  const [tileError, setTileError] = useState<boolean>(false);
  const [currentCenterCoords, setCurrentCenterCoords] = useState<{ lat: number; lng: number } | null>(null);

  const selectedEvent = events.find((e) => e.case_id === selectedCaseId) || events[0] || null;

  // 1. Initialize Map Instance
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Determine initial center from runtime coordinates
      const defaultLat = selectedEvent?.latitude != null ? selectedEvent.latitude : 23.8;
      const defaultLng = selectedEvent?.longitude != null ? selectedEvent.longitude : 90.4;
      const defaultZoom = events.length > 1 ? 5 : 6;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false, // We use custom cyber controls
        attributionControl: false,
      });

      // Public OpenStreetMap Real Geographic Basemap (Dark Sci-Fi Styling via CSS Filter)
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        className: 'trace-osm-dark-tiles',
        maxZoom: 19,
      });

      let tileErrorCount = 0;
      tileLayer.on('tileerror', () => {
        tileErrorCount++;
        if (tileErrorCount > 5 && isMounted) {
          setTileError(true);
        }
      });

      tileLayer.on('load', () => {
        tileErrorCount = 0;
        if (isMounted) setTileError(false);
      });

      tileLayer.addTo(map);

      // Attribution Control placed unobtrusively in bottom right
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<span class="text-[9px] font-mono text-slate-500">WGS84 // TRACE FIELD</span>',
        })
        .addTo(map);

      // Layers for dynamic markers & geometry
      const markersLayer = L.layerGroup().addTo(map);
      const geometryLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      geometryLayerRef.current = geometryLayer;

      map.on('move', () => {
        const center = map.getCenter();
        setCurrentCenterCoords({ lat: center.lat, lng: center.lng });
      });

      setCurrentCenterCoords({ lat: defaultLat, lng: defaultLng });
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers when events or selectedCaseId change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !markersLayerRef.current) return;

      const layer = markersLayerRef.current;
      layer.clearLayers();

      events.forEach((evt) => {
        if (evt.latitude == null || evt.longitude == null) return;

        const isSelected = evt.case_id === selectedCaseId;

        // Custom High-Contrast TRACE Scientific Marker Icon
        const statusBorder =
          evt.audit_verdict === 'SUPPORTED'
            ? 'border-emerald-400 bg-emerald-500 shadow-emerald-400/50'
            : evt.audit_verdict === 'REJECTED'
            ? 'border-rose-400 bg-rose-500 shadow-rose-400/50'
            : 'border-amber-400 bg-amber-500 shadow-amber-400/50';

        const labelColor = isSelected
          ? 'bg-slate-950/95 text-sky-300 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)] ring-1 ring-sky-400/50'
          : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:border-sky-400';

        const pingEffect = isSelected
          ? '<span class="absolute -inset-2.5 rounded-full bg-sky-400/35 animate-ping pointer-events-none"></span>'
          : '';

        const iconHtml = `
          <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            ${pingEffect}
            <div class="relative flex items-center justify-center w-5 h-5 rounded-full border-2 ${statusBorder} shadow-lg transition-transform duration-200 ${
              isSelected ? 'scale-125 ring-4 ring-sky-400/60' : 'group-hover:scale-110'
            }">
              <div class="w-1.5 h-1.5 rounded-full bg-[#050914]"></div>
            </div>
            <div class="mt-1 whitespace-nowrap text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${labelColor} transition-all pointer-events-none">
              ${evt.case_id}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'trace-custom-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([evt.latitude, evt.longitude], {
          icon: customIcon,
          title: `${evt.case_id} (${evt.event_type})`,
        });

        marker.on('click', () => {
          onSelectCase(evt.case_id);
        });

        layer.addLayer(marker);
      });
    }

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [events, selectedCaseId, mapReady, onSelectCase]);

  // 3. Pan to Selected Case or AOI Geometry on change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedEvent) return;

    if (selectedEvent.latitude != null && selectedEvent.longitude != null) {
      mapInstanceRef.current.flyTo(
        [selectedEvent.latitude, selectedEvent.longitude],
        Math.max(mapInstanceRef.current.getZoom(), 6),
        { duration: 0.8 }
      );
    }
  }, [selectedCaseId, mapReady]);

  // 4. Render Actual Case GeoJSON Geometry if available
  useEffect(() => {
    if (!mapReady || !geometryLayerRef.current) return;

    let isMounted = true;

    async function updateGeometry() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !geometryLayerRef.current) return;

      const layer = geometryLayerRef.current;
      layer.clearLayers();

      if (caseGeometry) {
        try {
          const geoJsonLayer = L.geoJSON(caseGeometry, {
            style: {
              color: '#38bdf8',
              weight: 2,
              opacity: 0.85,
              fillColor: '#0ea5e9',
              fillOpacity: 0.15,
              dashArray: '4, 4',
            },
          });
          layer.addLayer(geoJsonLayer);
        } catch {
          // Graceful ignore of invalid geometry
        }
      }
    }

    updateGeometry();

    return () => {
      isMounted = false;
    };
  }, [caseGeometry, mapReady]);

  // Handle Zoom In / Out
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  }, []);

  // Recenter to Active Case Location
  const handleRecenter = useCallback(() => {
    if (mapInstanceRef.current && selectedEvent?.latitude != null && selectedEvent?.longitude != null) {
      mapInstanceRef.current.flyTo(
        [selectedEvent.latitude, selectedEvent.longitude],
        7,
        { duration: 0.8 }
      );
    }
  }, [selectedEvent]);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] bg-[#050914] overflow-hidden select-none">
      {/* Real Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Cyber Reticle / WGS84 Crosshairs Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Subtle Equirectangular Center Guides */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sky-500/10" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-sky-500/10" />

        {/* Technical Corner Brackets */}
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />
        <div className="tech-corner-bl" />
        <div className="tech-corner-br" />
      </div>

      {/* Minimal Cyber Map Controls Group [+], [-], [⌖] */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 shadow-xl">
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="w-7 h-7 rounded-lg bg-slate-950/85 border border-sky-500/30 text-sky-300 hover:text-white hover:bg-sky-500/20 hover:border-sky-400 flex items-center justify-center transition-all shadow-md active:scale-95"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="w-7 h-7 rounded-lg bg-slate-950/85 border border-sky-500/30 text-sky-300 hover:text-white hover:bg-sky-500/20 hover:border-sky-400 flex items-center justify-center transition-all shadow-md active:scale-95"
          title="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleRecenter}
          aria-label="Recenter to active case location"
          className="w-7 h-7 rounded-lg bg-slate-950/85 border border-sky-500/30 text-sky-300 hover:text-white hover:bg-sky-500/20 hover:border-sky-400 flex items-center justify-center transition-all shadow-md active:scale-95"
          title="Recenter to active target"
        >
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>

      {/* Live Coordinate Telemetry Badge */}
      <div className="absolute bottom-2 left-3 z-20 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-sky-500/20 font-mono text-[9px] text-slate-400 flex items-center gap-2 shadow-md">
          <span className="text-sky-400 font-bold">WGS84:</span>
          <span>
            {currentCenterCoords
              ? `${Math.abs(currentCenterCoords.lat).toFixed(4)}°${currentCenterCoords.lat >= 0 ? 'N' : 'S'}, ${Math.abs(currentCenterCoords.lng).toFixed(4)}°${currentCenterCoords.lng >= 0 ? 'E' : 'W'}`
              : selectedEvent?.latitude != null && selectedEvent?.longitude != null
              ? `${selectedEvent.latitude.toFixed(4)}°N, ${selectedEvent.longitude.toFixed(4)}°E`
              : 'GRID CALIBRATING'}
          </span>
        </div>
      </div>

      {/* Graceful Fallback if Tile Server is Unreachable */}
      {tileError && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2 font-mono">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            MAP TILE DATA STREAM UNAVAILABLE
          </div>
          <div className="text-[11px] text-slate-400 max-w-sm">
            Geographic basemap connection interrupted. Case coordinates:{' '}
            <span className="text-sky-300 font-bold">
              {selectedEvent?.latitude != null && selectedEvent?.longitude != null
                ? `${selectedEvent.latitude.toFixed(4)}°, ${selectedEvent.longitude.toFixed(4)}°`
                : 'Offline'}
            </span>
          </div>
          <button
            onClick={() => setTileError(false)}
            className="mt-2 text-[10px] px-2.5 py-1 rounded border border-sky-500/30 text-sky-300 hover:bg-sky-500/15 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Retry Stream
          </button>
        </div>
      )}

      {/* Empty State when no events exist */}
      {!loading && events.length === 0 && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center space-y-2 font-mono">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
          <div className="text-xs font-bold text-slate-200 uppercase">NO TRACE EVENTS IN FILTER</div>
          <p className="text-[11px] text-slate-400">
            No active satellite cases match the selected pulse filters.
          </p>
        </div>
      )}
    </div>
  );
}
