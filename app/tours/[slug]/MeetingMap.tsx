'use client'

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'

interface MeetingMapProps {
  lat:     number
  lng:     number
  address: string
}

export default function MeetingMap({ lat, lng, address }: MeetingMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  if (!apiKey || !lat || !lng) {
    return (
      <div style={{
        width: '100%', height: '200px',
        background: '#0d0d12', border: '0.5px solid rgba(136,68,204,0.15)',
        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '6px',
      }}>
        <span style={{ fontSize: '20px' }}>📍</span>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
          {address || 'Meeting point TBD'}
        </span>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden', border: '0.5px solid rgba(136,68,204,0.18)' }}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          mapId="meeting-point-map"
          disableDefaultUI
          gestureHandling="none"
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={{ lat, lng }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#8844cc', border: '3px solid rgba(232,240,239,0.8)',
              boxShadow: '0 0 14px rgba(136,68,204,0.8)',
            }} />
          </AdvancedMarker>
        </Map>
      </div>
    </APIProvider>
  )
}
