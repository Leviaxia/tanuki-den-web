import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const processOrder = async () => {
            try {
                // 1. Recuperar carrito pendiente
                const pendingCartStr = localStorage.getItem('tanuki_pending_cart');
                // ALERT DEBUG
                alert(`DEBUG: Pendiente: ${pendingCartStr}`);

                if (!pendingCartStr) {
                    console.error("No hay carrito pendiente");
                    alert("ERROR: No se encontró el carrito temporal.");
                    setIsProcessing(false);
                    return;
                }

                const pendingCart = JSON.parse(pendingCartStr);

                // 2. Buscar membresías
                const subItem = pendingCart.find((item: any) => item.id.startsWith('sub-'));
                alert(`DEBUG: Item Suscripción: ${JSON.stringify(subItem)}`);

                if (subItem) {
                    const planId = subItem.id.replace('sub-', '');

                    // A. Actualizar LocalStorage
                    const userStr = localStorage.getItem('tanuki_user');
                    let user = userStr ? JSON.parse(userStr) : {};

                    user = {
                        ...user,
                        membership: planId,
                        isRegistered: true // Asumimos registro si compró membresía
                    };

                    localStorage.setItem('tanuki_user', JSON.stringify(user));
                    alert(`DEBUG: Usuario guardado: ${JSON.stringify(user)}`);

                    // B. Actualizar Supabase (si está logueado)
                    if (user.id && user.id !== 'guest') {
                        await supabase
                            .from('profiles')
                            .update({ membership: planId })
                            .eq('id', user.id);
                    }
                }

                // 3. Limpiar carrito
                localStorage.removeItem('tanuki_pending_cart');
                // IMPORTANTE: Disparar evento para que el Navbar actualice el carrito a 0
                // (Opcional, pero App.tsx suele leer de estado. Al recargar la página se limpia).

            } catch (error) {
                console.error("Error procesando orden:", error);
            } finally {
                setIsProcessing(false);
            }
        };


        const timeoutId = setTimeout(() => {
            console.warn("Forzando fin de proceso por tiempo de espera.");
            setIsProcessing(false);
        }, 5000); // 5 segundos de seguridad

        if (sessionId) {
            processOrder().finally(() => clearTimeout(timeoutId));
        } else {
            clearTimeout(timeoutId);
            setIsProcessing(false);
        }

        return () => clearTimeout(timeoutId);
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-[#FDF5E6] flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-12 rounded-[50px] shadow-2xl text-center border-8 border-[#81C784] animate-pop">
                <div className="w-24 h-24 bg-[#81C784] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-inner">
                    {isProcessing ? <Loader2 size={48} className="animate-spin" /> : <CheckCircle2 size={48} />}
                </div>
                <h1 className="font-ghibli-title text-4xl text-[#3A332F] mb-4 uppercase">
                    {isProcessing ? 'Procesando...' : '¡Pago Exitoso!'}
                </h1>
                <p className="text-[#8C8279] font-bold text-lg mb-8">
                    {isProcessing
                        ? 'Estamos confirmando tu ofrenda con los espíritus...'
                        : 'Tu ofrenda ha sido aceptada. Tu estatus en el clan ha sido actualizado.'}
                </p>
                {sessionId && !isProcessing && (
                    <p className="text-xs text-gray-400 mb-8 font-mono bg-gray-50 p-2 rounded">
                        ID de Referencia: {sessionId.slice(0, 10)}...
                    </p>
                )}

                {!isProcessing && (
                    <a href="/" className="inline-flex items-center gap-3 bg-[#3A332F] text-white font-ghibli-title px-8 py-4 rounded-full shadow-xl hover:bg-[#81C784] transition-all transform hover:scale-105">
                        VOLVER AL MENÚ <ArrowRight size={20} />
                    </a>
                )}
            </div>
        </div>
    );
};

