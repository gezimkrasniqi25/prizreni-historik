import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/api';
import { useLang } from '../context/LanguageContext';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#b8902a;border:2px solid #fffdf8;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(31,26,20,.35)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function FitBounds({ monuments }) {
  const map = useMap();
  useEffect(() => {
    if (!monuments?.length) return;
    const bounds = L.latLngBounds(monuments.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds.pad(0.18), { animate: false });
  }, [map, monuments]);
  return null;
}

export default function MonumentMap({ monuments = [], height = '480px', focus }) {
  const { t } = useLang();
  const center = focus ? [focus.latitude, focus.longitude] : [42.2095, 20.7415];

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-soft" style={{ height }}>
      <MapContainer
        center={center}
        zoom={focus ? 16 : 14}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!focus && <FitBounds monuments={monuments} />}
        {monuments.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={markerIcon}>
            <Popup>
              <div className="w-48">
                {m.coverThumb && (
                  <img src={mediaUrl(m.coverThumb)} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
                )}
                <p className="font-display text-base text-ink">{m.name}</p>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2">{m.shortDescription}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to={`/monuments/${m.slug}`} className="text-xs font-medium text-gold-dark hover:underline">
                    {t('home.openMonument')}
                  </Link>
                  <a
                    href={`https://www.openstreetmap.org/directions?from=&to=${m.latitude}%2C${m.longitude}#map=16/${m.latitude}/${m.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ink-muted hover:underline"
                  >
                    {t('common.directions')}
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
