import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, User, Sparkles, Info, Zap, CreditCard, QrCode, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LoginModal = ({ isOpen, onClose, onLogin, isCheckout, cartTotal = 0, freeShippingThreshold = 150 }) => {
    const [step, setStep] = useState(1);
    const [loadingCep, setLoadingCep] = useState(false);
    
    const [freightOptions, setFreightOptions] = useState({ standard: 0, express: 0 });
    const [selectedFreight, setSelectedFreight] = useState('standard'); 
    const [paymentMethod, setPaymentMethod] = useState('');
    
    // Estado para armazenar os preços baixados do banco
    const [zonasFrete, setZonasFrete] = useState(null);

    const ganhouFreteGratis = cartTotal >= freeShippingThreshold;

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
    });

    const MEU_CNPJ = "00.000.000/0001-00"; 
    const LINK_QR_CODE = "https://placehold.co/200x200/f8fafc/ec4899?text=Seu+QR+Code+PIX"; 

    // Baixa os valores de frete do Firebase UMA VEZ quando o modal abre
    useEffect(() => {
        const fetchFretes = async () => {
            if (!isOpen) return;
            try {
                const docRef = doc(db, 'configuracoes', 'fretes_zonas');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setZonasFrete(docSnap.data());
                } else {
                    setZonasFrete({ zona1: 15, zona2: 25, zona3: 35, zona4: 45, zona5: 55 });
                }
            } catch (error) {
                console.error("Erro ao buscar fretes no Firebase:", error);
            }
        };
        fetchFretes();
    }, [isOpen]);

    // Como removemos o sistema de login, o modal sempre reseta quando aberto
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
            setStep(1);
            setFreightOptions({ standard: 0, express: 0 });
            setPaymentMethod('');
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
                        street: data.logradouro || '', // Permite vir vazio em cidades do interior
                        neighborhood: data.bairro || '',
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state
                    }));
                    
                    let baseCost = 25.00; 
                    
                    if (zonasFrete) {
                        const uf = data.uf;
                        if (uf === 'PR') baseCost = Number(zonasFrete.zona1);
                        else if (['SC', 'RS', 'SP', 'RJ', 'MG', 'ES'].includes(uf)) baseCost = Number(zonasFrete.zona2);
                        else if (['MS', 'MT', 'GO', 'DF'].includes(uf)) baseCost = Number(zonasFrete.zona3);
                        else if (['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'].includes(uf)) baseCost = Number(zonasFrete.zona4);
                        else if (['AM', 'PA', 'AC', 'RR', 'RO', 'AP', 'TO'].includes(uf)) baseCost = Number(zonasFrete.zona5);
                    }
                    
                    let stdCost = baseCost;
                    let expCost = baseCost + 17.50; 
                    
                    if (ganhouFreteGratis) {
                        stdCost = 0; 
                    }
                    
                    setFreightOptions({ standard: stdCost, express: expCost });
                    setSelectedFreight('standard'); 
                } else {
                    alert("CEP não encontrado. Por favor, digite os dados do endereço manualmente.");
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
                alert("Erro de conexão ao buscar o CEP. Digite o endereço manualmente.");
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

    const handleNext1 = () => {
        if (formData.name && formData.email && formData.phone) {
            setStep(2);
        } else {
            alert("Preencha seus dados básicos primeiro!");
        }
    };

    const handleNext2 = () => {
        if (formData.cep && formData.number && formData.city && formData.state) {
            setStep(3); 
        } else {
            alert("Preencha o CEP, Número, Cidade e Estado para prosseguirmos!");
        }
    };

    const handleFinalize = () => {
        onLogin({ 
            ...formData, 
            freightCost: freightOptions[selectedFreight] || 0, 
            freightMethod: selectedFreight,
            paymentMethod: paymentMethod 
        });
    };

    const orderTotal = cartTotal + (freightOptions[selectedFreight] || 0);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        {step === 1 && <><User className="w-6 h-6 text-pink-500"/> Falta pouco!</>}
                        {step === 2 && <><MapPin className="w-6 h-6 text-pink-500"/> Entrega</>}
                        {step === 3 && <><ShieldCheck className="w-6 h-6 text-pink-500"/> Pagamento</>}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    
                    {/* Barra de Progresso */}
                    {isCheckout && (
                        <div className="flex gap-2 mb-6">
                            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-pink-500' : 'bg-slate-100'}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-pink-500' : 'bg-slate-100'}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-pink-500' : 'bg-slate-100'}`}></div>
                        </div>
                    )}

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

                            <button onClick={handleNext1} className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg py-4 rounded-2xl transition-colors">
                                Continuar
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

                            {/* O formulário agora abre assim que a UF (estado) for identificada ou o usuário digitar algo */}
                            {formData.state && (
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
                                            <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Nome da rua" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
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
                                            <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Nome do bairro" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Cidade/UF</label>
                                            <input type="text" value={`${formData.city} - ${formData.state}`} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm" readOnly />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">
                                    Voltar
                                </button>
                                <button onClick={handleNext2} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg">
                                    Ir para Pagamento
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="bg-pink-50 p-4 rounded-2xl flex justify-between items-center border border-pink-100">
                                <span className="font-medium text-slate-700">Total a pagar:</span>
                                <span className="text-2xl font-black text-pink-600">R$ {orderTotal.toFixed(2).replace('.', ',')}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => setPaymentMethod('pix')} 
                                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-pink-300 text-slate-600'}`}>
                                    <QrCode className="w-6 h-6" />
                                    <span className="font-bold text-sm">PIX</span>
                                </button>
                                
                                <button onClick={() => setPaymentMethod('credit')} 
                                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 text-slate-600'}`}>
                                    <CreditCard className="w-6 h-6" />
                                    <span className="font-bold text-sm">Crédito</span>
                                </button>

                                <button onClick={() => setPaymentMethod('debit')} 
                                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'debit' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-300 text-slate-600'}`}>
                                    <Smartphone className="w-6 h-6" />
                                    <span className="font-bold text-sm">Débito</span>
                                </button>
                            </div>

                            {paymentMethod === 'pix' && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center animate-in zoom-in-95">
                                    <h3 className="font-bold text-slate-800 mb-4">Escaneie o QR Code ou use a chave CNPJ</h3>
                                    <img src={LINK_QR_CODE} alt="QR Code PIX" className="w-40 h-40 mx-auto mb-4 rounded-xl shadow-sm border border-slate-200" />
                                    <p className="text-sm text-slate-500 mb-1">Chave CNPJ:</p>
                                    <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-mono font-bold text-lg text-slate-900 select-all">
                                        {MEU_CNPJ}
                                    </div>
                                </div>
                            )}

                            {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 text-center animate-in zoom-in-95">
                                    <ShieldCheck className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                    <h3 className="font-bold text-slate-800 mb-2">Ambiente Seguro</h3>
                                    <p className="text-slate-600 text-sm">
                                        Ao finalizar, você será redirecionado para o nosso gateway blindado para inserir os dados do cartão.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setStep(2)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors">
                                    Voltar
                                </button>
                                <button 
                                    disabled={!paymentMethod}
                                    onClick={handleFinalize} 
                                    className="flex-1 bg-pink-500 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-pink-600 text-white font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-pink-500/30">
                                    Finalizar Pedido <CheckCircle className="w-5 h-5"/>
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