import React from 'react';
import { ExternalLink } from 'lucide-react';

const brands = [
  {
    id: 'tanukiden',
    name: 'Tanuki Den',
    logo: '/assets/Tanuki Den LOGO.png',
    url: 'https://tanukiden.co',
  },
  {
    id: 'kimezu',
    name: 'Kimezu',
    logo: '/assets/KIMEZU LOGO.png',
    url: 'https://kimezu.com',
  },
  {
    id: 'emedical',
    name: 'eMedical',
    logo: '/assets/EMEDICAL LOGO.png',
    url: 'https://emedical.com.co',
  },
  {
    id: 'zonarunning',
    name: 'Zona Running',
    logo: '/assets/Zonarunning logo.png',
    url: 'https://zonarunning.co',
  },
  {
    id: 'athos',
    name: 'Athos',
    logo: '/assets/ATHOSLOGO1.png',
    url: 'https://athosrun.com',
  }
];

const BrandsSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal">
      <div className="text-center mb-16 relative">
        <div className="inline-block bg-[#FDF5E6] text-[#3A332F] px-6 py-2 rounded-full font-black text-sm tracking-[0.2em] uppercase mb-6 shadow-sm border border-[#3A332F]/10">
          Aliados Tanuki Den
        </div>
        
        <h2 className="text-5xl md:text-6xl font-ghibli-title text-[#3A332F] py-2 relative z-10 uppercase tracking-wider title-shadow mx-auto max-w-4xl px-4 md:px-0 leading-tight md:leading-normal mb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {brands.map((brand) => (
          <a
            key={brand.id}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative cursor-pointer outline-none"
          >
            <div className="absolute inset-0 bg-[#3A332F]/5 rounded-[30px] translate-x-3 translate-y-3 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300"></div>
            <div className="bg-white rounded-[30px] p-6 border-4 border-[#3A332F] overflow-hidden flex flex-col h-full items-center justify-center shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl relative">
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                 <ExternalLink size={20} className="text-[#C14B3A]" strokeWidth={2.5}/>
              </div>

              <div className="w-full flex items-center justify-center p-4">
                <img 
                  src={brand.logo} 
                  alt={`Logo de ${brand.name}`} 
                  className="w-full max-h-32 object-contain filter transition-all duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <h3 className="hidden font-ghibli-title text-2xl text-[#3A332F] uppercase text-center mt-2 group-hover:text-[#C14B3A] transition-colors">{brand.name}</h3>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default BrandsSection;
