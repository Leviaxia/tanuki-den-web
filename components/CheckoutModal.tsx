import React, { useState, useEffect } from 'react';
import { X, Wallet, Landmark, CreditCard, Minus, Plus, Trash2, CheckCircle2, ArrowRight, MapPin, Truck, ShieldCheck, Lock, Upload, Image as ImageIcon } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../src/lib/utils';
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
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen, onClose, cart, total, onUpdateQuantity, onRemove, onSuccess, user
}) => {
    const [step, setStep] = useState<'summary' | 'shipping' | 'payment'>('summary');
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Shipping State
    const [shipping, setShipping] = useState({ fullName: '', department: '', city: '', address: '' });
    const [shippingErrors, setShippingErrors] = useState<any>({});

    // Payment State
    const [method, setMethod] = useState<'nequi' | 'card' | 'manual'>('nequi');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [senderPhone, setSenderPhone] = useState('');

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

    const handleCompletePayment = async () => {
        setIsProcessing(true);
        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            setSuccess(true);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className={`bg-[#FDF5E6] w-full max-w-4xl rounded-[30px] md:rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-pop border-4 border-white relative transition-all duration-500 ${step === 'payment' ? 'max-w-[480px] md:flex-col min-h-0' : 'min-h-[600px]'}`}>

                <button onClick={onClose} className="absolute top-5 right-5 z-50 p-2 bg-white rounded-full text-[#3A332F] hover:bg-[#C14B3A] hover:text-white transition-colors shadow-sm"><X size={20} /></button>

                {/* Steps Logic for Summary/Shipping (Maintained structure) */}
                {step !== 'payment' && !success && (
                    <>
                        {/* Progress Sidebar (Desktop) / Topbar (Mobile) */}
                        <div className="w-full md:w-1/3 bg-white p-6 md:p-8 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-[#3A332F]/5">
                            <div className="space-y-6">
                                <h2 className="text-2xl md:text-3xl font-ghibli-title text-[#3A332F] uppercase leading-none">Tu <br /><span className="text-[#C14B3A]">Pedido</span></h2>
                                <div className="flex md:flex-col gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                    {[
                                        { id: 'summary', label: 'Resumen', icon: Wallet },
                                        { id: 'shipping', label: 'Envío', icon: Truck },
                                    ].map((s, i) => (
                                        <div key={s.id} className={`flex items-center gap-3 transition-all flex-shrink-0 ${step === s.id ? 'opacity-100 translate-x-1' : 'opacity-40'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === s.id ? 'bg-[#C14B3A] border-[#C14B3A] text-white' : 'bg-white border-[#3A332F]/20 text-[#3A332F]'}`}>
                                                <s.icon size={14} />
                                            </div>
                                            <span className="font-ghibli-title uppercase text-xs md:text-sm">{s.label}</span>
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
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-ghibli-title text-xl text-[#3A332F]">Total</span>
                                            <span className="font-ghibli-title text-2xl text-[#C14B3A]"><span className="text-[#C14B3A] text-lg">$</span>{formatCurrency(total)}</span>
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

                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={shipping.department}
                                                onChange={e => setShipping({ ...shipping, department: e.target.value })}
                                                className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] appearance-none ${shippingErrors.department ? 'border-red-400' : 'border-transparent'}`}
                                            >
                                                <option value="">Departamento</option>
                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>

                                            <select
                                                value={shipping.city}
                                                onChange={e => setShipping({ ...shipping, city: e.target.value })}
                                                disabled={!shipping.department}
                                                className={`w-full p-4 bg-white rounded-2xl font-bold text-[#3A332F] text-sm outline-none border-2 focus:border-[#C14B3A] appearance-none ${shippingErrors.city ? 'border-red-400' : 'border-transparent'} disabled:opacity-50`}
                                            >
                                                <option value="">Municipio</option>
                                                {shipping.department && colombiaData[shipping.department]?.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
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

                {/* PAYMENT STEP - REDESIGNED EXACTLY AS REQUESTED */}
                {step === 'payment' && !success && (
                    <div className="p-8 w-full animate-slide-in flex flex-col items-center">
                        <div className="text-center mb-6">
                            <h2 className="font-ghibli-title text-3xl text-[#3A332F] mb-1">Finalizar <span className="text-[#C14B3A]">Pago</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C8279]">Total a Pagar: <span className="text-[#C14B3A] text-base">${formatCurrency(total)}</span></p>
                        </div>

                        {/* Payment Toggles */}
                        <div className="grid grid-cols-3 gap-3 w-full mb-6">
                            <button onClick={() => setMethod('nequi')} className={`py-4 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${method === 'nequi' ? 'bg-[#C14B3A] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#3A332F] hover:bg-gray-50'}`}>
                                <img src="/assets/nequi-logo.png" alt="Nequi" className={`w-auto h-6 object-contain ${method === 'nequi' ? 'brightness-0 invert' : ''}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Nequi</span>
                            </button>
                            <button onClick={() => setMethod('card')} className={`py-4 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${method === 'card' ? 'bg-[#3A332F] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#C14B3A] hover:bg-gray-50'}`}>
                                <CreditCard size={20} className={method === 'card' ? 'text-white' : 'text-[#C14B3A]'} />
                                <span className={`text-[9px] font-black uppercase tracking-widest text-center leading-none ${method === 'card' ? 'text-white' : 'text-[#C14B3A]'}`}>Tarjeta<br />/ PSE</span>
                            </button>
                            <button onClick={() => setMethod('manual')} className={`py-4 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${method === 'manual' ? 'bg-[#D4AF37] text-white shadow-lg scale-105 z-10' : 'bg-white text-[#3A332F] hover:bg-gray-50'}`}>
                                <img src="/assets/bancolombia-logo.png" alt="Bancolombia" className="w-auto h-6 object-contain" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Bancolombia</span>
                            </button>
                        </div>

                        {/* NEQUI CARD View */}
                        {method === 'nequi' && (
                            <div className="bg-white rounded-[30px] p-6 w-full shadow-lg border border-white mb-6 relative overflow-visible group">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C14B3A] to-[#D4AF37]"></div>

                                <div className="text-center space-y-4 relative z-10">
                                    {/* Full QR Container - MAX VISIBILITY */}
                                    <div className="w-64 h-64 mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex items-center justify-center relative z-20">
                                        <img
                                            src="/assets/nequi-qr.png"
                                            alt="Nequi QR"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#8C8279]">Envía a nuestro número oficial</p>
                                        <p className="font-ghibli-title text-2xl text-[#C14B3A]">+57 322 687 0628</p>
                                        <p className="font-ghibli-title text-sm text-[#C14B3A] bg-[#FDF5E6] py-1 px-4 rounded-full inline-block">DAIVER RODRIGUEZ</p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <input
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            placeholder="Celular desde el que envías"
                                            className="w-full p-4 bg-[#FDF5E6] rounded-2xl font-bold text-[#3A332F] text-xs outline-none text-center border-2 border-transparent focus:border-[#C14B3A] placeholder:text-[#3A332F]/30"
                                        />

                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className={`w-full p-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-dashed transition-all ${proofFile ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#FDF5E6] text-[#8C8279] border-[#D7CCC8]'}`}>
                                                {proofFile ? (
                                                    <><CheckCircle2 size={16} /> ¡Comprobante Cargado!</>
                                                ) : (
                                                    <><Upload size={16} /> Subir Comprobante de Pago</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {method !== 'nequi' && (
                            <div className="bg-white rounded-[30px] p-8 w-full shadow-lg border border-white mb-6 min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                                {method === 'card' ? (
                                    <>
                                        <ShieldCheck className="text-[#3A332F]/20" size={64} />
                                        <p className="text-[#3A332F] font-bold text-sm max-w-[200px]">Pago seguro con Stripe. Serás redirigido.</p>
                                    </>
                                ) : (
                                    <>
                                        <img src="/assets/bancolombia-logo.png" alt="Bancolombia" className="w-32 h-auto object-contain mb-4 opacity-80" />
                                        <p className="text-[#3A332F] font-bold text-sm max-w-[200px]">Transferencia Bancaria a Bancolombia.</p>
                                        <p className="text-xs text-[#8C8279]">Cuenta Ahorros: 123-456-789-00</p>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleCompletePayment}
                            disabled={isProcessing || (method === 'nequi' && !proofFile)}
                            className={`w-full bg-[#3A332F] text-white font-ghibli-title py-4 rounded-[20px] shadow-xl hover:bg-[#C14B3A] transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${isProcessing || (method === 'nequi' && !proofFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Verificando...' : 'Completar Pago'} <ArrowRight size={20} />
                        </button>

                        <button onClick={() => setStep('shipping')} className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#3A332F]/40 hover:text-[#3A332F] transition-colors">
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
        </div>
    );
};

export default CheckoutModal;
