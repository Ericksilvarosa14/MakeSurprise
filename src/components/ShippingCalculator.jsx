// Arquivo: src/components/ShippingCalculator.jsx
import React, { useState } from 'react'; // Tivemos que importar o useState!
import { Truck } from 'lucide-react'; // Tivemos que importar o caminhão!

const ShippingCalculator = () => {
    const [cep, setCep] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleCalculate = (e) => {
        e.preventDefault();
        if (cep.replace(/\D/g, '').length < 8) return;
        setLoading(true);
        setTimeout(() => {
            setResult({ pac: { price: 15.90, days: 7 }, sedex: { price: 32.50, days: 2 } });
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-6">
            <h4 className="flex items-center text-slate-800 font-bold mb-3 text-sm">
                <Truck className="h-5 w-5 mr-2 text-slate-500" /> Simular Frete
            </h4>
            <form onSubmit={handleCalculate} className="flex gap-2 mb-4">
                <input type="text" placeholder="00000-000" maxLength={9}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
                    value={cep}
                    onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
                        setCep(val);
                    }} />
                <button type="submit" disabled={loading || cep.length < 8}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-700 transition-colors">
                    {loading ? '...' : 'Calcular'}
                </button>
            </form>
            {result && !loading && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex justify-between text-sm p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div><span className="font-bold block">PAC</span><span className="text-slate-500 text-xs">Até {result.pac.days} dias úteis</span></div>
                        <span className="font-bold">R$ {result.pac.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm p-3 bg-white rounded-xl shadow-sm border-l-2 border-l-pink-400">
                        <div><span className="font-bold block">Sedex</span><span className="text-pink-500 text-xs">Até {result.sedex.days} dias úteis</span></div>
                        <span className="font-bold text-pink-500">R$ {result.sedex.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingCalculator;