import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SocialProof } from "@/components/social-proof"
import { ValuePropositionSection } from "@/components/value-proposition-section"
import { HowItWorks } from "@/components/how-it-works"
import { TargetAudienceSection } from "@/components/target-audience-section"
import { FeaturesSection } from "@/components/features-section"
import { ROICalculator } from "@/components/roi-calculator"
import { TestimonialsSection } from "@/components/testimonials-section"
import { PricingSection } from "@/components/pricing-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { RAGIntelligenceSection } from "@/components/rag-intelligence-section"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Hero - Grab attention */}
        <HeroSection />

        {/* 2. Social Proof - Build trust immediately */}
        <SocialProof />

        {/* 3. Value Proposition - Explain the value */}
        <ValuePropositionSection />

        {/* 4. Target Audience - Who is it for */}
        <TargetAudienceSection />

        {/* 5. How It Works - Simple 4-step process */}
        <HowItWorks />

        {/* 6. Features - All capabilities including Prequalification and White-label */}
        <FeaturesSection />

        {/* 6.5. RAG Intelligence - Show AI answering questions using real data */}
        <RAGIntelligenceSection />

        {/* 7. ROI Calculator - Justify the investment */}
        <ROICalculator />

        {/* 8. Testimonials - Social proof */}
        <TestimonialsSection />

        {/* 9. Pricing - Convert */}
        <PricingSection />

        {/* 10. FAQ + CTA - Remove objections and final push */}
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
