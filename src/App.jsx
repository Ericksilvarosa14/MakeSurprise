import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Sparkles, Gift, Video, Info, Star, Users, Lock, LogOut, ShoppingCart, MessageCircle 
} from 'lucide-react';

import { INITIAL_PRODUCTS, SCOOP_PRODUCT } from './data/mockData';

import { collection, addDoc, onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase";

import Toast from './components/Toast';
import CartSidebar from './components/CartSidebar';
import LoginModal from './components/LoginModal';
import ImageCarousel from './components/ImageCarousel';
import ShippingCalculator from './components/ShippingCalculator';

import AdminPanel from './pages/AdminPanel';
import Market from './pages/Market';
import ProductView from './pages/ProductView';

const App = () => {
    const [currentTab, setCurrentTab] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [toastMsg, setToastMsg] = useState('');
    
    const [isAdminLogged, setIsAdminLogged] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const [scoopQty, setScoopQty] = useState(1);
    const [dbProducts, setDbProducts] = useState([]);
    const [dbOrders, setDbOrders] = useState([]);
    const [dbClients, setDbClients] = useState([]);
    const [scoopProductDynamic, setScoopProductDynamic] = useState(SCOOP_PRODUCT || {});
    
    // Variáveis que vêm do Painel Admin
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(150);
    const [socialLinks, setSocialLinks] = useState({ whatsapp: '', instagram: '' });

    const orderTotal = cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

    useEffect(() => {
        const unsubscribeProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
            const listaProdutos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (listaProdutos.length > 0) {
                setDbProducts(listaProdutos);
                const scoopEncontrado = listaProdutos.find(p => p.category && p.category.toLowerCase() === 'scoop');
                if (scoopEncontrado) {
                    let imagensFormatadas = SCOOP_PRODUCT?.images || [];
                    if (scoopEncontrado.images && Array.isArray(scoopEncontrado.images) && scoopEncontrado.images.length > 0) {
                        imagensFormatadas = scoopEncontrado.images;
                    } else if (scoopEncontrado.image) {
                        imagensFormatadas = [scoopEncontrado.image];
                    }

                    setScoopProductDynamic({
                        id: scoopEncontrado.id,
                        name: scoopEncontrado.name || 'Scoop Surpresa',
                        price: Number(scoopEncontrado.price || 0),
                        category: scoopEncontrado.category || 'Scoop',
                        description: scoopEncontrado.description || '',
                        rating: scoopEncontrado.rating || 4.9,
                        reviews: scoopEncontrado.reviews || 543,
                        images: imagensFormatadas
                    });
                } else {
                    setScoopProductDynamic(SCOOP_PRODUCT || {});
                }
            } else {
                setDbProducts(INITIAL_PRODUCTS || []);
                setScoopProductDynamic(SCOOP_PRODUCT || {});
            }
        });

        // Puxa a meta do frete grátis do banco
        const unsubConfig = onSnapshot(doc(db, "configuracoes", "frete"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().threshold !== undefined) {
                setFreeShippingThreshold(Number(docSnap.data().threshold));
            }
        });

        // Puxa as redes sociais do banco
        const unsubSocial = onSnapshot(doc(db, "configuracoes", "redes"), (docSnap) => {
            if (docSnap.exists()) {
                setSocialLinks({
                    whatsapp: docSnap.data().whatsapp || '',
                    instagram: docSnap.data().instagram || ''
                });
            }
        });

        return () => {
            unsubscribeProdutos();
            unsubConfig();
            unsubSocial();
        };
    }, []);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 6000); };
    
    const toggleFavorite = (id) => {
        setFavorites(prev => {
            if (prev.includes(id)) { showToast('Removido dos favoritos'); return prev.filter(i => i !== id); }
            showToast('Adicionado aos favoritos 💖'); return [...prev, id];
        });
    };

    const handleAddToCart = (product, quantity = 1) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
            return [...prev, { ...product, quantity }];
        });
        if (quantity > 1) { setIsCartOpen(true); } else { showToast(`${product.name} adicionado!`); }
    };

    const handleCheckoutProcess = () => {
        if (cartItems.length === 0) return;
        setIsCartOpen(false);
        setIsLoginModalOpen(true);
    };

    const handleLoginSubmit = async (userData) => {
        setLoggedUser(userData);
        setIsLoginModalOpen(false);

        try {
            await addDoc(collection(db, "clientes"), {
                name: userData?.name || '',
                email: userData?.email || '',
                phone: userData?.phone || '',
                cep: userData?.cep || '',
                street: userData?.street || '',
                number: userData?.number || '',
                complement: userData?.complement || '',
                neighborhood: userData?.neighborhood || '',
                city: userData?.city || '',
                state: userData?.state || '',
                address: `${userData?.street || ''}, ${userData?.number || ''} - ${userData?.complement || ''}`,
                createdAt: new Date().toISOString()
            });

            if (cartItems.length > 0) {
                const finalTotal = Number(orderTotal) + Number(userData?.freightCost || 0);

                const newOrder = { 
                    client: userData, 
                    items: cartItems, 
                    subtotal: Number(orderTotal),
                    freightCost: Number(userData?.freightCost || 0),
                    freightMethod: userData?.freightMethod || 'standard',
                    total: finalTotal, 
                    status: 'Pendente Pagamento',
                    data: new Date().toISOString()
                };
                
                await addDoc(collection(db, "pedidos"), newOrder);
                setCartItems([]);
                
                setShowSuccessModal(true); 

                // Redirecionamento Dinâmico para o WhatsApp do Admin
                const rawWhatsapp = String(socialLinks?.whatsapp || '').replace(/\D/g, '');
                
                if (rawWhatsapp.length >= 10) {
                    const textoMsg = `Olá! Acabei de finalizar um pedido no site no valor de R$ ${finalTotal.toFixed(2).replace('.', ',')}. Meu nome é ${userData?.name || 'Cliente'}. Aguardo as instruções para pagamento e o meu vídeo!`;
                    const linkZap = `https://wa.me/55${rawWhatsapp}?text=${encodeURIComponent(textoMsg)}`;
                    
                    setTimeout(() => {
                        window.open(linkZap, '_blank');
                    }, 2500);
                }
                            // Variável com o total exato (produtos + frete)
            const valorTotalFormatado = orderTotal.toFixed(2).replace('.', ',');

            // Lógica de texto baseada no método de pagamento
            let textoPagamento = "";

            if (paymentMethod === 'pix') {
                textoPagamento = "Gerei o pedido com pagamento via PIX. Segue o comprovante da transferência!";
            } else if (paymentMethod === 'credit') {
                textoPagamento = "Escolhi pagar no Cartão de Crédito. Pode me enviar o link de pagamento seguro, por favor?";
            } else if (paymentMethod === 'debit') {
                textoPagamento = "Escolhi pagar no Cartão de Débito. Pode me enviar o link de pagamento seguro, por favor?";
            }

            // Montagem final da mensagem que vai para o WhatsApp
            const mensagemWhatsApp = `Olá! Acabei de finalizar meu pedido da Scoop Surpresa.%0A%0A` +
                `*Nome:* ${formData.name}%0A` +
                `*Total do Pedido:* R$ ${valorTotalFormatado} (com frete)%0A%0A` +
                `${textoPagamento}`;

            const linkWhatsApp = `https://wa.me/5500000000000?text=${mensagemWhatsApp}`;
            window.open(linkWhatsApp, '_blank');
            }
        } catch (error) {
            console.error("Erro ao salvar: ", error);
            showToast('Erro ao processar o pedido. Tente novamente.');
        }
    };

    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    if (currentTab === 'admin') {
        if (!isAdminLogged) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
                        <Lock className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Acesso Restrito</h2>
                        <input type="text" placeholder="Usuário" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 outline-none" id="adminUser"/>
                        <input type="password" placeholder="Senha" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 outline-none" id="adminPass"/>
                        <button onClick={() => {
                            if(document.getElementById('adminUser').value === 'admin' && document.getElementById('adminPass').value === 'admin') setIsAdminLogged(true);
                            else alert("Senha incorreta.");
                        }} className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors">Entrar</button>
                        <button onClick={() => setCurrentTab('home')} className="mt-4 text-slate-400 hover:text-slate-700 text-sm">Voltar para Loja</button>
                    </div>
                </div>
            );
        }
        return <AdminPanel onLogout={() => { setIsAdminLogged(false); setCurrentTab('home'); }} dbProducts={dbProducts || []} setDbProducts={setDbProducts} dbOrders={dbOrders || []} dbClients={dbClients || []} />;
    }

    // Limpeza de variáveis para evitar tela branca
    const dynamicInstagram = String(socialLinks?.instagram || '').trim();
    const dynamicWhatsapp = String(socialLinks?.whatsapp || '').replace(/\D/g, '');

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-pink-200 selection:text-pink-900">
            <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center cursor-pointer group" onClick={() => { setCurrentTab('home'); setSelectedProduct(null); }}>
                        <Sparkles className="h-8 w-8 text-pink-500 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-2xl text-slate-800 tracking-tight">Make<span className="text-pink-500">Surprise</span></span>
                    </div>
                    
                    <div className="hidden md:flex gap-8 items-center font-medium">
                        <button onClick={() => { setCurrentTab('home'); setSelectedProduct(null); }} className={`${currentTab === 'home' && !selectedProduct ? 'text-pink-500 font-bold' : 'text-slate-500 hover:text-pink-500'} transition-colors`}>Início</button>
                        <button onClick={() => { setCurrentTab('scoop'); setSelectedProduct(null); }} className={`${currentTab === 'scoop' && !selectedProduct ? 'text-pink-500 font-bold' : 'text-slate-500 hover:text-pink-500'} transition-colors`}>Scoop Surpresa</button>
                        <button onClick={() => { setCurrentTab('market'); setSelectedProduct(null); }} className={`${currentTab === 'market' && !selectedProduct ? 'text-pink-500 font-bold' : 'text-slate-500 hover:text-pink-500'} transition-colors`}>Mercadinho</button>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        
                        {/* ÍCONE DO INSTAGRAM EM DEGRADÊ - Puxando do Banco de Dados */}
                        {dynamicInstagram !== "" && (
                            <a href={dynamicInstagram} target="_blank" rel="noreferrer" 
                               className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-500 text-white rounded-full shadow-md hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        )}

                        <div className="relative hidden sm:flex items-center">
                            <button onClick={() => loggedUser ? setIsUserMenuOpen(!isUserMenuOpen) : setIsLoginModalOpen(true)} className="text-slate-500 hover:text-pink-500 flex items-center gap-2 text-sm font-medium transition-colors">
                                <Users className="w-5 h-5"/> {loggedUser?.name ? 'Minha Conta' : 'Entrar'}
                            </button>
                            
                            {isUserMenuOpen && loggedUser && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in slide-in-from-top-2">
                                        <div className="px-3 py-3 border-b border-slate-100 mb-1">
                                            <p className="font-bold text-slate-800 text-sm truncate">{loggedUser?.name || 'Cliente'}</p>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{loggedUser?.email || ''}</p>
                                        </div>
                                        <button onClick={() => { 
                                            setLoggedUser(null); 
                                            setIsUserMenuOpen(false); 
                                            showToast('Você saiu da conta 👋'); 
                                        }} className="w-full text-left px-3 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors">
                                            <LogOut className="w-4 h-4"/> Sair da Conta
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
                        <button onClick={() => setIsCartOpen(true)} className="relative text-slate-700 hover:text-pink-500 transition-colors p-2 bg-slate-100 rounded-full hover:bg-pink-50">
                            <ShoppingBag className="w-6 h-6" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">{cartCount}</span>}
                        </button>
                        <button onClick={() => setCurrentTab('admin')} className="text-slate-400 hover:text-slate-700 ml-2 hidden sm:block">
                            <Lock className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {selectedProduct ? (
                    <ProductView product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />
                ) : currentTab === 'home' ? (
                    <div className="animate-in fade-in duration-500">
                        <div className="bg-pink-50 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmYmU4ZmYiLz48L3N2Zz4=')]"></div>
                            <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1 text-center md:text-left">
                                    <span className="inline-block py-1 px-3 rounded-full bg-pink-200 text-pink-700 text-sm font-bold tracking-wide mb-6">💖 A FEBRE DO TIKTOK CHEGOU!</span>
                                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
                                        Sua maquiagem favorita em um <span className="text-pink-500 underline decoration-pink-300 decoration-8 underline-offset-4">Scoop Surpresa</span>
                                    </h1>
                                    <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto md:mx-0">
                                        Testa sua sorte na nossa piscina de maquiagens. Você sempre sai ganhando no mínimo 5 produtos, mas pode levar muito mais!
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                        <button onClick={() => setCurrentTab('scoop')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl shadow-slate-900/20 transition-transform transform hover:-translate-y-1">
                                            Garantir meu Scoop
                                        </button>
                                        <button onClick={() => setCurrentTab('market')} className="bg-white hover:bg-pink-50 text-slate-900 border-2 border-slate-200 font-bold text-lg px-8 py-4 rounded-full transition-colors">
                                            Ver produtos avulsos
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    <div className="aspect-square bg-gradient-to-tr from-pink-200 to-pink-100 rounded-full absolute inset-0 blur-3xl opacity-50 animate-pulse"></div>
                                    <img src={SCOOP_PRODUCT?.images?.[0] || 'https://placehold.co/600x600/f8fafc/94a3b8'} alt="Caixa Surpresa" className="relative z-10 rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 border-8 border-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 py-16 text-white text-center px-4 relative overflow-hidden">
                            <Sparkles className="absolute top-10 left-10 w-12 h-12 text-pink-500/20" />
                            <Sparkles className="absolute bottom-10 right-10 w-16 h-16 text-pink-500/20" />
                            <div className="max-w-3xl mx-auto relative z-10">
                                <h2 className="text-3xl md:text-4xl font-black mb-6 text-pink-400">A Regra de Ouro do Scoop ✨</h2>
                                <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
                                    Não existe "azar" por aqui! Pagando por um scoop, você tem <strong className="text-white">GARANTIA</strong> de receber pelo menos <strong className="text-white bg-pink-500 px-2 rounded">5 produtos full-size</strong>. 
                                </p>
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-4 py-24">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-extrabold text-slate-900">Como funciona a mágica?</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="text-center group">
                                    <div className="w-20 h-20 mx-auto bg-pink-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-pink-200">
                                        <ShoppingCart className="w-10 h-10 text-pink-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">1. Você Compra</h3>
                                    <p className="text-slate-600">Adicione o Scoop ao carrinho e finalize seu pedido com segurança.</p>
                                </div>
                                <div className="text-center group">
                                    <div className="w-20 h-20 mx-auto bg-blue-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-200">
                                        <Video className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">2. Nós Gravamos</h3>
                                    <p className="text-slate-600">Gravamos um vídeo pegando os seus produtos na nossa piscina de maquiagens!</p>
                                </div>
                                <div className="text-center group">
                                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-green-200">
                                        <Gift className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">3. A Surpresa Chega</h3>
                                    <p className="text-slate-600">Enviamos a caixinha perfumada para a sua casa e o vídeo para o seu WhatsApp.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentTab === 'scoop' ? (
                    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <ImageCarousel images={scoopProductDynamic?.images || []} productName={scoopProductDynamic?.name || 'Scoop'} />
                            
                            <div>
                                <span className="text-xs font-bold tracking-wider text-pink-500 uppercase bg-pink-50 px-3 py-1 rounded-full mb-3 inline-block">Best Seller 🔥</span>
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{scoopProductDynamic?.name || 'Scoop'}</h1>
                                
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center text-yellow-400"><Star className="w-5 h-5 fill-current"/> <span className="text-slate-700 font-bold ml-1">{scoopProductDynamic?.rating || 4.9}</span></div>
                                    <span className="text-slate-400 text-sm">({scoopProductDynamic?.reviews || 0} pessoas sortudas)</span>
                                </div>
                                
                                <p className="text-slate-600 leading-relaxed mb-6 text-lg">{scoopProductDynamic?.description || ''}</p>
                                
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">Economize R$ 70+</div>
                                    <div className="flex flex-col mb-6">
                                        <span className="text-slate-400 line-through text-lg">De: R$ {Number((scoopProductDynamic?.price || 0) * scoopQty * 2).toFixed(2).replace('.', ',')}</span>
                                        <span className="text-4xl font-black text-pink-500">
                                            Por: R$ {Number((scoopProductDynamic?.price || 0) * scoopQty).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-sm font-bold text-slate-700">Quantidade:</span>
                                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                            <button onClick={() => setScoopQty(Math.max(1, scoopQty - 1))} className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors font-bold">-</button>
                                            <span className="px-4 py-2 font-bold text-slate-900">{scoopQty}</span>
                                            <button onClick={() => setScoopQty(scoopQty + 1)} className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors font-bold">+</button>
                                        </div>
                                    </div>

                                    <button onClick={() => handleAddToCart(scoopProductDynamic, scoopQty)} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30">
                                        <ShoppingBag className="w-6 h-6" /> Comprar {scoopQty} {scoopQty > 1 ? 'Scoops' : 'Scoop'} - R$ {Number((scoopProductDynamic?.price || 0) * scoopQty).toFixed(2).replace('.', ',')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Market onSelectProduct={setSelectedProduct} onAddToCart={handleAddToCart} favorites={favorites || []} toggleFavorite={toggleFavorite} products={dbProducts || []} />
                )}
            </main>

            <Toast message={toastMsg} />
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cartItems || []} 
                removeFromCart={(id) => setCartItems(p => p.filter(i => i.id !== id))} 
                updateQuantity={(id, qty) => setCartItems(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))}
                onCheckout={handleCheckoutProcess} />
            
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                onLogin={handleLoginSubmit} 
                isCheckout={(cartItems || []).length > 0} 
                cartTotal={orderTotal || 0} 
                freeShippingThreshold={freeShippingThreshold || 150}
                loggedUser={loggedUser}
            />

            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Gift className="w-10 h-10 text-pink-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">UHUUU! 🎉</h2>
                        <p className="text-slate-600 mb-8">Você finalizou a compra com sucesso! Em até 48 horas nossa equipe vai enviar o vídeo e entrar em contato com você para finalizar o pagamento.</p>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-pink-500/30">
                            Fechar e Voltar
                        </button>
                    </div>
                </div>
            )}

            {/* BOTÃO FIXO DO WHATSAPP - Puxando do Banco de Dados */}
            {dynamicWhatsapp.length >= 10 && (
                <a href={`https://wa.me/55${dynamicWhatsapp}?text=${encodeURIComponent("Olá, equipe MakeSurprise! Estava navegando no site e gostaria de tirar uma dúvida.")}`} target="_blank" rel="noreferrer" 
                    className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8" />
                </a>
            )}
        </div>
    );
};

export default App;