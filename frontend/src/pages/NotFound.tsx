import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold mb-4 shadow-xs">
        <GraduationCap className="w-6 h-6 text-sky-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-base font-semibold text-slate-700 mt-1">Sayfa Bulunamadı</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-2 mb-6">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
      </Link>
    </div>
  );
};
