export type Locale = 'en' | 'cs'

export const translations = {
  en: {
    nav: {
      login: 'Login',
      signup: 'Sign up',
    },
    hero: {
      eyebrow: 'Cannabis · Community · Hunt · 18+',
      cta1Label: '◈ Collection',
      cta1Sub: 'Curated strains & clones',
      cta2Label: '⚡ Hub',
      cta2Sub: 'Strain avatars · XP · Hunt · Forum',
      seekers: '◈ Powered by Seekers →',
    },
    shop: {
      pillarNum: 'Pillar 01 · E-commerce',
      title: 'H&S Shop',
      desc: 'Curated CBD strains and clones. Quality over quantity — every item verified, genetically pure.',
      tag: '✓ Guest checkout',
      features: ['Premium seeds', 'Selected clones', 'CBD flowers', 'Strain portfolio', 'Verified genetics', 'Crypto · Stripe'],
      cta: 'Open shop →',
    },
    hub: {
      pillarNum: 'Pillar 02 · Community',
      title: 'H&S Hub',
      desc: 'Strain avatars with AI personality, XP system, Seekers hunt events, community and forum for real enthusiasts.',
      tag: '⚡ Registration required',
      features: ['AI strain chat', 'Seekers hunt', 'XP & levels', 'Forum', 'Grow Academy', 'Profiles & badges'],
      cta: 'Enter Hub →',
    },
    forum: {
      tag: 'AI Forum Bridge',
      title1: 'All forums.',
      title2: 'One answer.',
      desc: 'AI bot indexes ICMag, Rollitup, Reddit and more. Ask a question — get a consolidated answer with links to original threads.',
      query: 'query: "fox farm vs living soil no-till"',
      results: [
        {
          source: 'ICMag · 847 replies',
          text: 'Living soil works better in a no-till setup — microbial activity replaces most nutrients after the 2nd cycle...',
        },
        {
          source: 'r/microgrowery · 1.2k upvotes',
          text: 'Fox Farm easier for beginners, but living soil better for organic terpene profile in the final...',
        },
        {
          source: 'Rollitup · Expert thread',
          text: 'Fox Farm → living soil transition in the first cycle is a popular strategy among experienced growers...',
        },
      ],
    },
    footer: '© 2025 · CBD only · 18+ · Powered by Seekers',
  },

  cs: {
    nav: {
      login: 'Přihlásit',
      signup: 'Registrovat',
    },
    hero: {
      eyebrow: 'Cannabis · Komunita · Hunt · 18+',
      cta1Label: '◈ Kolekce',
      cta1Sub: 'Kurátorsky vybrané strains & klony',
      cta2Label: '⚡ Hub',
      cta2Sub: 'Strain avatari · XP · Hunt · Fórum',
      seekers: '◈ Powered by Seekers →',
    },
    shop: {
      pillarNum: 'Pilíř 01 · E-commerce',
      title: 'H&S Shop',
      desc: 'Kurátorsky vybrané CBD strains a klony. Kvalita nad kvantitu — každý kus ověřený, každý geneticky čistý.',
      tag: '✓ Guest checkout',
      features: ['Prémiová semínka', 'Selektované klony', 'CBD květy', 'Strain portfolio', 'Ověřená genetika', 'Crypto · Stripe'],
      cta: 'Otevřít shop →',
    },
    hub: {
      pillarNum: 'Pilíř 02 · Komunita',
      title: 'H&S Hub',
      desc: 'Strain avatari s AI osobností, XP systém, Seekers hunt eventy, komunita a fórum pro skutečné nadšence.',
      tag: '⚡ Registrace nutná',
      features: ['AI strain chat', 'Seekers hunt', 'XP & levely', 'Fórum', 'Grow Academy', 'Profily & odznaky'],
      cta: 'Vstoupit do Hubu →',
    },
    forum: {
      tag: 'AI Forum Bridge',
      title1: 'Všechna fóra.',
      title2: 'Jedna odpověď.',
      desc: 'AI bot indexuje ICMag, Rollitup, Reddit a další. Položíš otázku — dostaneš konsolidovanou odpověď s odkazy na originální vlákna.',
      query: 'query: "fox farm vs living soil no-till"',
      results: [
        {
          source: 'ICMag · 847 replies',
          text: 'Living soil vychází lépe při no-till setupu — mikrobiální aktivita nahrazuje většinu hnojiv po 2. cyklu...',
        },
        {
          source: 'r/microgrowery · 1.2k upvotes',
          text: 'Fox Farm jednodušší pro začátečníky, ale living soil lepší pro organický terpénový profil ve finále...',
        },
        {
          source: 'Rollitup · Expert thread',
          text: 'Kombinace Fox Farm → living soil přechod v prvním cyklu je oblíbená strategie experienced growers...',
        },
      ],
    },
    footer: '© 2025 · Pouze CBD · 18+ · Powered by Seekers',
  },
} as const
