interface AdminPageHeaderProps {
  title:       string
  description?: string
  actions?:    React.ReactNode
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-orbitron)', color: '#f0a830' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: '#4a6066', fontFamily: 'var(--font-dm-sans)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
