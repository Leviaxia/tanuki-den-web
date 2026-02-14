import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User as UserIcon, Crown, Sparkles, Instagram, Facebook, Twitter, Youtube, Music2 } from 'lucide-react';
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
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  hasUnclaimedMissions?: boolean; // [NEW]
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  activeTab,
  setActiveTab,
  user,
  onOpenProfile,
  onOpenAuth,
  onOpenSubscription,
  isMenuOpen,
  setIsMenuOpen,
  hasUnclaimedMissions = false // [NEW]
}) => {
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
      <nav className="fixed md:absolute xl:fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-xl border-b-[6px] border-[#FDF5E6] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex justify-between items-center h-24 md:h-28">

            <div className="flex items-center gap-4 md:gap-5 cursor-pointer group relative z-[1001]" onClick={() => handleNavClick('inicio')}>
              <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#C14B3A] rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                  <img src="/assets/tanuki-logo.png" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform" alt="Tanuki Den Logo" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl lg:text-3xl font-ghibli-title tracking-tighter text-[#3A332F] leading-none">TANUKI DEN</span>
                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-[#8C8279] tracking-[0.4em] uppercase hidden sm:block">ESPÍRITU DE COLECCIÓN</span>
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

              {user.isRegistered ? (
                <div className="relative group">
                  <div
                    className="w-10 h-10 rounded-full border-2 overflow-hidden cursor-pointer transition-transform active:scale-95 shadow-md flex items-center justify-center bg-[#FDF5E6]"
                    style={{ borderColor: user.membership === 'gold' ? '#C14B3A' : user.membership === 'founder' ? '#D4AF37' : '#3A332F' }}
                    onClick={onOpenProfile}
                  >
                    <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  {/* Notification Dot */}
                  {hasUnclaimedMissions && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse pointer-events-none"></span>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="relative p-1 rounded-full transition-all duration-500 group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3A332F] rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white relative z-0">
                    <UserIcon size={24} />
                  </div>
                </button>
              )}


              <button className="lg:hidden p-2 text-[#3A332F]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#FDF5E6] lg:hidden animate-fade-in flex flex-col pt-36 px-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#3A332F]/10 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#C14B3A]/10 rounded-full blur-3xl pointer-events-none"></div>

          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-6 right-6 p-2 bg-white rounded-full text-[#3A332F] shadow-md hover:bg-[#C14B3A] hover:text-white transition-all z-20"
          >
            <X size={24} />
          </button>

          <div className="w-full flex flex-col items-center gap-6 mt-4 relative z-10 flex-shrink-0">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-3xl font-ghibli-title uppercase tracking-wider transition-all duration-300 ${activeTab === item.id ? 'text-[#C14B3A] scale-105' : 'text-[#3A332F]/60'
                  }`}
              >
                {item.label}
              </button>
            ))}

            <div className="h-px w-24 bg-[#3A332F]/10 my-2"></div>

            <button
              onClick={() => { onOpenSubscription(); setIsMenuOpen(false); }}
              className={`py-4 px-8 rounded-full font-ghibli-title text-base flex items-center justify-center gap-3 shadow-lg relative overflow-hidden group active:scale-95 transition-all duration-300 w-full max-w-xs ${user.membership ? 'bg-[#3A332F] text-[#D4AF37]' : 'bg-[#C14B3A] text-white'
                }`}
            >
              <Crown size={20} className={user.membership ? "" : "animate-bounce"} />
              <span className="relative z-10">{user.membership ? 'MI ESTATUS' : 'UNIRSE AL CLAN'}</span>
            </button>
          </div>

          <div className="pb-12 mt-12 text-center space-y-4 relative z-10">
            <p className="text-[10px] font-black uppercase text-[#3A332F]/40 tracking-[0.3em]">Sigue al gremio</p>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <button
                onClick={() => window.location.href = 'https://instagram.com/Tanukiden'}
                className="p-3 bg-white rounded-full text-[#3A332F] shadow-sm hover:scale-110 hover:text-[#C14B3A] transition-all"
              >
                <Instagram size={20} />
              </button>
              <button
                onClick={() => window.location.href = 'https://tiktok.com/@Tanukidenstore'}
                className="p-3 bg-white rounded-full text-[#3A332F] shadow-sm hover:scale-110 hover:text-[#C14B3A] transition-all"
              >
                <Music2 size={20} />
              </button>
              <button
                onClick={() => window.location.href = 'https://www.facebook.com/tanukiden.store'}
                className="p-3 bg-white rounded-full text-[#3A332F] shadow-sm hover:scale-110 hover:text-[#C14B3A] transition-all"
              >
                <Facebook size={20} />
              </button>
              <button
                onClick={() => window.location.href = 'https://x.com/Tanukidenstore'}
                className="p-3 bg-white rounded-full text-[#3A332F] shadow-sm hover:scale-110 hover:text-[#C14B3A] transition-all"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => window.location.href = 'https://youtube.com/@TanukiDen'}
                className="p-3 bg-white rounded-full text-[#3A332F] shadow-sm hover:scale-110 hover:text-[#C14B3A] transition-all"
              >
                <Youtube size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
