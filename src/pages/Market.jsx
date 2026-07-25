import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Heart, ShoppingBag } from 'lucide-react';

const Market = ({ onSelectProduct, onAddToCart, favorites, toggleFavorite, products }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('Destaques');
    const [isSortOpen, setIsSortOpen] = useState(false);

    const categories = ['Todas', 'Lábios', 'Pele', 'Olhos', 'Acessórios', 'Skincare'];
    const sortOptions = ['Destaques', 'Menor Preço', 'Maior Preço'];

    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (sortBy === 'Menor Preço') filteredProducts.sort((a, b) => a.price - b.price);
    if (sortBy === 'Maior Preço') filteredProducts.sort((a, b) => b.price - a.price);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Mercadinho</h2>
                    <p className="mt-2 text-slate-500 text-lg">Prefere escolher? Compre nossos produtos avulsos.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-20">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar maquiagem..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all" 
                        />
                    </div>
                    
                    <div className="relative w-full sm:w-48">
                        <button 
                            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 hover:border-pink-300 transition-colors"
                        >
                            <span className="flex items-center font-medium"><Filter className="w-4 h-4 mr-2 text-pink-500"/> {selectedCategory}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-pink-50 ${selectedCategory === cat ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-700'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative w-full sm:w-48">
                        <button onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 hover:border-pink-300 transition-colors">
                            <span className="text-slate-600 text-sm font-medium">Ordenar: {sortBy}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in slide-in-from-top-2">
                                    {sortOptions.map(opt => (
                                        <button key={opt} onClick={() => { setSortBy(opt); setIsSortOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-pink-50 transition-colors">{opt}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Nenhum produto encontrado</h3>
                    <p className="text-slate-500 mt-2">Tente buscar por outro termo ou limpar os filtros.</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); }} className="mt-6 px-6 py-2 bg-pink-100 text-pink-600 rounded-full font-bold hover:bg-pink-200 transition-colors">Limpar Filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(product => {
                        const isFav = favorites.includes(product.id);
                        return (
                        <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1" onClick={() => onSelectProduct(product)}>
                            <div className="relative aspect-square overflow-hidden bg-slate-50">
                                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                                    className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md z-10 transition-all ${isFav ? 'bg-pink-100 text-pink-500' : 'bg-white/90 text-slate-400 hover:text-pink-500'}`}>
                                    <Heart className={`w-5 h-5 ${isFav ? 'fill-current scale-110' : ''}`} />
                                </button>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <span className="text-xs font-bold text-pink-500 uppercase tracking-wider bg-pink-50 px-2 py-1 rounded-md mb-3 w-max">{product.category}</span>
                                <h3 className="font-bold text-slate-800 mb-2 leading-tight group-hover:text-pink-600 transition-colors">{product.name}</h3>
                                <div className="flex justify-between items-end mt-auto pt-4">
                                    <span className="text-xl font-extrabold text-slate-900">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onAddToCart(product, 1); }} className="bg-slate-100 p-2.5 rounded-xl text-slate-600 hover:bg-pink-500 hover:text-white transition-colors">
                                        <ShoppingBag className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};

export default Market;