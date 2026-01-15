import React, { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

interface CartItem {
    id: string; // Changed from number to string for UUID support
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartCheckoutProps {
    cart: CartItem[];
    userEmail?: string;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({ cart, userEmail }) => {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart,
                    userEmail,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No se recibió URL de pago', data);
                alert('Hubo un error iniciando el pago. Intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error al conectar con pasarela de pago:', error);
            alert('Error de conexión. Verifica tu internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full bg-[#C14B3A] text-white font-ghibli-title py-4 rounded-full text-xl shadow-xl hover:bg-[#3A332F] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="animate-spin" /> : <>PAGAR AHORA <CreditCard size={24} /></>}
        </button>
    );
};
