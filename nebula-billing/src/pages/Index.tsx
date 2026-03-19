import { Navbar } from "@/components/landing/Navbar";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { WhyChooseUs } from "@/components/landing/WhyChooseUs";
import { DownloadSection } from "@/components/landing/DownloadSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProductPreview />
      <WhyChooseUs />
      <DownloadSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Index;
