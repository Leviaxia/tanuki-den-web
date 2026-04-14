import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com';
import { ArrowLeft, Send, CheckCircle2, AlertOctagon, Upload } from 'lucide-react';
import Navbar from '../components/Navbar';

import { supabase } from '../lib/supabase'; // Ensure this path is correct

export const DebugEmail = () => {
    const [status, setStatus] = useState<string>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [testFile, setTestFile] = useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string>("");

    // Load vars from env (masking parts)
    const envService = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    const envAdminTemplate = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    const envReceiptTemplate = import.meta.env.VITE_EMAILJS_RECEIPT_TEMPLATE_ID || '';
    const envKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // ... (keep handleUploadTest same)

    const handleTest = async (type: 'admin' | 'receipt') => {
        setStatus('sending');
        addLog(`Starting ${type} test...`);

        const templateId = type === 'admin' ? envAdminTemplate : envReceiptTemplate;

        if (!envService || !templateId || !envKey) {
            addLog(`❌ ERROR: Missing ${type} variables.`);
            setStatus('error');
            return;
        }

        addLog(`Service ID: ${envService.substring(0, 4)}...`);
        addLog(`Template ID: ${templateId.substring(0, 4)}...`);
        
        const params = type === 'admin' ? {
            to_name: "Admin Debug",
            from_name: "Test User",
            order_id: "DEBUG-ADMIN-" + Math.random().toString(36).substr(2, 5),
            message: "Admin notification test",
            customer_email: "admin@test.com",
            customer_phone: "123456789",
            total: "$100"
        } : {
            to_email: "comprador@debug.com",
            customer_email: "comprador@debug.com",
            customer_name: "Cliente Debug",
            order_id: "DEBUG-RECEIPT-" + Math.random().toString(36).substr(2, 5),
            items: "1x Tanuki Plush\n2x Stickers",
            total_amount: "$150.000",
            shipping_address: "Calle 123",
            payment_method: "Nequi"
        };

        try {
            await emailjs.send(envService, templateId, params as any, envKey);
            addLog(`✅ SUCCESS: ${type} email sent.`);
            setStatus('success');
        } catch (e: any) {
            addLog(`❌ FAIL: ` + (e.text || e.message || JSON.stringify(e)));
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF5E6] p-8 font-sans text-[#3A332F]">
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">Diagnóstico de Email 🕵️‍♂️</h1>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[#3A332F]/10 space-y-4">
                    <h2 className="font-bold text-xl">1. Variables de Entorno</h2>
                    <div className="grid gap-2 text-sm font-mono">
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>SERVICE_ID:</span>
                            <span className={envService ? "text-green-600" : "text-red-500"}>{envService ? `OK` : 'MISSING'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>ADMIN_TEMPLATE:</span>
                            <span className={envAdminTemplate ? "text-green-600" : "text-red-500"}>{envAdminTemplate ? `OK` : 'MISSING'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>RECEIPT_TEMPLATE:</span>
                            <span className={envReceiptTemplate ? "text-green-600" : "text-red-500"}>{envReceiptTemplate ? `OK` : 'MISSING'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>PUBLIC_KEY:</span>
                            <span className={envKey ? "text-green-600" : "text-red-500"}>{envKey ? `OK` : 'MISSING'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[#3A332F]/10 space-y-4">
                    <h2 className="font-bold text-xl">2. Prueba de Almacenamiento (Supabase)</h2>
                    <div className="grid gap-2 text-sm font-mono mb-4">
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>SUPABASE_URL:</span>
                            <span className={supabaseUrl ? "text-green-600" : "text-red-500"}>
                                {supabaseUrl ? `OK` : 'MISSING'}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>SUPABASE_KEY:</span>
                            <span className={supabaseKey ? "text-green-600" : "text-red-500"}>
                                {supabaseKey ? `OK` : 'MISSING'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleUploadTest(); }} className="space-y-3">
                        <input
                            type="file"
                            onChange={(e) => setTestFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3A332F] file:text-white hover:file:bg-[#C14B3A]"
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload size={18} /> Probar Subida
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[#3A332F]/10 space-y-4">
                    <h2 className="font-bold text-xl">3. Pruebas de Email</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleTest('admin')}
                            disabled={status === 'sending'}
                            className="py-3 bg-[#3A332F] text-white rounded-xl font-bold hover:bg-[#C14B3A] transition-colors flex items-center justify-center gap-2"
                        >
                            {status === 'sending' ? 'Enviando...' : 'Probar Notificación Administrador'} <Send size={18} />
                        </button>
                        <button
                            onClick={() => handleTest('receipt')}
                            disabled={status === 'sending'}
                            className="py-3 bg-[#C14B3A] text-white rounded-xl font-bold hover:bg-[#3A332F] transition-colors flex items-center justify-center gap-2"
                        >
                            {status === 'sending' ? 'Enviando...' : 'Probar Recibo Cliente'} <CheckCircle2 size={18} />
                        </button>
                    </div>

                    {status === 'success' && (
                        <div className="p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-2">
                            <CheckCircle2 size={20} /> ¡Éxito! Revisa EmailJS o tu bandeja.
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-100 text-red-800 rounded-xl flex items-center gap-2">
                            <AlertOctagon size={20} /> Falló. Revisa el log abajo.
                        </div>
                    )}
                </div>

                <div className="bg-black text-green-400 p-6 rounded-2xl shadow-inner font-mono text-xs h-64 overflow-y-auto">
                    {log.map((l, i) => <div key={i}>{l}</div>)}
                    {log.length === 0 && <div className="opacity-50">Esperando prueba...</div>}
                </div>
            </div>
        </div>
    );
};
