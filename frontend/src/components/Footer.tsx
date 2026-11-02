import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-900">
          {/* Birinci sütun — Marka (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold">
                <GraduationCap className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AKRAN</span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              AKRAN, öğrencilerin birbirlerinden öğrenmelerini, bilgi paylaşmalarını ve bilimsel fırsatlara daha kolay ulaşmalarını destekleyen bir öğrenme platformudur.
            </p>

            <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Gönüllülük esaslı, açık akran eğitimi</span>
            </div>
          </div>

          {/* İkinci sütun — Platform (lg: 2-3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Platform
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tutors" className="text-slate-400 hover:text-white transition-colors">
                  Akran Desteği
                </Link>
              </li>
              <li>
                <Link to="/materials" className="text-slate-400 hover:text-white transition-colors">
                  Ders Kaynakları
                </Link>
              </li>
              <li>
                <Link to="/study-groups" className="text-slate-400 hover:text-white transition-colors">
                  Çalışma Grupları
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="text-slate-400 hover:text-white transition-colors">
                  Bilimsel Fırsatlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Üçüncü sütun — Öğrenme ve Gelişim (lg: 2-3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Öğrenme ve Gelişim
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/guides" className="text-slate-400 hover:text-white transition-colors">
                  Proje Rehberleri
                </Link>
              </li>
              <li>
                <Link to="/goals" className="text-slate-400 hover:text-white transition-colors">
                  Akademik Hedefler
                </Link>
              </li>
              <li>
                <Link to="/team-finder" className="text-slate-400 hover:text-white transition-colors">
                  Takım Arkadaşı İlanları
                </Link>
              </li>
              <li>
                <Link to="/pomodoro" className="text-slate-400 hover:text-white transition-colors">
                  Odaklanma Alanı (Pomodoro)
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-slate-400 hover:text-white transition-colors">
                  Ders Kataloğu
                </Link>
              </li>
            </ul>
          </div>

          {/* Dördüncü sütun — Bilgi ve Destek (lg: 2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Bilgi ve Destek
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with dynamic year */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} AKRAN — Üniversite Öğrencileri Akademik Destek Platformu. Tüm hakları saklıdır.
          </p>

          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">
              Gizlilik
            </Link>
            <span className="text-slate-800">•</span>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">
              Koşullar
            </Link>
            <span className="text-slate-800">•</span>
            <a
              href="mailto:destek@akran.edu.tr"
              className="hover:text-slate-400 transition-colors inline-flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              destek@akran.edu.tr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
