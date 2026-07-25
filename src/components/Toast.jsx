// Arquivo: src/components/Toast.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react'; // Tivemos que importar o ícone dele aqui!

const Toast = ({ message }) => {
    if (!message) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4">
            <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" /> {message}
            </div>
        </div>
    );
};

export default Toast;