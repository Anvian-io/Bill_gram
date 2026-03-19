import { Navbar } from "@/components/landing/Navbar";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { WhyChooseUs } from "@/components/landing/WhyChooseUs";
import { DownloadSection } from "@/components/landing/DownloadSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen max-w-[100vw] bg-background">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProductPreview />
      <WorkflowSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <FAQSection />
      <DownloadSection />
      <Footer />
    </div>
  );
};

export default Index;
