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
                // 1. Get pending cart
                const pendingCartJson = localStorage.getItem('tanuki_pending_cart');
                if (!pendingCartJson) {
                    console.log('No pending cart found');
                    return;
                }

                const pendingCart = JSON.parse(pendingCartJson);

                // 2. Identify subscription (membership)
                const membershipItem = pendingCart.find((item: any) => item.isSubscription);

                if (membershipItem) {
                    console.log('Procesando membresía:', membershipItem.name);

                    // 3. Update SESSION STORAGE (User)
                    const savedUser = sessionStorage.getItem('tanuki_user');
                    let userFn = savedUser ? JSON.parse(savedUser) : null;

                    if (savedUser && userFn.id && userFn.id !== 'guest') {
                        // Update Membership if bought
                        if (membershipItem) {
                            userFn.membership = membershipItem.name;
                            await supabase.from('profiles').update({ membership: membershipItem.name }).eq('id', userFn.id);
                        }

                        // --- NEW: TRACKING & MISSIONS ---
                        const totalAmount = pendingCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                        const has3DPrint = pendingCart.some((item: any) => item.category === 'Personalización' || item.category === '3D' || item.name.toLowerCase().includes('3d'));

                        // Fetch current stats
                        const { data: profile } = await supabase.from('profiles').select('total_spent, total_orders, total_3d_orders').eq('id', userFn.id).single();

                        if (profile) {
                            const newTotalSpent = (profile.total_spent || 0) + totalAmount;
                            const newTotalOrders = (profile.total_orders || 0) + 1;
                            const newTotal3D = (profile.total_3d_orders || 0) + (has3DPrint ? 1 : 0);

                            // Update Profile Stats
                            await supabase.from('profiles').update({
                                total_spent: newTotalSpent,
                                total_orders: newTotalOrders,
                                total_3d_orders: newTotal3D,
                                // If membership updated, it's already done above, but we can combine if refactoring. Separated is fine.
                            }).eq('id', userFn.id);

                            // Helper to update mission
                            const checkMission = async (missionId: string, currentVal: number, target: number) => {
                                const { data: existing } = await supabase.from('user_missions').select('*').eq('user_id', userFn.id).eq('mission_id', missionId).single();
                                const isCompleted = currentVal >= target;
                                const wasCompleted = existing?.completed || false;

                                // Only update if progress increased or completed status changed
                                if ((existing?.progress || 0) < currentVal || (!wasCompleted && isCompleted)) {
                                    await supabase.from('user_missions').upsert({
                                        user_id: userFn.id,
                                        mission_id: missionId,
                                        progress: currentVal,
                                        completed: isCompleted || wasCompleted, // Keep completed true if already was
                                        claimed: existing?.claimed || false
                                    }, { onConflict: 'user_id, mission_id' });
                                }
                            };

                            await checkMission('second_treasure', newTotalOrders, 2);
                            await checkMission('persistent_collector', newTotalOrders, 5);
                            await checkMission('great_hoarder', newTotalSpent, 500000);
                            await checkMission('legend_clan', newTotalSpent, 1000000);

                            if (has3DPrint) {
                                await checkMission('workshop_forger', newTotal3D, 1);
                                await checkMission('mold_master', newTotal3D, 3);
                            }
                        }

                        // Update Local Session with new Membership if changed
                        sessionStorage.setItem('tanuki_user', JSON.stringify(userFn));
                        // Force App.tsx to reload user data (which will now fetch updated stats from DB!)
                        window.dispatchEvent(new Event('tanuki_user_update'));
                    }

                    // 5. Clear pending cart
                    localStorage.removeItem('tanuki_pending_cart');
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

