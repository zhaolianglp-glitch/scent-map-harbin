// MapContainer - MapLibre 地图 + SmellCanvas 覆盖层
import { useEffect, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SmellCanvas } from './SmellCanvas';
import { HARBIN_CENTER, HARBIN_ZOOM } from '../data/mockSmells';
import { useAppStore } from '../store/useMapStore';

// CartoDB Positron 浅色底图
const POSITRON_STYLE = {
  version: 8 as const,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'carto-positron': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'positron-tiles',
      type: 'raster' as const,
      source: 'carto-positron',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const { openModal, triggerClickRipple } = useAppStore();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const m = new maplibregl.Map({
      container: containerRef.current,
      style: POSITRON_STYLE,
      center: HARBIN_CENTER,
      zoom: HARBIN_ZOOM,
      minZoom: 9,
      maxZoom: 16,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
      logoPosition: 'bottom-right',
    });

    mapRef.current = m;

    // 立即设置 map 实例，SmellCanvas 会自己处理加载状态
    setMap(m);

    // 点击地图：弹出输入框
    m.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      console.log('[MapContainer] click at', lng, lat);
      openModal(lng, lat);
      triggerClickRipple(lng, lat);
    });

    return () => {
      mapRef.current = null;
      m.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0" style={{ background: 'oklch(0.97 0.01 80)' }}>
      <div ref={containerRef} className="absolute inset-0" />
      <SmellCanvas map={map} />
    </div>
  );
}
