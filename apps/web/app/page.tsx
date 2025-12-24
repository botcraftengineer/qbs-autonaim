import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SocialProof } from "@/components/social-proof"
import { ProblemSection } from "@/components/problem-section"
import { HowItWorks } from "@/components/how-it-works"
import { HiringFunnel } from "@/components/hiring-funnel"
import { FeaturesSection } from "@/components/features-section"
import { VoiceInterviewSection } from "@/components/voice-interview-section"
import { PricingSection } from "@/components/pricing-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { TargetAudienceSection } from "@/components/target-audience-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { ROICalculator } from "@/components/roi-calculator"
import { IntegrationsSection } from "@/components/integrations-section"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <ProblemSection />
        <HowItWorks />
        <TargetAudienceSection />
        <VoiceInterviewSection />
        <HiringFunnel />
        <ROICalculator />
        <IntegrationsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
