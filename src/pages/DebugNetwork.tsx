import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const DebugNetwork = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog("Iniciando Pruebas de Diagnóstico V1.0...");
        setStatus('running');

        try {
            // TEST 1: Environment Variables
            addLog("--- 1. VARIABLES DE ENTORNO ---");
            addLog(`URL: ${supabaseUrl ? 'OK (' + supabaseUrl + ')' : 'MISSING'}`);
            addLog(`KEY: ${supabaseAnonKey ? 'OK (Presente)' : 'MISSING'}`);
            if (!supabaseUrl || !supabaseAnonKey) throw new Error("Faltan variables críticas.");

            // TEST 2: Raw Ping (HEAD Request)
            addLog("--- 2. CONEXIÓN RAW (FETCH) ---");
            const start = Date.now();
            try {
                const res = await fetch(`${supabaseUrl}/rest/v1/`, {
                    method: 'HEAD',
                    headers: { 'apikey': supabaseAnonKey }
                });
                const ms = Date.now() - start;
                addLog(`PING REST API: ${res.status} ${res.statusText} (${ms}ms)`);
                if (!res.ok) throw new Error(`Ping falló con estado ${res.status}`);
            } catch (e: any) {
                addLog(`ERROR PING: ${e.message}`);
                throw e; // Stop here if basic connectivity fails
            }

            // TEST 3: Auth Endpoint (Raw)
            addLog("--- 3. AUTH ENDPOINT (RAW) ---");
            try {
                // Just check if endpoint responds, even with 401 or 400 it means it's reachable
                const authRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
                    method: 'GET',
                    headers: { 'apikey': supabaseAnonKey }
                });
                // settings requires admin usually, so 401/403 is "Good" connectivity wise compared to Timeout
                addLog(`AUTH CHECK: ${authRes.status} (Esperado 200 o 401)`);
            } catch (e: any) {
                addLog(`ERROR AUTH: ${e.message}`);
            }

            // TEST 4: Storage Bucket Public Access
            addLog("--- 4. ACCESO STORAGE (Nativo) ---");
            try {
                // Try to head a known missing file, should get 404, not Network Error
                const storeRes = await fetch(`${supabaseUrl}/storage/v1/object/public/products/test-ping.txt`, { method: 'HEAD' });
                addLog(`STORAGE CHECK: ${storeRes.status} (Esperado 404 si conecta)`);
            } catch (e: any) {
                addLog(`ERROR STORAGE: ${e.message}`);
            }

            addLog("--- DIAGNÓSTICO FINALIZADO ---");
            addLog("Si todos los pasos anteriores mostraron actividad (incluso errores HTTP), tu internet funciona.");
            addLog("Si hubo 'Failed to fetch', es un bloqueo de red (CORS/Firewall).");

        } catch (err: any) {
            addLog(`❌ ERROR FATAL: ${err.message}`);
        } finally {
            setStatus('done');
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-8 overflow-auto">
            <h1 className="text-2xl font-bold mb-4 text-white">TANUKI SYSTEM DIAGNOSTICS</h1>

            <button
                onClick={runTests}
                disabled={status === 'running'}
                className="bg-green-600 text-black px-6 py-2 font-bold uppercase hover:bg-green-500 disabled:opacity-50 mb-6"
            >
                {status === 'running' ? 'EJECUTANDO...' : 'EJECUTAR PRUEBA DE RED'}
            </button>

            <div className="border border-green-800 p-4 rounded bg-black/50 min-h-[400px]">
                {logs.length === 0 ? (
                    <p className="opacity-50">Presiona Ejecutar para comenzar...</p>
                ) : (
                    logs.map((log, i) => <div key={i} className="mb-1 border-b border-green-900/30 pb-1">{log}</div>)
                )}
            </div>

            <div className="mt-8 text-white text-xs">
                <p>Environment: {import.meta.env.MODE}</p>
                <p>Browser: {navigator.userAgent}</p>
            </div>
        </div>
    );
};
