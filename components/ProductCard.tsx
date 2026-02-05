
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
      <div className="px-3 pb-3 md:px-8 md:pb-8 md:pt-2 space-y-2 md:space-y-3 flex-grow flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Unified Rating Style: Star + specific Number for both desktop and mobile */}
            <div className="flex items-center gap-1 bg-[#FDF5E6] px-2 py-1 rounded-full border border-[#F0E6D2]">
              <Star size={12} className="md:w-[14px] md:h-[14px] text-[#C14B3A] fill-[#C14B3A]" />
              <span className="text-[10px] md:text-xs font-bold text-[#3A332F]">{Number(product.rating).toFixed(1)}</span>
            </div>
            {/* Collection Name Tag */}
            {collectionName && (
              <span className="text-[8px] md:text-[10px] uppercase font-ghibli-title md:font-ghibli-title text-[#8C8279] tracking-wider truncate max-w-[80px] md:max-w-none">
                {collectionName}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-ghibli-title md:font-ghibli-title text-base md:text-xl text-[#C14B3A] line-clamp-2 leading-tight h-10 md:h-14">
          {product.name}
        </h3>

        <div className="flex items-center justify-between pt-2 md:pt-4 border-t md:border-t-2 border-[#FDF5E6] mt-auto">
          <span className="text-base md:text-xl font-ghibli-title md:font-ghibli-title text-[#3A332F]">
            <span className="text-[#C14B3A] mr-0.5 md:mr-1 text-sm md:text-xl">$</span>{formatCurrency(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className="p-2 md:p-3 bg-[#3A332F] md:bg-[#C14B3A] text-white hover:bg-[#C14B3A] md:hover:bg-[#3A332F] transition-all rounded-full shadow-md active:scale-90 border-2 border-transparent md:border-white relative z-10"
            aria-label="Añadir al carrito"
          >
            <ShoppingCart size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
