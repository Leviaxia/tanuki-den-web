import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit3, Trash2, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../lib/utils';

export const AdminDashboard = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({});
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (product: Partial<Product>) => {
        if (!product.name || !product.price) return alert('Nombre y Precio son requeridos');

        if (product.id) {
            // Update
            const { error } = await supabase
                .from('products')
                .update({
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    category: product.category,
                    image: product.image,
                    stock: product.stock
                })
                .eq('id', product.id);

            if (error) alert('Error actualizando: ' + error.message);
            else {
                setEditingId(null);
                fetchProducts();
            }
        } else {
            // Create
            const { error } = await supabase
                .from('products')
                .insert([{
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    category: product.category || 'General',
                    image: product.image || 'https://via.placeholder.com/300',
                    stock: product.stock || 0
                }]);

            if (error) alert('Error creando: ' + error.message);
            else {
                setIsCreating(false);
                setNewProduct({});
                fetchProducts();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar este tesoro?')) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert('Error borrando: ' + error.message);
        else fetchProducts();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

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
            </div>
        </div>
    );
};

const ProductForm = ({ product, onSave, onCancel }: { product: Partial<Product>, onSave: (p: Partial<Product>) => void, onCancel: () => void }) => {
    const [form, setForm] = useState(product);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <input placeholder="Nombre" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input type="number" placeholder="Precio" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input placeholder="Categoría" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input type="number" placeholder="Stock" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold" />
            <input placeholder="URL Imagen" value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold md:col-span-2" />
            <textarea placeholder="Descripción" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="p-3 bg-[#FDF5E6] rounded-xl border-none outline-none font-bold md:col-span-2" rows={3} />

            <div className="flex gap-4 md:col-span-2 justify-end mt-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-full border-2 border-[#3A332F]/10 font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={() => onSave(form)} className="px-6 py-2 rounded-full bg-[#3A332F] text-white font-bold hover:bg-[#C14B3A]">Guardar</button>
            </div>
        </div>
    );
};
