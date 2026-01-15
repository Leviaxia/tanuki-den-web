import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CheckoutCancel = () => {
    return (
        <div className="min-h-screen bg-[#FDF5E6] flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-12 rounded-[50px] shadow-2xl text-center border-8 border-[#C14B3A] animate-pop">
                <div className="w-24 h-24 bg-[#C14B3A] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-inner">
                    <XCircle size={48} />
                </div>
                <h1 className="font-ghibli-title text-4xl text-[#3A332F] mb-4 uppercase">Pago Cancelado</h1>
                <p className="text-[#8C8279] font-bold text-lg mb-8">
                    Parece que hubo un problema o cancelaste el proceso. No te preocupes, tus items siguen en el carrito.
                </p>

                <Link to="/" className="inline-flex items-center gap-3 bg-[#3A332F] text-white font-ghibli-title px-8 py-4 rounded-full shadow-xl hover:bg-[#C14B3A] transition-all transform hover:scale-105">
                    <ArrowLeft size={20} /> VOLVER A INTENTAR
                </Link>
            </div>
        </div>
    );
};
