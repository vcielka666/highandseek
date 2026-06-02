'use client'

import { useState } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'

interface MapSpot {
  id: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
}

interface MapTourStop {
  id: string
  title: string
  type: string
  lat: number
  lng: number
  tourTitle: string
}

interface ToursMapProps {
  spots: MapSpot[]
  tourStops: MapTourStop[]
  defaultLat?: number
  defaultLng?: number
}

const SPOT_TYPE_COLORS: Record<string, string> = {
  cannabis_club:  '#8844cc',
  cbd_shop:       '#00d4c8',
  smoke_friendly: '#f0a830',
  grow_shop:      '#44cc88',
  cafe:           '#cc6644',
  event_space:    '#cc00aa',
}

const STOP_TYPE_COLORS: Record<string, string> = {
  club:      '#8844cc',
  shop:      '#00d4c8',
  viewpoint: '#44cc88',
  cafe:      '#cc6644',
  culture:   '#cc00aa',
  other:     '#4a6066',
}

type SelectedItem =
  | { kind: 'spot'; item: MapSpot }
  | { kind: 'stop'; item: MapTourStop }

function MarkerDot({ color }: { color: string }) {
  return (
    <div style={{
      width: '14px', height: '14px', borderRadius: '50%',
      background: color, border: '2px solid rgba(255,255,255,0.3)',
      boxShadow: `0 0 8px ${color}88`,
      cursor: 'pointer',
    }} />
  )
}

function ToursMapInner({ spots, tourStops, defaultLat, defaultLng }: ToursMapProps) {
  const [selected, setSelected] = useState<SelectedItem | null>(null)

  const center = {
    lat: defaultLat ?? 50.0755,
    lng: defaultLng ?? 14.4378,
  }

  return (
    <Map
      defaultCenter={center}
      defaultZoom={13}
      mapId="tours-dark-map"
      disableDefaultUI
      gestureHandling="cooperative"
      style={{ width: '100%', height: '100%' }}
    >
      {spots.map(spot => (
        <AdvancedMarker
          key={`spot-${spot.id}`}
          position={{ lat: spot.lat, lng: spot.lng }}
          onClick={() => setSelected({ kind: 'spot', item: spot })}
        >
          <MarkerDot color={SPOT_TYPE_COLORS[spot.type] ?? '#4a6066'} />
        </AdvancedMarker>
      ))}

      {tourStops.map(stop => (
        <AdvancedMarker
          key={`stop-${stop.id}`}
          position={{ lat: stop.lat, lng: stop.lng }}
          onClick={() => setSelected({ kind: 'stop', item: stop })}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '4px',
            background: STOP_TYPE_COLORS[stop.type] ?? '#8844cc',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: `0 0 10px ${STOP_TYPE_COLORS[stop.type] ?? '#8844cc'}99`,
            cursor: 'pointer',
            transform: 'rotate(45deg)',
          }} />
        </AdvancedMarker>
      ))}

      {selected && (
        <InfoWindow
          position={
            selected.kind === 'spot'
              ? { lat: selected.item.lat, lng: selected.item.lng }
              : { lat: selected.item.lat, lng: selected.item.lng }
          }
          onCloseClick={() => setSelected(null)}
        >
          <div style={{
            background: '#0d0d12', border: '0.5px solid rgba(136,68,204,0.3)',
            borderRadius: '6px', padding: '10px 14px', minWidth: '160px',
          }}>
            <div style={{
              fontFamily: 'var(--font-orbitron)', fontSize: '11px',
              color: '#e8f0ef', fontWeight: 700, marginBottom: '4px',
            }}>
              {selected.kind === 'spot' ? selected.item.name : selected.item.title}
            </div>
            {selected.kind === 'spot' && (
              <>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {selected.item.type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', color: '#4a6066' }}>
                  {selected.item.address}
                </div>
              </>
            )}
            {selected.kind === 'stop' && (
              <>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#8844cc', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {selected.item.type} · {selected.item.tourTitle}
                </div>
              </>
            )}
          </div>
        </InfoWindow>
      )}
    </Map>
  )
}

export default function ToursMap(props: ToursMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  if (!apiKey) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: '#0d0d12', border: '0.5px solid rgba(136,68,204,0.15)',
        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
          Map unavailable
        </span>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <ToursMapInner {...props} />
    </APIProvider>
  )
}
