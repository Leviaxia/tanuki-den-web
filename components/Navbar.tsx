
import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User as UserIcon, Crown, Sparkles } from 'lucide-react';
import { User } from '../types';



interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  activeTab,
  setActiveTab,
  user,
  onOpenProfile,
  onOpenAuth,
  onOpenSubscription
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'figuras', label: 'Catálogo' },
    { id: 'colecciones', label: 'Colecciones' },
    { id: 'personalizacion', label: 'Taller' }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  const getMembershipFrame = () => {
    if (!user.membership) return 'border-transparent bg-[#3A332F]';
    return 'border-transparent'; // Remove CSS borders for members as we use images
  };


  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-xl border-b-[6px] border-[#FDF5E6] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex justify-between items-center h-24 md:h-28">

            <div className="flex items-center gap-4 md:gap-5 cursor-pointer group relative z-[1001]" onClick={() => handleNavClick('inicio')}>
              <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#C14B3A] rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                  <img src="/assets/TANUKI DEN - Logo.png" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform" alt="Tanuki Den Logo" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-3xl font-ghibli-title tracking-tighter text-[#3A332F] leading-none">TANUKI DEN</span>
                <span className="text-[8px] md:text-xs font-black text-[#8C8279] tracking-[0.4em] uppercase hidden sm:block">ESPÍRITU DE COLECCIÓN</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`font-ghibli-title text-[10px] xl:text-xs transition-all relative px-3 py-2 flex items-center gap-3 uppercase tracking-[0.15em] ${activeTab === item.id ? 'text-[#C14B3A]' : 'text-[#8C8279] hover:text-[#C14B3A]'
                    }`}
                >
                  {item.label}
                  {activeTab === item.id && (
                    <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#C14B3A] rounded-full animate-fade-in"></div>
                  )}
                </button>
              ))}
              {user.email === 'kaieke37@gmail.com' && (
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="w-10 h-10 bg-[#3A332F] rounded-full flex items-center justify-center text-[#D4AF37] hover:bg-[#C14B3A] hover:text-white transition-all shadow-lg animate-pulse"
                  title="Panel de Administración"
                >
                  <Crown size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={onOpenSubscription}
                className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-ghibli-title text-[10px] tracking-widest transition-all shadow-lg active:scale-95 border-2 relative overflow-hidden group z-10 ${user.membership
                  ? 'bg-[#3A332F] border-white/20 text-[#D4AF37]'
                  : 'bg-[#D4AF37] border-white/30 text-white hover:bg-[#B8860B]'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine"></div>
                <Crown size={14} className={user.membership ? "" : "animate-pulse"} />
                <span>{user.membership ? 'MI CLAN' : 'UNIRSE AL CLAN'}</span>
              </button>

              <button
                onClick={onOpenCart}
                className="relative p-3 bg-[#FDF5E6] rounded-full text-[#3A332F] hover:bg-[#C14B3A] hover:text-white transition-all border-2 border-[#E6D5B8]"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C14B3A] text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-pop">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={user.isRegistered ? onOpenProfile : onOpenAuth}
                className="relative p-1 rounded-full transition-all duration-500 group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3A332F] rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white relative z-0">
                  <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
                </div>
              </button>


              <button className="lg:hidden p-2 text-[#3A332F]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-white pt-24 px-6 lg:hidden animate-fade-in flex flex-col">
          <div className="flex flex-col gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-2xl font-ghibli-title text-left py-4 border-b-2 ${activeTab === item.id ? 'text-[#C14B3A] border-[#C14B3A]' : 'text-[#8C8279] border-[#FDF5E6]'
                  }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { onOpenSubscription(); setIsMenuOpen(false); }}
              className={`mt-4 py-6 rounded-2xl font-ghibli-title text-xl flex items-center justify-center gap-4 ${user.membership ? 'bg-[#3A332F] text-[#D4AF37]' : 'bg-[#D4AF37] text-white'
                }`}
            >
              <Crown size={24} /> {user.membership ? 'ESTATUS DE CLAN' : 'UNIRSE AL CLAN'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
