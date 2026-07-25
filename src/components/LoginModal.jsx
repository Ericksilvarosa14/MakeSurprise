import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, User, Sparkles, Info, Zap } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, isCheckout, cartTotal = 0, freeShippingThreshold = 150, loggedUser = null }) => {
    const [step, setStep] = useState(1);
    const [loadingCep, setLoadingCep] = useState(false);
    
    const [freightOptions, setFreightOptions] = useState({ standard: 0, express: 0 });
    const [selectedFreight, setSelectedFreight] = useState('standard'); 

    const ganhouFreteGratis = cartTotal >= freeShippingThreshold;

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (loggedUser) {
                setFormData(loggedUser);
                if (isCheckout) {
                    setStep(2); 
                    if (loggedUser.cep) {
                        searchCep(loggedUser.cep);
                    }
                } else {
                    setStep(1);
                }
            } else {
                setFormData({ name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
                setStep(1);
                setFreightOptions({ standard: 0, express: 0 });
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const searchCep = async (cepValue) => {
        const cleanCep = String(cepValue).replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setLoadingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state
                    }));
                    
                    let baseCost = 25.90;
                    if (data.uf === 'PR') baseCost = 12.90;
                    else if (['SC', 'RS', 'SP'].includes(data.uf)) baseCost = 18.90;
                    else if (['RJ', 'MG', 'ES'].includes(data.uf)) baseCost = 22.90;
                    
                    let stdCost = baseCost;
                    let expCost = baseCost + 17.50;
                    
                    if (ganhouFreteGratis) {
                        stdCost = 0; 
                    }
                    
                    setFreightOptions({ standard: stdCost, express: expCost });
                    setSelectedFreight('standard'); 
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const handleCepChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, cep: val }));
        if (String(val).replace(/\D/g, '').length === 8) {
            searchCep(val);
        }
    };

    const handleNext = () => {
        if (formData.name && formData.email && formData.phone) {
            if (isCheckout) {
                setStep(2);
            } else {
                onLogin(formData);
            }
        } else {
            alert("Preencha seus dados básicos primeiro!");
        }
    };

    const handleSubmit = () => {
        if (formData.cep && formData.number) {
            onLogin({ ...formData, freightCost: freightOptions[selectedFreight] || 0, freightMethod: selectedFreight });
            setStep(1); 
        } else {
            alert("Preencha o CEP e o número da residência!");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        {step === 1 ? <><User className="w-6 h-6 text-pink-500"/> Falta pouco!</> : <><MapPin className="w-6 h-6 text-pink-500"/> Revisar Entrega</>}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4">
                            <p className="text-slate-600 mb-6">Precisamos dos seus dados para finalizar e enviar o seu pedido.</p>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Maria Silva" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="maria@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full px-4 py-3 rounded-xl border border-pink-500 outline-none focus:ring-2 focus:ring-pink-200" />
                            </div>

                            <button onClick={handleNext} className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg py-4 rounded-2xl transition-colors">
                                Continuar para Entrega
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            {ganhouFreteGratis ? (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col gap-1 mb-2">
                                    <span className="font-black text-green-600 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Sparkles className="w-5 h-5"/> PARABÉNS! FRETE GRÁTIS ATIVADO!
                                    </span>
                                    <span className="text-xs text-green-700 font-medium">Você atingiu a meta de R$ {freeShippingThreshold.toFixed(2).replace('.', ',')} e a entrega PAC é por nossa conta!</span>
                                </div>
                            ) : (
                                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 flex items-center gap-2 mb-2">
                                    <Info className="w-5 h-5 text-pink-500 flex-shrink-0"/>
                                    <span className="text-xs font-bold text-pink-700">
                                        Faltam R$ {(freeShippingThreshold - cartTotal).toFixed(2).replace('.', ',')} para você ganhar Frete Grátis!
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">CEP</label>
                                <input type="text" name="cep" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" maxLength="9" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
                                {loadingCep && <span className="text-xs text-pink-500 mt-1 block">Buscando endereço e fretes...</span>}
                            </div>

                            {formData.street && (
                                <>
                                    <div className="space-y-3 my-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Forma de Envio</label>
                                        
                                        <label className={`cursor-pointer border-2 p-4 rounded-xl flex items-center justify-between transition-colors ${selectedFreight === 'standard' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="freight" value="standard" checked={selectedFreight === 'standard'} onChange={() => setSelectedFreight('standard')} className="hidden" />
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${selectedFreight === 'standard' ? 'bg-pink-500 text-white' : 'bg-white text-slate-400'}`}>
                                                    <Truck className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">Correios (PAC)</p>
                                                    <p className="text-xs text-slate-500">Aproximadamente 7 dias úteis</p>
                                                </div>
                                            </div>
                                            <span className={`font-black ${freightOptions.standard === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                                {freightOptions.standard === 0 ? 'GRÁTIS' : `R$ ${(freightOptions.standard || 0).toFixed(2).replace('.', ',')}`}
                                            </span>
                                        </label>

                                        <label className={`cursor-pointer border-2 p-4 rounded-xl flex items-center justify-between transition-colors ${selectedFreight === 'express' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="radio" name="freight" value="express" checked={selectedFreight === 'express'} onChange={() => setSelectedFreight('express')} className="hidden" />
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${selectedFreight === 'express' ? 'bg-pink-500 text-white' : 'bg-white text-slate-400'}`}>
                                                    <Zap className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">Sedex (Expresso)</p>
                                                    <p className="text-xs text-slate-500">Chega voando (Até 3 dias úteis)</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-slate-800">
                                                R$ {(freightOptions.express || 0).toFixed(2).replace('.', ',')}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Rua</label>
                                            <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" readOnly={!loggedUser} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Número</label>
                                            <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="123" className="w-full px-4 py-3 rounded-xl border border-pink-500 outline-none focus:ring-2 focus:ring-pink-200" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Complemento (Opcional)</label>
                                        <input type="text" name="complement" value={formData.complement} onChange={handleChange} placeholder="Apto, Bloco, Casa 2..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Bairro</label>
                                            <input type="text" name="neighborhood" value={formData.neighborhood} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" readOnly={!loggedUser} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Cidade/UF</label>
                                            <input type="text" value={`${formData.city} - ${formData.state}`} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm" readOnly />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 mt-6">
                                {!loggedUser && (
                                    <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">
                                        Voltar
                                    </button>
                                )}
                                <button onClick={handleSubmit} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-pink-500/30">
                                    Finalizar - R$ {(cartTotal + (freightOptions[selectedFreight] || 0)).toFixed(2).replace('.', ',')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;