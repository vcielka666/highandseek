import type { Metadata } from 'next'
import { Orbitron, DM_Sans, DM_Mono, Geist } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import ToastProvider from '@/components/providers/ToastProvider'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400'],
  display: 'swap',
})

const cacha = localFont({
  src: '../public/fonts/Cacha.otf',
  variable: '--font-cacha',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'High & Seek — CBD Shop & Community',
  description:
    'CBD e-commerce, AI strain personalities, Seekers geocaching integration. Komunita, fórum, XP. Jeden účet pre všetko.',
  keywords: ['CBD', 'cannabis', 'seeds', 'flowers', 'AI strains', 'Seekers', 'geocaching'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sk"
      className={cn(orbitron.variable, dmSans.variable, dmMono.variable, cacha.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          {children}
          <ToastProvider />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
