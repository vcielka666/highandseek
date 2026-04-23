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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BentoData {
  userId:         string
  username:       string
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
  xpEvents:       XPEventData[]
}

// ── Card config ───────────────────────────────────────────────────────────────

type CardId = 'grow' | 'strain' | 'forum' | 'xp' | 'academy' | 'marketplace' | 'leaderboard' | 'seekers'

interface CardMeta {
  id:         CardId
  accent:     string
  glowRgb:    string
  colSpan:    number   // desktop
  rowSpan:    number
  mobileSpan: number   // mobile col-span
}

const CARDS: CardMeta[] = [
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
    case 'grow':
      return <GrowCard grow={growAcknowledged ? null : data.activeGrow} labels={{ growSim: d.growSim, noActiveGrow: d.noActiveGrow, startGrow: d.startGrow, viewGrow: d.viewGrow, openFull: b.openFull, day: b.day, health: b.health, yield: b.yield, originLabel: b.growOriginLabel, story1: b.growStory1, story2: b.growStory2, story3: b.growStory3, noActiveDesc: b.growNoActiveDesc, startSetup: b.growStartSetup, availableStrains: b.growAvailableStrains, indica: b.growIndica, sativa: b.growSativa, hybrid: b.growHybrid, growsCompletedLabel: t.grow.growsCompleted, xpFromGrowsLabel: t.grow.xpFromGrows, creditsEarnedLabel: t.grow.creditsEarned, realtimeTitle: t.grow.realtimeTitle, realtimeDesc: t.grow.realtimeDesc, realtimeFree: t.grow.realtimeFree, addJournal: t.grow.addJournal, cloneBankTitle: t.grow.cloneBankTitle, cloneFreeLabel: t.grow.cloneFreeLabel, cloneSkipVegLabel: t.grow.cloneSkipVegLabel, growFailedTitle: t.growUI.growFailedTitle, growAbandonedTitle: t.growUI.growAbandonedTitle, growFailedSub: t.growUI.growFailedSub, growAbandonedSub: t.growUI.growAbandonedSub, growEndDayLabel: t.growUI.growEndDayLabel, growEndDaySuffix: t.growUI.growEndDaySuffix, growEndXpLabel: t.growUI.growEndXpLabel, growEndHealthLabel: t.growUI.growEndHealthLabel, growEndWhyTitle: t.growUI.growEndWhyTitle, growEndNoWarnings: t.growUI.growEndNoWarnings, growEndStartNew: t.growUI.growEndStartNew, growEndOkBtn: t.growUI.growEndOkBtn, growHistoryTitle: t.growUI.growHistoryTitle, growHistoryEmpty: t.growUI.growHistoryEmpty, growHistoryBack: t.growUI.growHistoryBack, growHistoryStatus: t.growUI.growHistoryStatus, growHistoryDay: t.growUI.growHistoryDay, growHistoryYield: t.growUI.growHistoryYield, growHistoryXp: t.growUI.growHistoryXp }} />
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
      return <SeekersCard labels={{ title: d.seekers, desc: d.seekersConnect, comingSoon: b.comingSoon, openApp: d.openSeekers }} />
  }
}

function CardExpanded({ id, data, t, onGrowAcknowledge }: { id: CardId; data: BentoData; t: ReturnType<typeof useLanguage>['t']; onGrowAcknowledge: () => void }) {
  const d = t.hubDash
  const b = t.hubBento

  switch (id) {
    case 'grow': {
      const growStrains: StrainPickerItem[] = data.strains.map(s => ({ slug: s.slug, name: s.name, type: s.type, floweringTime: s.floweringTime, difficulty: s.difficulty }))
      return <GrowCard grow={data.activeGrow} strains={growStrains} expanded growsCompleted={data.growsCompleted} userXP={data.xp} userCredits={data.credits} cloneBank={data.cloneBank} onAcknowledge={onGrowAcknowledge} labels={{ growSim: d.growSim, noActiveGrow: d.noActiveGrow, startGrow: d.startGrow, viewGrow: d.viewGrow, openFull: b.openFull, day: b.day, health: b.health, yield: b.yield, originLabel: b.growOriginLabel, story1: b.growStory1, story2: b.growStory2, story3: b.growStory3, noActiveDesc: b.growNoActiveDesc, startSetup: b.growStartSetup, availableStrains: b.growAvailableStrains, indica: b.growIndica, sativa: b.growSativa, hybrid: b.growHybrid, growsCompletedLabel: t.grow.growsCompleted, xpFromGrowsLabel: t.grow.xpFromGrows, creditsEarnedLabel: t.grow.creditsEarned, realtimeTitle: t.grow.realtimeTitle, realtimeDesc: t.grow.realtimeDesc, realtimeFree: t.grow.realtimeFree, addJournal: t.grow.addJournal, cloneBankTitle: t.grow.cloneBankTitle, cloneFreeLabel: t.grow.cloneFreeLabel, cloneSkipVegLabel: t.grow.cloneSkipVegLabel, growFailedTitle: t.growUI.growFailedTitle, growAbandonedTitle: t.growUI.growAbandonedTitle, growFailedSub: t.growUI.growFailedSub, growAbandonedSub: t.growUI.growAbandonedSub, growEndDayLabel: t.growUI.growEndDayLabel, growEndDaySuffix: t.growUI.growEndDaySuffix, growEndXpLabel: t.growUI.growEndXpLabel, growEndHealthLabel: t.growUI.growEndHealthLabel, growEndWhyTitle: t.growUI.growEndWhyTitle, growEndNoWarnings: t.growUI.growEndNoWarnings, growEndStartNew: t.growUI.growEndStartNew, growEndOkBtn: t.growUI.growEndOkBtn, growHistoryTitle: t.growUI.growHistoryTitle, growHistoryEmpty: t.growUI.growHistoryEmpty, growHistoryBack: t.growUI.growHistoryBack, growHistoryStatus: t.growUI.growHistoryStatus, growHistoryDay: t.growUI.growHistoryDay, growHistoryYield: t.growUI.growHistoryYield, growHistoryXp: t.growUI.growHistoryXp }} />
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
      return <SeekersCard expanded labels={{ title: d.seekers, desc: d.seekersConnect, comingSoon: b.comingSoon, openApp: d.openSeekers }} />
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HubBentoGrid({ data }: { data: BentoData }) {
  const [selected, setSelected] = useState<CardId | null>(null)
  const [growAcknowledged, setGrowAcknowledged] = useState(false)
  const { t } = useLanguage()

  function handleGrowAcknowledge() {
    setGrowAcknowledged(true)
    setSelected(null)
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
          }
        `}</style>

        {CARDS.map((card, index) => (
          <motion.div
            key={card.id}
            layoutId={`card-${card.id}`}
            onClick={() => setSelected(card.id)}
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
      </div>

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
                  <CardExpanded id={selected} data={data} t={t} onGrowAcknowledge={handleGrowAcknowledge} />
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </>
  )
}
