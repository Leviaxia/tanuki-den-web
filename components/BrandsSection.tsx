import React from 'react';
import { ExternalLink } from 'lucide-react';

const brands = [
  {
    id: 'tanukiden',
    name: 'Tanuki Den',
    logo: '/assets/Tanuki Den LOGO.png',
    url: 'https://www.tanukiden.co/',
  },
  {
    id: 'kimezu',
    name: 'Kimezu',
    logo: '/assets/KIMEZU LOGO.png',
    url: 'https://kimezu.co/',
  },
  {
    id: 'emedical',
    name: 'eMedical',
    logo: '/assets/EMEDICAL LOGO.png',
    url: 'https://emedical.me/',
  },
  {
    id: 'zonarunning',
    name: 'Zona Running',
    logo: '/assets/Zonarunning logo.png',
    url: 'https://www.athosrun.co/zona-running',
  },
  {
    id: 'athos',
    name: 'Athos',
    logo: '/assets/ATHOSLOGO1.png',
    url: 'https://www.athosrun.co/',
  }
];

const BrandsSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal">
      <div className="text-center mb-16 relative">
        <div className="inline-block bg-[#FFF8EB] text-[#3A332F] px-5 py-1.5 rounded-full font-bold text-[11px] md:text-xs tracking-[0.25em] uppercase mb-0 border border-[#E8DCC3] relative z-20">
          ALIADOS TANUKI DEN
        </div>
        
        <h2 className="text-5xl md:text-6xl font-ghibli-title text-[#3A332F] relative z-10 uppercase tracking-wider title-shadow mx-auto max-w-4xl px-4 md:px-0 leading-none mt-2 mb-6 md:mb-8">
          Nuestras <span className="text-[#C14B3A]">Marcas</span>
        </h2>
        
        <div className="flex items-center justify-center gap-4">
          <div className="h-[2px] w-12 bg-[#C14B3A]"></div>
          <p className="text-[#3A332F] text-xs md:text-sm font-black uppercase tracking-[0.4em] hidden md:block text-center">
            Conoce nuestra red de proyectos y tiendas asociadas
          </p>
          <p className="text-[#3A332F] text-xs md:text-sm font-black uppercase tracking-[0.1em] md:hidden text-center max-w-[200px]">
            Conoce nuestra red de proyectos y marcas
          </p>
          <div className="h-[2px] w-12 bg-[#C14B3A]"></div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
        {brands.map((brand) => (
          <a
            key={brand.id}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all filter drop-shadow-sm p-4 flex items-center justify-center"
          >
            <img 
              src={brand.logo} 
              alt={brand.name}
              className="w-28 h-auto md:w-36 md:h-auto max-h-16 object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default BrandsSection;
