import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/layout/HeroSection'
import PillarsSection from '@/components/layout/PillarsSection'
import ForumBridgeSection from '@/components/layout/ForumBridgeSection'
import FlowersBgImage from '@/components/layout/FlowersBgImage'
import Footer from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <div style={{ position: 'relative', zIndex: 0 }}>
          <FlowersBgImage />
          <PillarsSection />
          <ForumBridgeSection />
        </div>
      </main>
      <Footer />
    </>
  )
}
