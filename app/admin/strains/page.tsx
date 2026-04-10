import { requireAdmin } from '@/lib/admin/guard'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import Strain from '@/lib/db/models/Strain'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import DeleteStrainButton from '@/components/admin/DeleteStrainButton'

export default async function AdminStrainsPage() {
  const guard = await requireAdmin()
  if (guard) redirect('/auth/login?callbackUrl=/admin/strains')

  await connectDB()

  const strains = await Strain.find({})
    .select('slug name type personality.archetype stats isActive isComingSoon')
    .sort({ name: 1 })
    .lean<Array<{
      slug: string
      name: string
      type: 'indica' | 'sativa' | 'hybrid'
      personality: { archetype: string }
      stats: { totalChats: number; totalMessages: number }
      isActive: boolean
      isComingSoon: boolean
    }>>()

  const typeColor = (t: string) =>
    t === 'indica' ? '#8844cc' : t === 'sativa' ? '#44aa44' : '#00d4c8'

  const statusLabel = (s: typeof strains[number]) =>
    s.isComingSoon ? 'Soon' : s.isActive ? 'Active' : 'Inactive'

  return (
    <div style={{ padding: '20px 16px', maxWidth: '900px' }} className="md:px-7">
      <AdminPageHeader
        title="Strain Avatars"
        description={`${strains.length} strain personalities`}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Link
          href="/admin/strains/new"
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '1px',
            color: '#050508', background: '#f0a830', padding: '9px 18px', borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          + New Strain
        </Link>
      </div>

      {/* ── Mobile cards (hidden on md+) ── */}
      <div className="flex flex-col gap-2 md:hidden">
        {strains.map(s => (
          <div key={s.slug} style={{
            background: '#0d1014', border: '0.5px solid rgba(240,168,48,0.12)',
            borderRadius: '6px', padding: '14px 16px',
          }}>
            {/* Row 1: name + status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '13px', color: '#e8f0ef' }}>{s.name}</span>
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px',
                padding: '2px 8px', borderRadius: '3px',
                background: s.isActive ? 'rgba(0,212,200,0.1)' : 'rgba(74,96,102,0.1)',
                color: s.isActive ? '#00d4c8' : '#4a6066',
                border: `0.5px solid ${s.isActive ? 'rgba(0,212,200,0.2)' : 'rgba(74,96,102,0.2)'}`,
              }}>
                {statusLabel(s)}
              </span>
            </div>
            {/* Row 2: type + archetype */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: typeColor(s.type) }}>{s.type}</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e' }}>·</span>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: '#4a6066' }}>{s.personality.archetype}</span>
            </div>
            {/* Row 3: stats + actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#2a3a3e' }}>
                {s.stats.totalChats} chats · {s.stats.totalMessages} msgs
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link
                  href={`/admin/strains/${s.slug}`}
                  style={{
                    fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#f0a830',
                    textDecoration: 'none', padding: '6px 14px',
                    background: 'rgba(240,168,48,0.08)', borderRadius: '4px',
                    border: '0.5px solid rgba(240,168,48,0.2)',
                  }}
                >
                  Edit →
                </Link>
                <DeleteStrainButton slug={s.slug} name={s.name} />
              </div>
            </div>
          </div>
        ))}
        {strains.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066',
            background: '#0d1014', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '6px' }}>
            No strains seeded yet — run: pnpm tsx scripts/seed-strains.ts
          </div>
        )}
      </div>

      {/* ── Desktop table (hidden below md) ── */}
      <div className="hidden md:block" style={{ background: '#0d1014', border: '0.5px solid rgba(240,168,48,0.12)', borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(240,168,48,0.1)' }}>
              {['Strain', 'Type', 'Archetype', 'Chats', 'Messages', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '1px', color: '#4a6066', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strains.map(s => (
              <tr key={s.slug} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '12px', color: '#e8f0ef' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#4a6066', marginLeft: '8px' }}>{s.slug}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', color: typeColor(s.type) }}>
                    {s.type}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#4a6066' }}>
                  {s.personality.archetype}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }}>
                  {s.stats.totalChats.toLocaleString()}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#e8f0ef' }}>
                  {s.stats.totalMessages.toLocaleString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '3px',
                    background: s.isActive ? 'rgba(0,212,200,0.1)' : 'rgba(74,96,102,0.1)',
                    color: s.isActive ? '#00d4c8' : '#4a6066',
                    border: `0.5px solid ${s.isActive ? 'rgba(0,212,200,0.2)' : 'rgba(74,96,102,0.2)'}`,
                  }}>
                    {statusLabel(s)}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                    <Link
                      href={`/admin/strains/${s.slug}`}
                      style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#f0a830', textDecoration: 'none' }}
                    >
                      Edit →
                    </Link>
                    <DeleteStrainButton slug={s.slug} name={s.name} />
                  </span>
                </td>
              </tr>
            ))}
            {strains.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a6066' }}>
                  No strains seeded yet — run: pnpm tsx scripts/seed-strains.ts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
