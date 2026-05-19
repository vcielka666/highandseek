'use client'

interface BookingActionsProps {
  qrCode: string
}

export default function BookingActions({ qrCode }: BookingActionsProps) {
  function handlePrint() {
    window.print()
  }

  function handleShare() {
    if (navigator.share) {
      void navigator.share({
        title: 'My Tour Booking',
        text:  `Booking code: ${qrCode}`,
        url:   window.location.href,
      })
    } else {
      void navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
      <button
        onClick={handlePrint}
        style={{
          padding: '10px 20px', borderRadius: '4px', cursor: 'pointer',
          background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.3)',
          color: '#8844cc', fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
          letterSpacing: '0.5px', transition: 'all 0.2s',
        }}
      >
        🖨 Print / Save PDF
      </button>
      <button
        onClick={handleShare}
        style={{
          padding: '10px 20px', borderRadius: '4px', cursor: 'pointer',
          background: 'rgba(136,68,204,0.1)', border: '0.5px solid rgba(136,68,204,0.3)',
          color: '#8844cc', fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
          letterSpacing: '0.5px', transition: 'all 0.2s',
        }}
      >
        ↗ Share
      </button>
    </div>
  )
}
