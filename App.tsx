
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Minus, Trash2, X, Send, Sparkles, ShoppingBag, ShoppingCart,
  Star, Mail, MapPin, Instagram, Facebook, Twitter, Youtube,
  Video, Music2, Printer, ThumbsUp, ThumbsDown, ChevronRight, ArrowRight,
  Gift, Ticket, Lock, User as UserIcon, MessageSquare, Camera, Phone, CheckCircle2, Calendar, Map, Heart, PenLine, Crown, Zap, ShieldCheck, Truck, Shield, Clock, RotateCcw, Edit3, Save, UserPlus, Upload, Image as ImageIcon, CreditCard, Wallet, Landmark, QrCode, Home, Palette, Compass, Layers, Gem, Box, MoveLeft, ArrowLeft, ZoomIn
} from 'lucide-react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { Product, CartItem, UserMessage, Review, User as UserType, Collection } from './types';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import { PRODUCTS as INITIAL_PRODUCTS, heroText } from './constants';

import { supabase } from './src/lib/supabase';
import { formatCurrency } from './src/lib/utils';
import { useLocation, Routes, Route } from 'react-router-dom';
import { CheckoutSuccess } from './src/pages/CheckoutSuccess';
import { CheckoutCancel } from './src/pages/CheckoutCancel';
import { AdminDashboard } from './src/pages/AdminDashboard';

import { DebugNetwork } from './src/pages/DebugNetwork';
import { DebugEmail } from './src/pages/DebugEmail';

// Helper to handle base64 conversion
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  console.log("TANUKI APP VERSION: 3.5 - PROD RESTORED + TEMPLATE FIX (BUILD " + new Date().toISOString() + ")");



  // DEBUG CHECK ENV VARS
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-600 font-bold p-10 text-center">ERROR CRÍTICO: Faltan Variables de Entorno (Supabase) en Vercel.</div>;
  }

  const location = useLocation();

  const isCheckout = location.pathname.includes('/checkout');
  const isAdmin = location.pathname.includes('/admin');
  const isDebug = location.pathname.includes('/debug');

  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(() => {
    const savedReviews = localStorage.getItem('tanuki_all_reviews');
    const reviewsMap = savedReviews ? JSON.parse(savedReviews) : {};
    return INITIAL_PRODUCTS.map(p => ({
      ...p,
      reviews: reviewsMap[p.id] || []
    }));
  });

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isWritingReview, setIsWritingReview] = useState(false); // New state for toggling form

  // ... (existing state)

  if (isDebug) {
    return <Routes>
      <Route path="/debug" element={<DebugNetwork />} />
      <Route path="/debug-email" element={<DebugEmail />} />
    </Routes>;
  }



  // 1. Initialize User FIRST so other states can depend on user.id
  const [user, setUser] = useState<UserType>(() => {
    // 1. Try Session Storage (Fastest)
    const savedSession = sessionStorage.getItem('tanuki_user');
    if (savedSession) {
      try { return JSON.parse(savedSession); } catch (e) { }
    }
    // 2. Try Local Storage (Persistent)
    const savedLocal = localStorage.getItem('tanuki-auth-token');
    if (savedLocal) {
      try {
        const session = JSON.parse(savedLocal);
        const meta = session.user.user_metadata || {};
        return {
          id: session.user.id,
          email: session.user.email,
          name: meta.full_name || meta.username || (session.user.email?.split('@')[0] || 'Aventurero'),
          realName: meta.full_name || '',
          isRegistered: true,
          photo: meta.avatar_url || '/assets/default_avatar.png',
          membership: undefined,
          location: meta.location || '',
          birthDate: meta.birth_date || '',
          phone: meta.phone || ''
        };
      } catch (e) { console.error("Token parse error", e); }
    }
    // 3. Guest
    return {
      id: 'guest',
      name: 'Viajero',
      photo: '/assets/default_avatar.png',
      isRegistered: false,
      membership: undefined,
      location: '',
      birthDate: ''
    };
  });

  // 2. Initialize User-Scoped States
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`tanuki_favorites_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [hasSpunFirst, setHasSpunFirst] = useState(() => localStorage.getItem(`tanuki_has_spun_${user.id}`) === 'true');

  const [appliedDiscount, setAppliedDiscount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`tanuki_discount_${user.id}`);
      return saved ? Number(saved) : 0;
    } catch { return 0; }
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);


  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`tanuki_cart_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMobileReviews, setShowMobileReviews] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);





  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Review Photo State
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null);
  const [isUploadingReview, setIsUploadingReview] = useState(false);

  // Dynamic Collections State
  const [collections, setCollections] = useState<Collection[]>([]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Fetch Collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase.from('collections').select('*').order('id');
        if (data) setCollections(data);
      } catch (e) { console.error("Error fetching collections", e); }
    };
    fetchCollections();
  }, []);

  // Fetch Reviews (Directly from table to avoid Product sync issues)
  const fetchReviews = async () => {
    try {
      const { data } = await supabase.from('reviews').select('*');
      if (data) {
        // Group by product_id
        const reviewsByProduct: Record<string, any[]> = {};
        data.forEach(r => {
          const pid = String(r.product_id); // Normalize ID
          if (!reviewsByProduct[pid]) reviewsByProduct[pid] = [];

          let parsedImages: string[] = [];
          try {
            if (Array.isArray(r.images)) parsedImages = r.images;
            else if (typeof r.images === 'string') {
              if (r.images.startsWith('[')) parsedImages = JSON.parse(r.images);
              else if (r.images.startsWith('{')) parsedImages = r.images.replace(/[{}"]/g, '').split(',').filter(Boolean);
              else parsedImages = [r.images];
            }
          } catch (e) { parsedImages = []; }

          reviewsByProduct[pid].push({
            id: r.id,
            userName: r.user_name,
            rating: r.rating,
            comment: r.comment,
            date: r.created_at,
            images: parsedImages
          });
        });

        setProducts(prev => prev.map(p => {
          const pid = String(p.id);
          if (reviewsByProduct[pid]) {
            return {
              ...p,
              reviews: reviewsByProduct[pid].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
          }
          return { ...p, reviews: [] }; // Clear if no remote reviews found (optional, keeps sync strict)
        }));
      }
    } catch (e) { console.error("Error fetching reviews", e); }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Lock Body Scroll when Modal is Open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden'; // Lock text html as well
      document.body.style.position = 'fixed'; // Nuclear option for mobile
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [selectedProduct]);



  // PERMANENCE ENGINE: User-Scoped Data Sync
  const [isCloudInitialized, setIsCloudInitialized] = useState(false);

  // PERMANENCE ENGINE: User-Scoped Data Sync & Cloud Restore
  useEffect(() => {
    const refreshProfile = async () => {
      // 1. Load Local Data (Instant)
      try {
        setFavorites(JSON.parse(localStorage.getItem(`tanuki_favorites_${user.id}`) || '[]'));
        setAppliedDiscount(Number(localStorage.getItem(`tanuki_discount_${user.id}`) || 0));
        setCart(JSON.parse(localStorage.getItem(`tanuki_cart_${user.id}`) || '[]'));
        setHasSpunFirst(localStorage.getItem(`tanuki_has_spun_${user.id}`) === 'true');
      } catch (e) { console.error("Local load error", e); }

      // 2. Load Cloud Data (Async Upgrade)
      if (user.id === 'guest') {
        setIsCloudInitialized(true);
        return;
      }

      setIsCloudInitialized(false);
      const stored = localStorage.getItem('tanuki-auth-token');
      if (!stored) { setIsCloudInitialized(true); return; }

      try {
        const session = JSON.parse(stored);

        // Fetch Profile manually
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          const profiles = await res.json();
          if (profiles && profiles.length > 0) {
            const profile = profiles[0];
            console.log("[BG] Profile refreshed:", profile);

            // Update User Identity
            setUser(prev => ({
              ...prev,
              membership: profile.membership || prev.membership,
              photo: profile.avatar_url || prev.photo,
              location: profile.location || prev.location,
              birthDate: profile.birth_date || prev.birthDate,
              phone: profile.phone || prev.phone,
              realName: profile.full_name || prev.realName
            }));

            // CLOUD SYNC: Restore cross-device data from DB
            // Only overwrite local if DB has valid data
            if (profile.favorites && Array.isArray(profile.favorites)) setFavorites(profile.favorites);
            if (profile.cart && Array.isArray(profile.cart)) setCart(profile.cart);
            if (typeof profile.discount === 'number') setAppliedDiscount(profile.discount);
            if (typeof profile.has_spun === 'boolean') setHasSpunFirst(profile.has_spun);
          }
        }
      } catch (e) {
        console.error("[BG] Profile refresh failed", e);
      } finally {
        setIsCloudInitialized(true);
      }
    };

    refreshProfile();

    // 3. Realtime Subscription (Instant Sync across devices)
    // 3. Realtime Subscription (Instant Sync across devices)
    if (user.id !== 'guest') {
      const profileChannel = supabase.channel(`public:profiles:id=eq.${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          // console.log('[RT] Profile updated:', payload);
          const newFavs = payload.new.favorites;
          if (newFavs && Array.isArray(newFavs)) setFavorites(newFavs);
        })
        .subscribe();


      const reviewsChannel = supabase.channel('public:reviews')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => {
          fetchReviews();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(reviewsChannel);
      };
    }
  }, [user.id]);

  // Savers
  useEffect(() => { localStorage.setItem(`tanuki_favorites_${user.id}`, JSON.stringify(favorites)); }, [favorites, user.id]);
  useEffect(() => { localStorage.setItem(`tanuki_discount_${user.id}`, appliedDiscount.toString()); }, [appliedDiscount, user.id]);
  useEffect(() => { localStorage.setItem(`tanuki_cart_${user.id}`, JSON.stringify(cart)); }, [cart, user.id]);
  useEffect(() => { localStorage.setItem(`tanuki_has_spun_${user.id}`, String(hasSpunFirst)); }, [hasSpunFirst, user.id]);

  // CLOUD SYNC: Push updates to Supabase (Debounced)
  useEffect(() => {
    if (!user.isRegistered || user.id === 'guest' || !isCloudInitialized) return;

    const syncToCloud = async () => {
      try {
        await supabase.from('profiles').update({
          favorites: favorites,
          cart: cart,
          discount: appliedDiscount,
          has_spun: hasSpunFirst
        }).eq('id', user.id);
      } catch (e) { console.error("Cloud sync failed", e); }
    };

    const timeout = setTimeout(syncToCloud, 2000);
    return () => clearTimeout(timeout);
  }, [favorites, cart, appliedDiscount, hasSpunFirst, user.id, user.isRegistered, isCloudInitialized]);



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



  /* REMOVED: onAuthStateChange listener to prevent conflicts. 
     We rely 100% on tanuki-auth-token in localStorage. */

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
      try {
        console.log("Fetching public catalog via RAW FETCH...");
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          cache: 'no-store'
        });

        if (!response.ok) throw new Error('Catalog fetch failed');

        const data = await response.json();

        if (data && data.length > 0) {
          // Fetch Reviews for all products
          const { data: reviewsData, error: reviewsError } = await supabase.from('reviews').select('*');

          if (reviewsError) console.error("Error fetching reviews:", reviewsError);

          const reviewsByProduct = (reviewsData || []).reduce((acc: any, review: any) => {
            if (!acc[review.product_id]) acc[review.product_id] = [];
            acc[review.product_id].push({
              id: review.id,
              userName: review.user_name,
              rating: review.rating,
              comment: review.comment,
              date: review.created_at,
              images: [],
              likes: 0,
              dislikes: 0
            });
            return acc;
          }, {});

          setProducts(data.map((p: any) => {
            const productReviews = reviewsByProduct[p.id] || [];

            // Calculate Rating Logic
            let averageRating = 5.0;
            if (productReviews.length > 0) {
              const sum = productReviews.reduce((a: number, r: any) => a + r.rating, 0);
              averageRating = sum / productReviews.length;
            } else if (p.rating) {
              averageRating = p.rating; // Fallback to manual DB rating if no reviews
            }

            return {
              ...p,
              reviews: productReviews,
              // Ensure compatibility with Product type if DB has missing fields
              category: p.category || 'General',
              rating: averageRating,
              collectionId: p.collection_id || p.collectionId || null // Prioritize snake_case from DB
            };
          }));
        }
      } catch (err) {
        console.error("Error loading catalog:", err);
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

      // RESET ROULETTE CYCLE
      if (appliedDiscount > 0 || hasSpunFirst) {
        setAppliedDiscount(0);
        setHasSpunFirst(false); // Enable spin again for next purchase
      }

      alert('¡Pago completado con éxito! Gracias por tu compra.\n\n✨ ¡Tu energía se ha recargado! Puedes volver a girar la ruleta en tu próxima visita.');
      // remove params from url
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const toggleFavorite = async (id: string) => {
    // 1. Optimistic Update (Local)
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];

    setFavorites(newFavorites);
    localStorage.setItem(`tanuki_favorites_${user.id}`, JSON.stringify(newFavorites));

    // 2. Cloud Sync (Supabase)
    if (user.id !== 'auth_pending' && user.id !== 'guest') {
      try {
        await supabase.from('profiles').update({ favorites: newFavorites }).eq('id', user.id);
      } catch (e) { console.error("Error syncing favorites", e); }
    }
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

  const handleReviewSubmit = async () => {
    if (!user.isRegistered || user.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }
    if (!reviewComment.trim()) {
      alert("Por favor escribe tu leyenda (comentario).");
      return;
    }
    if (!selectedProduct) return;

    try {
      console.log('Sending review...');
      let imageUrls: string[] = [];

      // 1. Upload Photo if exists
      if (reviewPhoto) {
        setIsUploadingReview(true);
        try {
          const fileExt = reviewPhoto.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('reviews').upload(fileName, reviewPhoto);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        } catch (uploadEffect) {
          console.error("Error uploading review photo", uploadEffect);
          alert("No se pudo subir la foto, pero intentaremos guardar tu reseña.");
        } finally {
          setIsUploadingReview(false);
        }
      }

      const { data, error } = await supabase.from('reviews').insert({
        product_id: selectedProduct.id,
        user_id: user.id,
        user_name: user.name,
        rating: reviewRating,
        comment: reviewComment,
        images: JSON.stringify(imageUrls)
      }).select();

      if (error) throw error;

      // Optimistic Update
      const newReview = {
        id: data[0].id,
        userName: user.name,
        rating: reviewRating,
        comment: reviewComment,
        date: new Date().toISOString(),
        images: imageUrls,
        likes: 0,
        dislikes: 0
      };

      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id
          ? { ...p, reviews: [newReview, ...p.reviews] }
          : p
      ));

      // alert("¡Tu leyenda ha sido grabada en el bosque!"); // Removed as requested
      setIsWritingReview(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewPhoto(null);

      // Update Selected Product View
      setSelectedProduct(prev => prev ? { ...prev, reviews: [newReview, ...prev.reviews] } : null);

      setReviewComment('');
      setReviewRating(5);
      setIsWritingReview(false);
      alert("¡Tu leyenda ha sido grabada en el bosque!");

    } catch (e) {
      console.error("Error submitting review", e);
      alert("Hubo un error al guardar tu reseña. Intenta de nuevo.");
    }
  };

  const [userMsg, setUserMsg] = useState('');
  const [tallerConcept, setTallerConcept] = useState('Figura Personalizada');
  const [tallerDetails, setTallerDetails] = useState('');


  const handleTallerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tallerDetails.trim()) {
      alert("Por favor describe tu idea mágica ✨");
      return;
    }

    const phone = "573226870628";
    const message = `¡Hola Espíritu Tanuki! ✨\n\nHe tenido una visión y quiero que la hagas realidad en tu Taller Mágico... ✨\n\n✨ *La Idea:* ${tallerConcept}\n✨ *Los Detalles:* ${tallerDetails}\n\n¡Quedo atento a tu magia! ✨`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setTallerDetails(''); // Reset after sending
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
        localStorage.setItem(`tanuki_discount_${user.id}`, result.value.toString());
      }
      setHasSpunFirst(true);
      localStorage.setItem(`tanuki_has_spun_${user.id}`, 'true');
    }, 4000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'figuras':
        return (

          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-32 md:pb-24 space-y-12 section-reveal">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl lg:text-[5.5rem] font-ghibli-title text-[#3A332F] leading-[0.9] uppercase tracking-tighter">Catálogo <span className="text-[#C14B3A]">Completo</span></h2>
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                {['All', ...Array.from(new Set(products.map(p => p.category))).filter(c => c !== 'All'), 'Favoritos'].map(cat => (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-12">
              {products
                .filter(p => {
                  if (activeCategory === 'Favoritos') return favorites.includes(p.id);
                  return activeCategory === 'All' || p.category === activeCategory;
                })
                .map(product => {
                  const collectionTitle = collections.find(c => c.id === product.collectionId)?.title;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      collectionName={collectionTitle}
                      onAddToCart={(p) => addToCart(p, 1)}
                      onViewDetails={(p) => { setSelectedProduct(p); setDetailQuantity(1); }}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                    />
                  );
                })}
            </div>
          </div>
        );
      case 'personalizacion':
        return (
          <div className="max-w-7xl mx-auto px-6 pt-10 pb-32 md:pb-24 section-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <h2 className="text-4xl md:text-6xl lg:text-[7.5rem] font-ghibli-title text-[#3A332F] leading-[0.85] uppercase tracking-tighter">Taller <br /><span className="text-[#C14B3A]">Mágico.</span></h2>
                <p className="text-[#3A332F] text-xl md:text-2xl font-bold leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Crea algo único. Cuéntanos tu idea y la haremos realidad con el sello Tanuki.
                </p>
              </div>
              <div className="p-8 md:p-12 lg:p-16 rounded-[40px] border-4 border-[#3A332F] shadow-[15px_15px_0px_0px_#C14B3A] relative z-10 bg-[#FDF5E6] max-w-2xl mx-auto lg:max-w-none w-full">
                <form className="space-y-6" onSubmit={handleTallerSubmit}>
                  <div className="space-y-2">
                    <label className="font-ghibli-title text-[9px] md:text-sm uppercase tracking-widest text-[#3A332F] ml-2">¿Qué deseas crear?</label>
                    <select
                      value={tallerConcept}
                      onChange={(e) => setTallerConcept(e.target.value)}
                      className="w-full p-4 md:p-6 bg-white border-4 border-[#3A332F] rounded-[20px] font-bold text-sm md:text-xl outline-none transition-all cursor-pointer"
                    >
                      <option>Figura Personalizada</option>
                      <option>Camiseta Exclusiva</option>
                      <option>Cuadro o Ilustración</option>
                      <option>Accesorio Especial</option>
                      <option>Otra Idea Loca</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-ghibli-title text-[9px] md:text-sm uppercase tracking-widest text-[#3A332F] ml-2">Tus requerimientos</label>
                    <textarea
                      rows={4}
                      value={tallerDetails}
                      onChange={(e) => setTallerDetails(e.target.value)}
                      className="w-full p-5 md:p-8 bg-white border-4 border-[#3A332F] rounded-[25px] outline-none text-base font-medium shadow-inner"
                      placeholder="Describe aquí los detalles... (Colores, tamaño, referencia de anime, etc.)"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#C14B3A] text-white font-ghibli-title py-5 rounded-full text-base shadow-xl hover:bg-[#3A332F] transition-all flex items-center justify-center gap-4 group">
                    ENVIAR MI IDEA <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      case 'colecciones':
        if (selectedCollectionId) {
          const collection = collections.find(c => c.id === selectedCollectionId);
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
                      collectionName={collection?.title}
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
              {collections.map((item) => (
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
                <div className="text-center lg:text-left space-y-6 pt-8 md:pt-0">
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

      <div className="fixed bottom-4 md:bottom-12 right-6 z-[100] flex flex-col items-center gap-4">
        <button
          onClick={() => setIsRouletteOpen(true)}
          className={`w-12 h-12 md:w-16 md:h-16 bg-[#D4AF37] rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 relative overflow-hidden animate-wiggle ${hasSpunFirst ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
          <Gift className="text-white" size={24} />
          {!hasSpunFirst && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-shine"></div>}
        </button>
        <button
          onClick={() => window.open('https://wa.me/573226870628?text=%C2%A1Hola+Guardianes+del+Tanuki+Den!+He+visto+sus+tesoros+y+necesito+ayuda+para+mi+colecci%C3%B3n.+%C2%BFPodr%C3%ADan+asesorarme%3F', '_blank')}
          className="w-16 h-16 md:w-20 md:h-20 bg-[#3A332F] rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-float"
          aria-label="Contactar por WhatsApp"
        >
          <img src="/assets/whatsapp_custom.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="WhatsApp" />
        </button>
      </div>



      <main className="flex-grow relative z-10">{renderContent()}</main>



      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onComplete={handleAuthComplete}
      />

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm overflow-y-auto">
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
                className="bg-white w-full max-w-md rounded-[30px] md:rounded-[50px] p-6 md:p-8 border-4 md:border-8 relative animate-pop text-center space-y-6 md:space-y-8 my-auto"
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
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 flex items-start justify-center p-4 pt-4 md:p-6 md:pt-12 overflow-y-auto backdrop-blur-md">
          <div className="bg-[#FDF5E6] w-full max-w-6xl rounded-[40px] md:rounded-[60px] p-6 md:p-10 relative animate-pop border-4 md:border-4 border-white shadow-2xl my-8">
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
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#FDF5E6] w-full max-w-[340px] md:max-w-xl rounded-[30px] md:rounded-[50px] p-5 md:p-10 relative animate-pop text-center flex flex-col justify-between border-4 md:border-4 border-[#3A332F] shadow-[0_0_50px_rgba(0,0,0,0.5)] my-auto">
            <button onClick={() => setIsRouletteOpen(false)} className="absolute top-3 right-3 md:top-8 md:right-8 hover:rotate-90 transition-transform bg-white/80 p-1.5 md:p-2 rounded-full shadow-lg z-50 text-[#3A332F]"><X size={20} className="md:w-8 md:h-8" /></button>

            <div className="space-y-1 md:space-y-4 mb-2 md:mb-0 shrink-0">
              <h2 className="text-xl md:text-5xl font-ghibli-title text-[#3A332F] uppercase leading-tight">Sorteo del <span className="text-[#C14B3A]">Bosque</span></h2>
              <p className="text-[#8C8279] font-black uppercase tracking-[0.2em] text-[8px] md:text-xs">Invocando la sabiduría del Gremio Tanuki</p>
            </div>

            <div className="relative mx-auto w-60 h-60 md:w-96 md:h-96 flex items-center justify-center my-2 md:my-6 shrink-0">
              <div className="absolute -inset-3 md:-inset-6 rounded-full border-4 border-[#D4AF37]/20 border-dotted animate-spin-slow"></div>
              <div className="absolute -inset-1 md:-inset-2 rounded-full border-2 border-[#3A332F]/10"></div>
              <div className="absolute inset-0 rounded-full border-[10px] md:border-[20px] border-[#3A332F] shadow-[inset_0_0_30px_rgba(0,0,0,0.6),0_20px_40px_rgba(0,0,0,0.2)] z-10"></div>

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
                    <div className="w-full h-full flex flex-col items-center pt-8 md:pt-14 font-ghibli-title pointer-events-none" style={{ color: s.text }}>
                      <span className="text-[9px] md:text-sm uppercase tracking-tighter leading-none mb-1 text-center font-ghibli-title px-4">{s.label}</span>
                      <Sparkles size={12} className="opacity-40 animate-pulse mt-1 md:mt-2" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute w-10 h-10 md:w-16 md:h-16 bg-[#FDF5E6] rounded-full z-20 border-4 border-[#3A332F] flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-[#3A332F]/5 flex items-center justify-center"><Zap size={16} className="text-[#D4AF37] animate-pulse md:w-5 md:h-5" /></div>
              </div>

              {/* Pointer (Centered at Top) */}
              <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 z-[30] flex flex-col items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center border-4 border-[#C14B3A] shadow-[0_5px_15px_rgba(193,75,58,0.4)] animate-bounce-subtle">
                  <Crown className="text-[#D4AF37] w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="w-4 h-6 md:w-6 md:h-8 bg-[#C14B3A] clip-path-triangle rotate-180 -mt-1 md:-mt-2 shadow-sm"></div>
              </div>
            </div>

            <div className="min-h-[100px] md:min-h-[140px] flex flex-col items-center justify-center shrink-0">
              {isSpinning ? (
                <div className="space-y-2 md:space-y-4 text-center">
                  <p className="font-ghibli-title text-[#C14B3A] text-lg md:text-2xl tracking-widest animate-pulse">EL DESTINO GIRA...</p>
                  <div className="flex gap-2 md:gap-3 justify-center"><div className="w-2 h-2 md:w-3 md:h-3 bg-[#D4AF37] rounded-full animate-bounce"></div><div className="w-2 h-2 md:w-3 md:h-3 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 md:w-3 md:h-3 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.4s]"></div></div>
                </div>
              ) : hasSpunFirst ? (
                <div className="animate-pop w-full">
                  {appliedDiscount > 0 ? (
                    <div className="bg-white p-4 md:p-8 rounded-[20px] md:rounded-[40px] border-2 md:border-4 border-[#D4AF37] shadow-2xl space-y-1 md:space-y-3 relative overflow-hidden group"><div className="absolute inset-0 bg-[#D4AF37]/5 pointer-events-none"></div><p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[#8C8279]">Gracia del Espíritu</p><h3 className="text-2xl md:text-5xl font-ghibli-title text-[#3A332F] leading-tight">¡<span className="text-[#C14B3A]">{appliedDiscount}% OFF</span>!</h3><p className="font-bold text-[#8C8279] text-[10px] md:text-sm mt-1">Guardado para tu próxima compra.</p></div>
                  ) : (
                    <div className="bg-[#3A332F]/5 p-4 md:p-8 rounded-[20px] md:rounded-[40px] border-2 md:border-4 border-[#3A332F]/10 space-y-2 md:space-y-3"><h3 className="text-xl md:text-3xl font-ghibli-title text-[#3A332F] uppercase">INTENTO FALLIDO</h3><p className="font-bold text-[#8C8279] text-[9px] md:text-[10px] uppercase tracking-widest">Los vientos no soplaron a tu favor.</p></div>
                  )}
                </div>
              ) : (
                <button onClick={spinWheel} className="group relative px-10 py-3 md:px-28 md:py-8 rounded-full bg-[#3A332F] text-white font-ghibli-title text-lg md:text-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:bg-[#C14B3A] transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-white/20"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine"></div><span className="relative z-10 flex items-center gap-2 md:gap-4">INVOCAR SUERTE <ArrowRight size={18} className="md:w-6 md:h-6" /></span></button>
              )}
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/80 backdrop-blur-sm flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div className="w-[85vw] max-w-[360px] md:w-[500px] h-full bg-white shadow-2xl animate-slide-in flex flex-col border-l-4 md:border-l-8 border-[#D4AF37] rounded-l-[30px] md:rounded-l-none overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-8 border-b-4 border-[#FDF5E6] flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F] uppercase">Mi Carrito</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[#FDF5E6] rounded-full transition-all"><X size={24} className="md:w-7 md:h-7" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40"><ShoppingBag size={80} strokeWidth={1} /><p className="font-ghibli-title text-xl">Tu saco está vacío</p></div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 md:gap-6 p-4 bg-[#FDF5E6]/30 rounded-[20px] md:rounded-[30px] border-2 border-transparent hover:border-[#C14B3A]/20 transition-all">
                    <img src={item.image} className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-[15px] md:rounded-[20px] shadow-md" alt={item.name} />
                    <div className="flex-grow space-y-2">
                      <h4 className="font-ghibli-title text-[#3A332F] text-sm md:text-base leading-tight">{item.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#C14B3A] text-xs md:text-base"><span className="text-[#C14B3A]">$</span>{formatCurrency(item.price)}</span>
                        <div className="flex items-center gap-2 md:gap-4 bg-white px-2 md:px-4 py-1 md:py-2 rounded-full border-2 border-[#E6D5B8]">
                          {!item.id.startsWith('sub-') && <button onClick={() => updateQuantity(item.id, -1)}><Minus size={12} className="md:w-4 md:h-4" /></button>}
                          <span className="font-black text-xs md:text-sm">{item.quantity}</span>
                          {!item.id.startsWith('sub-') && <button onClick={() => updateQuantity(item.id, 1)}><Plus size={12} className="md:w-4 md:h-4" /></button>}
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-[#3A332F]/20 hover:text-red-500 transition-colors"><Trash2 size={16} className="md:w-5 md:h-5" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 md:p-8 bg-[#FDF5E6] space-y-4 md:space-y-6">
                {appliedDiscount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm md:text-base font-bold text-[#8C8279]">
                      <span>Subtotal</span>
                      <span className="line-through">${formatCurrency(cart.reduce((a, c) => a + (c.price * c.quantity), 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm md:text-base font-black text-[#C14B3A] animate-pulse">
                      <span>🎉 Descuento ({appliedDiscount}%)</span>
                      <span>-${formatCurrency(cart.reduce((a, c) => a + (c.price * c.quantity), 0) * (appliedDiscount / 100))}</span>
                    </div>
                    <div className="flex justify-between text-xl md:text-2xl font-ghibli-title pt-2 border-t border-[#3A332F]/10">
                      <span>TOTAL</span>
                      <span className="text-[#C14B3A]"><span className="text-[#C14B3A]">$</span>{formatCurrency(cart.reduce((a, c) => a + (c.price * c.quantity), 0) * (1 - appliedDiscount / 100))}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-xl md:text-2xl font-ghibli-title"><span>TOTAL</span><div className="text-right"><span className="text-[#C14B3A]"><span className="text-[#C14B3A]">$</span>{formatCurrency(cart.reduce((a, c) => a + (c.price * c.quantity), 0))}</span></div></div>
                )}
                <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-[#3A332F] text-white font-ghibli-title py-4 md:py-6 rounded-full text-base md:text-lg shadow-xl hover:bg-[#C14B3A] transition-all uppercase tracking-widest">FINALIZAR PEDIDO</button>
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
        discount={appliedDiscount}
        onSuccess={() => {
          const subItem = cart.find(item => item.id.startsWith('sub-'));
          if (subItem) {
            const planId = subItem.id.replace('sub-', '');
            setUser(prev => ({ ...prev, membership: planId as any, isRegistered: true }));
          }
          setCart([]);
          setIsCheckoutOpen(false);

          // RESET ROULETTE CYCLE
          if (appliedDiscount > 0 || hasSpunFirst) {
            setAppliedDiscount(0);
            setHasSpunFirst(false); // Enable spin again for next purchase
          }
        }}
      />

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 md:bg-[#3A332F]/90 backdrop-blur-sm md:backdrop-blur-md flex items-center justify-center p-4 md:p-8 cursor-pointer overflow-hidden"
          onClick={() => { setSelectedProduct(null); setShowMobileReviews(false); }}
        >
          {/* Mobile "Window" Modal */}
          <div
            className="bg-white w-[90vw] h-[85vh] md:h-auto md:w-full md:max-w-5xl md:max-h-[85vh] rounded-[30px] md:rounded-[60px] block md:flex md:flex-row border-4 md:border-8 border-[#D4AF37] shadow-2xl animate-pop cursor-default relative overflow-y-auto md:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => { setSelectedProduct(null); setShowMobileReviews(false); }}
              className="absolute top-3 right-3 md:top-6 md:right-6 z-50 p-2 bg-white/80 hover:bg-white text-[#3A332F] rounded-full shadow-lg transition-all border border-[#3A332F]/10"
            >
              <X size={20} className="md:w-8 md:h-8" />
            </button>

            {/* Mobile: View State Toggle (Product <-> Reviews) */}
            <div className="md:hidden absolute top-3 left-3 z-50">
              {!showMobileReviews ? (
                <button onClick={() => setShowMobileReviews(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur shadow-md rounded-full text-xs font-bold text-[#3A332F] border border-[#E6D5B8]">
                  <MessageSquare size={14} className="text-[#C14B3A]" />
                  <span>Reseñas</span>
                </button>
              ) : (
                <button onClick={() => setShowMobileReviews(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C14B3A] shadow-md rounded-full text-xs font-bold text-white">
                  <ArrowLeft size={14} />
                  <span>Producto</span>
                </button>
              )}
            </div>

            {/* MAIN CONTENT (Desktop: Always Visible | Mobile: Visible if !showMobileReviews) */}
            <div className={`w-full h-full transition-all duration-300 md:opacity-100 md:pointer-events-auto ${showMobileReviews ? 'hidden md:flex md:flex-row' : 'flex flex-col md:flex-row'}`}>

              {/* Image Section */}
              <div className="h-[220px] md:h-auto w-full md:w-1/2 bg-[#FDF5E6] relative group flex shrink-0 items-center justify-center overflow-hidden">
                <img
                  src={selectedProduct.image}
                  className="w-full h-full object-cover object-center md:rounded-l-[50px] md:cursor-zoom-in"
                  alt={selectedProduct.name}
                  onClick={() => setFullScreenImage(selectedProduct.image)}
                />
                {/* Desktop Zoom Button */}
                <button
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md p-4 rounded-full text-white border border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl pointer-events-none md:pointer-events-auto hidden md:block"
                  aria-label="Zoom Image"
                >
                  <ZoomIn size={32} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[9px] px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none md:hidden flex items-center gap-1 z-10 font-bold border border-white/10">
                  <Sparkles size={8} /> Zoom
                </div>

                {/* Mobile: Rating Overlay (Bottom Left) */}
                <div className="absolute bottom-3 left-3 bg-black/40 text-[#D4AF37] px-2 py-1 rounded-full backdrop-blur-sm md:hidden flex items-center gap-1 z-10 border border-white/10">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-white ml-1">({selectedProduct.reviews?.length || 0})</span>
                </div>
              </div>

              {/* Details Section */}
              <div className="flex-1 flex flex-col p-5 md:p-12 md:max-h-full md:overflow-hidden bg-white relative">

                <div className="space-y-2 md:space-y-4 text-center md:text-left">
                  <span className="hidden md:inline-block bg-[#C14B3A]/10 text-[#C14B3A] text-[9px] font-bold md:font-ghibli-title md:text-white md:bg-[#C14B3A] px-3 py-1 md:px-6 md:py-2 rounded-full uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-xl md:text-5xl font-ghibli-title text-[#3A332F] leading-tight uppercase line-clamp-2 md:line-clamp-none">
                    {selectedProduct.name}
                  </h2>

                  {/* Desktop Reviews Summary: Adjusted to match mobile style */}
                  <div className="hidden md:flex items-center gap-2 justify-center md:justify-start">
                    <div className="flex items-center gap-1 bg-[#FDF5E6] px-3 py-1.5 rounded-full border border-[#F0E6D2]">
                      <Star size={16} className="text-[#C14B3A] fill-[#C14B3A]" />
                      <span className="text-sm font-bold text-[#3A332F]">{selectedProduct.rating}</span>
                    </div>
                    <span className="text-xs font-ghibli-title uppercase text-[#8C8279] tracking-wider px-2 border-l border-[#8C8279]/30">
                      {collections.find(c => c.id === selectedProduct.collectionId)?.title || "Colección Especial"}
                    </span>
                    <span className="text-[10px] font-bold text-[#8C8279] underline ml-2 cursor-pointer hover:text-[#C14B3A] transition-colors">
                      {selectedProduct.reviews?.length || 0} Opiniones
                    </span>
                  </div>

                  {/* Desktop Review Buton */}
                  <div className="hidden md:block mt-2">
                    <button
                      onClick={() => {
                        setShowMobileReviews(true);
                        setIsWritingReview(false); // Open in "View" mode first
                      }}
                      className="text-[10px] uppercase font-bold text-[#C14B3A] border border-[#C14B3A] px-3 py-1 rounded-full hover:bg-[#C14B3A] hover:text-white transition-colors flex items-center gap-1 w-fit"
                    >
                      <MessageSquare size={12} /> Ver Opiniones
                    </button>
                  </div>
                </div>

                {/* Mobile: Full Description with internal scroll */}
                <div className="mt-4 flex-grow overflow-y-auto pr-2 custom-scrollbar min-h-0">
                  <p className="text-[#3A332F]/80 text-sm md:text-lg font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="flex-grow flex flex-col justify-end gap-4 mt-2 md:mt-8">
                  {/* Price */}
                  <div className="text-center md:text-left border-t border-[#F0E6D2] pt-3 md:pt-6 md:border-none">
                    <span className="font-ghibli-title text-3xl md:text-5xl text-[#3A332F]">
                      <span className="text-[#C14B3A] text-lg md:text-2xl mr-1">$</span>{formatCurrency(selectedProduct.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 md:gap-6">
                    {/* Qty */}
                    <div className="flex items-center justify-between bg-[#FDF5E6] px-3 py-2 md:px-8 md:py-5 rounded-full border-2 border-[#E6D5B8] w-28 md:w-48 shrink-0">
                      <button onClick={() => setDetailQuantity(q => Math.max(1, q - 1))} className="p-1"><Minus size={14} className="md:w-5 md:h-5" /></button>
                      <span className="font-ghibli-title text-base md:text-2xl">{detailQuantity}</span>
                      <button onClick={() => setDetailQuantity(q => q + 1)} className="p-1"><Plus size={14} className="md:w-5 md:h-5" /></button>
                    </div>

                    {/* Add to Cart - Desktop: Icon Only requested */}
                    <button onClick={() => addToCart(selectedProduct, detailQuantity)} className="flex-grow bg-[#3A332F] text-white font-ghibli-title py-3 md:py-6 rounded-full text-xs md:text-lg shadow-lg hover:bg-[#C14B3A] transition-all uppercase tracking-widest flex items-center justify-center gap-2 md:gap-4 active:scale-95 group">
                      <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                      {/* Text hidden on both mobile (previously) and now desktop as per request "reemplazado por el ícono" */}
                    </button>
                  </div>
                </div>

                {/* Desktop: Ensure this footer is always visible */}
                <div className="flex-shrink-0 pt-4"></div>

              </div>
            </div>

            {/* REVIEWS CONTENT (Mobile & Desktop Overlay) */}
            <div className={`flex-col h-full bg-white px-4 pb-4 pt-12 ${showMobileReviews ? 'flex md:absolute md:inset-0 md:z-20 md:p-12' : 'hidden'} min-h-[60vh]`}>
              <div className="mt-2 flex-grow overflow-y-auto space-y-4 pb-8">
                <h3 className="font-ghibli-title text-xl text-[#3A332F] uppercase text-center mb-4">Opiniones del Gremio</h3>

                {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                  selectedProduct.reviews.map((r, i) => (
                    <div key={i} className="bg-[#FDF5E6]/40 p-4 rounded-[20px] space-y-2 border border-[#F0E6D2]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#3A332F] text-sm">{r.userName}
                          </h4>
                          <div className="flex text-[#D4AF37]">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                          {/* RAW DEBUGGING: Show exactly what is stored */}
                          {/* <pre className="text-[8px] text-blue-600 bg-gray-100 p-1 mt-1 rounded max-w-[200px] overflow-hidden">{JSON.stringify(r.images)}</pre> */}
                        </div>
                        <span className="text-[9px] text-[#8C8279] font-bold">{new Date(r.date).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-[#3A332F]/80 leading-tight">{r.comment}</p>
                      {
                        r.images && r.images.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                            {r.images.map((img, idx) => (
                              <img key={idx} src={img} className="w-16 h-16 object-cover rounded-lg border border-[#D4AF37]/30" alt="Review attachment" onClick={() => setFullScreenImage(img)} />
                            ))}
                          </div>
                        )
                      }
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center py-10 opacity-60 space-y-3">
                    <div className="w-16 h-16 bg-[#FDF5E6] rounded-full flex items-center justify-center mb-2">
                      <MessageSquare size={32} className="text-[#C14B3A]" />
                    </div>
                    <h4 className="font-ghibli-title text-lg text-[#3A332F]">Sin opiniones aún</h4>
                    <p className="text-xs text-[#8C8279] max-w-[200px]">Este tesoro espera su primera leyenda. ¡Sé el primero en contarla!</p>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-4 border-t border-[#F0E6D2]">
                {isWritingReview ? (
                  <div className="space-y-3 animate-slide-in">
                    <div className="flex justify-center gap-2 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform active:scale-95 hover:scale-110">
                          <Star size={24} fill={star <= reviewRating ? "#D4AF37" : "none"} className={star <= reviewRating ? "text-[#D4AF37]" : "text-[#D4AF37]/40"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Cuéntanos tu historia..."
                      className="w-full p-3 bg-[#FDF5E6] border-2 border-[#D4AF37]/30 rounded-2xl outline-none text-[#3A332F] text-xs font-medium resize-none h-20"
                    />

                    {/* Photo Upload Preview & Button */}
                    <div className="flex items-center gap-2">
                      <label className={`cursor-pointer p-2 rounded-full border border-[#C14B3A]/30 text-[#C14B3A] hover:bg-[#C14B3A] hover:text-white transition-all ${reviewPhoto ? 'bg-[#C14B3A] text-white' : 'bg-white'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) setReviewPhoto(e.target.files[0]);
                        }} />
                        <Camera size={16} />
                      </label>
                      {reviewPhoto && (
                        <div className="flex items-center gap-2 bg-[#FDF5E6] px-2 py-1 rounded-lg border border-[#D4AF37]/20">
                          <span className="text-[10px] text-[#3A332F] truncate max-w-[100px]">{reviewPhoto.name}</span>
                          <button onClick={() => setReviewPhoto(null)}><X size={12} className="text-[#C14B3A]" /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsWritingReview(false)} className="flex-1 py-2 bg-gray-200 text-[#3A332F] font-bold rounded-full text-[10px] uppercase tracking-widest hover:bg-gray-300 transition-colors">Cancelar</button>
                      <button type="button" onClick={handleReviewSubmit} className="flex-1 py-2 bg-[#C14B3A] text-white font-bold rounded-full text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#8B362A] transition-colors">Enviar</button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user.isRegistered) {
                        setShowMobileReviews(false);
                        setSelectedProduct(null);
                        setIsAuthModalOpen(true);
                        return;
                      };
                      setIsWritingReview(true);
                    }}
                    className="w-full py-3 bg-[#FDF5E6] text-[#C14B3A] font-bold rounded-full text-xs uppercase tracking-widest border border-[#C14B3A]/20 hover:bg-[#C14B3A] hover:text-white transition-all"
                  >
                    Escribir Reseña
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Reviews: Re-inject original logic if needed, or keeping it hidden for now as per mobile focus. 
                I'll allow desktop to just show the main content. The user said "Also for desktop... wait no, user said 'Recuerda que es sólo en la versión móvil'".
                So I should maintain desktop as best as I can. 
                The previous desktop layout had Image | Info (with reviews inside Info or separate).
                I'll leave it simple for now to avoid breaking desktop logic too much, sticking to what I verified.
            */}

          </div>
        </div>
      )
      }

      <footer className="bg-[#1A1614] text-[#FDF5E6] pt-12 pb-24 md:pt-32 md:pb-12 rounded-t-[40px] md:rounded-t-[100px] mt-12 md:mt-24 relative z-[50] border-t-8 border-[#D4AF37] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 space-y-12 md:space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16 text-center md:text-left">
            <div className="space-y-4 md:space-y-8">
              <h3 className="text-3xl md:text-6xl font-ghibli-title leading-none uppercase tracking-tighter">TANUKI <br /><span className="text-[#D4AF37]">DEN</span></h3>
              <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] leading-loose max-w-xs mx-auto md:mx-0">Tesoros con alma. El refugio de todo coleccionista de corazón en Colombia.</p>
              <div className="flex justify-center md:justify-start gap-5">
                <button className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Instagram size={16} className="md:w-[18px] md:h-[18px]" /></button>
                <button className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Facebook size={16} className="md:w-[18px] md:h-[18px]" /></button>
                <button className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Twitter size={16} className="md:w-[18px] md:h-[18px]" /></button>
                <button className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-[#D4AF37] transition-all"><Youtube size={16} className="md:w-[18px] md:h-[18px]" /></button>
              </div>
              {/* Accordion-style sections for mobile could be nice, but simple hiding is safer for now */}
            </div>

            {/* Desktop-only sections */}
            <div className="hidden md:block space-y-8">
              <h4 className="font-ghibli-title text-2xl text-[#D4AF37] uppercase tracking-widest">El Gremio</h4>
              <ul className="space-y-5 font-bold text-[10px] uppercase tracking-[0.2em] text-white/60">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('inicio')}>Portal Inicio</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('figuras')}>Catálogo Total</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('personalizacion')}>Taller Mágico</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleNavClick('colecciones')}>Explorar Temas</li>
              </ul>
            </div>

            <div className="hidden md:block space-y-8">
              <h4 className="font-ghibli-title text-2xl text-[#D4AF37] uppercase tracking-widest">Soporte</h4>
              <ul className="space-y-5 font-bold text-[10px] uppercase tracking-[0.2em] text-white/60">
                <li className="hover:text-white cursor-pointer transition-colors">Seguir Tesoro</li>
                <li className="hover:text-white cursor-pointer transition-colors">Preguntas Frecuentes</li>
                <li className="hover:text-white cursor-pointer transition-colors">Términos Ancestrales</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacidad del Clan</li>
              </ul>
            </div>

            <div className="space-y-4 md:space-y-8 bg-white/5 p-6 md:p-8 rounded-[30px] md:rounded-[50px] border border-white/10 shadow-2xl mx-2 md:mx-0">
              {/* Simplified Newsletter for mobile */}
              <h4 className="font-ghibli-title text-xl md:text-2xl text-white uppercase tracking-widest">Susurros</h4>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest hidden md:block">Recibe novedades del bosque mágico.</p>
              <div className="relative">
                <input type="email" placeholder="tu@email.com" className="w-full bg-[#110E0C] border-2 border-white/10 rounded-full px-4 py-3 md:px-6 md:py-4 outline-none text-[10px] font-bold focus:border-[#D4AF37] transition-all" />
                <button className="absolute right-1 top-1 bottom-1 md:right-2 md:top-2 md:bottom-2 bg-[#D4AF37] text-white px-3 md:px-5 rounded-full hover:bg-white hover:text-[#D4AF37] transition-all shadow-lg"><ArrowRight size={14} className="md:w-[18px] md:h-[18px]" /></button>
              </div>
              <div className="flex items-center gap-4 text-white/60 text-[8px] font-black uppercase tracking-widest justify-center"><Lock size={12} className="text-[#81C784]" /> PAGOS SEGUROS</div>
            </div>
          </div>

          <div className="pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 opacity-40">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-center">© 2024 TANUKI DEN COLOMBIA</p>
            <div className="flex gap-4"><Shield size={16} /><Truck size={16} /><CreditCard size={16} /></div>
          </div>
        </div>
      </footer>



      {/* Fullscreen Image Overlay */}
      {
        fullScreenImage && (
          <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-2 animate-fade-in" onClick={() => setFullScreenImage(null)}>
            <button className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32} /></button>
            <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl scale-100 animate-pop" alt="Zoom" />
          </div>
        )
      }

      <style>{`
        @keyframes slide-up { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pop { 0% { transform: scale(0.7); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes subtle-glow { 0%, 100% { box-shadow: 0 0 20px rgba(193, 75, 58, 0.2); } 50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.4); } }
        @keyframes shine { from { transform: translateX(-150%) rotate(45deg); } to { transform: translateX(250%) rotate(45deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-pop { animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-wiggle { animation: wiggle 3.5s ease-in-out infinite; }
        .animate-subtle-glow { animation: subtle-glow 8s ease-in-out infinite; }
        .animate-shine { animation: shine 3s infinite linear; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .clip-path-triangle { clip-path: polygon(50% 50%, 0% 100%, 100% 100%); }
      `}</style>
    </div >
  );
};

export default App;
