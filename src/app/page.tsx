import { CTA } from "@/components/CTA";
import { CaseStudy } from "@/components/CaseStudy";
import { FAQ } from "@/components/FAQ";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { LocalSEO } from "@/components/LocalSEO";
import { Navigation } from "@/components/Navigation";
import { RankingVisualization } from "@/components/RankingVisualization";
import { SocialProof } from "@/components/SocialProof";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navigation />
      <main className="pt-20">
        <Hero />
        <SocialProof />
        <RankingVisualization />
        <Features />
        <CaseStudy />
        <LocalSEO />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
