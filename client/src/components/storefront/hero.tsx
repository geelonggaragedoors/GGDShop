import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { QuoteRequestDialog } from "@/components/QuoteRequestDialog";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroContactForm } from "@/components/storefront/HeroContactForm";

export default function Hero() {
  const { data: heroSettings, isLoading } = useQuery({
    queryKey: ['/api/site-settings/hero'],
    queryFn: async () => {
      const imageRes = await fetch('/api/site-settings/hero_image_url');
      const titleRes = await fetch('/api/site-settings/hero_title');
      const subtitleRes = await fetch('/api/site-settings/hero_subtitle');
      const customPositionRes = await fetch('/api/site-settings/hero_image_position_custom');
      const zoomRes = await fetch('/api/site-settings/hero_image_zoom');
      
      const [imageData, titleData, subtitleData, customPositionData, zoomData] = await Promise.all([
        imageRes.json(),
        titleRes.json(),
        subtitleRes.json(),
        customPositionRes.json(),
        zoomRes.json()
      ]);

      return {
        imageUrl: imageData.value || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800',
        title: titleData.value || 'Professional Garage Door Solutions',
        subtitle: subtitleData.value || 'Quality residential and commercial garage doors, parts, and expert installation services across Geelong and surrounding areas.',
        imagePosition: customPositionData.value || '50% 50%',
        imageZoom: zoomData.value || '100'
      };
    }
  });

  if (isLoading) {
    return (
      <section className="relative h-96 hero-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
        <div className="absolute inset-0 bg-gray-600"></div>
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-16 w-3/4 bg-white/20" />
            <Skeleton className="h-6 w-full bg-white/20" />
            <Skeleton className="h-6 w-5/6 bg-white/20" />
            <div className="flex space-x-4 pt-2">
              <Skeleton className="h-12 w-32 bg-white/20" />
              <Skeleton className="h-12 w-32 bg-white/20" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-96 hero-gradient text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${heroSettings?.imageUrl}')`,
          backgroundPosition: heroSettings?.imagePosition || '50% 50%',
          backgroundSize: heroSettings?.imageZoom ? `${heroSettings.imageZoom}%` : 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 h-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between h-full">
          {/* Hero content - desktop only */}
          <div className="hidden lg:block flex-1 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              {heroSettings?.title}
            </h2>
            <p className="text-lg lg:text-xl mb-6 text-gray-100">
              {heroSettings?.subtitle}
            </p>
            <div className="flex space-x-4 mb-8 lg:mb-0">
              <Link href="/products">
                <Button size="lg" className="bg-[#2b3990] hover:bg-[#1e2871] text-white font-bold text-[16px] transition-colors duration-200">
                  Shop Now
                </Button>
              </Link>
              <QuoteRequestDialog />
            </div>
          </div>
          
          {/* Contact form - mobile centered, desktop right */}
          <div className="flex-1 lg:flex-none lg:ml-8 flex items-center justify-center h-full">
            <HeroContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
