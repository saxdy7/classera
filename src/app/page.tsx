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
    <div className="scroll-smooth bg-white text-slate-900 antialiased selection:bg-fuchsia-300 selection:text-fuchsia-900 pb-6">
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
