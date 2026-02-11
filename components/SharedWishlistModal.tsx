import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingCart, Share2, Copy, Check } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../src/lib/supabase';
import { formatCurrency } from '../src/lib/utils';

interface SharedWishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    products: Product[];
    onAddToCart: (products: Product[]) => void;
}

const SharedWishlistModal: React.FC<SharedWishlistModalProps> = ({
    isOpen, onClose, targetUserId, products, onAddToCart
}) => {
    const [targetUser, setTargetUser] = useState<any>(null);
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && targetUserId) {
            fetchSharedData();
        }
    }, [isOpen, targetUserId]);

    const fetchSharedData = async () => {
        setLoading(true);
        try {
            // 1. Fetch User Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', targetUserId)
                .single();

            if (profile) setTargetUser(profile);

            // 2. Fetch Favorites
            const { data: favorites } = await supabase
                .from('favorites')
                .select('product_id')
                .eq('user_id', targetUserId);

            if (favorites) {
                const favIds = favorites.map(f => f.product_id);
                // Filter products that are in the favorites list
                const foundProducts = products.filter(p => favIds.includes(p.id));
                setWishlistProducts(foundProducts);
                // Select all by default for convenience? No, maybe better to let user choose.
                // Let's select none by default explicitly.
                setSelectedItems(new Set());
            }
        } catch (error) {
            console.error("Error fetching shared wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (productId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === wishlistProducts.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(wishlistProducts.map(p => p.id)));
        }
    };

    const handleAddToCart = () => {
        const selectedProducts = wishlistProducts.filter(p => selectedItems.has(p.id));
        onAddToCart(selectedProducts);
        onClose();
        // You might want to open the cart here or show a success message
    };

    const totalPrice = wishlistProducts
        .filter(p => selectedItems.has(p.id))
        .reduce((sum, p) => sum + p.price, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div
                className="bg-[#FDF5E6] w-full max-w-4xl h-[85vh] rounded-[30px] md:rounded-[50px] overflow-hidden flex flex-col shadow-2xl relative animate-pop border-4 border-[#D4AF37]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[#3A332F]/10 flex justify-between items-center bg-white/50">
                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                        ) : (
                            <img
                                src={targetUser?.avatar_url || '/assets/default_avatar.png'}
                                className="w-12 h-12 rounded-full border-2 border-[#D4AF37] object-cover"
                                alt="Owner"
                            />
                        )}
                        <div>
                            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">LISTA DE DESEOS DE</p>
                            <h2 className="text-xl md:text-2xl font-ghibli-title text-[#3A332F]">
                                {loading ? 'Cargando...' : targetUser?.full_name || 'Un Aventurero'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-[#3A332F] hover:text-white rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : wishlistProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[#3A332F]/40 space-y-4">
                            <Heart size={64} strokeWidth={1} />
                            <p className="font-ghibli-title text-lg">Esta lista está vacía</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-sm font-bold text-[#3A332F] hover:text-[#C14B3A] underline decoration-dotted"
                                >
                                    {selectedItems.size === wishlistProducts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                                <span className="text-sm text-[#3A332F]/60">
                                    {selectedItems.size} seleccionados
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wishlistProducts.map(product => {
                                    const isSelected = selectedItems.has(product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleSelection(product.id)}
                                            className={`
                                                relative p-4 rounded-[20px] transition-all cursor-pointer border-2
                                                ${isSelected
                                                    ? 'bg-white border-[#C14B3A] shadow-md'
                                                    : 'bg-white/60 border-transparent hover:bg-white hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-[#C14B3A] border-[#C14B3A]' : 'border-[#3A332F]/20 bg-white'}
                                            `}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>

                                            <div className="flex gap-4">
                                                <img src={product.image} className="w-20 h-20 rounded-xl object-cover" alt={product.name} />
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="font-bold text-[#3A332F] text-sm truncate mb-1">{product.name}</h4>
                                                    <p className="text-[#C14B3A] font-black text-sm">${formatCurrency(product.price)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {wishlistProducts.length > 0 && (
                    <div className="p-6 bg-white border-t border-[#3A332F]/10 flex flex-col md:flex-row gap-4 items-center justify-between sticky bottom-0 z-20 shadow-lg-reverse">
                        <div className="text-center md:text-left">
                            <p className="text-xs text-[#3A332F]/60 font-bold uppercase tracking-wider">Total Seleccionado</p>
                            <p className="text-2xl font-black text-[#C14B3A]">${formatCurrency(totalPrice)}</p>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={selectedItems.size === 0}
                            className={`
                                flex items-center gap-3 px-8 py-4 rounded-full font-ghibli-title uppercase tracking-widest text-sm transition-all
                                ${selectedItems.size > 0
                                    ? 'bg-[#3A332F] text-white hover:bg-[#C14B3A] shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                                    : 'bg-[#3A332F]/10 text-[#3A332F]/40 cursor-not-allowed'
                                }
                            `}
                        >
                            <ShoppingCart size={18} />
                            <span>Agregar {selectedItems.size} al Carrito</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedWishlistModal;
