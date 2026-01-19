import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { Plus, Edit3, Trash2, Save, X, Image as ImageIcon, Loader2, Home, Box, Layers, Gem } from 'lucide-react';
import { Product, Collection } from '../../types';
import { formatCurrency } from '../lib/utils';

export const AdminDashboard = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({});
    const [isCreating, setIsCreating] = useState(false);

    // Collections State
    const [activeTab, setActiveTab] = useState<'products' | 'collections'>('products');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [newCollection, setNewCollection] = useState<Partial<Collection>>({});
    const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);

    const getAuthToken = () => {
        try {
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

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Attempting RAW FETCH to bypass SDK...");
            const token = getAuthToken();
            const headers: HeadersInit = { 'apikey': supabaseAnonKey || '', 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`, { method: 'GET', headers: headers, cache: 'no-store' });
            if (!response.ok) throw new Error(`Error del Servidor (${response.status})`);

            const data = await response.json();
            // Map DB snake_case to frontend camelCase
            const mappedData = (data || []).map((p: any) => ({
                ...p,
                collectionId: p.collection_id // Map collection_id to collectionId
            }));
            setProducts(mappedData);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('collections').select('*').order('id');
            if (error) throw error;
            setCollections(data || []);
        } catch (err: any) {
            console.error('Error fetching collections:', err);
            alert('Error cargando colecciones');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        setLoading(false);
        fetchProducts();
        fetchCollections();
    }, []);

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

            const payload = {
                name: product.name,
                price: product.price,
                description: product.description,
                category: product.category || 'General',
                image: product.image || 'https://via.placeholder.com/300',
                stock: product.stock || 0,
                // ADDED COLLECTION ID (Mapped to DB column snake_case)
                collection_id: product.collectionId || null
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
                headers: { 'apikey': supabaseAnonKey || '', 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Error (${response.status})`);
            fetchProducts();
        } catch (err: any) {
            alert('Error borrando: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCollection = async (collection: Partial<Collection>) => {
        if (!collection.title || !collection.image) return alert('Título e Imagen son requeridos');
        setLoading(true);
        try {
            const { error } = collection.id
                ? await supabase.from('collections').update(collection).eq('id', collection.id)
                : await supabase.from('collections').insert([collection]);

            if (error) throw error;

            if (collection.id) setEditingCollectionId(null);
            else { setIsCreating(false); setNewCollection({}); }

            fetchCollections();
        } catch (err: any) {
            console.error(err);
            alert('Error guardando colección: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollection = async (id: number) => {
        if (!confirm('¿Borrar colección?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('collections').delete().eq('id', id);
            if (error) throw error;
            fetchCollections();
        } catch (err: any) {
            alert('Error: ' + err.message);
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
            { id: '1', name: 'Tanuki de Prueba', price: 50000, stock: 10, category: 'Test', description: 'Si ves esto, la interfaz funciona.', image: 'https://via.placeholder.com/150', created_at: new Date().toISOString(), rating: 5 }
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
                    <div className="flex gap-3">
                        <button onClick={() => window.location.href = '/'} className="bg-[#FDF5E6] text-[#3A332F] px-6 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#D4AF37] hover:text-white transition-all border-2 border-[#3A332F]"><Home size={20} /> Inicio</button>
                        <button onClick={() => setIsCreating(true)} className="bg-[#C14B3A] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#3A332F] transition-all"><Plus /> Nuevo Tesoro</button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center mb-8">
                    <button onClick={() => { setActiveTab('products'); setIsCreating(false); }} className={`px-8 py-3 rounded-full font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-[#3A332F] text-white shadow-lg' : 'bg-white text-[#3A332F] hover:bg-[#FDF5E6]'}`}><Gem size={18} /> Tesoros (Productos)</button>
                    <button onClick={() => { setActiveTab('collections'); setIsCreating(false); }} className={`px-8 py-3 rounded-full font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'collections' ? 'bg-[#3A332F] text-white shadow-lg' : 'bg-white text-[#3A332F] hover:bg-[#FDF5E6]'}`}><Box size={18} /> Mundos (Colecciones)</button>
                </div>

                {isCreating && (
                    <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-[#C14B3A] animate-slide-in">
                        <h2 className="text-xl font-bold mb-4">{activeTab === 'products' ? 'Nuevo Tesoro' : 'Nueva Colección'}</h2>
                        {activeTab === 'products' ? (
                            <ProductForm product={newProduct} collections={collections} onSave={handleSave} onCancel={() => setIsCreating(false)} />
                        ) : (
                            <CollectionForm collection={newCollection} onSave={handleSaveCollection} onCancel={() => setIsCreating(false)} />
                        )}
                    </div>
                )}

                {activeTab === 'products' ? (
                    products.length === 0 ? (
                        <div className="bg-white p-12 rounded-[40px] shadow-xl border-4 border-[#3A332F] text-center opacity-80 mt-8">
                            <ImageIcon className="mx-auto mb-4 text-[#C14B3A]" size={64} />
                            <h3 className="text-2xl font-ghibli-title text-[#3A332F] mb-2">No hay tesoros visibles</h3>
                            <div className="flex justify-center gap-4 mt-6">
                                <button onClick={fetchProducts} className="bg-[#3A332F] text-white px-6 py-3 rounded-full font-bold hover:bg-[#C14B3A] transition-all flex items-center gap-2"><Loader2 size={16} /> Cargar</button>
                                <button onClick={loadMockData} className="bg-gray-200 text-gray-600 px-6 py-3 rounded-full font-bold hover:bg-gray-300 transition-all">🛠️ Simular</button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {products.map(product => (
                                <div key={product.id} className="bg-white p-6 rounded-[30px] shadow-md border-2 border-[#FDF5E6] flex flex-col md:flex-row gap-6 items-center">
                                    <img src={product.image} className="w-24 h-24 rounded-2xl object-cover bg-gray-100" />
                                    {editingId === product.id ? (
                                        <div className="flex-grow w-full"><ProductForm product={product} collections={collections} onSave={handleSave} onCancel={() => setEditingId(null)} /></div>
                                    ) : (
                                        <>
                                            <div className="flex-grow text-center md:text-left">
                                                <h3 className="font-bold text-xl text-[#3A332F]">{product.name}</h3>
                                                <p className="text-[#8C8279] text-sm line-clamp-1">{product.description}</p>
                                                <div className="flex gap-4 mt-2 justify-center md:justify-start">
                                                    <span className="bg-[#FDF5E6] px-3 py-1 rounded-full text-xs font-bold text-[#C14B3A]">{product.category}</span>
                                                    <span className="bg-[#FDF5E6] px-3 py-1 rounded-full text-xs font-bold text-[#3A332F]">${product.price}</span>
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
                    )
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {collections.map(col => (
                            <div key={col.id} className="bg-white p-6 rounded-[30px] shadow-md border-2 border-[#FDF5E6] flex flex-col md:flex-row gap-6 items-center">
                                <img src={col.image} className="w-24 h-24 rounded-2xl object-cover bg-gray-100" />
                                {editingCollectionId === col.id ? (
                                    <div className="flex-grow w-full"><CollectionForm collection={col} onSave={handleSaveCollection} onCancel={() => setEditingCollectionId(null)} /></div>
                                ) : (
                                    <>
                                        <div className="flex-grow text-center md:text-left">
                                            <h3 className="font-bold text-xl text-[#3A332F]">{col.title}</h3>
                                            <p className="text-[#8C8279] text-sm line-clamp-1">{col.description}</p>
                                            <div className="flex gap-4 mt-2 justify-center md:justify-start">
                                                <span className="bg-[#FDF5E6] px-3 py-1 rounded-full text-xs font-bold text-[#C14B3A]">{col.rotation || '0deg'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingCollectionId(col.id)} className="p-3 hover:bg-[#FDF5E6] rounded-full text-[#3A332F] transition-colors"><Edit3 size={20} /></button>
                                            <button onClick={() => handleDeleteCollection(col.id)} className="p-3 hover:bg-red-50 rounded-full text-red-500 transition-colors"><Trash2 size={20} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {collections.length === 0 && <div className="text-center p-10 opacity-50">No hay colecciones creadas.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductForm = ({ product, collections, onSave, onCancel }: { product: Partial<Product>, collections: Collection[], onSave: (p: Partial<Product>) => void, onCancel: () => void }) => {
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

            // 1. Obtener Token de Sesión
            let token = '';

            // INTENTO 1: SDK
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

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: headers,
                body: file
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error en subida (${response.status}): ${errorText}`);
            }

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
                <label className="block text-sm font-bold text-[#3A332F] mb-1 ml-2">Asignar a Colección (Opcional)</label>
                <select
                    value={form.collectionId || ''}
                    onChange={e => setForm({ ...form, collectionId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold cursor-pointer appearance-none"
                >
                    <option value="">-- Sin Colección --</option>
                    {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
            </div>

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

const CollectionForm = ({ collection, onSave, onCancel }: { collection: Partial<Collection>, onSave: (c: Partial<Collection>) => void, onCancel: () => void }) => {
    const [form, setForm] = useState(collection);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                setUploading(false);
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `col-${Date.now()}.${fileExt}`;
            const uploadUrl = `${supabaseUrl}/storage/v1/object/products/${fileName}`;

            let token = '';
            const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
            const key = `sb-${projectRef}-auth-token`;
            const stored = localStorage.getItem(key);
            if (stored) token = JSON.parse(stored).access_token;

            if (!token) throw new Error("Sesión expirada. Por favor recarga.");

            const res = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey || ''
                },
                body: file
            });

            if (!res.ok) throw new Error("Error subiendo imagen");

            const publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${fileName}`;
            setForm({ ...form, image: publicUrl });
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="space-y-2">
                <label className="text-sm font-bold text-[#3A332F] ml-2">Título de la Colección</label>
                <input
                    placeholder="Ej: Brisa de Ghibli"
                    value={form.title || ''}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-[#3A332F] ml-2">Rotación (Estilo Tarjeta)</label>
                <input
                    placeholder="Ej: -3deg, 2deg, 0deg"
                    value={form.rotation || ''}
                    onChange={e => setForm({ ...form, rotation: e.target.value })}
                    className="w-full p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold"
                />
            </div>

            <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-[#3A332F] ml-2">Imagen de Portada</label>
                <div className="flex gap-2">
                    <input
                        placeholder="URL de la imagen"
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
                {form.image && <img src={form.image} className="h-32 w-full object-cover rounded-xl mt-2 border-2 border-[#3A332F]/10" />}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-[#3A332F] ml-2">Color de Acento (Hex)</label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={form.accent || '#3A332F'}
                        onChange={e => setForm({ ...form, accent: e.target.value })}
                        className="h-[50px] w-[50px] rounded-xl cursor-pointer border-none"
                    />
                    <input
                        placeholder="#3A332F"
                        value={form.accent || ''}
                        onChange={e => setForm({ ...form, accent: e.target.value })}
                        className="flex-grow p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold"
                    />
                </div>
            </div>

            <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-[#3A332F] ml-2">Descripción</label>
                <textarea
                    placeholder="Describe la temática de esta colección..."
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold"
                    rows={3}
                />
            </div>

            <div className="flex gap-4 md:col-span-2 justify-end mt-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-full border-2 border-[#3A332F]/10 font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={() => onSave(form)} className="px-6 py-2 rounded-full bg-[#3A332F] text-white font-bold hover:bg-[#C14B3A]">Guardar</button>
            </div>
        </div>
    );
};
