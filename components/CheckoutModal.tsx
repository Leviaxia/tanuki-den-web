import React, { useState, useEffect } from 'react';
import { sendOrderEmail } from '../src/services/email';
import { X, Wallet, Landmark, CreditCard, Minus, Plus, Trash2, CheckCircle2, ArrowRight, MapPin, Truck, ShieldCheck, Lock, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { CartItem, UserReward, Reward } from '../types';
import { formatCurrency } from '../src/lib/utils';
import { supabase } from '../src/lib/supabase';
import { departments, colombiaData } from '@/src/data/colombia';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    total: number;
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onSuccess: () => void;
    user: any;
    discount?: number;
    coupon: UserReward | null;
    rewards: Reward[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen, onClose, cart, total, onUpdateQuantity, onRemove, onSuccess, user, discount = 0, coupon, rewards
}) => {
    const [step, setStep] = useState<'summary' | 'shipping' | 'payment'>('summary');
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Shipping State
    const [shipping, setShipping] = useState({ fullName: '', department: '', city: '', address: '', phone: '' });
    const [shippingErrors, setShippingErrors] = useState<any>({});
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    // Payment State
    const [method, setMethod] = useState<'nequi' | 'card' | 'manual'>('nequi');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [senderPhone, setSenderPhone] = useState('');
    const [showFullQr, setShowFullQr] = useState(false);

    // Calculation Logic
    const baseShipping = 15000;
    const rewardInfo = coupon ? rewards.find(r => r.id === coupon.reward_id) : null;
    const couponValue = rewardInfo ? (rewardInfo.value as any) : {};

    // 1. apply roulette discount to products
    const subtotalAfterRoulette = total - (total * (discount / 100));

    // 2. apply coupon discount (product based)
    let couponDiscountAmount = 0;
    if (couponValue.discount) { // Flat discount
        couponDiscountAmount = couponValue.discount;
    } else if (couponValue.discount_percent) { // Percent discount
        couponDiscountAmount = subtotalAfterRoulette * (couponValue.discount_percent / 100);
    }

    // Check min purchase for coupon
    if (couponValue.min_purchase && total < couponValue.min_purchase) {
        couponDiscountAmount = 0; // Requirement not met
    }

    const subtotalAfterCoupon = Math.max(0, subtotalAfterRoulette - couponDiscountAmount);

    // 3. calculate shipping
    let shippingCost = baseShipping;
    if (couponValue.discount_type === 'shipping_free') {
        if (!couponValue.min_purchase || total >= couponValue.min_purchase) {
            shippingCost = 0;
        }
    } else if (couponValue.discount_type === 'shipping_percent') {
        if (!couponValue.min_purchase || total >= couponValue.min_purchase) {
            shippingCost = baseShipping * (1 - (couponValue.value / 100));
        }
    }

    // If total > 300k, free shipping anyway? (Standard rule - Optional)
    // if (total > 300000) shippingCost = 0; 

    const finalTotal = subtotalAfterCoupon + shippingCost;

    useEffect(() => {
        if (isOpen) {
            setStep('summary');
            setSuccess(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    // Reset city when department changes
    useEffect(() => {
        setShipping(prev => ({ ...prev, city: '' }));
    }, [shipping.department]);

    if (!isOpen) return null;

    const validateShipping = () => {
        const errs: any = {};
        if (!shipping.fullName) errs.fullName = 'Requerido';
        if (!shipping.department) errs.department = 'Requerido';
        if (!shipping.city) errs.city = 'Requerido';
        if (!shipping.address) errs.address = 'Requerido';
        setShippingErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const uploadProofToSupabase = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error("Error uploading proof:", error);
            // Fallback: If upload fails (e.g. bucket doesn't exist), return null so order continues without image
            return null;
        }
    };

    const handleCompletePayment = async () => {
        setIsProcessing(true);

        try {
            // Upload file to Supabase if exists
            let proofUrl = "";
            if (proofFile) {
                const uploadedUrl = await uploadProofToSupabase(proofFile);
                if (uploadedUrl) proofUrl = uploadedUrl;
            }

            // FAILSAFE: Ensure we NEVER send a huge string (like base64) that crashes EmailJS
            if (proofUrl.length > 2000) {
                console.warn("Proof URL too long! Truncating to avoid crash.");
                proofUrl = "";
            }

            // Prepare Email Params
            // Prepare Email Params
            const itemsList = cart.map(item => `- ${item.quantity}x ${item.name} ($${formatCurrency(item.price * item.quantity)})`).join('\n');

            let priceBreakdown = `Subtotal: $${formatCurrency(total)}`;
            if (discount > 0) {
                priceBreakdown += `\nDescuento (${discount}%): -$${formatCurrency(total * (discount / 100))}`;
                priceBreakdown += `\nTOTAL FINAL: $${formatCurrency(finalTotal)}`;
            } else {
                priceBreakdown += `\nTotal: $${formatCurrency(total)}`;
            }

            const emailParams = {
                to_name: "Admin Tanuki",
                from_name: shipping.fullName || "Cliente",
                order_id: new Date().getTime().toString(),
                message: `Nuevo Pedido Guardian:\n\nProductos:\n${itemsList}\n\n${priceBreakdown}\n\nEnvío:\n${shipping.address}, ${shipping.city}, ${shipping.department}\n\nPago: ${method}`,
                customer_email: user.email || "no-email@provided.com",
                customer_phone: shipping.phone || senderPhone || "No registrado",
                payment_proof: proofUrl,
                total: formatCurrency(finalTotal)
            };

            // Save Order to Supabase (if user logged in or guest tracking enabled)
            let orderIdStr = `guest_checkout_${new Date().getTime()}`;

            if (user.id !== 'guest') {
                // VALIDATE SESSION BEFORE INSERTING to avoid RLS errors
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

                if (authError || !authUser || authUser.id !== user.id) {
                    console.error("Session mismatch during checkout", authError);
                    alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente para completar el pedido.");
                    setIsProcessing(false);
                    return;
                }

                const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                    user_id: user.id,
                    status: 'paid', // Mark as PAID immediately for user satisfaction
                    total: finalTotal,
                    payment_method: method,
                    shipping_details: shipping,
                    stripe_session_id: null // Placeholder for future Stripe integration
                }).select();

                if (orderError) throw orderError;

                if (orderData && orderData.length > 0) {
                    const orderId = orderData[0].id;
                    orderIdStr = orderId;

                    const orderItems = cart.map(item => ({
                        order_id: orderId,
                        product_id: item.id,
                        quantity: item.quantity,
                        price_at_purchase: item.price
                    }));

                    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
                    if (itemsError) console.error("Error saving items:", itemsError);

                    // Mark Coupon as Used
                    if (coupon) {
                        const { error: couponError } = await supabase.from('user_rewards')
                            .update({
                                status: 'used',
                                used_at: new Date().toISOString()
                            })
                            .eq('id', coupon.id);

                        if (couponError) console.error("Error updating coupon:", couponError);

                        // Clear selected coupon
                        localStorage.removeItem(`tanuki_selected_coupon_${user.id}`);
                    }
                }
            }

            // Send Email (After order creation, before redirect)
            await sendOrderEmail(emailParams);

            // REDIRECT TO SUCCESS PAGE to trigger Mission Logic
            // 1. Save pending cart for Success page logic
            localStorage.setItem('tanuki_pending_cart', JSON.stringify(cart));

            // 2. Redirect
            window.location.href = `/checkout/success?session_id=manual_order_${orderIdStr}`;
            return;

        } catch (e: any) {
            console.error("Error processing order:", e);
            alert("⚠️ Error: " + (e.text || e.message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className={`bg-[#FDF5E6] w-[95%] md:w-full max-w-4xl rounded-[20px] md:rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-pop border-2 md:border-4 border-white relative transition-all duration-500 my-auto ${step === 'payment' ? 'max-w-[480px] md:flex-col' : 'max-h-[85vh] md:max-h-none md:min-h-[600px]'}`}>

                <button onClick={onClose} className="absolute top-3 right-3 md:top-5 md:right-5 z-50 p-2 bg-white rounded-full text-[#3A332F] hover:bg-[#C14B3A] hover:text-white transition-colors shadow-sm scale-75 md:scale-100"><X size={20} /></button>

                {/* Steps Logic for Summary/Shipping (Maintained structure) */}
                {step !== 'payment' && !success && (
                    <>
                        {/* Progress Sidebar (Desktop) / Topbar (Mobile) */}
                        <div className="w-full md:w-1/3 bg-white p-4 md:p-8 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-[#3A332F]/5 shrink-0">
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between gap-4">
                                <h2 className="text-xl md:text-3xl font-ghibli-title text-[#3A332F] uppercase leading-none">Tu <br className="hidden md:block" /><span className="text-[#C14B3A]">Pedido</span></h2>
                                <div className="flex md:flex-col gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
                                    {[
                                        { id: 'summary', label: 'Resumen', icon: Wallet },
                                        { id: 'shipping', label: 'Envío', icon: Truck },
                                    ].map((s, i) => (
                                        <div key={s.id} className={`flex items-center gap-2 md:gap-3 transition-all flex-shrink-0 ${step === s.id ? 'opacity-100 translate-x-0 md:translate-x-1' : 'opacity-40'}`}>
                                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 ${step === s.id ? 'bg-[#C14B3A] border-[#C14B3A] text-white' : 'bg-white border-[#3A332F]/20 text-[#3A332F]'}`}>
                                                <s.icon size={12} className="md:w-3.5 md:h-3.5" />
                                            </div>
                                            <span className="font-ghibli-title uppercase text-[10px] md:text-sm">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full md:w-2/3 p-6 md:p-8 bg-[#FDF5E6]">
                            {step === 'summary' && (
                                <div className="space-y-6 animate-slide-in h-full flex flex-col">
                                    <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex gap-4 p-3 bg-white rounded-[20px] shadow-sm items-center">
                                                <img src={item.image} className="w-14 h-14 rounded-xl object-cover" alt={item.name} />
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-sm text-[#3A332F] truncate">{item.name}</h4>
                                                    <p className="text-[#C14B3A] font-black text-xs">{formatCurrency(item.price)}</p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-[#FDF5E6] px-2 py-1 rounded-full border border-[#3A332F]/5 translate-x-[-10px]">
                                                    {!item.id.startsWith('sub-') && <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:text-[#C14B3A]"><Minus size={12} /></button>}
                                                    <span className="font-bold text-xs text-[#3A332F] w-4 text-center">{item.quantity}</span>
                                                    {!item.id.startsWith('sub-') && <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:text-[#C14B3A]"><Plus size={12} /></button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t-2 border-[#3A332F]/5">
                                        <div className="flex flex-col items-end w-full space-y-2">
                                            <div className="flex justify-between w-full text-sm text-[#8C8279]">
                                                <span>Subtotal</span>
                                                <span>${formatCurrency(total)}</span>
                                            </div>

                                            {discount > 0 && (
                                                <div className="flex justify-between w-full text-sm text-[#C14B3A]">
                                                    <span className="flex items-center gap-1"><Sparkles size={12} /> Descuento Ruleta (-{discount}%)</span>
                                                    <span>-${formatCurrency(total * (discount / 100))}</span>
                                                </div>
                                            )}

                                            {couponDiscountAmount > 0 && (
                                                <div className="flex justify-between w-full text-sm text-[#C14B3A]">
                                                    <span className="flex items-center gap-1"><Plus size={12} /> Cupón: {rewardInfo?.title}</span>
                                                    <span>-${formatCurrency(couponDiscountAmount)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between w-full text-sm text-[#8C8279]">
                                                <span>Envío</span>
                                                {shippingCost === 0 ? <span className="text-[#C14B3A] font-bold">GRATIS</span> : <span>${formatCurrency(shippingCost)}</span>}
                                            </div>

                                            <div className="w-full h-px bg-[#3A332F]/10 my-2"></div>

                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-ghibli-title text-xl text-[#3A332F]">Total</span>
                                                <span className="font-ghibli-title text-2xl text-[#C14B3A]"><span className="text-[#C14B3A] text-lg">$</span>{formatCurrency(finalTotal)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setStep('shipping')} className="w-full bg-[#3A332F] text-white font-ghibli-title py-4 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all flex items-center justify-center gap-3">IR A ENVÍO <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            )}

                            {step === 'shipping' && (
                                <div className="space-y-6 animate-slide-in h-full flex flex-col">
                                    <h3 className="text-xl font-ghibli-title text-[#3A332F] flex items-center gap-2"><MapPin size={20} className="text-[#C14B3A]" /> Datos de Entrega</h3>
                                    <div className="space-y-3 flex-grow">
                                        <input
                                            value={shipping.fullName}
                                            onChange={e => setShipping({ ...shipping, fullName: e.target.value })}
                                            placeholder="Nombre Completo"
                                            className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] placeholder:text-[#3A332F]/30 ${shippingErrors.fullName ? 'border-red-400' : 'border-transparent'}`}
                                        />
                                        <input
                                            value={shipping.phone}
                                            onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                                            placeholder="Teléfono de Contacto"
                                            type="tel"
                                            className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] placeholder:text-[#3A332F]/30`}
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={shipping.department}
                                                onChange={e => setShipping({ ...shipping, department: e.target.value })}
                                                className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] appearance-none ${shippingErrors.department ? 'border-red-400' : 'border-transparent'}`}
                                            >
                                                <option value="">Departamento</option>
                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>

                                            <div className="relative">
                                                <input
                                                    value={shipping.city}
                                                    onChange={e => {
                                                        setShipping({ ...shipping, city: e.target.value });
                                                        setShowCitySuggestions(true);
                                                    }}
                                                    onFocus={() => setShowCitySuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                                                    disabled={!shipping.department}
                                                    placeholder="Escribe tu Municipio"
                                                    className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] placeholder:text-[#3A332F]/30 ${shippingErrors.city ? 'border-red-400' : 'border-transparent'} disabled:opacity-50`}
                                                />
                                                {showCitySuggestions && shipping.department && (
                                                    <ul className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border-2 border-[#3A332F]/5 max-h-[200px] overflow-y-auto">
                                                        {colombiaData[shipping.department]
                                                            ?.filter(c => c.toLowerCase().includes(shipping.city.toLowerCase()))
                                                            .map(c => (
                                                                <li
                                                                    key={c}
                                                                    className="p-3 hover:bg-[#FDF5E6] hover:text-[#C14B3A] cursor-pointer text-sm text-[#3A332F] font-bold transition-colors"
                                                                    onMouseDown={() => {
                                                                        setShipping(prev => ({ ...prev, city: c }));
                                                                        setShowCitySuggestions(false);
                                                                    }}
                                                                >
                                                                    {c}
                                                                </li>
                                                            ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        <input
                                            value={shipping.address}
                                            onChange={e => setShipping({ ...shipping, address: e.target.value })}
                                            placeholder="Dirección Exacta"
                                            className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] placeholder:text-[#3A332F]/30 ${shippingErrors.address ? 'border-red-400' : 'border-transparent'}`}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setStep('summary')} className="px-6 py-4 bg-white rounded-full font-bold text-[#3A332F] shadow-sm hover:bg-gray-50 text-sm">Volver</button>
                                        <button onClick={() => validateShipping() && setStep('payment')} className="flex-grow bg-[#3A332F] text-white font-ghibli-title py-4 rounded-full shadow-lg hover:bg-[#C14B3A] transition-all text-sm">CONTINUAR</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {step === 'payment' && !success && (
                    <div className="p-4 md:p-8 w-full animate-slide-in flex flex-col items-center justify-center h-full">
                        <div className="text-center mb-4 md:mb-6 shrink-0">
                            <h2 className="font-ghibli-title text-xl md:text-3xl text-[#3A332F] mb-1">Finalizar <span className="text-[#C14B3A]">Pago</span></h2>
                            {discount > 0 || couponDiscountAmount > 0 ? (
                                <div className="flex flex-col items-center w-full max-w-xs mx-auto bg-[#FDF5E6] p-4 rounded-xl mb-4">
                                    <div className="w-full flex justify-between text-xs text-[#8C8279] mb-1">
                                        <span>Subtotal:</span>
                                        <span>${formatCurrency(total)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="w-full flex justify-between text-xs text-[#C14B3A] font-bold mb-1">
                                            <span>Ruleta (-{discount}%):</span>
                                            <span>-${formatCurrency(total * (discount / 100))}</span>
                                        </div>
                                    )}
                                    {couponDiscountAmount > 0 && (
                                        <div className="w-full flex justify-between text-xs text-[#C14B3A] font-bold mb-1">
                                            <span>Cupón:</span>
                                            <span>-${formatCurrency(couponDiscountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="w-full flex justify-between text-xs text-[#8C8279] mb-2">
                                        <span>Envío:</span>
                                        {shippingCost === 0 ? <span className="text-[#C14B3A] font-bold">GRATIS</span> : <span>${formatCurrency(shippingCost)}</span>}
                                    </div>
                                    <div className="w-full h-px bg-[#3A332F]/10 mb-2"></div>
                                    <div className="w-full flex justify-between font-ghibli-title text-lg text-[#3A332F]">
                                        <span>Total:</span>
                                        <span className="text-[#C14B3A]">${formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8279] mb-1">Envío: {shippingCost === 0 ? 'GRATIS' : `$${formatCurrency(shippingCost)}`}</p>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8279]">Total: <span className="text-[#C14B3A] text-sm md:text-base">${formatCurrency(finalTotal)}</span></p>
                                </div>
                            )}
                        </div>

                        {/* Payment Toggles - COMPACT */}
                        <div className="grid grid-cols-3 gap-2 md:gap-3 w-full mb-4 md:mb-6 shrink-0">
                            <button onClick={() => setMethod('nequi')} className={`py-2 md:py-4 rounded-[15px] md:rounded-[20px] flex flex-col items-center justify-center gap-1 md:gap-2 transition-all shadow-sm ${method === 'nequi' ? 'bg-[#C14B3A] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#3A332F] hover:bg-gray-50'}`}>
                                <img src="/assets/nequi-logo.png" alt="Nequi" className={`w-auto h-4 md:h-6 object-contain ${method === 'nequi' ? 'brightness-0 invert' : ''}`} />
                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest leading-none">Nequi</span>
                            </button>
                            <button onClick={() => setMethod('card')} className={`py-2 md:py-4 rounded-[15px] md:rounded-[20px] flex flex-col items-center justify-center gap-1 md:gap-2 transition-all shadow-sm ${method === 'card' ? 'bg-[#3A332F] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#C14B3A] hover:bg-gray-50'}`}>
                                <CreditCard size={16} className={`md:w-5 md:h-5 ${method === 'card' ? 'text-white' : 'text-[#C14B3A]'}`} />
                                <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest text-center leading-none ${method === 'card' ? 'text-white' : 'text-[#C14B3A]'}`}>Tarjeta</span>
                            </button>
                            <button onClick={() => setMethod('manual')} className={`py-2 md:py-4 rounded-[15px] md:rounded-[20px] flex flex-col items-center justify-center gap-1 md:gap-2 transition-all shadow-sm ${method === 'manual' ? 'bg-[#D4AF37] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#3A332F] hover:bg-gray-50'}`}>
                                <img src="/assets/bancolombia-logo.png" alt="Bancolombia" className="w-auto h-4 md:h-6 object-contain" />
                                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter leading-none whitespace-nowrap">Bancolombia</span>
                            </button>
                        </div>

                        {/* NEQUI CARD View - COMPACT */}
                        {method === 'nequi' && (
                            <div className="bg-white rounded-[20px] md:rounded-[30px] p-3 md:p-6 w-full shadow-lg border border-white mb-4 md:mb-6 relative group overflow-visible shrink min-h-0 flex flex-col">
                                <div className="text-center flex flex-col justify-center h-full">
                                    {/* Link to external if needed, or just show QR */}
                                    <div className="relative z-50 mb-1 md:mb-4 shrink">
                                        <img
                                            src="/assets/nequi-qr.png"
                                            alt="Nequi QR"
                                            className="w-[120px] md:w-[200px] h-auto mx-auto object-contain block p-1 md:p-2 cursor-zoom-in hover:scale-105 transition-transform duration-300 drop-shadow-md"
                                            onClick={() => setShowFullQr(true)}
                                        />
                                    </div>

                                    <div className="space-y-0.5 md:space-y-1 mb-2 md:mb-4 shrink-0">
                                        <p className="font-ghibli-title text-base md:text-2xl text-[#C14B3A] leading-none">0089453443</p>
                                        <p className="font-ghibli-title text-[10px] md:text-sm text-[#C14B3A] bg-[#FDF5E6] py-0.5 md:py-1 px-2 md:px-4 rounded-full inline-block">EMEDICAL EYDER RODRIGUEZ</p>
                                    </div>

                                    <div className="space-y-2 md:space-y-3 pt-1 w-full max-w-[280px] mx-auto shrink-0">
                                        <input
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            placeholder="Celular origen"
                                            className="w-full p-2 md:p-4 bg-[#FDF5E6] rounded-xl md:rounded-2xl font-bold text-[#3A332F] text-[10px] md:text-xs outline-none text-center border-2 border-transparent focus:border-[#C14B3A] placeholder:text-[#3A332F]/50"
                                        />
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className={`w-full p-2 md:p-4 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-xs flex items-center justify-center gap-2 border-2 border-dashed transition-all ${proofFile ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#FDF5E6] text-[#8C8279] border-[#D7CCC8]'}`}>
                                                {proofFile ? <><CheckCircle2 size={12} className="md:w-4 md:h-4" /> Listo</> : <><Upload size={12} className="md:w-4 md:h-4" /> Subir Comprobante</>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {method !== 'nequi' && (
                            <div className="bg-white rounded-[20px] md:rounded-[30px] p-4 md:p-8 w-full shadow-lg border border-white mb-4 md:mb-6 min-h-[200px] md:min-h-[300px] flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 shrink">
                                {method === 'card' ? (
                                    <>
                                        <ShieldCheck className="text-[#3A332F]/20 w-10 md:w-16 h-10 md:h-16" />
                                        <p className="text-[#3A332F] font-bold text-xs md:text-sm max-w-[200px]">Pago seguro con Stripe. Serás redirigido.</p>
                                    </>
                                ) : (
                                    <>
                                        <img src="/assets/bancolombia-logo.png" alt="Bancolombia" className="w-24 md:w-32 h-auto object-contain mb-2 md:mb-4 opacity-80" />
                                        <p className="text-[#3A332F] font-bold text-xs md:text-sm max-w-[200px]">Transferencia Bancaria a Bancolombia.</p>
                                        <p className="font-ghibli-title text-sm md:text-lg text-[#C14B3A] mt-1">Cuenta Ahorros: 81378232538</p>

                                        <div className="relative w-full max-w-[200px] pt-2">
                                            <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className={`w-full p-2 md:p-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs flex items-center justify-center gap-2 border-2 border-dashed transition-all ${proofFile ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#FDF5E6] text-[#8C8279] border-[#D7CCC8]'}`}>
                                                {proofFile ? <><CheckCircle2 size={12} /> Listo</> : <><Upload size={12} /> Subir Comprobante</>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleCompletePayment}
                            disabled={isProcessing || (method === 'nequi' && !proofFile)}
                            className={`w-full bg-[#3A332F] text-white font-ghibli-title py-3 md:py-4 rounded-[15px] md:rounded-[20px] shadow-xl hover:bg-[#C14B3A] transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-xs md:text-base shrink-0 ${isProcessing || (method === 'nequi' && !proofFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Verificando...' : 'Completar Pago'} <ArrowRight size={16} className="md:w-5 md:h-5" />
                        </button>

                        <button onClick={() => setStep('shipping')} className="mt-3 md:mt-4 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#3A332F]/40 hover:text-[#3A332F] transition-colors shrink-0">
                            Volver a envíos
                        </button>
                    </div>
                )}

                {success && (
                    <div className="p-12 flex flex-col items-center justify-center text-center bg-white h-full min-h-[400px]">
                        <div className="w-24 h-24 bg-[#81C784] rounded-full flex items-center justify-center text-white mb-6 animate-pop shadow-xl"><CheckCircle2 size={48} /></div>
                        <h2 className="text-3xl font-ghibli-title mb-2 text-[#3A332F]">¡Pedido Recibido!</h2>
                        <p className="text-[#8C8279] font-bold mb-8 text-sm max-w-xs">Gracias por tu ofrenda. Los espíritus prepararán tu envío pronto.</p>
                        <button onClick={onSuccess} className="px-10 py-4 bg-[#3A332F] text-white rounded-full font-ghibli-title hover:bg-[#C14B3A] transition-all shadow-lg text-sm">ENTENDIDO</button>
                    </div>
                )}
            </div>
            {/* Full Screen QR Modal */}
            {showFullQr && (
                <div className="fixed inset-0 z-[2200] bg-[#3A332F]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowFullQr(false)}>
                    <div className="relative max-w-lg w-full bg-[#FDF5E6] rounded-[40px] p-8 md:p-10 shadow-2xl border-4 border-[#C14B3A]/30 animate-in zoom-in-95 duration-300 flex flex-col items-center transform transition-all" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowFullQr(false)}
                            className="absolute top-4 right-4 p-3 bg-white rounded-full text-[#3A332F] hover:bg-[#C14B3A] hover:text-white transition-colors shadow-lg group"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="text-center mb-6">
                            <span className="bg-[#C14B3A] text-white text-[10px] uppercase font-black tracking-[0.3em] px-3 py-1 rounded-full mb-2 inline-block shadow-sm">Escanea para pagar</span>
                            <h3 className="font-ghibli-title text-3xl md:text-5xl text-[#3A332F] leading-none">Nequi <span className="text-[#C14B3A]">QR</span></h3>
                        </div>

                        <div className="bg-white p-4 rounded-[30px] shadow-inner mb-6 border-2 border-[#3A332F]/5 rotate-1 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/assets/nequi-qr.png"
                                alt="Nequi QR Full"
                                className="w-full h-auto max-h-[50vh] object-contain min-w-[280px]"
                            />
                        </div>

                        <div className="text-center space-y-1">
                            <p className="font-ghibli-title text-2xl text-[#C14B3A]">EMEDICAL EYDER RODRIGUEZ</p>
                            <p className="font-bold text-[#3A332F]/40 text-xs tracking-widest uppercase">Haz clic fuera para cerrar</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutModal;
