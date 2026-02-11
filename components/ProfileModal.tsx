import React, { useState, useEffect } from 'react';
import { X, Camera, Edit3, Mail, MapPin, Phone, Package, Heart, User as UserIcon, LogOut, ChevronRight, ExternalLink, Share2, Sparkles, Trophy, CheckCircle2, Lock, Flame } from 'lucide-react';
import { User, Product, Mission, UserMission } from '../types';
import { supabase } from '../src/lib/supabase';
import ProductCard from './ProductCard'; // Assuming you have this or need to move logic
import { formatCurrency } from '../src/lib/utils'; // You might need to move utils or duplicate formatCurrency

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    onLogout: () => void;
    products: Product[]; // Needed for wishlist
    favorites: string[];
    toggleFavorite: (id: string) => void;
    onOpenSubscription: () => void; // To forward the "Estatus del Clan" click
    onAddToCart: (products: Product[]) => void;
    // Missions Props
    initialTab?: 'profile' | 'orders' | 'wishlist' | 'missions';
    missions: Mission[];
    userMissions: Record<string, UserMission>;
    userCoins: number;
    onClaimReward: (missionId: string) => void;
    hasUnclaimedMissions?: boolean; // [NEW]
}

// Helper for currency if not available
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen, onClose, user, setUser, onLogout, products, favorites, toggleFavorite, onOpenSubscription, onAddToCart,
    initialTab = 'profile', missions, userMissions, userCoins, onClaimReward, hasUnclaimedMissions = false
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist' | 'missions'>('profile');
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Wishlist Selection State
    const [selectedWishlistItems, setSelectedWishlistItems] = useState<Set<string>>(new Set());

    // Icon mapping for missions
    const getMissionIcon = (iconName: string, completed: boolean) => {
        const className = `w-6 h-6 ${completed ? 'text-white' : 'text-[#3A332F]/40'}`;
        // Simple mapping based on icon string
        return <Trophy className={className} />;
    };

    // Colors based on membership
    const getAccentColor = () => {
        switch (user.membership) {
            case 'bronze': return '#4A6741';
            case 'silver': return '#5D4037';
            case 'gold': return '#C14B3A';
            case 'founder': return '#D4AF37';
            default: return '#3A332F';
        }
    };
    const accentColor = getAccentColor();

    useEffect(() => {
        if (isOpen) {
            // Set initial tab if provided, otherwise default to profile (or keep current if switching back? No, props change)
            // Ideally we reset on open if initialTab passed
            if (initialTab) setActiveTab(initialTab);

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            // Fetch orders when modal opens
            fetchOrders();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, user.id, initialTab]);

    const fetchOrders = async () => {
        if (!user.id) return;
        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (*)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (e) {
            console.error("Error fetching orders:", e);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setUser(prev => ({ ...prev, photo: publicUrl }));
            alert('¡Foto de perfil actualizada con éxito!');
        } catch (err: any) {
            console.error('Error uploading photo:', err);
            alert('No se pudo subir la foto.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div
                className="bg-[#FDF5E6] w-full max-w-5xl h-[85vh] rounded-[30px] md:rounded-[50px] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-pop border-4 relative"
                style={{ borderColor: accentColor }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-all md:hidden"
                >
                    <X size={24} color={accentColor} />
                </button>

                {/* Sidebar (Desktop) / Bottom Bar (Mobile) */}
                <div className="hidden md:flex w-1/4 bg-white/50 border-r border-[#3A332F]/10 p-6 flex-col gap-4 shrink-0 relative z-20">
                    <div className="mb-6 text-center">
                        <div
                            className="w-20 h-20 mx-auto rounded-full border-4 overflow-hidden shadow-md mb-2"
                            style={{ borderColor: accentColor }}
                        >
                            <img src={user.photo} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <p className="font-ghibli-title text-[#3A332F] truncate">{user.name}</p>
                    </div>

                    {[
                        { id: 'profile', label: 'Mi Perfil', icon: UserIcon },
                        { id: 'orders', label: 'Mis Pedidos', icon: Package },
                        { id: 'wishlist', label: 'Lista de Deseos', icon: Heart },
                        { id: 'missions', label: 'Misiones', icon: Sparkles, hasNotification: hasUnclaimedMissions }, // [MODIFIED]
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all whitespace-nowrap relative ${activeTab === tab.id
                                ? `bg-[#3A332F] text-white shadow-lg`
                                : 'hover:bg-white/60 text-[#3A332F]/70'
                                }`}
                        >
                            <div className="relative">
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-[#D4AF37]' : ''} />
                                {/* Tab Notification Dot */}
                                {(tab as any).hasNotification && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </div>
                            <span className="font-ghibli-title text-base">{tab.label}</span>
                        </button>
                    ))}

                    <div className="mt-auto">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 text-red-500/70 hover:text-red-500 w-full transition-all"
                        >
                            <LogOut size={20} />
                            <span className="font-ghibli-title text-sm">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#FDF5E6] relative pb-24 md:pb-10">
                    <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 bg-white hover:bg-[#3A332F] hover:text-white rounded-full transition-all shadow-sm">
                        <X size={24} />
                    </button>

                    {activeTab === 'profile' && (
                        <div className="max-w-md mx-auto text-center space-y-6 md:space-y-8 animate-slide-in">
                            <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 group cursor-pointer">
                                <input
                                    type="file"
                                    id="photo-upload-tab"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                                <div
                                    className="w-full h-full bg-[#3A332F] rounded-full border-4 overflow-hidden shadow-2xl relative z-0 group-hover:opacity-80 transition-opacity"
                                    style={{ borderColor: accentColor }}
                                    onClick={() => document.getElementById('photo-upload-tab')?.click()}
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
                                <h2 className="text-3xl md:text-4xl font-ghibli-title text-[#3A332F] leading-tight">{user.name}</h2>
                                <p
                                    className="font-black uppercase text-[10px] md:text-xs tracking-[0.2em]"
                                    style={{ color: accentColor }}
                                >
                                    {user.membership ? `MIEMBRO ${user.membership.toUpperCase()}` : 'VIAJERO DEL BOSQUE'}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-[30px] text-left space-y-4 border-2 border-[#E6D5B8] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-[#C14B3A]" />
                                    <span className="text-sm font-bold text-[#3A332F]">{user.email || 'No registrado'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-[#C14B3A]" />
                                    <span className="text-sm font-bold text-[#3A332F]">{user.location || 'Sin ubicación'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-[#C14B3A]" />
                                    <span className="text-sm font-bold text-[#3A332F]">{user.phone || 'Sin teléfono'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button onClick={onOpenSubscription} className="w-full bg-[#3A332F] text-white font-ghibli-title py-4 md:py-5 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all uppercase tracking-widest text-xs md:text-sm">
                                    ESTATUS DEL CLAN
                                </button>
                                <button onClick={onLogout} className="md:hidden w-full bg-transparent border-2 border-[#3A332F]/10 text-[#3A332F]/60 font-ghibli-title py-4 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all uppercase tracking-widest text-[10px]">
                                    CERRAR SESIÓN
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-slide-in h-full flex flex-col">
                            <h2 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F]">Historial de Compras</h2>

                            {loadingOrders ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-[#C14B3A] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-[#3A332F]/40 space-y-4">
                                    <Package size={64} strokeWidth={1} />
                                    <p className="font-ghibli-title text-lg">Aún no has realizado pedidos</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 overflow-y-auto pb-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-white p-4 md:p-6 rounded-[20px] shadow-sm border border-[#3A332F]/5 flex flex-col gap-4">
                                            <div className="flex justify-between items-start border-b border-[#3A332F]/5 pb-4">
                                                <div>
                                                    <p className="font-bold text-[#3A332F] text-sm md:text-base">Pedido #{order.id.slice(0, 8)}</p>
                                                    <p className="text-xs text-[#8C8279]">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.status === 'paid' ? 'PAGADO' : order.status === 'shipped' ? 'ENVIADO' : 'PENDIENTE'}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {order.order_items.map((item: any) => {
                                                    // Find product name in current products list if possible, or use ID
                                                    const product = products.find(p => p.id === item.product_id);
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                            <span className="text-[#3A332F] font-medium">
                                                                {item.quantity}x {product ? product.name : 'Producto Desconocido'}
                                                            </span>
                                                            <span className="text-[#8C8279]">${formatMoney(item.price_at_purchase)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="pt-2 flex justify-between items-center font-bold text-[#3A332F] border-t border-[#3A332F]/5 mt-auto">
                                                <span>Total</span>
                                                <span className="text-[#C14B3A] text-lg">${formatMoney(order.total)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="space-y-6 animate-slide-in h-full flex flex-col">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F]">Lista de Deseos</h2>
                                {favorites.length > 0 && (
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}?shared_wishlist=${user.id}`;
                                            navigator.clipboard.writeText(url);
                                            alert('¡Enlace copiado! Comparte tu lista con tus amigos.');
                                        }}
                                        className="flex items-center gap-2 text-[#C14B3A] font-bold text-sm bg-[#C14B3A]/10 px-4 py-2 rounded-full hover:bg-[#C14B3A] hover:text-white transition-all"
                                    >
                                        <Share2 size={16} />
                                        Compartir Lista
                                    </button>
                                )}
                            </div>

                            {favorites.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-[#3A332F]/40 space-y-4">
                                    <Heart size={64} strokeWidth={1} />
                                    <p className="font-ghibli-title text-lg">Tu lista está vacía</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center px-1">
                                        <button
                                            onClick={() => {
                                                if (selectedWishlistItems.size === products.filter(p => favorites.includes(p.id)).length) {
                                                    setSelectedWishlistItems(new Set());
                                                } else {
                                                    setSelectedWishlistItems(new Set(products.filter(p => favorites.includes(p.id)).map(p => p.id)));
                                                }
                                            }}
                                            className="text-sm font-bold text-[#3A332F] hover:text-[#C14B3A] underline decoration-dotted"
                                        >
                                            {selectedWishlistItems.size === products.filter(p => favorites.includes(p.id)).length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                        </button>
                                        <span className="text-sm text-[#3A332F]/60">
                                            {selectedWishlistItems.size} seleccionados
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 scrollbar-hide flex-1">
                                        {products.filter(p => favorites.includes(p.id)).map(product => {
                                            const isSelected = selectedWishlistItems.has(product.id);
                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => {
                                                        const newSet = new Set(selectedWishlistItems);
                                                        if (newSet.has(product.id)) newSet.delete(product.id);
                                                        else newSet.add(product.id);
                                                        setSelectedWishlistItems(newSet);
                                                    }}
                                                    className={`
                                                        bg-white p-4 rounded-[20px] shadow-sm border transition-all cursor-pointer flex gap-4 relative group hover:shadow-md
                                                        ${isSelected ? 'border-[#C14B3A] bg-red-50/10' : 'border-[#3A332F]/5'}
                                                    `}
                                                >
                                                    {/* Checkbox Indicator */}
                                                    <div className={`
                                                        absolute top-3 right-3 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                        ${isSelected ? 'bg-[#C14B3A] border-[#C14B3A]' : 'border-[#3A332F]/20 bg-white'}
                                                    `}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>

                                                    <img src={product.image} className="w-20 h-20 rounded-xl object-cover" alt={product.name} />
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <h4 className="font-bold text-[#3A332F] text-sm truncate mb-1">{product.name}</h4>
                                                        <p className="text-[#C14B3A] font-black text-sm">${formatMoney(product.price)}</p>

                                                        <div className="mt-2 flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFavorite(product.id);
                                                                }}
                                                                className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-20 relative"
                                                            >
                                                                <Heart size={14} fill="currentColor" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer for Wishlist Actions */}
                                    <div className="pt-4 border-t border-[#3A332F]/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FDF5E6] sticky bottom-0">
                                        <div className="text-center sm:text-left">
                                            <p className="text-xs text-[#3A332F]/60 font-bold uppercase tracking-wider">Total Est.</p>
                                            <p className="text-xl font-black text-[#C14B3A]">
                                                ${formatMoney(
                                                    products
                                                        .filter(p => favorites.includes(p.id) && selectedWishlistItems.has(p.id))
                                                        .reduce((sum, p) => sum + p.price, 0)
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            disabled={selectedWishlistItems.size === 0}
                                            onClick={() => {
                                                if (selectedWishlistItems.size === 0) return;
                                                const itemsToAdd = products.filter(p => favorites.includes(p.id) && selectedWishlistItems.has(p.id));
                                                onAddToCart(itemsToAdd);
                                                // Deselect after adding? Maybe optional.
                                                setSelectedWishlistItems(new Set());
                                                alert(`¡${itemsToAdd.length} productos agregados al carrito mágico!`);
                                            }}
                                            className={`
                                                flex items-center gap-2 px-6 py-3 rounded-full font-ghibli-title uppercase tracking-widest text-xs transition-all w-full sm:w-auto justify-center
                                                ${selectedWishlistItems.size > 0
                                                    ? 'bg-[#3A332F] text-white hover:bg-[#C14B3A] shadow-lg'
                                                    : 'bg-[#3A332F]/10 text-[#3A332F]/40 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            <Package size={16} />
                                            <span>Mover al Carrito ({selectedWishlistItems.size})</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'missions' && (
                        <div className="space-y-6 animate-slide-in h-full flex flex-col">
                            <div className="flex justify-between items-center bg-[#D4AF37]/10 p-4 rounded-xl border border-[#D4AF37]/20">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F]">Misiones del Clan</h2>
                                    <p className="text-xs text-[#3A332F]/60 font-bold uppercase tracking-wider">Completa retos y gana monedas</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-black text-[#3A332F]/40 tracking-widest">Tu Tesoro</p>
                                    <div className="flex items-center gap-2 text-[#D4AF37] font-black text-xl">
                                        <span>{userCoins}</span>
                                        <span className="text-xs">🪙</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 overflow-y-auto pb-4 scrollbar-hide flex-1">
                                {missions.map(mission => {
                                    const userMission = userMissions[mission.id] || { progress: 0, completed: false, claimed: false };
                                    const progressPercent = Math.min(100, (userMission.progress / mission.target) * 100);

                                    return (
                                        <div key={mission.id} className={`relative bg-white rounded-[20px] p-4 md:p-5 border-2 transition-all duration-300 group ${userMission.completed ? 'border-[#D4AF37] shadow-md' : 'border-[#3A332F]/5 hover:border-[#3A332F]/20'}`}>
                                            <div className="flex items-center gap-4">
                                                {/* Medal/Icon */}
                                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center border-2 flex-shrink-0 transition-all duration-500 overflow-hidden relative ${userMission.completed ? 'bg-[#D4AF37] border-[#FDF5E6] rotate-3' : 'bg-[#3A332F]/5 border-[#3A332F]/5 grayscale'}`}>
                                                    {userMission.completed && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-shine"></div>}
                                                    {getMissionIcon(mission.icon, userMission.completed)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className={`font-ghibli-title text-base md:text-lg uppercase ${userMission.completed ? 'text-[#D4AF37]' : 'text-[#3A332F]'}`}>{mission.title}</h3>
                                                            <p className="text-[#8C8279] text-xs font-bold leading-tight">{mission.description}</p>
                                                        </div>
                                                        {userMission.claimed ? (
                                                            <span className="bg-[#81C784]/20 text-[#2E7D32] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Listo
                                                            </span>
                                                        ) : userMission.completed ? (
                                                            <button
                                                                onClick={() => onClaimReward(mission.id)}
                                                                className="bg-[#D4AF37] text-white px-4 py-1.5 rounded-full font-ghibli-title text-xs uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse"
                                                            >
                                                                Reclamar {mission.reward} 🪙
                                                            </button>
                                                        ) : (
                                                            <span className="bg-[#3A332F]/5 text-[#3A332F]/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                                <Lock size={10} /> {mission.reward} 🪙
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-[#3A332F]/40 tracking-wider">
                                                            <span>Progreso</span>
                                                            <span>{userMission.progress} / {mission.target}</span>
                                                        </div>
                                                        <div className="h-3 bg-[#3A332F]/5 rounded-full overflow-hidden border border-[#3A332F]/5">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${userMission.completed ? 'bg-[#D4AF37]' : 'bg-[#C14B3A]'}`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-[#3A332F]/10 p-2 flex justify-around items-center z-30 pb- safe-area-bottom">
                    {[
                        { id: 'profile', label: 'Perfil', icon: UserIcon },
                        { id: 'orders', label: 'Pedidos', icon: Package },
                        { id: 'wishlist', label: 'Deseos', icon: Heart },
                        { id: 'missions', label: 'Misiones', icon: Sparkles }, // [NEW]
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full ${activeTab === tab.id
                                ? 'text-[#C14B3A]'
                                : 'text-[#3A332F]/60'
                                }`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? 'fill-current' : ''} />
                            <span className="font-ghibli-title text-[10px] uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
