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
    const envTemplate = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    const envKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleUploadTest = async () => {
        if (!testFile) {
            addLog('⚠️ Selecciona un archivo primero.');
            return;
        }

        addLog(`📂 Iniciando prueba de subida: ${testFile.name} (${testFile.size} bytes)`);

        if (!supabaseUrl || !supabaseKey) {
            addLog('❌ ERROR CRÍTICO: Faltan variables de Supabase (URL o Key).');
            return;
        }

        try {
            const fileName = `debug_test_${Date.now()}_${testFile.name}`;
            const { data, error } = await supabase.storage
                .from('receipts')
                .upload(fileName, testFile);

            if (error) {
                addLog('❌ ERROR SUBIDA: ' + error.message);
                addLog('🔍 Detalles: ' + JSON.stringify(error));
            } else {
                addLog('✅ ÉXITO SUBIDA: Archivo guardado.');
                const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
                addLog('🔗 URL Pública: ' + urlData.publicUrl);
                setUploadedUrl(urlData.publicUrl); // Save for email test
                addLog('👉 URL Guardada para la prueba de email.');
            }
        } catch (err: any) {
            addLog('❌ EXCEPCIÓN: ' + (err.message || err));
        }
    };


    const handleTest = async () => {
        setStatus('sending');
        addLog('Starting test...');

        if (!envService || !envTemplate || !envKey) {
            addLog('❌ ERROR: Missing Environment Variables in Vercel.');
            setStatus('error');
            return;
        }

        addLog(`Service ID: ${envService.substring(0, 4)}...`);
        addLog(`Template ID: ${envTemplate.substring(0, 4)}...`);
        addLog(`Public Key: ${envKey.substring(0, 4)}...`);

        const params = {
            to_name: "Admin Debug",
            from_name: "Test User",
            order_id: "DEBUG-" + Math.random().toString(36).substr(2, 5),
            message: "This is a clean debug message with image test.",
            customer_email: "debug@test.com",
            customer_phone: "123456789",
            payment_proof: uploadedUrl || "NO_IMAGE_UPLOADED",
            total: "$100"
        };

        addLog('Sending payload: ' + JSON.stringify(params));

        try {
            await emailjs.send(envService, envTemplate, params, envKey);
            addLog('✅ SUCCESS: Email sent to EmailJS API.');
            setStatus('success');
        } catch (e: any) {
            addLog('❌ FAIL: ' + (e.text || e.message || JSON.stringify(e)));
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF5E6] p-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-[#3A332F]">Diagnóstico de Email 🕵️‍♂️</h1>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[#3A332F]/10 space-y-4">
                    <h2 className="font-bold text-xl">1. Variables de Entorno (Vercel)</h2>
                    <div className="grid gap-2 text-sm font-mono">
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>SERVICE_ID:</span>
                            <span className={envService ? "text-green-600" : "text-red-500"}>
                                {envService ? `${envService.substring(0, 5)}...OK` : 'MISSING'}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>TEMPLATE_ID:</span>
                            <span className={envTemplate ? "text-green-600" : "text-red-500"}>
                                {envTemplate ? `${envTemplate.substring(0, 5)}...OK` : 'MISSING'}
                            </span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-100 rounded">
                            <span>PUBLIC_KEY:</span>
                            <span className={envKey ? "text-green-600" : "text-red-500"}>
                                {envKey ? `${envKey.substring(0, 5)}...OK` : 'MISSING'}
                            </span>
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
                    <h2 className="font-bold text-xl">3. Prueba de Email</h2>
                    <button
                        onClick={handleTest}
                        disabled={status === 'sending'}
                        className="w-full py-3 bg-[#3A332F] text-white rounded-xl font-bold hover:bg-[#C14B3A] transition-colors flex items-center justify-center gap-2"
                    >
                        {status === 'sending' ? 'Enviando...' : 'Enviar Email de Prueba'} <Send size={18} />
                    </button>

                    {status === 'success' && (
                        <div className="p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-2">
                            <CheckCircle2 size={20} /> ¡Éxito! Revisa tu bandeja de entrada.
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
