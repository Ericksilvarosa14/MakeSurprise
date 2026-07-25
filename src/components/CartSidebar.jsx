import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const CartSidebar = ({ isOpen, onClose, cart, updateQuantity, removeFromCart, onCheckout }) => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const progress = Math.min((total / 150) * 100, 100);

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity" onClick={onClose} />}
            
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="text-pink-500" /> Meu Carrinho
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <div className="flex justify-between text-sm mb-2 font-medium text-slate-700">
                        <span>Frete Grátis</span>
                        <span>{progress >= 100 ? 'Alcançado!' : `Falta R$ ${(150 - total).toFixed(2).replace('.', ',')}`}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-slate-400 mt-10">Seu carrinho está vazio :(</div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative group">
                                <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-800 text-sm leading-tight pr-6">{item.name}</h3>
                                    <p className="text-pink-500 font-bold mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                    
                                    <div className="flex items-center gap-3 mt-2 bg-slate-50 w-fit rounded-lg border border-slate-200 p-1">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-pink-500">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-pink-500">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white p-1 rounded-full shadow-sm">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-slate-500 font-medium">Total da compra</span>
                        <span className="text-2xl font-bold text-slate-800">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button 
                        onClick={onCheckout}
                        disabled={cart.length === 0} 
                        className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Finalizar Pedido
                    </button>
                </div>
            </div>
        </>
    );
};

export default CartSidebar;