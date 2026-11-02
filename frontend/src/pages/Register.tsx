import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, User, Building, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    university: '',
    department: '',
    grade: '1. Sınıf',
    bio: '',
    interests: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Kayıt oluşturulamadı. Lütfen bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">AKRAN</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Öğrenci Hesabı Oluştur
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
            Giriş Yapın
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xs sm:rounded-xl border border-slate-200 sm:px-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ad Soyad *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Ayşe Yılmaz"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Üniversite E-Postası *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ad.soyad@universite.edu.tr"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parola *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="En az 6 karakter"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Üniversite *
                </label>
                <input
                  type="text"
                  required
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="İstanbul Teknik Üniversitesi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sınıf Seviyesi
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                >
                  <option value="Hazırlık">Hazırlık</option>
                  <option value="1. Sınıf">1. Sınıf</option>
                  <option value="2. Sınıf">2. Sınıf</option>
                  <option value="3. Sınıf">3. Sınıf</option>
                  <option value="4. Sınıf">4. Sınıf</option>
                  <option value="Yüksek Lisans">Yüksek Lisans</option>
                  <option value="Doktora">Doktora</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bölüm *
              </label>
              <input
                type="text"
                required
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Bilgisayar Mühendisliği"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kısa Biyografi ve Yetkinlikler
              </label>
              <textarea
                rows={2}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Hangi alanlarda desteğe ihtiyacınız var veya hangi konularda akranlarınıza yardımcı olabilirsiniz?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors resize-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                İlgi Alanları (Virgülle ayırın)
              </label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="Yapay Zekâ, Veri Bilimi, Robotik, TEKNOFEST"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isLoading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol ve Katıl'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
