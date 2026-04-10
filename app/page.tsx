import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/layout/HeroSection'
import PillarsSection from '@/components/layout/PillarsSection'
import ForumBridgeSection from '@/components/layout/ForumBridgeSection'
import Footer from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PillarsSection />
        <ForumBridgeSection />
      </main>
      <Footer />
    </>
  )
}
