
import React from 'react';
import { ShoppingCart, Star, Heart, MessageSquare } from 'lucide-react';
import { Product } from '../types';

import { formatCurrency } from '../src/lib/utils';

interface ProductCardProps {
  product: Product;
  collectionName?: string;
  onAddToCart: (p: Product, quantity?: number) => void;
  onViewDetails: (p: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, collectionName, onAddToCart, onViewDetails, isFavorite, onToggleFavorite }) => {
  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group relative bg-white rounded-[20px] md:rounded-[40px] overflow-hidden border-2 md:border-4 border-[#3A332F] hover:shadow-[8px_8px_0px_0px_#C14B3A] md:hover:shadow-[12px_12px_0px_0px_#C14B3A] transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 flex flex-col h-full cursor-pointer"
    >

      {/* Botón de Favoritos */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-3 right-3 md:top-8 md:right-8 z-30 p-2 md:p-3 bg-white rounded-full transition-all shadow-md md:shadow-xl border-2 active:scale-75 ${isFavorite
          ? 'text-[#C14B3A] border-[#C14B3A] scale-100 md:scale-110'
          : 'text-[#3A332F] border-[#F0E6D2]'
          }`}
        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <Heart
          size={16}
          className={`md:w-5 md:h-5 ${isFavorite ? "fill-[#C14B3A] animate-wiggle" : ""}`}
        />
      </button>

      {/* Product Image Area */}
      <div className="relative aspect-square md:aspect-[4/5] m-2 md:m-4 rounded-[15px] md:rounded-[30px] overflow-hidden bg-[#FDF5E6] border md:border-2 border-[#F0E6D2] z-10">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Badge de Categoría */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
          <span className="bg-[#3A332F]/90 backdrop-blur-sm text-white text-[8px] md:text-[9px] font-bold md:font-ghibli-title px-2 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-white/10">
            {product.category}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-5 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-1 md:mb-2">
          {/* Badge de Colección (Mobile & Desktop) */}
          <span className="text-[10px] md:text-[10px] font-ghibli-title uppercase text-[#8C8279] tracking-wider px-2 py-0.5 border border-[#8C8279]/30 rounded-full bg-[#FDF5E6]">
            {collectionName || "Colección"}
          </span>
          {/* Rating Unificado */}
          <div className="flex items-center gap-1 bg-[#FDF5E6] px-2 py-0.5 rounded-full border border-[#F0E6D2]">
            <Star size={12} className="text-[#C14B3A] fill-[#C14B3A] md:w-3.5 md:h-3.5" />
            <span className="text-[10px] md:text-xs font-bold text-[#3A332F]">{Number(product.rating).toFixed(1)}</span>
          </div>
        </div>

        <h3 className="font-ghibli-title text-sm md:text-xl text-[#3A332F] leading-tight mb-1 md:mb-2 line-clamp-2 min-h-[40px] md:min-h-[50px] uppercase">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 md:gap-4 pt-2 border-t md:border-t-2 border-[#F0E6D2]">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] font-bold text-[#8C8279] uppercase tracking-widest hidden md:block">Precio</span>
            <span className="font-ghibli-title text-base md:text-2xl text-[#C14B3A]">
              <span className="text-sm md:text-lg mr-0.5">$</span>{formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className="p-2 md:p-3 bg-[#3A332F] rounded-full text-white shadow-lg hover:bg-[#C14B3A] hover:scale-110 active:scale-90 transition-all group/btn"
            aria-label="Añadir al carrito"
          >
            <ShoppingCart size={18} className="md:w-5 md:h-5 group-hover/btn:animate-bounce-subtle" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
