import React, { useState, useEffect } from 'react';
import { X, Wallet, Landmark, CreditCard, Minus, Plus, Trash2, CheckCircle2, ArrowRight, MapPin, Truck, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../lib/utils';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    total: number;
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onSuccess: () => void;
    user: any;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen, onClose, cart, total, onUpdateQuantity, onRemove, onSuccess, user
}) => {
    const [step, setStep] = useState<'summary' | 'shipping' | 'payment'>('summary');
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Shipping State
    const [shipping, setShipping] = useState({ city: '', address: '', notes: '' });
    const [shippingErrors, setShippingErrors] = useState<any>({});

    // Payment State
    const [method, setMethod] = useState<'card' | 'nequi' | 'pse'>('card');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [cardErrors, setCardErrors] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setStep('summary');
            setSuccess(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateShipping = () => {
        const errs: any = {};
        if (!shipping.city) errs.city = 'Requerido';
        if (!shipping.address) errs.address = 'Requerido';
        setShippingErrors(errs);
        return Object.keys(errs).length === 0;
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/95 flex items-center justify-center p-4 md:p-6 backdrop-blur-md overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[50px] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-pop border-8 border-[#D4AF37] relative my-auto">
                <button onClick={onClose} className="absolute top-6 right-6 z-50 text-[#3A332F]/50 hover:text-[#3A332F]"><X size={32} /></button>

                {/* Progress Sidebar (Desktop) / Topbar (Mobile) */}
                <div className="w-full md:w-1/3 bg-[#FDF5E6] p-8 md:p-12 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-[#3A332F]/10">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-ghibli-title text-[#3A332F] uppercase leading-none">Tu <br /><span className="text-[#C14B3A]">Pedido</span></h2>
                        <div className="space-y-6">
                            {[
                                { id: 'summary', label: 'Resumen', icon: Wallet },
                                { id: 'shipping', label: 'Envío', icon: Truck },
                                { id: 'payment', label: 'Pago', icon: CreditCard }
                            ].map((s, i) => (
                                <div key={s.id} className={`flex items-center gap-4 transition-all ${step === s.id ? 'opacity-100 translate-x-2' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === s.id ? 'bg-[#C14B3A] border-[#C14B3A] text-white' : 'bg-white border-[#3A332F]/20 text-[#3A332F]'}`}>
                                        <s.icon size={18} />
                                    </div>
                                    <span className="font-ghibli-title uppercase text-sm">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-center gap-2 text-[#3A332F]/40 font-bold text-[10px] uppercase tracking-widest">
                            <Lock size={12} /> Pagos Encriptados
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="w-full md:w-2/3 p-8 md:p-12 relative min-h-[500px]">
                    {success ? (
                        <div className="absolute inset-0 bg-white z-[20] flex flex-col items-center justify-center text-center p-12">
                            <div className="w-24 h-24 bg-[#81C784] rounded-full flex items-center justify-center text-white mb-6 animate-pop"><CheckCircle2 size={48} /></div>
                            <h2 className="text-3xl font-ghibli-title mb-4 text-[#3A332F]">¡PEDIDO REALIZADO!</h2>
                            <p className="text-[#8C8279] font-bold mb-8">Tus tesoros están en camino bajo la protección del espíritu Tanuki.</p>
                            <button onClick={onSuccess} className="px-12 py-5 bg-[#3A332F] text-white rounded-full font-ghibli-title hover:bg-[#C14B3A] transition-all shadow-xl">ENTENDIDO</button>
                        </div>
                    ) : (
                        <>
                            {step === 'summary' && (
                                <div className="space-y-6 animate-slide-in">
                                    <h3 className="text-xl font-ghibli-title uppercase text-[#3A332F] mb-6">Revisar Items</h3>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex gap-4 p-3 border-2 border-[#FDF5E6] rounded-[20px] items-start">
                                                <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt={item.name} />
                                                <div className="flex-grow">
                                                    <h4 className="font-bold text-sm text-[#3A332F]">{item.name}</h4>
                                                    <p className="text-[#C14B3A] font-black text-xs">{formatCurrency(item.price)}</p>
                                                    {item.benefits && (
                                                        <div className="mt-2 space-y-1 bg-[#FDF5E6]/50 p-2 rounded-xl">
                                                            <p className="text-[9px] uppercase font-black tracking-widest text-[#8C8279] mb-1">Tu Pacto Incluye:</p>
                                                            <ul className="grid grid-cols-1 gap-1">
                                                                {item.benefits.map((b, i) => (
                                                                    <li key={i} className="text-[10px] text-[#3A332F] flex items-center gap-1.5 font-bold">
                                                                        <CheckCircle2 size={10} className="text-[#C14B3A]" /> {b}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 bg-[#FDF5E6] px-3 py-1 rounded-full self-start">
                                                    {!item.id.startsWith('sub-') && <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:text-[#C14B3A] transition-colors"><Minus size={12} /></button>}
                                                    <span className="font-bold text-xs text-[#3A332F]">{item.quantity}</span>
                                                    {!item.id.startsWith('sub-') && <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:text-[#C14B3A] transition-colors"><Plus size={12} /></button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-6 border-t-2 border-[#FDF5E6]">
                                        <span className="font-ghibli-title text-xl">Total</span>
                                        <span className="font-ghibli-title text-3xl text-[#C14B3A]">{formatCurrency(total)}</span>
                                    </div>
                                    <button onClick={() => setStep('shipping')} className="w-full bg-[#3A332F] text-white font-ghibli-title py-5 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all flex items-center justify-center gap-4">IR A ENVÍO <ArrowRight size={20} /></button>
                                </div>
                            )}

                            {step === 'shipping' && (
                                <div className="space-y-6 animate-slide-in">
                                    <h3 className="text-xl font-ghibli-title uppercase text-[#3A332F] mb-6 flex items-center gap-3"><MapPin size={24} className="text-[#C14B3A]" /> Datos de Entrega</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Ciudad</label>
                                                <input value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} className={`w-full p-4 bg-[#FDF5E6] rounded-2xl font-bold text-[#3A332F] outline-none border-2 focus:border-[#C14B3A] ${shippingErrors.city ? 'border-red-400' : 'border-transparent'}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Departamento</label>
                                                <input className="w-full p-4 bg-[#FDF5E6] rounded-2xl font-bold text-[#3A332F] outline-none border-2 border-transparent focus:border-[#C14B3A]" defaultValue="Cundinamarca" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Dirección Exacta</label>
                                            <input value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} placeholder="Calle 123 # 45-67" className={`w-full p-4 bg-[#FDF5E6] rounded-2xl font-bold text-[#3A332F] outline-none border-2 focus:border-[#C14B3A] ${shippingErrors.address ? 'border-red-400' : 'border-transparent'}`} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Notas Adicionales</label>
                                            <textarea value={shipping.notes} onChange={e => setShipping({ ...shipping, notes: e.target.value })} rows={3} className="w-full p-4 bg-[#FDF5E6] rounded-2xl font-bold text-[#3A332F] outline-none border-2 border-transparent focus:border-[#C14B3A]" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep('summary')} className="px-8 py-4 bg-white border-2 border-[#3A332F]/10 rounded-full font-bold text-[#3A332F]">Volver</button>
                                        <button onClick={() => validateShipping() && setStep('payment')} className="flex-grow bg-[#3A332F] text-white font-ghibli-title py-4 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all">CONTINUAR</button>
                                    </div>
                                </div>
                            )}

                            {step === 'payment' && (
                                <div className="space-y-6 animate-slide-in">
                                    <h3 className="text-xl font-ghibli-title uppercase text-[#3A332F] mb-6 flex items-center gap-3"><ShieldCheck size={24} className="text-[#C14B3A]" /> Método de Pago</h3>

                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {['card', 'nequi', 'pse'].map((m: any) => (
                                            <button key={m} onClick={() => setMethod(m)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${method === m ? 'border-[#C14B3A] bg-[#C14B3A]/5 text-[#C14B3A]' : 'border-[#FDF5E6] hover:border-[#3A332F]/20'}`}>
                                                {m === 'card' && <CreditCard size={24} />}
                                                {m === 'nequi' && <Wallet size={24} />}
                                                {m === 'pse' && <Landmark size={24} />}
                                                <span className="text-[10px] font-black uppercase">{m}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {method === 'card' && (
                                        <div className="bg-[#FDF5E6] p-6 rounded-[30px] border-2 border-[#3A332F]/10 mb-6 space-y-4 text-center">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                <CreditCard className="text-[#3A332F]" size={32} />
                                            </div>
                                            <p className="text-[#3A332F] text-sm font-bold">
                                                Serás redirigido a la pasarela segura de <span className="text-[#635BFF] font-black">Stripe</span> para completar tu compra.
                                            </p>
                                            <div className="flex justify-center gap-2 grayscale opacity-50">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-6" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-6" alt="Mastercard" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-2">
                                        <button onClick={() => setStep('shipping')} className="px-8 py-4 bg-white border-2 border-[#3A332F]/10 rounded-full font-bold text-[#3A332F]">Volver</button>
                                        <button
                                            onClick={async () => {
                                                if (method !== 'card') {
                                                    alert('Por ahora solo aceptamos tarjeta vía Stripe.');
                                                    return;
                                                }
                                                setIsProcessing(true);
                                                try {
                                                    const res = await fetch('/api/create-checkout', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            cart,
                                                            userEmail: user?.email || 'invitado@tanuki.com'
                                                        }),
                                                    });

                                                    if (!res.ok) throw new Error('Error al conectar con el servidor de pagos');

                                                    const { url } = await res.json();
                                                    if (url) {
                                                        localStorage.setItem('tanuki_pending_cart', JSON.stringify(cart));
                                                        window.location.href = url;
                                                    } else throw new Error('No se recibió la URL de pago');

                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error iniciando el pago. Asegúrate de estar en una versión desplegada o usando "netlify dev".');
                                                    setIsProcessing(false);
                                                }
                                            }}
                                            disabled={isProcessing}
                                            className={`flex-grow bg-[#3A332F] text-white font-ghibli-title py-4 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all flex items-center justify-center gap-3 ${isProcessing ? 'opacity-80 cursor-wait' : ''}`}
                                        >
                                            {isProcessing ? (
                                                <>CONECTANDO CON STRIPE...</>
                                            ) : (
                                                <>IR A PAGAR {formatCurrency(total)} <ShieldCheck size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
