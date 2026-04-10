import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: 'rgba(240,168,48,0.12)',  text: '#f0a830', border: 'rgba(240,168,48,0.25)' },
  paid:      { bg: 'rgba(0,212,200,0.12)',   text: '#00d4c8', border: 'rgba(0,212,200,0.25)' },
  shipped:   { bg: 'rgba(136,68,204,0.12)',  text: '#8844cc', border: 'rgba(136,68,204,0.25)' },
  delivered: { bg: 'rgba(74,255,128,0.12)',  text: '#4aff80', border: 'rgba(74,255,128,0.25)' },
  admin:     { bg: 'rgba(240,168,48,0.12)',  text: '#f0a830', border: 'rgba(240,168,48,0.25)' },
  user:      { bg: 'rgba(74,96,102,0.2)',    text: '#4a6066', border: 'rgba(74,96,102,0.3)' },
  seed:      { bg: 'rgba(0,212,200,0.1)',    text: '#00d4c8', border: 'rgba(0,212,200,0.2)' },
  clone:     { bg: 'rgba(136,68,204,0.1)',   text: '#8844cc', border: 'rgba(136,68,204,0.2)' },
  flower:    { bg: 'rgba(204,0,170,0.1)',    text: '#cc00aa', border: 'rgba(204,0,170,0.2)' },
  merch:     { bg: 'rgba(240,168,48,0.1)',   text: '#f0a830', border: 'rgba(240,168,48,0.2)' },
  low:       { bg: 'rgba(0,212,200,0.1)',    text: '#00d4c8', border: 'rgba(0,212,200,0.2)' },
  medium:    { bg: 'rgba(240,168,48,0.1)',   text: '#f0a830', border: 'rgba(240,168,48,0.2)' },
  high:      { bg: 'rgba(204,0,170,0.1)',    text: '#cc00aa', border: 'rgba(204,0,170,0.2)' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.user
  return (
    <Badge
      className="text-xs capitalize"
      style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}` }}
    >
      {status}
    </Badge>
  )
}
