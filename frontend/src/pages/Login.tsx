import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Giriş yapılamadı. Lütfen e-posta ve şifrenizi kontrol edin.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">AKRAN</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Öğrenci Girişi
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
            Hemen kayıt olun
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs sm:rounded-xl border border-slate-200 sm:px-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Üniversite E-Postası
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ad.soyad@universite.edu.tr"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parola
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
