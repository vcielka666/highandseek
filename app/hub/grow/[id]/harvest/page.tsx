import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HarvestPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/auth/login')

  await connectDB()

  const grow = await VirtualGrow.findOne({
    _id: id,
    userId: session.user.id,
    status: 'completed',
  }).lean<{
    _id: { toString(): string }
    strainName: string
    strainType: string
    currentDay: number
    setup: { tentSize: string; lightType: string; lightWatts: number; medium: string }
    health: number
    xpEarned: number
    harvestData: {
      gramsYield: number
      qualityScore: number
      creditsEarned: number
      completedAt: Date
    }
    isPerkEligible: boolean
    journalEntries: Array<{ photoUrl: string; day: number }>
    actions: Array<{ type: string }>
  }>()

  if (!grow) notFound()

  const { gramsYield, qualityScore, creditsEarned } = grow.harvestData
  const qualityLabel = qualityScore >= 90 ? 'Exceptional' : qualityScore >= 70 ? 'Good' : qualityScore >= 50 ? 'Average' : 'Poor'
  const qualityColor = qualityScore >= 90 ? '#00d4c8' : qualityScore >= 70 ? '#f0a830' : qualityScore >= 50 ? '#8844cc' : '#cc00aa'

  const photos = grow.journalEntries.filter(e => e.photoUrl).slice(-4)
  const techniques = {
    lst:       grow.actions.some(a => a.type === 'lst'),
    defoliate: grow.actions.some(a => a.type === 'defoliate'),
    top:       grow.actions.some(a => a.type === 'top'),
  }

  return (
    <div style={{ maxWidth: '700px', padding: '20px 16px 60px', margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '36px', paddingTop: '16px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌾</div>
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(28px, 5vw, 44px)', color: '#e8f0ef', margin: '0 0 8px', letterSpacing: '2px' }}>
          Harvest Complete
        </h1>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', color: '#4a6066' }}>
          {grow.strainName} · Day {grow.currentDay} · {grow.setup.tentSize}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}
        className="max-sm:grid-cols-1">
        {[
          { label: 'Yield',   value: `${gramsYield}g`, sub: 'dry weight estimate', color: '#00d4c8' },
          { label: 'Quality', value: `${qualityScore}%`, sub: qualityLabel, color: qualityColor },
          { label: 'Credits', value: `+${creditsEarned}`, sub: 'added to wallet', color: '#f0a830' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{
            background: 'rgba(13,0,20,0.7)', border: `0.5px solid ${color}30`,
            borderRadius: '8px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '8px' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '26px', fontWeight: 700, color, marginBottom: '4px' }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* XP earned */}
      <div style={{
        background: 'rgba(240,168,48,0.07)', border: '0.5px solid rgba(240,168,48,0.2)',
        borderRadius: '6px', padding: '16px 20px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginBottom: '2px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            XP Earned this grow
          </div>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', color: '#f0a830' }}>
            +{grow.xpEarned} xp
          </div>
        </div>
      </div>

      {/* Techniques used */}
      <div style={{
        background: 'rgba(13,0,20,0.6)', border: '0.5px solid rgba(204,0,170,0.12)',
        borderRadius: '6px', padding: '16px 20px', marginBottom: '24px',
      }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '12px' }}>
          Techniques Used
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { key: 'lst',       label: 'LST Training' },
            { key: 'defoliate', label: 'Defoliation' },
            { key: 'top',       label: 'Topping' },
          ].map(({ key, label }) => (
            <div key={key} style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 10px',
              borderRadius: '3px',
              border: `0.5px solid ${techniques[key as keyof typeof techniques] ? 'rgba(0,212,200,0.3)' : 'rgba(74,96,102,0.2)'}`,
              color: techniques[key as keyof typeof techniques] ? '#00d4c8' : '#4a6066',
            }}>
              {techniques[key as keyof typeof techniques] ? '✓' : '○'} {label}
            </div>
          ))}
        </div>
      </div>

      {/* Journal photos */}
      {photos.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '12px' }}>
            Grow Diary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {photos.map((e, i) => (
              <img key={i} src={e.photoUrl} alt={`Day ${e.day}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
            ))}
          </div>
        </div>
      )}

      {/* Funnel */}
      <div style={{
        background: 'rgba(0,212,200,0.05)', border: '0.5px solid rgba(0,212,200,0.2)',
        borderRadius: '8px', padding: '20px 24px', marginBottom: '28px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#00d4c8', marginBottom: '6px' }}>
          Liked growing {grow.strainName}?
        </div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', marginBottom: '14px' }}>
          Grab real seeds and grow it for real.
        </div>
        <Link href={`/shop?search=${encodeURIComponent(grow.strainName)}`} style={{
          fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
          color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '8px 20px',
          textDecoration: 'none', display: 'inline-block',
        }}>
          Find in Shop →
        </Link>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/hub/grow" style={{
          fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
          color: '#050508', background: '#cc00aa', borderRadius: '4px', padding: '10px 24px',
          textDecoration: 'none',
        }}>
          Start New Grow
        </Link>
        <Link href="/hub" style={{
          fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
          color: '#cc00aa', background: 'transparent', border: '0.5px solid rgba(204,0,170,0.4)',
          borderRadius: '4px', padding: '10px 24px', textDecoration: 'none',
        }}>
          Back to Hub
        </Link>
      </div>
    </div>
  )
}
