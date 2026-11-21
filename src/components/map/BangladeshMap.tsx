import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getExternalRouteUrl } from '../../services/locationService';
import { useLanguage } from '../../context/LanguageContext';
import { ExternalLink, Navigation } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  badgeText?: string;
  type: 'donor' | 'hospital' | 'request' | 'center';
  isApproximate?: boolean;
}

interface BangladeshMapProps {
  center: [number, number];
  zoom?: number;
  radiusKm?: number;
  markers: MapMarkerItem[];
  onSelectMarker?: (id: string, type: string) => void;
  className?: string;
}

export const BangladeshMap: React.FC<BangladeshMapProps> = ({
  center,
  zoom = 11,
  radiusKm,
  markers,
  onSelectMarker,
  className = 'h-96 w-full rounded-2xl shadow-inner',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: false, // Prevents accidental scrolling on mobile
      });

      // OpenStreetMap standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update radius circle and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Draw search radius circle around center if specified
    if (radiusKm && radiusKm > 0) {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
      circleRef.current = L.circle(center, {
        radius: radiusKm * 1000,
        color: '#DC2626',
        fillColor: '#EF4444',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);
    } else if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Add markers
    markers.forEach((item) => {
      let iconHtml = '';
      if (item.type === 'donor') {
        iconHtml = `
          <div style="background-color: #DC2626; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            ${item.badgeText || '🩸'}
          </div>
        `;
      } else if (item.type === 'hospital') {
        iconHtml = `
          <div style="background-color: #0284C7; color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            🏥
          </div>
        `;
      } else if (item.type === 'request') {
        iconHtml = `
          <div style="background-color: #B91C1C; color: white; width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid #FEF08A; box-shadow: 0 0 10px rgba(220,38,38,0.6); animation: pulse 2s infinite;">
            ${item.badgeText || '🚨'}
          </div>
        `;
      } else {
        iconHtml = `
          <div style="background-color: #4B5563; color: white; width: 20px; height: 20px; border-radius: 9999px; border: 2px solid white;"></div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      const routeUrl = getExternalRouteUrl(item.lat, item.lng);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 2px;">
          ${item.title}
        </div>
        <div style="color: #4B5563; margin-bottom: 6px;">
          ${item.subtitle}
        </div>
        ${
          item.isApproximate
            ? `<div style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px;">
                ${language === 'bn' ? 'গোপনীয়তার স্বার্থে অবস্থান আনুমানিক' : 'Approximate location for privacy'}
              </div><br/>`
            : ''
        }
        <a href="${routeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background-color: #DC2626; color: white; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 11px;">
          🗺️ ${language === 'bn' ? 'গুগল ম্যাপে দিকনির্দেশনা' : 'Directions on Map'}
        </a>
      `;

      marker.bindPopup(popupContent);

      if (onSelectMarker) {
        marker.on('click', () => {
          onSelectMarker(item.id, item.type);
        });
      }

      layerGroup.addLayer(marker);
    });
  }, [markers, radiusKm, center, language, onSelectMarker]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      {radiusKm && (
        <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-red-600" />
          <span>
            {language === 'bn' ? `অনুসন্ধান ব্যাসার্ধ: ${radiusKm} কি.মি.` : `Search Radius: ${radiusKm} KM`}
          </span>
        </div>
      )}
    </div>
  );
};
