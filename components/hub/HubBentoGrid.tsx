'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/stores/languageStore'
import GrowCard,        { type GrowCardData, type StrainPickerItem } from './cards/GrowCard'
import StrainCard,      { type StrainPreview }   from './cards/StrainCard'
import ForumCard                                  from './cards/ForumCard'
import XPCard,          { type XPEventData }     from './cards/XPCard'
import AcademyCard                                from './cards/AcademyCard'
import MarketplaceCard, { type ListingData }     from './cards/MarketplaceCard'
import LeaderboardCard, { type LeaderUser }      from './cards/LeaderboardCard'
import SeekersCard                                from './cards/SeekersCard'
import FeedCard,        { type FeedPreviewData } from './cards/FeedCard'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BentoData {
  userId:         string
  username:       string
  userAvatar:     string
  xp:             number
  level:          number
  credits:        number
  growsCompleted: number
  cloneBank:      Array<{ strainSlug: string; strainName: string; strainType: string; floweringTime: number; takenAt: string }>
  percent:        number
  levelName:      string
  nextLevelName:  string | null
  nextLevelXP:    number | null
  activeGrow:     GrowCardData | null
  strains:        StrainPreview[]
  strainCount:    number
  listings:       ListingData[]
  listingCount:   number
  topUsers:       LeaderUser[]
  xpEvents:               XPEventData[]
  feedPreview:            FeedPreviewData | null
  seekersTreasuresClaimed: number
}

// ── Card config ───────────────────────────────────────────────────────────────

type CardId = 'grow' | 'strain' | 'forum' | 'xp' | 'academy' | 'marketplace' | 'leaderboard' | 'seekers' | 'feed'

interface CardMeta {
  id:         CardId
  accent:     string
  glowRgb:    string
  colSpan:    number   // desktop
  rowSpan:    number
  mobileSpan: number   // mobile col-span
}

const CARDS: CardMeta[] = [
  { id: 'feed',        accent: '#00d4c8', glowRgb: '0,212,200',   colSpan: 2, rowSpan: 2, mobileSpan: 2 },
  { id: 'grow',        accent: '#00d4c8', glowRgb: '0,212,200',   colSpan: 2, rowSpan: 2, mobileSpan: 2 },
  { id: 'strain',      accent: '#cc00aa', glowRgb: '204,0,170',   colSpan: 2, rowSpan: 1, mobileSpan: 2 },
  { id: 'forum',       accent: '#8844cc', glowRgb: '136,68,204',  colSpan: 2, rowSpan: 1, mobileSpan: 2 },
  { id: 'xp',          accent: '#f0a830', glowRgb: '240,168,48',  colSpan: 1, rowSpan: 1, mobileSpan: 1 },
  { id: 'academy',     accent: '#00d4c8', glowRgb: '0,212,200',   colSpan: 1, rowSpan: 1, mobileSpan: 1 },
  { id: 'marketplace', accent: '#f0a830', glowRgb: '240,168,48',  colSpan: 1, rowSpan: 1, mobileSpan: 1 },
  { id: 'leaderboard', accent: '#cc00aa', glowRgb: '204,0,170',   colSpan: 1, rowSpan: 1, mobileSpan: 1 },
  { id: 'seekers',     accent: '#f0a830', glowRgb: '240,168,48',  colSpan: 2, rowSpan: 1, mobileSpan: 2 },
]

// ── Preview renderer ──────────────────────────────────────────────────────────

function CardPreview({ id, data, t, growAcknowledged }: { id: CardId; data: BentoData; t: ReturnType<typeof useLanguage>['t']; growAcknowledged: boolean }) {
  const d = t.hubDash
  const b = t.hubBento

  switch (id) {
    case 'feed':
      return <FeedCard feedPreview={data.feedPreview} currentUser={{ id: data.userId, username: data.username, avatar: data.userAvatar }} labels={t.feed} />
    case 'grow':
      return <GrowCard grow={growAcknowledged ? null : data.activeGrow} labels={{ growSim: d.growSim, noActiveGrow: d.noActiveGrow, startGrow: d.startGrow, viewGrow: d.viewGrow, openFull: b.openFull, day: b.day, health: b.health, yield: b.yield, originLabel: b.growOriginLabel, story1: b.growStory1, story2: b.growStory2, story3: b.growStory3, noActiveDesc: b.growNoActiveDesc, startSetup: b.growStartSetup, availableStrains: b.growAvailableStrains, indica: b.growIndica, sativa: b.growSativa, hybrid: b.growHybrid, growsCompletedLabel: t.grow.growsCompleted, xpFromGrowsLabel: t.grow.xpFromGrows, creditsEarnedLabel: t.grow.creditsEarned, realtimeTitle: t.grow.realtimeTitle, realtimeDesc: t.grow.realtimeDesc, realtimeFree: t.grow.realtimeFree, addJournal: t.grow.addJournal, cloneBankTitle: t.grow.cloneBankTitle, cloneFreeLabel: t.grow.cloneFreeLabel, cloneSkipVegLabel: t.grow.cloneSkipVegLabel, growFailedTitle: t.growUI.growFailedTitle, growAbandonedTitle: t.growUI.growAbandonedTitle, growFailedSub: t.growUI.growFailedSub, growAbandonedSub: t.growUI.growAbandonedSub, growEndDayLabel: t.growUI.growEndDayLabel, growEndDaySuffix: t.growUI.growEndDaySuffix, growEndXpLabel: t.growUI.growEndXpLabel, growEndHealthLabel: t.growUI.growEndHealthLabel, growEndWhyTitle: t.growUI.growEndWhyTitle, growEndNoWarnings: t.growUI.growEndNoWarnings, growEndStartNew: t.growUI.growEndStartNew, growEndOkBtn: t.growUI.growEndOkBtn, growHistoryTitle: t.growUI.growHistoryTitle, growHistoryEmpty: t.growUI.growHistoryEmpty, growHistoryBack: t.growUI.growHistoryBack, growHistoryStatus: t.growUI.growHistoryStatus, growHistoryDay: t.growUI.growHistoryDay, growHistoryYield: t.growUI.growHistoryYield, growHistoryXp: t.growUI.growHistoryXp, startNewGrow: t.grow.startNewGrow, creditsPerGrow: t.grow.creditsPerGrow }} />
    case 'strain':
      return <StrainCard strains={data.strains} totalCount={data.strainCount} labels={{ title: b.strainTitle, explore: b.strainExplore, strainCount: b.strainCount }} />
    case 'forum':
      return <ForumCard labels={{ title: d.forumBridge, placeholder: d.forumPlaceholder, openForum: b.openForum, sources: [...b.forumSources], suggestions: [...b.forumSuggestions] }} />
    case 'xp':
      return <XPCard xp={data.xp} level={data.level} percent={data.percent} name={data.levelName} nextName={data.nextLevelName} nextXP={data.nextLevelXP} events={data.xpEvents} labels={{ title: b.xpTitle, level: b.levelLabel, toNext: b.toNext, recentXP: d.recentXP, noXP: d.noXP }} />
    case 'academy':
      return <AcademyCard labels={{ title: b.academyTitle, subtitle: b.academySubtitle, open: b.academyOpen, topics: [...b.academyTopics].map(t => ({ ...t })) }} />
    case 'marketplace':
      return <MarketplaceCard listings={data.listings} totalActive={data.listingCount} labels={{ title: b.marketTitle, activeListings: b.activeListings, browse: b.marketBrowse, post: b.marketPost, noListings: b.noListings, free: b.free }} />
    case 'leaderboard':
      return <LeaderboardCard users={data.topUsers} currentId={data.userId} labels={{ title: d.leaderboardTitle, fullLink: d.fullLeaderboard, you: b.you, lv: b.lv }} />
    case 'seekers':
      return <SeekersCard credits={data.credits} treasuresClaimed={data.seekersTreasuresClaimed} labels={{ title: d.seekers, desc: d.seekersConnect, openApp: d.openSeekers, creditsLabel: d.seekersCreditsLabel, treasuresLabel: d.seekersTreasuresLabel }} />
  }
}

function CardExpanded({ id, data, t, onGrowAcknowledge, growAcknowledged }: { id: CardId; data: BentoData; t: ReturnType<typeof useLanguage>['t']; onGrowAcknowledge: () => void; growAcknowledged: boolean }) {
  const d = t.hubDash
  const b = t.hubBento

  switch (id) {
    case 'feed':
      return <FeedCard feedPreview={data.feedPreview} currentUser={{ id: data.userId, username: data.username, avatar: data.userAvatar }} expanded labels={t.feed} />
    case 'grow': {
      const growStrains: StrainPickerItem[] = data.strains.map(s => ({ slug: s.slug, name: s.name, type: s.type, floweringTime: s.floweringTime, difficulty: s.difficulty }))
      return <GrowCard grow={growAcknowledged ? null : data.activeGrow} strains={growStrains} expanded growsCompleted={data.growsCompleted} userXP={data.xp} userCredits={data.credits} cloneBank={data.cloneBank} onAcknowledge={onGrowAcknowledge} labels={{ growSim: d.growSim, noActiveGrow: d.noActiveGrow, startGrow: d.startGrow, viewGrow: d.viewGrow, openFull: b.openFull, day: b.day, health: b.health, yield: b.yield, originLabel: b.growOriginLabel, story1: b.growStory1, story2: b.growStory2, story3: b.growStory3, noActiveDesc: b.growNoActiveDesc, startSetup: b.growStartSetup, availableStrains: b.growAvailableStrains, indica: b.growIndica, sativa: b.growSativa, hybrid: b.growHybrid, growsCompletedLabel: t.grow.growsCompleted, xpFromGrowsLabel: t.grow.xpFromGrows, creditsEarnedLabel: t.grow.creditsEarned, realtimeTitle: t.grow.realtimeTitle, realtimeDesc: t.grow.realtimeDesc, realtimeFree: t.grow.realtimeFree, addJournal: t.grow.addJournal, cloneBankTitle: t.grow.cloneBankTitle, cloneFreeLabel: t.grow.cloneFreeLabel, cloneSkipVegLabel: t.grow.cloneSkipVegLabel, growFailedTitle: t.growUI.growFailedTitle, growAbandonedTitle: t.growUI.growAbandonedTitle, growFailedSub: t.growUI.growFailedSub, growAbandonedSub: t.growUI.growAbandonedSub, growEndDayLabel: t.growUI.growEndDayLabel, growEndDaySuffix: t.growUI.growEndDaySuffix, growEndXpLabel: t.growUI.growEndXpLabel, growEndHealthLabel: t.growUI.growEndHealthLabel, growEndWhyTitle: t.growUI.growEndWhyTitle, growEndNoWarnings: t.growUI.growEndNoWarnings, growEndStartNew: t.growUI.growEndStartNew, growEndOkBtn: t.growUI.growEndOkBtn, growHistoryTitle: t.growUI.growHistoryTitle, growHistoryEmpty: t.growUI.growHistoryEmpty, growHistoryBack: t.growUI.growHistoryBack, growHistoryStatus: t.growUI.growHistoryStatus, growHistoryDay: t.growUI.growHistoryDay, growHistoryYield: t.growUI.growHistoryYield, growHistoryXp: t.growUI.growHistoryXp, startNewGrow: t.grow.startNewGrow, creditsPerGrow: t.grow.creditsPerGrow }} />
    }
    case 'strain':
      return <StrainCard strains={data.strains} totalCount={data.strainCount} expanded labels={{ title: b.strainTitle, explore: b.strainExplore, strainCount: b.strainCount }} />
    case 'forum':
      return <ForumCard expanded labels={{ title: d.forumBridge, placeholder: d.forumPlaceholder, openForum: b.openForum, sources: [...b.forumSources], suggestions: [...b.forumSuggestions] }} />
    case 'xp':
      return <XPCard xp={data.xp} level={data.level} percent={data.percent} name={data.levelName} nextName={data.nextLevelName} nextXP={data.nextLevelXP} events={data.xpEvents} expanded labels={{ title: b.xpTitle, level: b.levelLabel, toNext: b.toNext, recentXP: d.recentXP, noXP: d.noXP }} />
    case 'academy':
      return <AcademyCard expanded labels={{ title: b.academyTitle, subtitle: b.academySubtitle, open: b.academyOpen, topics: [...b.academyTopics].map(t => ({ ...t })) }} />
    case 'marketplace':
      return <MarketplaceCard listings={data.listings} totalActive={data.listingCount} expanded labels={{ title: b.marketTitle, activeListings: b.activeListings, browse: b.marketBrowse, post: b.marketPost, noListings: b.noListings, free: b.free }} />
    case 'leaderboard':
      return <LeaderboardCard users={data.topUsers} currentId={data.userId} expanded labels={{ title: d.leaderboardTitle, fullLink: d.fullLeaderboard, you: b.you, lv: b.lv }} />
    case 'seekers':
      return <SeekersCard expanded credits={data.credits} treasuresClaimed={data.seekersTreasuresClaimed} labels={{ title: d.seekers, desc: d.seekersConnect, openApp: d.openSeekers, creditsLabel: d.seekersCreditsLabel, treasuresLabel: d.seekersTreasuresLabel }} />
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HubBentoGrid({ data }: { data: BentoData }) {
  const [selected, setSelected] = useState<CardId | null>(null)
  const [growAcknowledged, setGrowAcknowledged] = useState(false)
  const { t } = useLanguage()

  const [seekersConfirm, setSeekersConfirm] = useState(false)
  const [seekersLoading, setSeekersLoading] = useState(false)
  const [seekersTransition, setSeekersTransition] = useState(false)
  const [seekersTargetUrl, setSeekersTargetUrl] = useState('')

  async function handleSeekersEnter() {
    setSeekersLoading(true)
    try {
      const res = await fetch('/api/auth/seekers-token', { method: 'POST' })
      if (!res.ok) throw new Error()
      const { token } = await res.json()
      const base = process.env.NEXT_PUBLIC_SEEKERS_URL || 'http://localhost:3000'
      setSeekersTargetUrl(`${base}/cross-app?token=${encodeURIComponent(token)}`)
      setSeekersConfirm(false)
      setSeekersTransition(true)
    } catch {
      setSeekersLoading(false)
    }
  }

  function handleGrowAcknowledge() {
    setGrowAcknowledged(true)
    // overlay stays open so user can read history — they close it themselves
  }

  return (
    <>
      {/* Grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap:                 '14px',
        padding:             '20px',
      }}
        className="bento-grid"
      >
        <style>{`
          @media (max-width: 768px) {
            .bento-grid { grid-template-columns: repeat(2, 1fr) !important; padding: 12px !important; gap: 10px !important; }
            .hub-home-card { display: flex !important; }
          }
        `}</style>

        {CARDS.map((card, index) => (
          <motion.div
            key={card.id}
            layoutId={`card-${card.id}`}
            onClick={() => {
              if (card.id === 'seekers') { setSeekersConfirm(true); return }
              setSelected(card.id)
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: selected === card.id ? 0 : 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            style={{
              gridColumn:    `span ${card.colSpan}`,
              gridRow:       `span ${card.rowSpan}`,
              borderRadius:  '20px',
              background:    'rgba(255,255,255,0.03)',
              border:        `1px solid rgba(${card.glowRgb},0.15)`,
              backdropFilter: 'blur(10px)',
              overflow:      'hidden',
              cursor:        'pointer',
              minHeight:     card.rowSpan > 1 ? '280px' : '140px',
              '--glow-rgb':  card.glowRgb,
              animation:     `bento-border-glow 4s ease-in-out ${index * 0.5}s infinite`,
            } as React.CSSProperties}
          >
            <CardPreview id={card.id} data={data} t={t} growAcknowledged={growAcknowledged} />
          </motion.div>
        ))}

        {/* Mobile-only: landing page card (last card, full width) */}
        <motion.a
          href="/"
          className="hub-home-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: CARDS.length * 0.06, duration: 0.4, ease: 'easeOut' }}
          whileTap={{ scale: 0.97 }}
          style={{
            display:       'none',
            gridColumn:    'span 2',
            borderRadius:  '20px',
            background:    'rgba(0,212,200,0.04)',
            border:        '0.5px solid rgba(0,212,200,0.18)',
            backdropFilter: 'blur(10px)',
            overflow:      'hidden',
            cursor:        'pointer',
            minHeight:     '80px',
            textDecoration: 'none',
            alignItems:    'center',
            justifyContent: 'space-between',
            padding:       '0 24px',
            animation:     `bento-border-glow 4s ease-in-out ${CARDS.length * 0.5}s infinite`,
            '--glow-rgb':  '0,212,200',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,212,200,0.4)', marginBottom: '2px' }}>
              ← {t.hubNavbar.backToHome}
            </div>
            <div style={{ fontFamily: 'var(--font-cacha)', fontSize: '22px', letterSpacing: '2px', color: '#e8f0ef' }}>
              HIGH<span style={{ color: '#00d4c8' }}>&amp;</span>SEEK
            </div>
          </div>
        </motion.a>
      </div>

      {/* Seekers confirmation dialog */}
      <AnimatePresence>
        {seekersConfirm && (
          <>
            <motion.div
              key="seekers-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { if (!seekersLoading) setSeekersConfirm(false) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 60, backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              key="seekers-dialog"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 61, width: 'min(320px, calc(100vw - 32px))',
                background: '#08080d', border: '0.5px solid rgba(240,168,48,0.3)', borderRadius: 16,
                padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                boxShadow: '0 0 60px rgba(240,168,48,0.1)',
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(240,168,48,0.3)', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, letterSpacing: '1.5px', color: '#f0a830', marginBottom: 8 }}>
                  {t.hubDash.seekersEnterTitle}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: '#4a6066', lineHeight: 1.6 }}>
                  {t.hubDash.seekersEnterDesc}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={() => setSeekersConfirm(false)}
                  disabled={seekersLoading}
                  style={{
                    flex: 1, height: 40, borderRadius: 6, cursor: 'pointer', border: '0.5px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)', color: '#4a6066',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
                  }}
                >
                  {t.hubDash.seekersEnterCancel}
                </button>
                <button
                  onClick={handleSeekersEnter}
                  disabled={seekersLoading}
                  style={{
                    flex: 1, height: 40, borderRadius: 6, cursor: seekersLoading ? 'wait' : 'pointer',
                    border: '0.5px solid rgba(240,168,48,0.4)',
                    background: seekersLoading ? 'rgba(240,168,48,0.06)' : 'rgba(240,168,48,0.12)',
                    color: '#f0a830',
                    fontFamily: 'var(--font-orbitron)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
                  }}
                >
                  {seekersLoading ? '...' : t.hubDash.seekersEnterConfirm}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Seekers portal transition overlay */}
      <AnimatePresence>
        {seekersTransition && (
          <motion.div
            key="seekers-transition"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => { window.location.href = seekersTargetUrl }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'linear-gradient(135deg, #06060a 0%, #0d0810 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            }}
          >
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(240,168,48,0.4)', boxShadow: '0 0 40px rgba(240,168,48,0.15)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/seekers/icon-512x512.png" alt="Seekers" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)', transformOrigin: 'center' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(240,168,48,0.7)' }}>
              {t.hubDash.seekersEnterLoading}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded overlay */}
      <AnimatePresence>
        {selected && (() => {
          const card = CARDS.find(c => c.id === selected)!
          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelected(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40, backdropFilter: 'blur(4px)' }}
              />

              {/* Expanded card */}
              <motion.div
                key="expanded"
                layoutId={`card-${selected}`}
                style={{
                  position:   'fixed',
                  inset:      '16px',
                  zIndex:     50,
                  borderRadius: '24px',
                  background: '#0d0d12',
                  border:     `1px solid rgba(${card.glowRgb},0.25)`,
                  overflow:   'hidden',
                  display:    'flex',
                  flexDirection: 'column',
                  boxShadow:  `0 0 60px rgba(${card.glowRgb},0.12)`,
                }}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelected(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', color: '#e8f0ef', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-mono)' }}
                >
                  ✕
                </button>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <CardExpanded id={selected} data={data} t={t} onGrowAcknowledge={handleGrowAcknowledge} growAcknowledged={growAcknowledged} />
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </>
  )
}
