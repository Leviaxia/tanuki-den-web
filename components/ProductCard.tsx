
import React from 'react';
import { ShoppingCart, Star, Heart, MessageSquare } from 'lucide-react';
import { Product } from '../types';

import { formatCurrency } from '../src/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product, quantity?: number) => void;
  onViewDetails: (p: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails, isFavorite, onToggleFavorite }) => {
  return (
    <div className="group relative bg-white rounded-[40px] overflow-hidden border-4 border-[#3A332F] hover:shadow-[12px_12px_0px_0px_#C14B3A] transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">

      {/* Botón de Favoritos - Fuera del contenedor de clic de imagen para evitar conflictos */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggleFavorite();
        }}
        className={`absolute top-8 right-8 z-30 p-3 bg-white rounded-full transition-all shadow-xl border-2 active:scale-75 hover:scale-110 ${isFavorite
          ? 'text-[#C14B3A] border-[#C14B3A] scale-110'
          : 'text-[#3A332F] border-[#F0E6D2]'
          }`}
        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <Heart
          size={20}
          fill={isFavorite ? "#C14B3A" : "none"}
          className={isFavorite ? "animate-wiggle" : ""}
        />
      </button>

      {/* Product Image Area */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-[4/5] m-4 rounded-[30px] overflow-hidden bg-[#FDF5E6] border-2 border-[#F0E6D2] cursor-pointer z-10"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
        />

        {/* Badge de Categoría */}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-[#3A332F] text-white text-[9px] font-ghibli-title px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-white/20">
            {product.category}
          </span>
        </div>

        {/* Overlay Hover */}
        <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 pointer-events-none z-20">
          <button
            className="px-8 py-3 bg-[#3A332F] text-white font-ghibli-title text-xs tracking-widest rounded-full hover:bg-[#C14B3A] transition-all shadow-2xl pointer-events-auto"
          >
            VER MÁS
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div
        onClick={() => onViewDetails(product)}
        className="px-8 pb-8 pt-2 space-y-3 cursor-pointer flex-grow flex flex-col"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "#C14B3A" : "none"} className={i < Math.floor(product.rating) ? "text-[#C14B3A]" : "text-[#F0E6D2]"} />
            ))}
            <span className="text-[10px] font-ghibli-title text-[#C14B3A] ml-2 tracking-tighter">{product.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-[#8C8279]">
            <MessageSquare size={12} />
            <span className="text-[10px] font-black">{product.reviews?.length || 0}</span>
          </div>
        </div>

        <h3 className="font-ghibli-title text-xl text-[#3A332F] line-clamp-2 leading-tight group-hover:text-[#C14B3A] transition-colors h-14">
          {product.name}
        </h3>

        <div className="flex items-center justify-between pt-4 border-t-2 border-[#FDF5E6] mt-auto">
          <span className="text-xl font-ghibli-title text-[#3A332F]">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className="p-3 bg-[#C14B3A] text-white hover:bg-[#3A332F] transition-all rounded-full shadow-lg shadow-[#C14B3A]/20 active:scale-90 border-2 border-white relative z-10"
            aria-label="Añadir al carrito"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
