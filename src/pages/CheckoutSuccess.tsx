import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-[#FDF5E6] flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-12 rounded-[50px] shadow-2xl text-center border-8 border-[#81C784] animate-pop">
                <div className="w-24 h-24 bg-[#81C784] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-inner">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="font-ghibli-title text-4xl text-[#3A332F] mb-4 uppercase">¡Pago Exitoso!</h1>
                <p className="text-[#8C8279] font-bold text-lg mb-8">
                    Tu ofrenda ha sido aceptada por los espíritus. El Tanuki ya está preparando tu paquete.
                </p>
                {sessionId && (
                    <p className="text-xs text-gray-400 mb-8 font-mono bg-gray-50 p-2 rounded">
                        ID de Referencia: {sessionId.slice(0, 10)}...
                    </p>
                )}

                <Link to="/" className="inline-flex items-center gap-3 bg-[#3A332F] text-white font-ghibli-title px-8 py-4 rounded-full shadow-xl hover:bg-[#81C784] transition-all transform hover:scale-105">
                    VOLVER AL MENÚ <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};
