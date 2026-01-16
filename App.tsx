
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Minus, Trash2, X, Send, Sparkles, ShoppingBag,
  Star, Mail, MapPin, Instagram, Facebook, Twitter, Youtube,
  Video, Music2, Printer, ThumbsUp, ThumbsDown, ChevronRight, ArrowRight,
  Gift, Ticket, Lock, User as UserIcon, MessageSquare, Camera, Phone, CheckCircle2, Calendar, Map, Heart, PenLine, Crown, Zap, ShieldCheck, Truck, Shield, Clock, RotateCcw, Edit3, Save, UserPlus, Upload, Image as ImageIcon, CreditCard, Wallet, Landmark, QrCode, Home, Palette, Compass, Layers, Gem, Box, MoveLeft
} from 'lucide-react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { Product, CartItem, UserMessage, Review, User as UserType } from './types';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import { PRODUCTS as INITIAL_PRODUCTS, heroText, collectionsContent } from './constants';
import { getOtakuRecommendation } from './services/gemini';
import { supabase } from './src/lib/supabase';
import { formatCurrency } from './src/lib/utils';
import { useLocation, Routes, Route } from 'react-router-dom';
import { CheckoutSuccess } from './src/pages/CheckoutSuccess';
import { CheckoutCancel } from './src/pages/CheckoutCancel';
import { AdminDashboard } from './src/pages/AdminDashboard';

// Helper to handle base64 conversion
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

console.log("TANUKI APP VERSION: 2.2 - LOGIN DEBUG (BUILD " + new Date().toISOString() + ")");

// DEBUG CHECK ENV VARS
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-600 font-bold p-10 text-center">ERROR CRÍTICO: Faltan Variables de Entorno (Supabase) en Vercel.</div>;
}

const location = useLocation();

const isCheckout = location.pathname.includes('/checkout');
const isAdmin = location.pathname.includes('/admin');

const [activeTab, setActiveTab] = useState('inicio');
const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
const [products, setProducts] = useState<Product[]>(() => {
  const savedReviews = localStorage.getItem('tanuki_all_reviews');
  const reviewsMap = savedReviews ? JSON.parse(savedReviews) : {};
  return INITIAL_PRODUCTS.map(p => ({
    ...p,
    reviews: reviewsMap[p.id] || []
  }));
});

const [favorites, setFavorites] = useState<string[]>(() => {
  const saved = localStorage.getItem('tanuki_favorites');
  return saved ? JSON.parse(saved) : [];
});

const [user, setUser] = useState<UserType>(() => {
  // SWITCH TO SESSION STORAGE for volatile sessions
  const saved = sessionStorage.getItem('tanuki_user');
  return saved ? JSON.parse(saved) : {
    id: 'guest',
    name: 'Viajero',
    photo: '/assets/default_avatar.png',
    isRegistered: false,
    membership: undefined,
    location: '',
    birthDate: ''
  };
});

const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const [isRouletteOpen, setIsRouletteOpen] = useState(false);
const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
const [hasSpunFirst, setHasSpunFirst] = useState(() => localStorage.getItem('tanuki_has_spun') === 'true');
const [appliedDiscount, setAppliedDiscount] = useState<number>(() => Number(localStorage.getItem('tanuki_discount') || 0));
const [isSpinning, setIsSpinning] = useState(false);
const [rotation, setRotation] = useState(0);

const [cart, setCart] = useState<CartItem[]>([]);
const [isCartOpen, setIsCartOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
const [detailQuantity, setDetailQuantity] = useState(1);

const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);


const [chatMessages, setChatMessages] = useState<UserMessage[]>([
  { role: 'assistant', content: '¡Hola! Soy el espíritu de Tanuki Den. ¿En qué puedo ayudarte hoy? ✨' }
]);
const [isChatOpen, setIsChatOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
const [isTyping, setIsTyping] = useState(false);
const [activeCategory, setActiveCategory] = useState<string>('All');

const chatEndRef = useRef<HTMLDivElement>(null);


useEffect(() => {
  if (chatEndRef.current) {
    chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [chatMessages, isTyping]);

useEffect(() => {
  localStorage.setItem('tanuki_favorites', JSON.stringify(favorites));
}, [favorites]);

// Clean up OLD localStorage data to prevent conflicts
useEffect(() => {
  localStorage.removeItem('tanuki_user');
}, []);

// Fix for stale guest data in localStorage (only reset if using the old unsplash image)
useEffect(() => {
  if (user.id === 'guest' && user.photo?.includes('unsplash.com')) {
    setUser(prev => ({ ...prev, photo: '/assets/default_avatar.png' }));
  }
}, [user.id, user.photo]);

// Supabase Auth Listener
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Get extra profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Use metadata as fallback if profile is empty (common immediately after signup)
      const meta = session.user.user_metadata || {};

      setUser(prev => ({
        ...prev,
        id: session.user.id,
        // Hierarchy: Profile (DB) -> Metadata (Auth) -> Previous Local -> Email Fallback
        name: profile?.full_name || meta.full_name || meta.username || (prev.id === session.user.id && prev.name !== 'Viajero' ? prev.name : (session.user.email?.split('@')[0] || 'Aventurero')),
        photo: profile?.avatar_url || prev.photo,
        isRegistered: true,
        email: session.user.email,
        membership: profile?.membership || (prev.id === session.user.id ? prev.membership : undefined),
        location: profile?.location || meta.location || (prev.id === session.user.id ? prev.location : ''),
        birthDate: profile?.birth_date || meta.birth_date || (prev.id === session.user.id ? prev.birthDate : ''),
        phone: profile?.phone || meta.phone || (prev.id === session.user.id ? prev.phone : ''),
        realName: profile?.full_name || meta.full_name || (prev.id === session.user.id ? prev.realName : '')
      }));
    } else if (event === 'SIGNED_OUT') {
      // Reset to guest
      setUser({
        id: 'guest',
        name: 'Viajero',
        photo: '/assets/default_avatar.png',
        isRegistered: false,
        membership: undefined,
        location: '',
        birthDate: ''
      });
      sessionStorage.removeItem('tanuki_user');
    }
  });

  return () => subscription.unsubscribe();
}, []);

// Sync state when returning from checkout
useEffect(() => {
  if (!isCheckout) {
    const savedUser = sessionStorage.getItem('tanuki_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Only update if membership changed or wasn't set to avoid loops
        if (parsed.membership !== user.membership) {
          console.log("Syncing user state from storage:", parsed);
          setUser(parsed);
        }
      } catch (e) {
        console.error("Error syncing user state", e);
      }
    }
  }
}, [isCheckout]); // Depend only on route change context

// Listen for internal state updates (from CheckoutSuccess, etc)
useEffect(() => {
  const handleUserUpdate = () => {
    const saved = sessionStorage.getItem('tanuki_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("⚡ Evento recibido: Actualizando usuario en App:", parsed);
        setUser(parsed);
      } catch (e) {
        console.error("Error parsing update event user", e);
      }
    }
  };

  window.addEventListener('tanuki_user_update', handleUserUpdate);
  return () => window.removeEventListener('tanuki_user_update', handleUserUpdate);
}, []);

useEffect(() => {
  sessionStorage.setItem('tanuki_user', JSON.stringify(user));
}, [user]);

// Fetch Products from Supabase
useEffect(() => {
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge with local reviews if needed, or just set
      const savedReviews = localStorage.getItem('tanuki_all_reviews');
      const reviewsMap = savedReviews ? JSON.parse(savedReviews) : {};

      setProducts(data.map(p => ({
        ...p,
        reviews: reviewsMap[p.id] || [],
        // Ensure compatibility with Product type if DB has missing fields
        category: p.category || 'General',
        rating: p.rating || 5.0,
        collectionId: p.collectionId || null
      })));
    }
  };
  fetchProducts();
}, []);

// Payment Success Handling
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    setCart([]);
    setIsCartOpen(false);
    alert('¡Pago completado con éxito! Gracias por tu compra.');
    // remove params from url
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);

const toggleFavorite = (id: string) => {
  setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
};

const addToCart = (product: Product, quantity: number = 1) => {
  setCart(prev => {
    const existing = prev.find(item => item.id === product.id);
    if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
    return [...prev, { ...product, quantity }];
  });
  setIsCartOpen(true);
  setSelectedProduct(null);
};

const updateQuantity = (productId: string, delta: number) => {
  setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
};

const removeFromCart = (productId: string) => {
  setCart(prev => prev.filter(item => item.id !== productId));
};

const handleNavClick = (id: string) => {
  setActiveTab(id);
  setSelectedCollectionId(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputValue.trim()) return;

  const userMsg = inputValue;
  setInputValue('');
  setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
  setIsTyping(true);

  const response = await getOtakuRecommendation(userMsg);
  setIsTyping(false);
  setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
};



const handleAuthComplete = (userData: Partial<UserType>) => {
  setUser(prev => ({ ...prev, ...userData }));
  setIsAuthModalOpen(false);
  if (userData.membership) setIsSubscriptionModalOpen(true);
};

const segments = [
  { label: 'BRISA 3%', value: 3, color: '#FDF5E6', text: '#3A332F' },
  { label: '¡HUY!', value: 0, color: '#C14B3A', text: '#FFFFFF' },
  { label: 'BROTE 5%', value: 5, color: '#FDF5E6', text: '#3A332F' },
  { label: '¡OH NO!', value: 0, color: '#3A332F', text: '#FFFFFF' },
  { label: 'ALMA 10%', value: 10, color: '#D4AF37', text: '#3A332F' },
  { label: '¡UPS!', value: 0, color: '#C14B3A', text: '#FFFFFF' },
];

const spinWheel = () => {
  if (isSpinning || hasSpunFirst) return;
  setIsSpinning(true);

  const extraSpins = 10 + Math.floor(Math.random() * 5);
  const randomSegmentIndex = Math.floor(Math.random() * segments.length);
  const segmentAngle = 360 / segments.length;

  // To align the center of segment `k` with the pointer (top), 
  // the wheel must be rotated by `- (k * 60)`. 
  // We add full spins and normalize.
  const targetAngle = (extraSpins * 360) + (360 - (randomSegmentIndex * segmentAngle));

  setRotation(targetAngle);

  setTimeout(() => {
    setIsSpinning(false);
    const result = segments[randomSegmentIndex];
    if (result.value > 0) {
      setAppliedDiscount(result.value);
      localStorage.setItem('tanuki_discount', result.value.toString());
    }
    setHasSpunFirst(true);
    localStorage.setItem('tanuki_has_spun', 'true');
  }, 4000);
};

const renderContent = () => {
  switch (activeTab) {
    case 'figuras':
      return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-32 md:pb-24 space-y-12 section-reveal">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h2 className="text-4xl md:text-[5rem] lg:text-[5.5rem] font-ghibli-title text-[#3A332F] leading-[0.9] uppercase tracking-tighter">Catálogo <span className="text-[#C14B3A]">Completo</span></h2>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
              {['All', 'Scale', 'Nendoroid', 'Accessory', 'Limited', 'Favoritos'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-8 py-3 rounded-full text-[10px] md:text-sm font-ghibli-title uppercase border-4 transition-all snap-start flex items-center gap-2 ${activeCategory === cat ? 'bg-[#C14B3A] text-white border-[#C14B3A] shadow-lg shadow-[#C14B3A]/30' : 'bg-white text-[#D4AF37] border-[#FDF5E6]'
                    }`}
                >
                  {cat === 'Favoritos' && <Heart size={14} fill={activeCategory === 'Favoritos' ? 'white' : 'none'} />}
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {products
              .filter(p => {
                if (activeCategory === 'Favoritos') return favorites.includes(p.id);
                return activeCategory === 'All' || p.category === activeCategory;
              })
              .map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => addToCart(p, 1)}
                  onViewDetails={(p) => { setSelectedProduct(p); setDetailQuantity(1); }}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
              ))}
          </div>
        </div>
      );
    case 'personalizacion':
      return (
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h2 className="text-4xl md:text-[6.5rem] lg:text-[7.5rem] font-ghibli-title text-[#3A332F] leading-[0.85] uppercase tracking-tighter">Taller <br /><span className="text-[#C14B3A]">Mágico.</span></h2>
              <p className="text-[#3A332F] text-xl md:text-2xl font-bold leading-relaxed max-w-xl mx-auto lg:mx-0">
                Crea algo único. Cuéntanos tu idea y la haremos realidad con el sello Tanuki.
              </p>
            </div>
            <div className="p-8 md:p-16 rounded-[40px] border-4 border-[#3A332F] shadow-[15px_15px_0px_0px_#C14B3A] relative z-10 bg-[#FDF5E6]">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Tu petición ha sido recibida."); }}>
                <div className="space-y-2">
                  <label className="font-ghibli-title text-[9px] md:text-sm uppercase tracking-widest text-[#3A332F] ml-2">¿Qué deseas crear?</label>
                  <select className="w-full p-4 md:p-6 bg-white border-4 border-[#3A332F] rounded-[20px] font-bold text-sm md:text-xl outline-none transition-all cursor-pointer">
                    <option>Figura Personalizada</option>
                    <option>Camiseta Exclusiva</option>
                    <option>Cuadro o Ilustración</option>
                    <option>Accesorio Especial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-ghibli-title text-[9px] md:text-sm uppercase tracking-widest text-[#3A332F] ml-2">Tus requerimientos</label>
                  <textarea rows={4} className="w-full p-5 md:p-8 bg-white border-4 border-[#3A332F] rounded-[25px] outline-none text-base font-medium shadow-inner" placeholder="Describe aquí los detalles..." required />
                </div>
                <button type="submit" className="w-full bg-[#C14B3A] text-white font-ghibli-title py-5 rounded-full text-base shadow-xl hover:bg-[#3A332F] transition-all flex items-center justify-center gap-4">
                  ENVIAR MI IDEA <ArrowRight size={22} />
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    case 'colecciones':
      if (selectedCollectionId) {
        const collection = collectionsContent.find(c => c.id === selectedCollectionId);
        const collectionProducts = products.filter(p => p.collectionId === selectedCollectionId);

        return (
          <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal space-y-16">
            <button
              onClick={() => setSelectedCollectionId(null)}
              className="flex items-center gap-4 font-ghibli-title text-[#3A332F] hover:text-[#C14B3A] transition-colors uppercase tracking-widest text-xs group"
            >
              <div className="w-10 h-10 bg-[#FDF5E6] rounded-full flex items-center justify-center group-hover:-translate-x-2 transition-transform shadow-md"><MoveLeft size={18} /></div>
              Volver a Colecciones
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <h2 className="text-4xl md:text-7xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter leading-tight" style={{ color: collection?.accent }}>{collection?.title}</h2>
                <p className="text-[#3A332F] text-lg md:text-xl font-bold leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-70">
                  {collection?.description}
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  <Box size={20} className="text-[#C14B3A]" />
                  <span className="font-ghibli-title text-sm uppercase tracking-widest">{collectionProducts.length} Tesoros encontrados</span>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-[60px] border-8 border-white shadow-2xl aspect-video">
                <img src={collection?.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={collection?.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A332F]/40 to-transparent"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 pt-12">
              {collectionProducts.length > 0 ? (
                collectionProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => addToCart(p, 1)}
                    onViewDetails={(p) => { setSelectedProduct(p); setDetailQuantity(1); }}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-6 opacity-40">
                  <Sparkles size={80} className="mx-auto" />
                  <p className="font-ghibli-title text-2xl uppercase tracking-widest">Aún no hay tesoros en esta bóveda</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal">
          <div className="text-center mb-16 md:mb-24 space-y-6">
            <h2 className="text-4xl md:text-[6.5rem] lg:text-[7.5rem] font-ghibli-title text-[#3A332F] uppercase tracking-tighter leading-tight">Colecciones</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-12 bg-[#C14B3A]"></div>
              <p className="text-[#3A332F] text-xs md:text-sm font-black uppercase tracking-[0.4em]">Explora universos temáticos</p>
              <div className="h-[2px] w-12 bg-[#C14B3A]"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14">
            {collectionsContent.map((item) => (
              <div
                key={item.id}
                onClick={() => { setSelectedCollectionId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#3A332F]/5 rounded-[50px] translate-x-4 translate-y-4 -z-10 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform"></div>
                <div className="bg-white rounded-[50px] p-6 border-4 border-[#3A332F] overflow-hidden flex flex-col h-full shadow-xl transition-all group-hover:-translate-y-3 group-hover:shadow-2xl">
                  <div className="relative aspect-[4/3] rounded-[35px] overflow-hidden mb-8 border-2 border-[#3A332F]/10">
                    <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <button className="w-full bg-white py-3 rounded-full font-ghibli-title text-[10px] tracking-widest text-[#3A332F] uppercase shadow-lg">Entrar al Universo</button>
                    </div>
                  </div>
                  <div className="space-y-4 px-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-ghibli-title text-2xl text-[#3A332F] uppercase group-hover:text-[#C14B3A] transition-colors">{item.title}</h3>
                      <ChevronRight className="text-[#C14B3A] group-hover:translate-x-2 transition-transform" />
                    </div>
                    <p className="text-[#8C8279] text-[11px] font-bold leading-relaxed line-clamp-2 uppercase tracking-wide">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="space-y-40 pb-24">
          <section className="relative min-h-[85vh] flex items-center overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">
              <div className="text-center lg:text-left space-y-12">
                <div className="inline-flex items-center gap-4 py-2 px-6 bg-[#FDF5E6] rounded-full border-2 border-[#E6D5B8]">
                  <Sparkles className="text-[#C14B3A] animate-pulse" size={18} />
                  <span className="text-[#3A332F] text-[10px] font-black uppercase tracking-[0.2em]">Boutique de Arte Anime</span>
                </div>
                <h1 className="text-[2.6rem] sm:text-[4.5rem] lg:text-[7rem] font-ghibli-title text-[#3A332F] leading-[0.85] tracking-tighter uppercase mb-4">
                  Tesoros <br />
                  <span className="text-[#C14B3A]">Con Alma.</span>
                </h1>
                <p className="text-[#3A332F] text-xl md:text-2xl font-bold leading-relaxed max-w-xl mx-auto lg:mx-0 px-4 md:px-0">
                  Más que figuras, custodiamos historias. Piezas seleccionadas para coleccionistas que valoran la autenticidad y el detalle.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-6 px-4 md:px-0">
                  <button onClick={() => handleNavClick('figuras')} className="bg-[#3A332F] text-white font-ghibli-title py-6 px-10 md:px-16 rounded-full text-lg shadow-2xl hover:bg-[#C14B3A] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest">VER CATÁLOGO</button>
                </div>
              </div>
              <div className="relative group animate-float hidden lg:block">
                <div className="relative w-full aspect-square rounded-[100px] overflow-hidden border-[15px] border-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-1000">
                  <img src="/assets/Tanuki_Hero_Ref.jpg" className="w-full h-full object-cover object-center" alt="Hero" />
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center mb-24 space-y-4">
              <h2 className="text-4xl md:text-7xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter leading-[0.9]">¿Por qué elegir <br /><span className="text-[#C14B3A]">Tanuki Den?</span></h2>
              <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#3A332F]">Valores que forjan nuestra leyenda</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="group bg-[#C14B3A] rounded-[60px] p-12 border-4 border-[#3A332F] transition-all duration-500 hover:shadow-[15px_15px_0px_0px_#3A332F] section-reveal flex flex-col justify-center min-h-[320px] relative overflow-hidden text-white">
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-[#3A332F] shadow-sm animate-bounce-subtle">
                    <Layers className="text-[#C14B3A]" size={32} />
                  </div>
                  <h3 className="text-3xl font-ghibli-title uppercase tracking-tight">Gran Variedad</h3>
                  <p className="text-white/80 font-bold text-sm leading-relaxed max-w-sm">Desde estatuas a escala hasta accesorios de escritorio. Catálogo infinito para todo coleccionista.</p>
                </div>
              </div>
              <div className="group bg-[#D4AF37] rounded-[60px] p-12 border-4 border-[#3A332F] transition-all duration-500 hover:shadow-[15px_15px_0px_0px_#C14B3A] section-reveal flex flex-col justify-center min-h-[320px] relative overflow-hidden text-[#3A332F]">
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-[#3A332F] shadow-sm animate-float">
                    <Gem className="text-[#3A332F]" size={32} />
                  </div>
                  <h3 className="text-3xl font-ghibli-title uppercase tracking-tight text-[#3A332F]">Alta Fidelidad</h3>
                  <p className="text-[#3A332F]/80 font-bold text-sm leading-relaxed max-w-sm">Acabados premium y estética legendaria para tus vitrinas.</p>
                </div>
              </div>
              <div className="group bg-[#4A6741] rounded-[60px] p-12 border-4 border-[#3A332F] transition-all duration-500 hover:shadow-[15px_15px_0px_0px_#81C784] section-reveal flex flex-col justify-center min-h-[320px] relative overflow-hidden text-white">
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-[#3A332F] shadow-sm animate-wiggle">
                    <ShieldCheck className="text-[#81C784]" size={32} />
                  </div>
                  <h3 className="text-3xl font-ghibli-title uppercase tracking-tight">Compra Segura</h3>
                  <p className="text-white/80 font-bold text-sm leading-relaxed max-w-sm">Empaque reforzado y protección ancestral en cada envío.</p>
                </div>
              </div>
              <div className="group bg-[#5D4037] rounded-[60px] p-12 border-4 border-[#3A332F] transition-all duration-500 hover:shadow-[15px_15px_0px_0px_#FDF5E6] section-reveal flex flex-col justify-center min-h-[320px] relative overflow-hidden text-white">
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-[#D4AF37] shadow-sm animate-pulse">
                    <Palette className="text-[#C14B3A]" size={32} />
                  </div>
                  <h3 className="text-3xl font-ghibli-title uppercase tracking-tight">Taller Mágico</h3>
                  <p className="text-white/70 font-bold text-sm leading-relaxed max-w-sm">Personalización total y creaciones a medida del gremio.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 text-center section-reveal pb-32">
            <div className="bg-[#3A332F] rounded-[80px] py-24 md:py-32 px-10 relative overflow-hidden shadow-2xl animate-subtle-glow group hover:scale-[1.01] transition-transform duration-700 z-[10]">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-[#C14B3A]/10 via-transparent to-[#D4AF37]/10 pointer-events-none"></div>
              <div className="relative z-10 space-y-10">
                <h2 className="text-4xl sm:text-6xl md:text-[5.5rem] lg:text-[7.5rem] font-ghibli-title text-white uppercase tracking-tighter drop-shadow-xl leading-[0.85]">Forja tu <br /><span className="text-[#D4AF37]">Colección</span></h2>
                <p className="text-white/60 text-base md:text-2xl font-bold max-w-2xl mx-auto leading-relaxed">Únete al gremio más exclusivo de coleccionistas en Colombia.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                  <button onClick={() => handleNavClick('figuras')} className="bg-[#C14B3A] text-white font-ghibli-title py-6 px-16 rounded-full text-lg shadow-xl hover:bg-white hover:text-[#C14B3A] transition-all uppercase tracking-widest active:scale-95">ENTRAR AL BOSQUE</button>
                  <button onClick={() => handleSubscriptionClick()} className="bg-transparent border-4 border-white text-white font-ghibli-title py-6 px-16 rounded-full text-lg hover:bg-white hover:text-[#3A332F] transition-all uppercase tracking-widest active:scale-95">VER MEMBRESÍAS</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
  }
};

const handleSubscriptionClick = () => {
  if (!user.isRegistered) {
    setIsAuthModalOpen(true);
    return;
  }
  setIsSubscriptionModalOpen(true);
};


if (isAdmin) {
  // SECURITY: Only allow specific email
  if (user.email !== 'kaieke37@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#3A332F] text-[#FDF5E6] font-ghibli-title space-y-6">
        <Shield size={64} className="text-[#C14B3A]" />
        <h1 className="text-4xl uppercase tracking-widest">Acceso Denegado</h1>
        <p className="font-bold text-center max-w-md opacity-80">Este santuario está protegido. Solo el guardián designado puede entrar.</p>
        <div className="text-[10px] text-white/30 font-mono bg-black/20 p-4 rounded-lg">
          DEBUG INFO:<br />
          Email: {user.email || 'No email detected'}<br />
          ID: {user.id}<br />
          Auth Status: {user.isRegistered ? 'Registered' : 'Guest'}
        </div>
        <button onClick={() => window.location.href = '/'} className="bg-[#FDF5E6] text-[#3A332F] py-3 px-8 rounded-full font-black uppercase text-xs tracking-widest hover:bg-[#C14B3A] hover:text-white transition-all">Volver al Bosque</button>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

if (isCheckout) {
  return (
    <Routes>
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancel" element={<CheckoutCancel />} />
    </Routes>
  );
}

return (
  <div className="min-h-screen bg-white selection:bg-[#C14B3A] selection:text-white flex flex-col pt-24 md:pt-32 relative overflow-x-hidden">
    <Navbar
      cartCount={cart.reduce((a, c) => a + c.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onOpenProfile={() => setIsProfileModalOpen(true)}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      onOpenSubscription={handleSubscriptionClick}
    />




    {appliedDiscount > 0 && (
      <div className="bg-[#C14B3A] text-white py-2 text-center font-ghibli-title text-[10px] tracking-widest uppercase animate-pulse z-[50]">
        ✨ ¡TIENES UN {appliedDiscount}% DE DESCUENTO ACTIVO EN TU PRÓXIMA COMPRA! ✨
      </div>
    )}

    <div className="fixed bottom-32 md:bottom-12 right-6 z-[100] flex flex-col items-center gap-4">
      <button
        onClick={() => setIsRouletteOpen(true)}
        className={`w-12 h-12 md:w-16 md:h-16 bg-[#D4AF37] rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 relative overflow-hidden animate-wiggle ${hasSpunFirst ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        <Gift className="text-white" size={24} />
        {!hasSpunFirst && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-shine"></div>}
      </button>
      <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-float ${isChatOpen ? 'bg-[#C14B3A]' : 'bg-[#3A332F]'}`}>
        {isChatOpen ? <X className="text-white" size={28} /> : <Sparkles size={28} className="text-[#FDF5E6] animate-pulse" />}
      </button>
    </div>

    <div className="lg:hidden fixed bottom-6 left-4 right-4 h-20 bg-[#2C2420]/95 backdrop-blur-xl rounded-full z-[1600] flex items-center justify-around px-2 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-[#D4AF37]/20">
      {[
        { id: 'inicio', icon: Home, label: 'Inicio' },
        { id: 'figuras', icon: ShoppingBag, label: 'Tienda' },
        { id: 'personalizacion', icon: Palette, label: 'Taller' },
        { id: 'colecciones', icon: Compass, label: 'Explorar' }
      ].map(item => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.id)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all relative ${activeTab === item.id ? 'text-[#D4AF37] -translate-y-4' : 'text-white/40 hover:text-white/80'}`}
        >
          <div className={`absolute inset-0 bg-[#3A332F] rounded-full -z-10 transition-all duration-300 ${activeTab === item.id ? 'opacity-100 scale-100 shadow-lg border border-[#D4AF37]/30' : 'opacity-0 scale-50'}`}></div>
          <item.icon size={activeTab === item.id ? 24 : 22} className="transition-all" />
          <span className={`text-[9px] font-bold mt-1 uppercase tracking-widest transition-all ${activeTab === item.id ? 'opacity-100 translate-y-0 font-ghibli-title' : 'opacity-0 translate-y-2 hidden'}`}>{item.label}</span>
        </button>
      ))}
    </div>

    <main className="flex-grow relative z-10">{renderContent()}</main>

    {isChatOpen && (
      <div className="fixed bottom-32 md:bottom-40 right-6 w-[calc(100vw-3rem)] md:w-96 h-[500px] bg-white rounded-[40px] border-4 border-[#3A332F] shadow-2xl z-[110] flex flex-col overflow-hidden animate-slide-up">
        <div className="bg-[#3A332F] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C14B3A] rounded-full flex items-center justify-center border-2 border-white"><Sparkles size={18} /></div>
            <div>
              <h4 className="font-ghibli-title text-sm uppercase">Espíritu Tanuki</h4>
              <span className="text-[8px] font-black uppercase opacity-60 tracking-widest">Guía Sabio</span>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[#FDF5E6]/30">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[25px] text-sm font-bold ${msg.role === 'user' ? 'bg-[#C14B3A] text-white rounded-tr-none shadow-lg' : 'bg-white text-[#3A332F] border-2 border-[#3A332F]/10 rounded-tl-none shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-[25px] rounded-tl-none border-2 border-[#3A332F]/10 flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#C14B3A] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#C14B3A] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-[#C14B3A] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-4 border-[#FDF5E6] flex gap-2">
          <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Susurra al espíritu..." className="flex-grow bg-[#FDF5E6] border-2 border-[#E6D5B8] rounded-full px-6 py-3 text-sm outline-none focus:border-[#C14B3A] transition-all" />
          <button type="submit" className="w-12 h-12 bg-[#3A332F] text-white rounded-full flex items-center justify-center hover:bg-[#C14B3A] transition-all"><Send size={18} /></button>
        </form>
      </div>
    )}

    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      onComplete={handleAuthComplete}
    />

    {isProfileModalOpen && (
      <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
        {(() => {
          const getColor = () => {
            switch (user.membership) {
              case 'bronze': return '#4A6741';
              case 'silver': return '#5D4037';
              case 'gold': return '#C14B3A';
              case 'founder': return '#D4AF37';
              default: return '#9CA3AF'; // Gris para gratis/null
            }
          };
          const accentColor = getColor();

          const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              // 1. Upload to Supabase Storage
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}-${Math.random()}.${fileExt}`;
              const filePath = `${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

              if (uploadError) throw uploadError;

              // 2. Get Public URL
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              // 3. Update Profile
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

              if (updateError) throw updateError;

              // 4. Update Local State
              setUser(prev => ({ ...prev, photo: publicUrl }));
              alert('¡Foto de perfil actualizada con éxito!');
            } catch (err: any) {
              console.error('Error uploading photo:', err);
              alert('No se pudo subir la foto. Asegúrate de crear un bucket público llamado "avatars" en Supabase.');
            }
          };

          return (
            <div
              className="bg-white w-full max-w-md rounded-[50px] p-6 md:p-12 border-8 relative animate-pop text-center space-y-8"
              style={{ borderColor: accentColor }}
            >
              <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-8 right-8"><X size={28} /></button>
              <div className="relative mx-auto w-36 h-36 group cursor-pointer">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div
                  className="w-full h-full bg-[#3A332F] rounded-full border-4 overflow-hidden shadow-2xl relative z-0 group-hover:opacity-80 transition-opacity"
                  style={{ borderColor: accentColor }}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <Camera className="text-white" size={32} />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#C14B3A] text-white p-2 rounded-full border-2 border-white shadow-lg pointer-events-none">
                  <Edit3 size={16} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-ghibli-title text-[#3A332F] leading-tight">{user.name}</h2>
                <p
                  className="font-black uppercase text-[10px] tracking-[0.2em]"
                  style={{ color: accentColor }}
                >
                  {user.membership ? `MIEMBRO ${user.membership.toUpperCase()}` : 'VIAJERO DEL BOSQUE'}
                </p>
              </div>
              <div className="bg-[#FDF5E6] p-6 rounded-[30px] text-left space-y-3 border-2 border-[#E6D5B8]">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#C14B3A]" />
                  <span className="text-xs font-bold text-[#3A332F]">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[#C14B3A]" />
                  <span className="text-xs font-bold text-[#3A332F]">{user.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[#C14B3A]" />
                  <span className="text-xs font-bold text-[#3A332F]">{user.phone}</span>
                </div>
              </div>
              <button onClick={() => { setIsProfileModalOpen(false); handleSubscriptionClick(); }} className="w-full bg-[#3A332F] text-white font-ghibli-title py-5 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all uppercase tracking-widest text-xs mb-3">ESTATUS DEL CLAN</button>
              <button onClick={() => {
                setUser({
                  id: 'guest',
                  name: 'Invitado',
                  photo: 'https://cdn-icons-png.flaticon.com/512/3222/3222791.png',
                  isRegistered: false,
                  membership: undefined,
                  location: '',
                  birthDate: ''
                });
                // Cleanup for pending cart if user logs out
                const pendingCart = localStorage.getItem('tanuki_pending_cart');
                if (pendingCart) {
                  try {
                    // Use session storage for cart too during checkout flow? user might reload.
                    // Keep cart persistent for nice UX, but user auth volatile.
                    // No change needed for cart unless user asked.
                    localStorage.removeItem('tanuki_pending_cart');
                    setCart([]);
                  } catch (e) { }
                }
                sessionStorage.removeItem('tanuki_user'); // Changed from localStorage to sessionStorage
                setIsProfileModalOpen(false);
              }} className="w-full bg-transparent border-2 border-[#3A332F]/10 text-[#3A332F]/60 font-ghibli-title py-4 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all uppercase tracking-widest text-[10px]">CERRAR SESIÓN</button>
            </div>
          );
        })()}
      </div>
    )}

    {isSubscriptionModalOpen && (
      <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 flex items-start md:items-center justify-center p-4 pt-24 md:p-6 overflow-y-auto backdrop-blur-md">
        <div className="bg-[#FDF5E6] w-full max-w-6xl rounded-[40px] md:rounded-[60px] p-6 md:p-14 relative animate-pop border-4 md:border-8 border-white shadow-2xl my-8 md:my-0">
          <button onClick={() => setIsSubscriptionModalOpen(false)} className="absolute top-4 right-4 md:top-8 md:right-8 hover:rotate-90 transition-transform bg-white/80 p-2 rounded-full shadow-lg z-50 text-[#3A332F]"><X className="w-6 h-6 md:w-8 md:h-8" /></button>

          {user.membership ? (
            /* Vista de Usuario Suscrito */
            (() => {
              const plans = [
                { name: 'Semilla', price: '40000', period: 'Mensual', color: '#4A6741', id: 'bronze', benefits: ['Insignia del Clan', 'Chat Exclusivo', 'Soporte Prioritario', 'Preventas 24h'] },
                { name: 'Brote', price: '100000', period: 'Trimestral', color: '#5D4037', id: 'silver', benefits: ['Todo lo Mensual', '5% OFF Base', 'Acceso al Taller Mágico', 'Sticker Pack Digital'] },
                { name: 'Rama', price: '180000', period: 'Semestral', color: '#C14B3A', id: 'gold', benefits: ['Todo lo Trimestral', 'Regalo de Cumpleaños', 'Sorteos Exclusivos', 'Unboxing VIP'] },
                { name: 'Espíritu', price: '320000', period: 'Anual', color: '#D4AF37', id: 'founder', featured: true, benefits: ['ENVÍOS GRATIS SIEMPRE', 'Todo lo Semestral', 'Carnet Físico Clan', 'Rango Leyenda VIP'] }
              ];
              const currentPlan = plans.find(p => p.id === user.membership);

              return (
                <div className="text-center space-y-12 py-8">
                  <div className="space-y-4">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-[#3A332F] shadow-lg animate-bounce-subtle mb-6">
                      <Crown style={{ color: currentPlan?.color || '#3A332F' }} size={40} />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter">Mi Pacto <span style={{ color: currentPlan?.color || '#C14B3A' }}>{currentPlan?.name}</span></h2>
                    <p className="text-[#8C8279] font-black uppercase tracking-[0.3em] text-xs">Eres parte de la leyenda del bosque</p>
                  </div>

                  <div className="max-w-2xl mx-auto bg-white p-10 rounded-[50px] border-4 border-[#3A332F] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
                    <h3 className="text-2xl font-ghibli-title text-[#3A332F] uppercase mb-8 border-b-2 border-[#FDF5E6] pb-4">Tus Privilegios Activos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {currentPlan?.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-full bg-[#FDF5E6] flex items-center justify-center text-[#C14B3A] group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={20} />
                          </div>
                          <span className="font-bold text-[#3A332F] text-sm md:text-base">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-[#3A332F]/60 text-xs font-bold uppercase tracking-widest mb-6">Tu membresía se renueva automáticamente</p>
                    <button onClick={() => setIsSubscriptionModalOpen(false)} className="bg-[#3A332F] text-white font-ghibli-title py-4 px-12 rounded-full text-lg shadow-lg hover:bg-[#C14B3A] transition-all uppercase tracking-widest">VOLVER AL BOSQUE</button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Vista de Selección de Planes (Original) */
            <div className="text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter">Gremio <span className="text-[#C14B3A]">Tanuki</span></h2>
                <p className="text-[#8C8279] font-black uppercase tracking-[0.3em] text-xs">Forja tu destino con el Clan más exclusivo de coleccionistas</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {[
                  { name: 'Semilla', price: '40000', period: 'Mensual', color: '#4A6741', id: 'bronze', benefits: ['Insignia del Clan', 'Chat Exclusivo', 'Soporte Prioritario', 'Preventas 24h'] },
                  { name: 'Brote', price: '100000', period: 'Trimestral', color: '#5D4037', id: 'silver', benefits: ['Todo lo Mensual', '5% OFF Base', 'Acceso al Taller Mágico', 'Sticker Pack Digital'] },
                  { name: 'Rama', price: '180000', period: 'Semestral', color: '#C14B3A', id: 'gold', benefits: ['Todo lo Trimestral', 'Regalo de Cumpleaños', 'Sorteos Exclusivos', 'Unboxing VIP'] },
                  { name: 'Espíritu', price: '320000', period: 'Anual', color: '#D4AF37', id: 'founder', featured: true, benefits: ['ENVÍOS GRATIS SIEMPRE', 'Todo lo Semestral', 'Carnet Físico Clan', 'Rango Leyenda VIP'] }
                ].map((plan) => (
                  <div key={plan.id} className={`relative bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border-4 border-[#3A332F] space-y-6 md:space-y-8 flex flex-col transition-all hover:-translate-y-4 shadow-xl ${plan.featured ? 'ring-4 ring-[#C14B3A]/20 scale-100 md:scale-105 z-10' : ''}`}>
                    {plan.featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C14B3A] text-white px-6 py-1 rounded-full text-[10px] font-ghibli-title uppercase tracking-widest shadow-lg">Más Popular</div>}
                    <div className="space-y-2 text-center">
                      <div className="w-16 h-16 bg-[#FDF5E6] rounded-2xl mx-auto flex items-center justify-center border-2 border-[#3A332F] shadow-sm"><Crown style={{ color: plan.color }} size={28} /></div>
                      <h3 className="font-ghibli-title text-2xl uppercase text-[#3A332F] pt-2">{plan.name}</h3>
                      <p className="text-[10px] font-black uppercase text-[#8C8279] tracking-widest">{plan.period}</p>
                    </div>
                    <div className="text-center"><p className="text-3xl md:text-4xl font-ghibli-title text-[#C14B3A] tracking-tighter"><span className="text-lg mr-1">$</span>{formatCurrency(Number(plan.price))}</p></div>
                    <ul className="flex-grow space-y-3">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3 text-left">
                          <CheckCircle2 size={16} className={plan.featured ? "text-[#C14B3A]" : "text-[#81C784]"} />
                          <span className={`text-[11px] font-bold ${benefit.includes('GRATIS') ? 'text-[#C14B3A] font-black underline decoration-2' : 'text-[#3A332F]'}`}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => {
                      const subProduct: Product = {
                        id: `sub-${plan.id}`,
                        name: `Membresía ${plan.name} (${plan.period})`,
                        category: 'Limited',
                        price: parseFloat(plan.price),
                        description: `Acceso y privilegios del Clan Tanuki - Nivel ${plan.name}`,
                        image: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
                        stock: 999,
                        rating: 5,
                        benefits: plan.benefits
                      };
                      setCart(prev => [...prev.filter(item => !item.id.startsWith('sub-')), { ...subProduct, quantity: 1 }]);
                      setIsSubscriptionModalOpen(false);
                      setIsCheckoutOpen(true);
                    }} className={`w-full py-4 rounded-full font-ghibli-title text-sm transition-all shadow-md active:scale-95 ${plan.featured ? 'bg-[#C14B3A] text-white hover:bg-[#3A332F]' : 'bg-[#3A332F] text-white hover:bg-[#C14B3A]'}`}>FORJAR PACTO</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {isRouletteOpen && (
      <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 flex items-center justify-center p-6 overflow-y-auto backdrop-blur-md">
        <div className="bg-[#FDF5E6] w-full max-w-2xl rounded-[60px] p-8 md:p-14 relative animate-pop text-center space-y-10 border-8 border-[#3A332F] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <button onClick={() => setIsRouletteOpen(false)} className="absolute top-8 right-8 hover:rotate-90 transition-transform bg-white/80 p-2 rounded-full shadow-lg z-50 text-[#3A332F]"><X size={32} /></button>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-ghibli-title text-[#3A332F] uppercase leading-tight">Sorteo del <span className="text-[#C14B3A]">Bosque</span></h2>
            <p className="text-[#8C8279] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Invocando la sabiduría del Gremio Tanuki</p>
          </div>
          <div className="relative mx-auto w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            <div className="absolute -inset-6 rounded-full border-4 border-[#D4AF37]/20 border-dotted animate-spin-slow"></div>
            <div className="absolute -inset-2 rounded-full border-2 border-[#3A332F]/10"></div>
            <div className="absolute inset-0 rounded-full border-[20px] border-[#3A332F] shadow-[inset_0_0_30px_rgba(0,0,0,0.6),0_20px_40px_rgba(0,0,0,0.2)] z-10"></div>

            {/* The Wheel */}
            <div className="relative w-full h-full rounded-full overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.1, 0, 0.1, 1) bg-[#3A332F]" style={{ transform: `rotate(${rotation}deg)` }}>
              {segments.map((s, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full flex items-center justify-center origin-center"
                  style={{
                    transform: `rotate(${i * 60}deg)`,
                    clipPath: 'polygon(50% 50%, 21.2% 0%, 78.8% 0%)',
                    backgroundColor: s.color
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center pt-10 md:pt-14 font-ghibli-title pointer-events-none" style={{ color: s.text }}>
                    <span className="text-[10px] md:text-sm uppercase tracking-tighter leading-none mb-1 text-center font-ghibli-title px-4">{s.label}</span>
                    <Sparkles size={16} className="opacity-40 animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute w-12 h-12 md:w-16 md:h-16 bg-[#FDF5E6] rounded-full z-20 border-4 border-[#3A332F] flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="w-full h-full bg-[#3A332F]/5 flex items-center justify-center"><Zap size={20} className="text-[#D4AF37] animate-pulse" /></div>
            </div>

            {/* Pointer (Centered at Top) */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[30] flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-4 border-[#C14B3A] shadow-[0_5px_15px_rgba(193,75,58,0.4)] animate-bounce-subtle">
                <Crown className="text-[#D4AF37]" size={20} />
              </div>
              <div className="w-6 h-8 bg-[#C14B3A] clip-path-triangle rotate-180 -mt-2 shadow-sm"></div>
            </div>
          </div>
          <div className="min-h-[140px] flex flex-col items-center justify-center px-4">
            {isSpinning ? (
              <div className="space-y-4 text-center">
                <p className="font-ghibli-title text-[#C14B3A] text-2xl tracking-widest animate-pulse">EL DESTINO ESTÁ GIRANDO...</p>
                <div className="flex gap-3 justify-center"><div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce"></div><div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.4s]"></div></div>
              </div>
            ) : hasSpunFirst ? (
              <div className="animate-pop w-full">
                {appliedDiscount > 0 ? (
                  <div className="bg-white p-8 rounded-[40px] border-4 border-[#D4AF37] shadow-2xl space-y-3 relative overflow-hidden group"><div className="absolute inset-0 bg-[#D4AF37]/5 pointer-events-none"></div><p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#8C8279]">Gracia del Espíritu</p><h3 className="text-4xl md:text-5xl font-ghibli-title text-[#3A332F] leading-tight">¡TIENES UN <span className="text-[#C14B3A]">{appliedDiscount}% OFF</span>!</h3><p className="font-bold text-[#8C8279] text-sm mt-2">Guardado en tu esencia para la próxima compra.</p></div>
                ) : (
                  <div className="bg-[#3A332F]/5 p-8 rounded-[40px] border-4 border-[#3A332F]/10 space-y-3"><h3 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F] uppercase">INTENTO FALLIDO</h3><p className="font-bold text-[#8C8279] text-[10px] uppercase tracking-widest">Los vientos no soplaron a tu favor. Regresa en 24 horas.</p></div>
                )}
              </div>
            ) : (
              <button onClick={spinWheel} className="group relative px-20 py-6 md:px-28 md:py-8 rounded-full bg-[#3A332F] text-white font-ghibli-title text-xl md:text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-[#C14B3A] transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-white/20"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine"></div><span className="relative z-10 flex items-center gap-4">INVOCAR SUERTE <ArrowRight size={24} /></span></button>
            )}
          </div>
        </div>
      </div>
    )}

    {isCartOpen && (
      <div className="fixed inset-0 z-[2000] bg-[#3A332F]/80 backdrop-blur-sm flex justify-end">
        <div className="w-full md:w-[500px] h-full bg-white shadow-2xl animate-slide-in flex flex-col border-l-8 border-[#D4AF37]">
          <div className="p-8 border-b-4 border-[#FDF5E6] flex items-center justify-between">
            <h2 className="text-3xl font-ghibli-title text-[#3A332F] uppercase">Mi Carrito</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[#FDF5E6] rounded-full transition-all"><X size={28} /></button>
          </div>
          <div className="flex-grow overflow-y-auto p-8 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40"><ShoppingBag size={80} strokeWidth={1} /><p className="font-ghibli-title text-xl">Tu saco está vacío</p></div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-6 p-4 bg-[#FDF5E6]/30 rounded-[30px] border-2 border-transparent hover:border-[#C14B3A]/20 transition-all">
                  <img src={item.image} className="w-24 h-24 object-cover rounded-[20px] shadow-md" alt={item.name} />
                  <div className="flex-grow space-y-2">
                    <h4 className="font-ghibli-title text-[#3A332F]">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#C14B3A]"><span className="text-[#C14B3A]">$</span>{formatCurrency(item.price)}</span>
                      <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border-2 border-[#E6D5B8]">
                        {!item.id.startsWith('sub-') && <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>}
                        <span className="font-black text-sm">{item.quantity}</span>
                        {!item.id.startsWith('sub-') && <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>}
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[#3A332F]/20 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-8 bg-[#FDF5E6] space-y-6">
              <div className="flex justify-between text-2xl font-ghibli-title"><span>TOTAL</span><div className="text-right"><span className="text-[#C14B3A]"><span className="text-[#C14B3A]">$</span>{formatCurrency(cart.reduce((a, c) => a + (c.price * c.quantity), 0))}</span></div></div>
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-[#3A332F] text-white font-ghibli-title py-6 rounded-full text-lg shadow-xl hover:bg-[#C14B3A] transition-all uppercase tracking-widest">FINALIZAR PEDIDO</button>
            </div>
          )}
        </div>
      </div>
    )}

    <CheckoutModal
      isOpen={isCheckoutOpen}
      onClose={() => setIsCheckoutOpen(false)}
      cart={cart}
      total={cart.reduce((a, c) => a + (c.price * c.quantity), 0)}
      onUpdateQuantity={updateQuantity}
      onRemove={removeFromCart}
      user={user}
      onSuccess={() => {
        const subItem = cart.find(item => item.id.startsWith('sub-'));
        if (subItem) {
          const planId = subItem.id.replace('sub-', '');
          setUser(prev => ({ ...prev, membership: planId as any, isRegistered: true }));
        }
        setCart([]);
        setIsCheckoutOpen(false);
      }}
    />

    {selectedProduct && (
      <div className="fixed inset-0 z-[2100] bg-[#3A332F]/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
        <div className="bg-white w-full max-w-5xl h-fit max-h-[90vh] rounded-[60px] overflow-hidden flex flex-col md:flex-row border-8 border-white shadow-2xl animate-pop">
          <div className="w-full md:w-1/2 h-64 md:h-auto bg-[#FDF5E6] relative"><img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} /><button onClick={() => setSelectedProduct(null)} className="md:hidden absolute top-6 right-6 p-3 bg-white/90 rounded-full"><X size={24} /></button></div>
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="hidden md:block self-end p-3 hover:bg-[#FDF5E6] rounded-full transition-all mb-8"><X size={32} /></button>
            <div className="space-y-8 flex-grow">
              <span className="bg-[#C14B3A] text-white text-[10px] font-ghibli-title px-6 py-2 rounded-full uppercase tracking-widest">{selectedProduct.category}</span>
              <h2 className="text-4xl md:text-5xl font-ghibli-title text-[#3A332F] leading-tight uppercase">{selectedProduct.name}</h2>
              <p className="text-[#8C8279] text-lg font-bold leading-relaxed">{selectedProduct.description}</p>
              <div className="text-5xl font-ghibli-title text-[#3A332F] pt-6 border-t-4 border-[#FDF5E6]"><span className="text-[#C14B3A] text-2xl mr-2">$</span>{formatCurrency(selectedProduct.price)}</div>
              <div className="flex flex-col sm:flex-row gap-6 pt-10"><div className="flex items-center justify-between bg-[#FDF5E6] px-8 py-5 rounded-full border-4 border-[#E6D5B8] sm:w-48"><button onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}><Minus size={20} /></button><span className="font-ghibli-title text-2xl">{detailQuantity}</span><button onClick={() => setDetailQuantity(q => q + 1)}><Plus size={20} /></button></div><button onClick={() => addToCart(selectedProduct, detailQuantity)} className="flex-grow bg-[#3A332F] text-white font-ghibli-title py-6 rounded-full text-lg shadow-xl hover:bg-[#C14B3A] transition-all uppercase tracking-widest flex items-center justify-center gap-4">AÑADIR AL SACO <ArrowRight size={22} /></button></div>
            </div>
          </div>
        </div>
      </div>
    )}

    <footer className="bg-[#1A1614] text-[#FDF5E6] pt-32 pb-44 md:pb-12 rounded-t-[60px] md:rounded-t-[100px] mt-24 relative z-[50] border-t-8 border-[#D4AF37] shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-8 text-center md:text-left">
            <h3 className="text-4xl md:text-6xl font-ghibli-title leading-none uppercase tracking-tighter">TANUKI <br /><span className="text-[#D4AF37]">DEN</span></h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-loose">Tesoros con alma. El refugio de todo coleccionista de corazón en Colombia. Forjamos piezas legendarias para repisas épicas. 🇨🇴</p>
            <div className="flex justify-center md:justify-start gap-5">
              <button className="p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Instagram size={18} /></button>
              <button className="p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Facebook size={18} /></button>
              <button className="p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Twitter size={18} /></button>
              <button className="p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Youtube size={18} /></button>
            </div>
          </div>
          <div className="space-y-8 text-center md:text-left">
            <h4 className="font-ghibli-title text-2xl text-[#D4AF37] uppercase tracking-widest">El Gremio</h4>
            <ul className="space-y-5 font-bold text-[10px] uppercase tracking-[0.2em] text-white/60">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('inicio')}>Portal Inicio</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('figuras')}>Catálogo Total</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('personalizacion')}>Taller Mágico</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('colecciones')}>Explorar Temas</li>
            </ul>
          </div>
          <div className="space-y-8 text-center md:text-left">
            <h4 className="font-ghibli-title text-2xl text-[#D4AF37] uppercase tracking-widest">Soporte</h4>
            <ul className="space-y-5 font-bold text-[10px] uppercase tracking-[0.2em] text-white/60">
              <li className="hover:text-white cursor-pointer transition-colors">Seguir Tesoro</li>
              <li className="hover:text-white cursor-pointer transition-colors">Preguntas Frecuentes</li>
              <li className="hover:text-white cursor-pointer transition-colors">Términos Ancestrales</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacidad del Clan</li>
            </ul>
          </div>
          <div className="space-y-8 bg-white/5 p-8 rounded-[50px] border border-white/10 shadow-2xl mx-4 md:mx-0">
            <h4 className="font-ghibli-title text-2xl text-white uppercase tracking-widest">Susurros</h4>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Recibe novedades del bosque mágico.</p>
            <div className="relative">
              <input type="email" placeholder="tu@bosque.com" className="w-full bg-[#110E0C] border-2 border-white/10 rounded-full px-6 py-4 outline-none text-[10px] font-bold focus:border-[#D4AF37] transition-all" />
              <button className="absolute right-2 top-2 bottom-2 bg-[#D4AF37] text-white px-5 rounded-full hover:bg-white hover:text-[#D4AF37] transition-all shadow-lg"><ArrowRight size={18} /></button>
            </div>
            <div className="flex items-center gap-4 text-white/60 text-[8px] font-black uppercase tracking-widest justify-center"><Lock size={12} className="text-[#81C784]" /> PAGOS 100% SEGUROS</div>
          </div>
        </div>
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
          <p className="text-[8px] font-bold uppercase tracking-[0.4em]">© 2024 TANUKI DEN COLOMBIA - ESPÍRITU DE COLECCIÓN (v2.0 COP)</p>
          <div className="flex gap-4"><Shield size={16} /><Truck size={16} /><CreditCard size={16} /></div>
        </div>
      </div>
    </footer>



    <style>{`
        @keyframes slide-up { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pop { 0% { transform: scale(0.7); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes subtle-glow { 0%, 100% { box-shadow: 0 0 20px rgba(193, 75, 58, 0.2); } 50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.4); } }
        @keyframes shine { from { transform: translateX(-150%) rotate(45deg); } to { transform: translateX(250%) rotate(45deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-pop { animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-wiggle { animation: wiggle 3.5s ease-in-out infinite; }
        .animate-subtle-glow { animation: subtle-glow 8s ease-in-out infinite; }
        .animate-shine { animation: shine 3s infinite linear; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .clip-path-triangle { clip-path: polygon(50% 50%, 0% 100%, 100% 100%); }
      `}</style>
  </div>
);
};

export default App;
