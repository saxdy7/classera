'use client';

import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import MarqueeSection from '@/components/landing/MarqueeSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PartnersSection from '@/components/landing/PartnersSection';
import ServicesSection from '@/components/landing/ServicesSection';
import StatsSection from '@/components/landing/StatsSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    // `cl-app` opts the landing page into the design system. It was previously
    // excluded on purpose; that constraint has been lifted.
    <div className="cl-app bg-[var(--cl-canvas)] text-[var(--cl-body)] antialiased selection:bg-[var(--cl-surface-strong)]">
      <Navigation />
      <HeroSection />
      <MarqueeSection />
      <PartnersSection />
      <FeaturesSection />
      <ServicesSection />
      <StatsSection />
      <Footer />
    </div>
  );
}
