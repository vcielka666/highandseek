'use client'

import { QRCodeSVG } from 'qrcode.react'

interface BookingQRProps {
  qrCode: string
}

export default function BookingQR({ qrCode }: BookingQRProps) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '16px',
      background: '#ffffff',
      borderRadius: '8px',
    }}>
      <QRCodeSVG
        value={qrCode}
        size={180}
        bgColor="#ffffff"
        fgColor="#050508"
        level="M"
      />
    </div>
  )
}
