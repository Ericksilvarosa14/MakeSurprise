import React, { useState } from 'react';
import { ArrowLeft, Star, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import ImageCarousel from '../components/ImageCarousel';
import ShippingCalculator from '../components/ShippingCalculator';

const ProductView = ({ product, onBack, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const totalPrice = product.price * quantity;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-pink-500 mb-8 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <ImageCarousel images={product.images} productName={product.name} />
                
                <div>
                    <span className="text-xs font-bold tracking-wider text-pink-500 uppercase bg-pink-50 px-3 py-1 rounded-full">{product.category}</span>
                    <h1 className="text-3xl font-extrabold text-slate-900 mt-4 mb-2">{product.name}</h1>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center text-yellow-400">
                            <Star className="w-5 h-5 fill-current"/> 
                            <span className="text-slate-700 font-bold ml-1">{product.rating}</span>
                        </div>
                        <span className="text-slate-400 text-sm">({product.reviews} avaliações)</span>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
                        <div className="text-3xl font-black text-pink-500 mb-6">R$ {totalPrice.toFixed(2).replace('.', ',')}</div>
                        
                        <div className="flex gap-4">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-slate-500 hover:text-pink-500 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                                <span className="w-8 text-center font-bold text-slate-800">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-slate-500 hover:text-pink-500 transition-colors"><ChevronRight className="w-5 h-5"/></button>
                            </div>
                            <button onClick={() => onAddToCart(product, quantity)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]">
                                <ShoppingBag className="w-5 h-5" /> Adicionar
                            </button>
                        </div>
                        <ShippingCalculator />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductView;