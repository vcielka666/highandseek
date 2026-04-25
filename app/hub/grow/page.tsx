import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/db/connect'
import VirtualGrow from '@/lib/db/models/VirtualGrow'
import InfoTooltip from '@/components/ui/InfoTooltip'
import StoryExpand from '@/components/ui/StoryExpand'
import User from '@/lib/db/models/User'
import Strain from '@/lib/db/models/Strain'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { getServerT } from '@/lib/i18n/server'

export default async function GrowPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/hub/grow')

  const { t } = await getServerT()
  const g = t.grow

  await connectDB()

  type ActiveGrow = {
    _id: { toString(): string }
    strainName: string; strainType: string; stage: string
    currentDay: number; health: number; yieldProjection: number
    setup: { tentSize: string; lightType: string; lightWatts: number; medium: string }
  }

  const [activeGrows, user, strains, totalGrows] = await Promise.all([
    VirtualGrow.find({ userId: session.user.id, status: 'active' })
      .select('_id strainName strainType stage currentDay health yieldProjection setup')
      .sort({ createdAt: -1 })
      .lean<ActiveGrow[]>(),
    User.findById(session.user.id).select('growsCompleted xp credits cloneBank').lean<{
      growsCompleted: number; xp: number; credits: number
      cloneBank: Array<{ strainSlug: string; strainName: string; strainType: string; floweringTime: number; takenAt: string }>
    }>(),
    Strain.find({ isActive: true, isComingSoon: false })
      .select('slug name type floweringTime difficulty')
      .limit(12)
      .lean<Array<{ slug: string; name: string; type: string; floweringTime: number; difficulty: string }>>(),
    VirtualGrow.countDocuments({ userId: session.user.id }),
  ])

  const growsCompleted = user?.growsCompleted ?? 0
  const cloneBank = user?.cloneBank ?? []
  const isFirstGrow = totalGrows === 0
  const SUBSEQUENT_GROW_COST = 2

  return (
    <div style={{ maxWidth: '900px' }} className="px-4 pt-4 pb-16 md:px-7 md:pt-7">
      {/* Header + story preview */}
      <div style={{ marginBottom: '28px' }}>
        <Breadcrumb items={[{ label: 'Hub', href: '/hub' }, { label: g.title }]} color="#cc00aa" />
        <h1 style={{ fontFamily: 'var(--font-cacha)', fontSize: 'clamp(26px, 5vw, 42px)', color: '#e8f0ef', letterSpacing: '2px', margin: '0 0 14px', lineHeight: 1 }}>
          {g.title}
        </h1>

        <StoryExpand
          originLabel={g.originLabel}
          story1={g.story1}
          story2={g.story2}
          story3={g.story3}
        />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}
        className="max-sm:grid-cols-1">
        {[
          { label: g.growsCompleted, value: String(growsCompleted) },
          { label: g.xpFromGrows,   value: String(user?.xp ?? 0) + ' xp' },
          { label: g.creditsEarned, value: String(user?.credits ?? 0) + ' 💎' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(204,0,170,0.05)',
            border: '0.5px solid rgba(204,0,170,0.12)',
            borderRadius: '6px', padding: '14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '18px', fontWeight: 700, color: '#cc00aa', marginBottom: '3px' }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: '#4a6066' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Active grows list ── */}
      {activeGrows.length > 0 && (
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.5)' }}>
            {g.activeGrowLabel} ({activeGrows.length})
          </div>
          {activeGrows.map(grow => (
            <div key={grow._id.toString()} style={{
              background: 'rgba(0,212,200,0.05)',
              border: '0.5px solid rgba(0,212,200,0.25)',
              borderRadius: '8px', padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '17px', color: '#e8f0ef', marginBottom: '4px' }}>
                    {grow.strainName}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>
                    {g.activeGrowInfo(grow.currentDay, grow.stage, grow.setup.tentSize, grow.setup.lightWatts, grow.setup.lightType)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginBottom: '3px' }}>{g.healthLabel}</div>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '20px', color: grow.health > 60 ? '#00d4c8' : grow.health > 30 ? '#f0a830' : '#cc00aa' }}>
                    {grow.health}%
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href={`/hub/grow/${grow._id.toString()}`} style={{
                  fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
                  color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '8px 18px',
                  textDecoration: 'none',
                }}>
                  {g.viewGrow}
                </Link>
                <Link href={`/hub/grow/${grow._id.toString()}/journal/new`} style={{
                  fontFamily: 'var(--font-cacha)', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
                  color: '#00d4c8', background: 'transparent', border: '0.5px solid rgba(0,212,200,0.4)',
                  borderRadius: '4px', padding: '8px 18px', textDecoration: 'none',
                }}>
                  {g.addJournal}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Start new grow ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '16px' }}>
          {g.startNewGrow}
        </div>
        <div style={{
          background: 'rgba(0,212,200,0.05)',
          border: '0.5px solid rgba(0,212,200,0.2)',
          borderRadius: '8px', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#00d4c8', marginBottom: '6px' }}>
            {g.realtimeTitle}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066', lineHeight: 1.6, marginBottom: '10px' }}>
            {g.realtimeDesc}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: isFirstGrow ? '#00d4c8' : '#f0a830', marginBottom: '12px' }}>
            {isFirstGrow ? g.realtimeFree : `💎 ${SUBSEQUENT_GROW_COST} ${g.creditsPerGrow}`}
          </div>
          <Link href="/hub/grow/setup" style={{
            fontFamily: 'var(--font-cacha)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase',
            color: '#050508', background: '#00d4c8', borderRadius: '4px', padding: '8px 16px',
            textDecoration: 'none', display: 'inline-block',
          }}>
            {g.startSetup}
          </Link>
        </div>
      </div>

      {/* ── Clone bank ── */}
      {cloneBank.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00d4c8' }}>
              {g.cloneBankTitle}
            </div>
            <InfoTooltip
              title="Clone Bank"
              body="After a successful harvest (quality ≥ 40%), a cutting is saved automatically. Clones skip the full veg phase — root in 4 days, flip window day 4–13. Free to start, no credits needed."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {cloneBank.map((clone, idx) => (
              <Link
                key={`${clone.strainSlug}-${idx}`}
                href={`/hub/grow/setup?clone=${clone.strainSlug}`}
                style={{
                  display: 'block',
                  background: 'rgba(0,212,200,0.05)',
                  border: '0.5px solid rgba(0,212,200,0.3)',
                  borderRadius: '8px', padding: '14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#00d4c8', letterSpacing: '1px', marginBottom: '4px' }}>
                  🌿 CLONE · {clone.strainType.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '15px', color: '#e8f0ef', marginBottom: '6px' }}>
                  {clone.strainName}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#4a6066' }}>
                  {clone.floweringTime}d flower · {g.cloneFreeLabel}
                </div>
                <div style={{ marginTop: '8px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'rgba(0,212,200,0.5)', background: 'rgba(0,212,200,0.06)', borderRadius: '3px', padding: '4px 7px', display: 'inline-block' }}>
                  {g.cloneSkipVegLabel}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Strain picker ── */}
      {strains.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4a6066', marginBottom: '14px' }}>
            {g.availableStrains}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {strains.map(s => (
              <Link
                key={s.slug}
                href={`/hub/grow/setup?strain=${s.slug}`}
                style={{
                  background: 'rgba(13,0,20,0.6)',
                  border: '0.5px solid rgba(204,0,170,0.12)',
                  borderRadius: '6px', padding: '14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                className="hover:border-[rgba(204,0,170,0.4)]"
              >
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', color: '#e8f0ef', marginBottom: '4px' }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066' }}>
                  {(g.strainTypes as Record<string, string>)[s.type] ?? s.type} · {s.floweringTime}d · {(g.strainDifficulty as Record<string, string>)[s.difficulty] ?? s.difficulty}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
