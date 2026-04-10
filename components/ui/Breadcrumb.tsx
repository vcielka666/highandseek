import Link from 'next/link'

interface CrumbItem {
  label: string
  href?: string // undefined = current page (not clickable)
}

interface BreadcrumbProps {
  items: CrumbItem[]
  color?: string // accent color for current page label, defaults to teal
}

function truncate(label: string, max = 15) {
  return label.length > max ? label.slice(0, max).trimEnd() + '…' : label
}

export default function Breadcrumb({ items, color = '#00d4c8' }: BreadcrumbProps) {
  const backHref = [...items].reverse().find(i => i.href)?.href

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '4px',
            border: '0.5px solid rgba(0,212,200,0.15)',
            background: 'rgba(0,212,200,0.05)',
            color: '#4a6066', textDecoration: 'none', flexShrink: 0,
            transition: 'all 0.15s', marginRight: '2px',
          }}
          className="hover:border-[rgba(0,212,200,0.4)] hover:text-[#00d4c8]"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {item.href ? (
            <Link
              href={item.href}
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color: '#4a6066', textDecoration: 'none' }}
              className="hover:text-[#00d4c8] transition-colors"
            >
              {truncate(item.label)}
            </Link>
          ) : (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '1px', color }}>
              {truncate(item.label)}
            </span>
          )}
          {i < items.length - 1 && (
            <span style={{ color: '#4a6066', fontSize: '10px' }}>›</span>
          )}
        </span>
      ))}
    </div>
  )
}
