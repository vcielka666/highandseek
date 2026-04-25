'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  { value: 'flower', label: 'FLOWERS',  icon: '/icons/flowersIcon.png',  iconSize: 40 },
  { value: 'seed',   label: 'GENETICS', icon: '/icons/geneticsIcon.png', iconSize: 40 },
  { value: 'merch',  label: 'MERCH',    icon: '/icons/merchIcon.png',    iconSize: 26 },
]

const TYPES = [
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'hybrid', label: 'Hybrid' },
]

const SEED_TYPES = [
  { value: 'feminized', label: 'Feminized' },
  { value: 'autoflower', label: 'Autoflower' },
  { value: 'regular', label: 'Regular' },
]

const ORIGINS = [
  { value: 'usa', label: '🇺🇸 USA Genetics' },
  { value: 'european', label: '🌍 European' },
  { value: 'landrace', label: '🌿 Landrace' },
]

const CLIMATES = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
]

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const YIELDS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const CBD_LEVELS = [
  { value: 'high_cbd', label: 'High CBD' },
  { value: 'high_thc', label: 'High THC' },
  { value: 'balanced', label: 'Balanced' },
]

export default function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    type: false, seedType: false, origin: false, climate: false, difficulty: false, yield: false, cbdLevel: false, price: false,
  })
  const [flowerUnlocked, setFlowerUnlocked] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/api/mystery/status')
      .then(r => r.json())
      .then((d: { flowerUnlocked: boolean }) => setFlowerUnlocked(d.flowerUnlocked))
      .catch(() => setFlowerUnlocked(false))
  }, [])

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const category = searchParams.get('category') ?? 'flower'
  const types    = searchParams.getAll('type')
  const seedTypes = searchParams.getAll('seedType')
  const origins   = searchParams.getAll('origin')
  const climates  = searchParams.getAll('climate')
  const difficulties = searchParams.getAll('difficulty')
  const yields    = searchParams.getAll('yield')
  const cbdLevels = searchParams.getAll('cbdLevel')
  const priceMax  = Number(searchParams.get('priceMax') ?? 2500)
  // prices are stored in CZK — filter compares directly

  const isFlower = category === 'flower'
  const isSeed   = category === 'seed'

  const update = useCallback((updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    // Remove page when filters change
    params.delete('page')

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key)
      if (value === null) continue
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      } else if (value && value !== 'all') {
        params.set(key, value)
      }
    }
    router.push(`/shop?${params.toString()}`)
  }, [searchParams, router])

  const toggleMulti = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update({ [key]: next.length ? next : null })
  }

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    flexShrink: 0,
    background: '#050508',
    borderRight: '0.5px solid rgba(0,212,200,0.12)',
    padding: '20px 0 0',
    flexDirection: 'column',
    minHeight: '100%',
  }

  const mobileSidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isOpen ? 0 : '-300px',
    width: '300px',
    height: '100vh',
    zIndex: 200,
    background: '#050508',
    borderRight: '0.5px solid rgba(0,212,200,0.2)',
    padding: '20px 0 0',
    transition: 'left 0.3s ease',
    boxShadow: isOpen ? '4px 0 40px rgba(0,0,0,0.6)' : 'none',
    flexDirection: 'column',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)',
    fontSize: '9px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#4a6066',
    padding: '0 20px',
    marginBottom: '10px',
    marginTop: '20px',
  }

  const dividerStyle: React.CSSProperties = {
    height: '0.5px',
    background: 'rgba(0,212,200,0.07)',
    margin: '16px 0 4px',
  }

  const radioRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderRadius: '0',
  }

  const checkboxRowStyle = radioRowStyle

  function AccordionHeader({ label, sectionKey, alwaysOpen }: { label: string; sectionKey: string; alwaysOpen?: boolean }) {
    const isOpen = alwaysOpen || openSections[sectionKey]
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px 6px',
          cursor: alwaysOpen ? 'default' : 'pointer',
          userSelect: 'none',
        }}
        onClick={() => { if (!alwaysOpen) toggleSection(sectionKey) }}
        className={alwaysOpen ? '' : 'hover:bg-[rgba(0,212,200,0.03)]'}
      >
        <span style={sectionTitleStyle as React.CSSProperties}>{label}</span>
        {!alwaysOpen && (
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}
          >
            <path d="M2 4L5 7L8 4" stroke="#4a6066" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    )
  }

  const FLOWER_FILTERS = [
    { param: 'type',     value: 'indica',   label: 'Indica'        },
    { param: 'type',     value: 'sativa',   label: 'Sativa'        },
    { param: 'type',     value: 'hybrid',   label: 'Hybrid'        },
    { param: 'cbdLevel', value: 'high_thc', label: 'High THC'      },
    { param: 'cbdLevel', value: 'high_cbd', label: 'High CBD'      },
    { param: 'origin',   value: 'usa',      label: '🇺🇸 USA Genetics' },
  ]

  function FlowerFilters({
    types, cbdLevels, origins, onToggleType, onToggleCbd, onToggleOrigin,
  }: {
    types: string[]
    cbdLevels: string[]
    origins: string[]
    onToggleType: (v: string) => void
    onToggleCbd: (v: string) => void
    onToggleOrigin: (v: string) => void
  }) {
    function isChecked(param: string, value: string) {
      if (param === 'type') return types.includes(value)
      if (param === 'cbdLevel') return cbdLevels.includes(value)
      if (param === 'origin') return origins.includes(value)
      return false
    }
    function handleToggle(param: string, value: string) {
      if (param === 'type') onToggleType(value)
      else if (param === 'cbdLevel') onToggleCbd(value)
      else if (param === 'origin') onToggleOrigin(value)
    }
    return (
      <div style={{ padding: '6px 0 4px', borderTop: '0.5px solid rgba(0,212,200,0.07)' }}>
        {FLOWER_FILTERS.map(({ param, value, label }) => {
          const checked = isChecked(param, value)
          return (
            <div
              key={`${param}-${value}`}
              style={{ ...checkboxRowStyle }}
              onClick={() => handleToggle(param, value)}
              className="hover:bg-[rgba(0,212,200,0.05)]"
            >
              <div style={{
                width: '12px', height: '12px', borderRadius: '2px',
                border: `1px solid ${checked ? '#00d4c8' : '#4a6066'}`,
                background: checked ? '#00d4c8' : 'transparent',
                flexShrink: 0, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {checked && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="#050508" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px',
                color: checked ? '#e8f0ef' : '#4a6066',
                transition: 'color 0.15s',
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  function CategoryGroup({
    options, value, onChange,
  }: {
    options: { value: string; label: string; icon: string; iconSize: number }[]
    value: string
    onChange: (v: string) => void
  }) {
    return (
      <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {options.map((opt) => {
          const active = value === opt.value
          const isLocked = opt.value === 'flower' && flowerUnlocked === false
          return (
            <div
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: `0.5px solid ${active ? 'rgba(0,212,200,0.5)' : 'rgba(0,212,200,0.08)'}`,
                background: active ? 'rgba(205, 0, 212, 0.12)' : 'transparent',
                transition: 'all 0.15s',
                overflow: 'hidden',
              }}
              className={active ? '' : 'hover:bg-[rgba(0,212,200,0.05)]'}
            >
              {/* Blurred actual content */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                filter: isLocked ? 'blur(5px)' : 'none',
                opacity: isLocked ? 0.25 : 1,
                transition: 'all 0.15s',
                fontFamily: 'var(--font-cacha)',
                fontSize: '14px',
                letterSpacing: '1.5px',
                color: active ? '#00d4c8' : '#4a6066',
                userSelect: isLocked ? 'none' : 'auto',
              }}>
                <Image
                  src={opt.icon}
                  alt={opt.label}
                  width={opt.iconSize}
                  height={opt.iconSize}
                  style={{ opacity: active ? 1 : 0.4, transition: 'opacity 0.15s', flexShrink: 0 }}
                />
                {opt.label}
              </div>
              {/* Single question mark overlay when locked */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-cacha)',
                  fontSize: '20px',
                  letterSpacing: '2px',
                  color: 'rgba(232,240,239,0.35)',
                }}>
                  ?
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function RadioGroup({
    label, sectionKey, options, value, onChange, alwaysOpen,
  }: {
    label: string
    sectionKey: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
    alwaysOpen?: boolean
  }) {
    const isOpen = alwaysOpen || openSections[sectionKey]
    return (
      <div style={{ borderTop: '0.5px solid rgba(0,212,200,0.07)' }}>
        <AccordionHeader label={label} sectionKey={sectionKey} alwaysOpen={alwaysOpen} />
        {isOpen && options.map((opt) => (
          <div
            key={opt.value}
            style={radioRowStyle}
            onClick={() => onChange(opt.value)}
            className="hover:bg-[rgba(0,212,200,0.05)]"
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              border: `1px solid ${value === opt.value ? '#00d4c8' : '#4a6066'}`,
              background: value === opt.value ? '#00d4c8' : 'transparent',
              flexShrink: 0,
              transition: 'all 0.15s',
            }} />
            <span style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              color: value === opt.value ? '#e8f0ef' : '#4a6066',
              transition: 'color 0.15s',
            }}>
              {opt.label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  function CheckboxGroup({
    label, sectionKey, options, values, onChange,
  }: {
    label: string
    sectionKey: string
    options: { value: string; label: string }[]
    values: string[]
    onChange: (v: string) => void
  }) {
    const isOpen = openSections[sectionKey]
    return (
      <div style={{ borderTop: '0.5px solid rgba(0,212,200,0.07)' }}>
        <AccordionHeader label={label} sectionKey={sectionKey} />
        {isOpen && options.map((opt) => (
          <div
            key={opt.value}
            style={checkboxRowStyle}
            onClick={() => onChange(opt.value)}
            className="hover:bg-[rgba(0,212,200,0.05)]"
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '2px',
              border: `1px solid ${values.includes(opt.value) ? '#00d4c8' : '#4a6066'}`,
              background: values.includes(opt.value) ? '#00d4c8' : 'transparent',
              flexShrink: 0,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {values.includes(opt.value) && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="#050508" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              color: values.includes(opt.value) ? '#e8f0ef' : '#4a6066',
              transition: 'color 0.15s',
            }}>
              {opt.label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const content = (
    <>
      {/* Mobile close button — hidden on desktop */}
      <div style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 12px', borderBottom: '0.5px solid rgba(0,212,200,0.07)' }}
        className="flex lg:hidden">
        <span style={{
          fontFamily: 'var(--font-cacha)',
          fontSize: '14px',
          letterSpacing: '1px',
          background: 'linear-gradient(90deg, #00d4c8 0%, #8844cc 50%, #cc00aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>Category</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6066', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable filter area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Category — always visible, no accordion */}
        <CategoryGroup
          options={CATEGORIES}
          value={category}
          onChange={(v) => update({ category: v, type: null, seedType: null, origin: null, climate: null, difficulty: null, yield: null, cbdLevel: null })}
        />

        {isFlower && (
          <div style={{ position: 'relative' }}>
            <div style={{ filter: flowerUnlocked === false ? 'blur(4px)' : 'none', pointerEvents: flowerUnlocked === false ? 'none' : 'auto', userSelect: flowerUnlocked === false ? 'none' : 'auto', transition: 'filter 0.3s' }}>
              <FlowerFilters
                types={types}
                cbdLevels={cbdLevels}
                origins={origins}
                onToggleType={(v) => toggleMulti('type', v, types)}
                onToggleCbd={(v) => toggleMulti('cbdLevel', v, cbdLevels)}
                onToggleOrigin={(v) => toggleMulti('origin', v, origins)}
              />
            </div>
          </div>
        )}

        {isSeed && (
          <>
            <CheckboxGroup
              label="Type"
              sectionKey="type"
              options={TYPES}
              values={types}
              onChange={(v) => toggleMulti('type', v, types)}
            />
            <CheckboxGroup
              label="Origin"
              sectionKey="origin"
              options={ORIGINS}
              values={origins}
              onChange={(v) => toggleMulti('origin', v, origins)}
            />
            <CheckboxGroup
              label="Seed Type"
              sectionKey="seedType"
              options={SEED_TYPES}
              values={seedTypes}
              onChange={(v) => toggleMulti('seedType', v, seedTypes)}
            />
            <CheckboxGroup
              label="Climate"
              sectionKey="climate"
              options={CLIMATES}
              values={climates}
              onChange={(v) => toggleMulti('climate', v, climates)}
            />
            <CheckboxGroup
              label="Difficulty"
              sectionKey="difficulty"
              options={DIFFICULTIES}
              values={difficulties}
              onChange={(v) => toggleMulti('difficulty', v, difficulties)}
            />
            <CheckboxGroup
              label="Yield"
              sectionKey="yield"
              options={YIELDS}
              values={yields}
              onChange={(v) => toggleMulti('yield', v, yields)}
            />
          </>
        )}

        {/* Price range */}
        <div style={{ borderTop: '0.5px solid rgba(0,212,200,0.07)' }}>
          <AccordionHeader label="Price Range" sectionKey="price" />
          {openSections.price && (
            <div style={{ padding: '4px 20px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a6066' }}>0 Kč</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#00d4c8' }}>{priceMax.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <input
                type="range"
                min={0}
                max={2500}
                step={100}
                value={priceMax}
                onChange={(e) => update({ priceMax: e.target.value })}
                style={{ width: '100%', accentColor: '#00d4c8', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* Reset */}
        <div style={{ padding: '16px 12px 20px' }}>
          <button
            onClick={() => router.push(`/shop?category=${category}`)}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '0.5px solid rgba(0,212,200,0.2)',
              borderRadius: '4px',
              color: '#4a6066',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="hover:border-[#00d4c8] hover:text-[#00d4c8]"
          >
            Reset filters
          </button>
        </div>
      </div>

    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={sidebarStyle} className="hidden lg:flex">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar — always in DOM, slides in/out */}
      <aside style={mobileSidebarStyle} className="flex lg:hidden">
        {content}
      </aside>
    </>
  )
}
