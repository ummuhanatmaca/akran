import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, Building, HelpCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Genel Geri Bildirim',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
          İletişim & Geri Bildirim
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Bizimle İletişime Geçin
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
          Platformla ilgili soru, öneri, teknik sorun veya üniversite topluluğu iş birliği
          talepleriniz için ekibimize doğrudan ulaşabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Mail className="w-4 h-4 text-sky-600" />
              <span>Doğrudan E-Posta</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Resmî proje ve destek iletileriniz için:
            </p>
            <a
              href="mailto:destek@akran.edu.tr"
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 block"
            >
              destek@akran.edu.tr
            </a>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Akademik Kapsam</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Üniversite Bilgisayar Mühendisliği Bölümü bitirme projesi kapsamında geliştirilmektedir.
            </p>
          </div>

          <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Yanıt Süresi</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              İletilen bildirimler ve telif raporları en geç 48 saat içerisinde değerlendirilir.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs md:col-span-2">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Mesajınız Alındı</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Geri bildiriminiz için teşekkür ederiz. İlgili konu en kısa sürede incelenecektir.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'Genel Geri Bildirim', message: '' });
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Yeni Mesaj Gönder
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">İletişim Formu</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Adınız Soyadınız *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Adınız"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    E-Posta Adresiniz *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ogrenci@universite.edu.tr"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Konu
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors text-slate-800"
                >
                  <option value="Genel Geri Bildirim">Genel Geri Bildirim</option>
                  <option value="Hata veya Teknik Sorun">Hata veya Teknik Sorun Bildirimi</option>
                  <option value="İçerik ve Telif Raporu">İçerik ve Telif Raporu</option>
                  <option value="Öneri ve Katkı">Platform Geliştirme Önerisi</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mesajınız *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detaylı açıklamanızı buraya yazınız..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gönder
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
