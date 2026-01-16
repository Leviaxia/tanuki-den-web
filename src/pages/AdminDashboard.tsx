import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { Plus, Edit3, Trash2, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../lib/utils';

export const AdminDashboard = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({});
    const [isCreating, setIsCreating] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Initial load: Do NOT fetch automatically to prevent loading loops
    useEffect(() => {
        setLoading(false);
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Attempting RAW FETCH to bypass SDK...");

            // 1. Get Session Token (Use Helper)
            const token = getAuthToken();

            // 2. Prepare Headers
            const headers: HeadersInit = {
                'apikey': supabaseAnonKey || '',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 3. Raw Fetch Request (No Cache)
            const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, {
                method: 'GET',
                headers: headers,
                cache: 'no-store'
            });

            // 4. Handle HTTP Errors Explicitly
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error del Servidor (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log("Raw Fetch Success:", data);

            setProducts(data || []);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const getAuthToken = () => {
        try {
            // 1. Try SDK Session first (cleanest)
            // But we can't await here easily, and SDK might hang. 
            // Better to rely on localStorage which is synchronous and reliable if user is logged in.

            const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
            const key = `sb-${projectRef}-auth-token`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.access_token;
            }
        } catch (e) {
            console.error("Error reading token", e);
        }
        return null;
    };

    const handleSave = async (product: Partial<Product>) => {
        if (!product.name || !product.price) return alert('Nombre y Precio son requeridos');
        setLoading(true);

        try {
            const token = getAuthToken();
            if (!token) throw new Error("No hay sesión. Por favor reloguea.");

            const headers: HeadersInit = {
                'apikey': supabaseAnonKey || '',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };

            let url = `${supabaseUrl}/rest/v1/products`;
            let method = 'POST';

            // Payload cleaning: remove undefined/nulls that Supabase dislikes? 
            // Actually REST API handles JSON fine.
            const payload = {
                name: product.name,
                price: product.price,
                description: product.description,
                category: product.category || 'General',
                image: product.image || 'https://via.placeholder.com/300',
                stock: product.stock || 0
            };

            if (product.id) {
                // Update
                url = `${supabaseUrl}/rest/v1/products?id=eq.${product.id}`;
                method = 'PATCH';
            }

            console.log(`Sending RAW ${method} to ${url}`);

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error (${response.status}): ${errText}`);
            }

            console.log("Save Success");

            if (product.id) {
                setEditingId(null);
            } else {
                setIsCreating(false);
                setNewProduct({});
            }

            // Wait a bit before fetching to let DB propagate? Usually not needed for single writer.
            fetchProducts();

        } catch (err: any) {
            console.error(err);
            alert('Error guardando: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar este tesoro?')) return;
        setLoading(true);

        try {
            const token = getAuthToken();
            if (!token) throw new Error("No hay sesión.");

            const response = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseAnonKey || '',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error (${response.status}): ${errText}`);
            }

            fetchProducts();
        } catch (err: any) {
            alert('Error borrando: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        try {
            const start = Date.now();
            const res = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD', headers: { apikey: supabaseAnonKey || '' } });
            const time = Date.now() - start;
            alert(`Conexión Exitosa: ${res.status} OK (${time}ms)\nLa red funciona.`);
        } catch (e: any) {
            console.error(e);
            alert(`Error de Conexión: ${e.message}\nEs posible que tu internet bloquee Supabase.`);
        }
    };

    const loadMockData = () => {
        setProducts([
            { id: '1', name: 'Tanuki de Prueba', price: 50000, stock: 10, category: 'Test', description: 'Si ves esto, la interfaz funciona.', image: 'https://via.placeholder.com/150', created_at: new Date().toISOString() }
        ]);
        alert("Modo Prueba: Se han cargado datos falsos para verificar la interfaz.");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDF5E6]"><Loader2 className="animate-spin text-[#C14B3A]" size={48} /></div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF5E6] space-y-4 text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-ghibli-title text-[#3A332F]">Algo salió mal</h2>
            <p className="text-red-600 font-bold max-w-md">{error}</p>

            <div className="bg-black/10 p-4 rounded-lg text-[10px] font-mono text-left space-y-1 w-full max-w-sm mx-auto">
                <p><strong>Diagnosis (V5.1):</strong></p>
                <p>Mode: FULL RAW FETCH</p>
                <p>Target: {supabaseUrl}</p>
                <p>Timestamp: {new Date().toLocaleTimeString()}</p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <button onClick={fetchProducts} className="bg-[#3A332F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#C14B3A] transition-all flex items-center justify-center gap-2">
                    <Loader2 size={16} /> Reintentar
                </button>
                <button onClick={testConnection} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    📡 Probar Conexión (Ping)
                </button>
                <button onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} className="text-[#3A332F] underline text-sm hover:text-[#C14B3A]">
                    Cerrar Sesión y Volver al Inicio
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDF5E6] p-8 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-xl border-4 border-[#3A332F]">
                    <div>
                        <h1 className="text-4xl font-ghibli-title text-[#3A332F] uppercase">Panel de Control</h1>
                        <p className="text-[#8C8279] font-bold">Gestiona los tesoros del Tanuki Den</p>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="bg-[#C14B3A] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#3A332F] transition-all"><Plus /> Nuevo Tesoro</button>
                </div>

                {isCreating && (
                    <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-[#C14B3A] animate-slide-in">
                        <h2 className="text-xl font-bold mb-4">Crear Nuevo Producto</h2>
                        <ProductForm product={newProduct} onSave={handleSave} onCancel={() => setIsCreating(false)} />
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="bg-white p-12 rounded-[40px] shadow-xl border-4 border-[#3A332F] text-center opacity-80 mt-8">
                        <ImageIcon className="mx-auto mb-4 text-[#C14B3A]" size={64} />
                        <h3 className="text-2xl font-ghibli-title text-[#3A332F] mb-2">No hay tesoros visibles</h3>
                        <p className="text-[#8C8279] font-bold">Si acabas de arreglar la base de datos, es posible que esté vacía.</p>
                        <p className="text-[#8C8279]">¡Prueba el botón "Nuevo Tesoro"!</p>
                        <p className="mt-4 text-xs font-mono text-gray-400">Estado: Sin Datos (Haz clic abajo)</p>

                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={fetchProducts} className="bg-[#3A332F] text-white px-6 py-3 rounded-full font-bold hover:bg-[#C14B3A] transition-all flex items-center gap-2">
                                <Loader2 size={16} /> Cargar de Supabase
                            </button>
                            <button onClick={loadMockData} className="bg-gray-200 text-gray-600 px-6 py-3 rounded-full font-bold hover:bg-gray-300 transition-all">
                                🛠️ Simular Datos
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {products.map(product => (
                            <div key={product.id} className="bg-white p-6 rounded-[30px] shadow-md border-2 border-[#FDF5E6] flex flex-col md:flex-row gap-6 items-center">
                                <img src={product.image} className="w-24 h-24 rounded-2xl object-cover bg-gray-100" />

                                {editingId === product.id ? (
                                    <div className="flex-grow w-full">
                                        <ProductForm product={product} onSave={handleSave} onCancel={() => setEditingId(null)} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="font-bold text-xl text-[#3A332F]">{product.name}</h3>
                                            <p className="text-[#8C8279] text-sm line-clamp-1">{product.description}</p>
                                            <div className="flex gap-4 mt-2 justify-center md:justify-start">
                                                <span className="bg-[#FDF5E6] px-3 py-1 rounded-full text-xs font-bold text-[#C14B3A]"><span className="text-[#C14B3A]">$</span>{formatCurrency(product.price)}</span>
                                                <span className="bg-[#FDF5E6] px-3 py-1 rounded-full text-xs font-bold text-[#3A332F]">{product.stock} Unidades</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(product.id)} className="p-3 hover:bg-[#FDF5E6] rounded-full text-[#3A332F] transition-colors"><Edit3 size={20} /></button>
                                            <button onClick={() => handleDelete(product.id)} className="p-3 hover:bg-red-50 rounded-full text-red-500 transition-colors"><Trash2 size={20} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductForm = ({ product, onSave, onCancel }: { product: Partial<Product>, onSave: (p: Partial<Product>) => void, onCancel: () => void }) => {
    const [form, setForm] = useState(product);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            // 0. Validación Básica
            if (!e.target.files || e.target.files.length === 0) {
                setUploading(false);
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const uploadUrl = `${supabaseUrl}/storage/v1/object/products/${fileName}`;

            console.log("Iniciando subida RAW para:", fileName);

            // 1. Obtener Token de Sesión (Manual para evitar errores del SDK)
            let token = '';

            // INTENTO 1: SDK con Timeout agresivo (2s)
            try {
                const sdkPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject('SDK Timeout'), 2000));

                const { data }: any = await Promise.race([sdkPromise, timeoutPromise]);
                token = data?.session?.access_token || '';
            } catch (err) {
                console.warn("SDK getSession falló o tardó demasiado, usando localStorage...");
            }

            // INTENTO 2: LocalStorage Manual
            if (!token) {
                const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
                const key = `sb-${projectRef}-auth-token`;
                const stored = localStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    token = parsed.access_token;
                }
            }

            if (!token) throw new Error("No hay sesión válida. Recarga la página.");


            const headers: HeadersInit = {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey || '',
            };

            // 3. Raw Fetch (Sin SDK)
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: headers,
                body: file
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error en subida (${response.status}): ${errorText}`);
            }

            // 4. Construir URL Pública (Manual o vía SDK, el SDK es seguro para esto)
            // Re-derive path or just rely on convention
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${fileName}`;

            setForm({ ...form, image: publicUrl });
        } catch (error: any) {
            console.error('Raw Upload Error:', error);
            alert(`Error subiendo imagen: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <input placeholder="Nombre" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input type="number" placeholder="Precio" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input placeholder="Categoría" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value as any })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input type="number" placeholder="Stock" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />


            <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#3A332F] mb-1 ml-2">Imagen del Tesoro</label>
                <div className="flex gap-2">
                    <input
                        placeholder="URL de la imagen (o sube una 📸)"
                        value={form.image || ''}
                        onChange={e => setForm({ ...form, image: e.target.value })}
                        className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold flex-grow"
                    />
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`bg-[#3A332F] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#C14B3A] transition-colors flex items-center justify-center ${uploading ? 'opacity-50' : ''}`}>
                            {uploading ? <Loader2 className="animate-spin" size={24} /> : <div className="flex items-center gap-2"><ImageIcon size={20} /> <span className="hidden md:inline">Subir</span></div>}
                        </div>
                    </div>
                </div>
                {form.image && <img src={form.image} className="w-20 h-20 rounded-lg mt-2 object-cover border-2 border-[#3A332F]/10" alt="Preview" />}
            </div>

            <textarea placeholder="Descripción" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold md:col-span-2" rows={3} />

            <div className="flex gap-4 md:col-span-2 justify-end mt-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-full border-2 border-[#3A332F]/10 font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={() => onSave(form)} className="px-6 py-2 rounded-full bg-[#3A332F] text-white font-bold hover:bg-[#C14B3A]">Guardar</button>
            </div>
        </div>
    );
};
