import React, { useState, useEffect } from 'react';
import { Lock, LayoutDashboard, Package, ShoppingCart, Users, LogOut, Plus, Trash2, Edit, Truck, Link as LinkIcon } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const AdminPanel = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Scoop', description: '', image: '' });
    const [editingId, setEditingId] = useState(null);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(150);
    const [socialLinks, setSocialLinks] = useState({ whatsapp: '', instagram: '' });
    
    const [pedidos, setPedidos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        const unsubPedidos = onSnapshot(collection(db, "pedidos"), (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.data) - new Date(a.data));
            setPedidos(list);
        });

        const unsubClientes = onSnapshot(collection(db, "clientes"), (snapshot) => {
            setClientes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
            setProdutos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubConfigFrete = onSnapshot(doc(db, "configuracoes", "frete"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().threshold !== undefined) {
                setFreeShippingThreshold(Number(docSnap.data().threshold));
            }
        });

        const unsubConfigRedes = onSnapshot(doc(db, "configuracoes", "redes"), (docSnap) => {
            if (docSnap.exists()) {
                setSocialLinks({
                    whatsapp: docSnap.data().whatsapp || '',
                    instagram: docSnap.data().instagram || ''
                });
            }
        });

        return () => {
            unsubPedidos();
            unsubClientes();
            unsubProdutos();
            unsubConfigFrete();
            unsubConfigRedes();
        };
    }, []);

    const stats = {
        totalVendas: pedidos.length,
        receita: pedidos.reduce((acc, order) => acc + (Number(order.total) || 0), 0),
        clientes: clientes.length,
        produtos: produtos.length
    };

    const handleSaveFreeShipping = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "configuracoes", "frete"), { threshold: Number(freeShippingThreshold) });
            alert("Meta de Frete Grátis atualizada!");
        } catch (error) { console.error("Erro", error); }
    };

    const handleSaveSocialLinks = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "configuracoes", "redes"), {
                whatsapp: String(socialLinks?.whatsapp || ''),
                instagram: String(socialLinks?.instagram || '')
            });
            alert("Redes Sociais atualizadas com sucesso!");
        } catch (error) { console.error("Erro", error); }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            let listaImagens = [];
            if (newProduct.image && newProduct.image.trim() !== '') {
                listaImagens = newProduct.image.split(',').map(img => img.trim());
            } else {
                listaImagens = [`https://placehold.co/600x600/f8fafc/94a3b8?text=${encodeURIComponent(newProduct.name.split(' ')[0])}`];
            }

            const productData = {
                name: newProduct.name,
                price: Number(newProduct.price),
                category: newProduct.category,
                description: newProduct.description,
                rating: 5.0,
                reviews: 50,
                images: listaImagens
            };

            if (editingId) {
                const productRef = doc(db, "produtos", editingId);
                await updateDoc(productRef, productData);
                setEditingId(null);
                alert("Produto atualizado com sucesso!");
            } else {
                await addDoc(collection(db, "produtos"), productData);
                alert("Produto cadastrado com sucesso!");
            }
            setNewProduct({ name: '', price: '', category: 'Scoop', description: '', image: '' });
        } catch (error) {
            console.error("Erro ao salvar produto: ", error);
        }
    };

    const handleEditClick = (p) => {
        setEditingId(p.id);
        setNewProduct({
            name: p.name || '',
            price: p.price || '',
            category: p.category || 'Scoop',
            description: p.description || '',
            image: p.images && Array.isArray(p.images) ? p.images.join(', ') : (p.image || '')
        });
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Deseja realmente excluir este produto?")) {
            try {
                await deleteDoc(doc(db, "produtos", id));
                if (editingId === id) {
                    setEditingId(null);
                    setNewProduct({ name: '', price: '', category: 'Scoop', description: '', image: '' });
                }
            } catch (error) { console.error("Erro", error); }
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <div className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <span className="font-bold text-xl text-white flex items-center gap-2"><Lock className="w-5 h-5 text-pink-500"/> Painel Admin</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-pink-500 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('produtos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'produtos' ? 'bg-pink-500 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Package className="w-5 h-5" /> Produtos
                    </button>
                    <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'pedidos' ? 'bg-pink-500 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <ShoppingCart className="w-5 h-5" /> Pedidos
                    </button>
                    <button onClick={() => setActiveTab('clientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'clientes' ? 'bg-pink-500 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Users className="w-5 h-5" /> Clientes
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" /> Sair do Painel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
                {activeTab === 'dashboard' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">Visão Geral</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="text-slate-500 font-medium mb-2">Total de Vendas</div>
                                <div className="text-4xl font-black text-slate-900">{stats.totalVendas}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="text-slate-500 font-medium mb-2">Receita Total</div>
                                <div className="text-4xl font-black text-green-500">R$ {Number(stats.receita).toFixed(2).replace('.', ',')}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="text-slate-500 font-medium mb-2">Clientes Cadastrados</div>
                                <div className="text-4xl font-black text-blue-500">{stats.clientes}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="text-slate-500 font-medium mb-2">Produtos Ativos</div>
                                <div className="text-4xl font-black text-pink-500">{stats.produtos}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
                                    <Truck className="w-5 h-5 text-pink-500"/> Configuração de Frete Grátis
                                </h3>
                                <form onSubmit={handleSaveFreeShipping} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mínimo (R$)</label>
                                        <input type="number" step="0.01" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-500"
                                            value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors">
                                        Salvar Frete
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
                                    <LinkIcon className="w-5 h-5 text-blue-500"/> Redes Sociais
                                </h3>
                                <form onSubmit={handleSaveSocialLinks} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Número do WhatsApp (com DDD)</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                                            value={socialLinks?.whatsapp || ''} onChange={e => setSocialLinks({...socialLinks, whatsapp: e.target.value})} placeholder="Ex: 41988506306" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Link do Instagram</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                                            value={socialLinks?.instagram || ''} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="https://instagram.com/seu_perfil" />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
                                        Salvar Redes Sociais
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'produtos' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">Gerenciar Produtos e Scoops</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-max">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-pink-500"/> 
                                    {editingId ? 'Editando Produto/Scoop' : 'Novo Produto ou Scoop'}
                                </h3>
                                <form onSubmit={handleSaveProduct} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                                        <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-400" 
                                            value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                                        <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-400" 
                                            value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                        <select className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-400" 
                                            value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                            <option>Scoop</option><option>Lábios</option><option>Pele</option><option>Olhos</option><option>Skincare</option><option>Acessórios</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                        <textarea required rows="3" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-400" 
                                            value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Links das Imagens (separados por vírgula)</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-pink-400" 
                                            value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                                            {editingId ? 'Atualizar' : 'Salvar'}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={() => { setEditingId(null); setNewProduct({ name: '', price: '', category: 'Scoop', description: '', image: '' }); }} className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors">
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                                            <th className="p-4 font-medium">Produto</th>
                                            <th className="p-4 font-medium">Categoria</th>
                                            <th className="p-4 font-medium">Preço</th>
                                            <th className="p-4 font-medium text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(!produtos || produtos.length === 0) ? (
                                            <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum produto cadastrado no banco ainda.</td></tr>
                                        ) : (
                                            produtos.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-medium text-slate-900">{p.name}</td>
                                                    <td className="p-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-600">{p.category}</span></td>
                                                    <td className="p-4 text-pink-600 font-bold">R$ {Number(p.price || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td className="p-4 flex justify-end gap-2">
                                                        <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit className="w-[18px] h-[18px]" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 className="w-[18px] h-[18px]" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pedidos' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">Pedidos Recebidos</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                                        <th className="p-4 font-medium">Cliente</th>
                                        <th className="p-4 font-medium">Endereço Completo</th>
                                        <th className="p-4 font-medium">Itens</th>
                                        <th className="p-4 font-medium">Valores & Frete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(!pedidos || pedidos.length === 0) ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum pedido recebido ainda.</td></tr>
                                    ) : (
                                        pedidos.map(pedido => (
                                            <tr key={pedido.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900">{pedido.client?.name || 'Cliente'}</div>
                                                    <div className="text-sm text-slate-500">{pedido.client?.phone || ''}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : ''}</div>
                                                </td>
                                                <td className="p-4 text-xs text-slate-600">
                                                    <p className="font-bold text-slate-800">{pedido.client?.street || '-'}, {pedido.client?.number || '-'}</p>
                                                    {pedido.client?.complement && <p>{pedido.client?.complement}</p>}
                                                    <p>{pedido.client?.neighborhood || '-'} - {pedido.client?.city || '-'}/{pedido.client?.state || '-'}</p>
                                                    <p>CEP: {pedido.client?.cep || '-'}</p>
                                                </td>
                                                <td className="p-4 text-slate-600 text-sm">
                                                    {pedido.items && pedido.items.map((item, i) => (
                                                        <div key={i}>{item.quantity}x {item.name}</div>
                                                    ))}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="text-slate-500">Subtotal: R$ {Number(pedido.subtotal || 0).toFixed(2).replace('.', ',')}</div>
                                                    <div className="text-slate-500">
                                                        Frete ({pedido.freightMethod === 'express' ? 'Sedex' : 'PAC'}): 
                                                        {Number(pedido.freightCost || 0) === 0 ? <span className="text-green-500 font-bold"> Grátis</span> : ` R$ ${Number(pedido.freightCost || 0).toFixed(2).replace('.', ',')}`}
                                                    </div>
                                                    <div className="text-pink-600 font-black mt-1 text-base">Total: R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'clientes' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">Base de Clientes</h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                                        <th className="p-4 font-medium">Nome</th>
                                        <th className="p-4 font-medium">E-mail</th>
                                        <th className="p-4 font-medium">Telefone</th>
                                        <th className="p-4 font-medium">Cidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(!clientes || clientes.length === 0) ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum cliente cadastrado ainda.</td></tr>
                                    ) : (
                                        clientes.map(c => (
                                            <tr key={c.id || c.email} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-900">{c.name}</td>
                                                <td className="p-4 text-slate-600">{c.email}</td>
                                                <td className="p-4 text-slate-600">{c.phone}</td>
                                                <td className="p-4 text-slate-600 text-sm">{c.city ? `${c.city}/${c.state}` : '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;