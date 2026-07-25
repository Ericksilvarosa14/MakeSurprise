import React, { useState } from 'react';

const ImageCarousel = ({ images = [], productName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Se não houver imagens, exibe uma cinza padrão
    const listImages = images && images.length > 0 ? images : ['https://placehold.co/600x600/f8fafc/94a3b8?text=Sem+Foto'];

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? listImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === listImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Imagem Principal sem esticar */}
            <div className="w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative group">
                <img 
                    src={listImages[currentIndex]} 
                    alt={productName} 
                    className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Setas de navegação (aparecem se houver mais de 1 imagem) */}
                {listImages.length > 1 && (
                    <>
                        <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                            ‹
                        </button>
                        <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                            ›
                        </button>
                    </>
                )}
            </div>

            {/* Miniaturas (caso queira adicionar mais fotos no futuro) */}
            {listImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {listImages.map((img, index) => (
                        <button 
                            key={index} 
                            onClick={() => setCurrentIndex(index)}
                            className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${currentIndex === index ? 'border-pink-500 scale-105 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;