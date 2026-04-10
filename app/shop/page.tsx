import Navbar from '@/components/layout/Navbar'

export default function ShopPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#e8f0ef' }}>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#007a74', marginBottom: '8px' }}>
          Pillar 01 · E-commerce
        </div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(28px, 5vw, 48px)', color: '#00d4c8', textShadow: '0 0 30px rgba(0,212,200,0.3)' }}>
          H&amp;S Shop
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginTop: '8px' }}>
          Coming soon
        </p>
        <div style={{ width: '40px', height: '0.5px', background: 'rgba(0,212,200,0.3)', margin: '8px 0' }} />
        <p style={{ fontSize: '14px', color: '#4a6066', maxWidth: '400px', lineHeight: 1.7 }}>
          Curated CBD strains, clones and seeds. Quality over quantity.
        </p>
      </main>
    </div>
  )
}
