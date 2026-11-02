import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course, Opportunity, StudyMaterial } from '../types';
import {
  Compass,
  FileText,
  Users,
  ArrowRight,
  HeartHandshake,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<Course[]>('/courses'),
      apiClient.get<Opportunity[]>('/opportunities?status_filter=open'),
      apiClient.get<StudyMaterial[]>('/materials'),
    ])
      .then(([cRes, oRes, mRes]) => {
        setCourses(cRes.data.slice(0, 6));
        setOpportunities(oRes.data.slice(0, 3));
        setMaterials(mRes.data.slice(0, 4));
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION & PROPOSITION */}
      <section className="bg-slate-900 border-b border-slate-800 text-white pt-16 sm:pt-20 pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 text-sky-400 text-xs font-semibold mb-6 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Üniversite Öğrencileri Akademik Destek Platformu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Birlikte öğren, birlikte geliş.
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Üniversitede öğrenmek, doğru kaynaklara ulaşmak ve bir fikri hayata geçirmek herkes için aynı ölçüde kolay olmayabilir.
            AKRAN, bildiklerini paylaşmak isteyen öğrencilerle desteğe ihtiyaç duyanları buluşturur;
            ders kaynaklarını, çalışma gruplarını ve bilimsel fırsatları tek bir yerde bir araya getirir.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              to="/tutors"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Compass className="w-4 h-4 text-slate-950" />
              Ders Desteği Bul
            </Link>

            <Link
              to="/opportunities"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              Bilimsel Fırsatları İncele
            </Link>
          </div>

          {/* 4 Value Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <Link
              to="/tutors"
              className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-800 transition-colors group block"
            >
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs sm:text-sm mb-1.5">
                <Compass className="w-4 h-4" />
                <span>Akran Desteği</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Birlikte öğren, bildiklerini paylaş. Zorlandığın konularda akranlarından destek al.
              </p>
              <span className="text-[11px] font-medium text-sky-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Anlatıcıları gör <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              to="/materials"
              className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-800 transition-colors group block"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs sm:text-sm mb-1.5">
                <FileText className="w-4 h-4" />
                <span>Ortak Kaynaklar</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ders notlarına ve çalışma gruplarına daha kolay ulaş. Sınavlara birlikte hazırlan.
              </p>
              <span className="text-[11px] font-medium text-cyan-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Notları incele <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              to="/opportunities"
              className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-800 transition-colors group block"
            >
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm mb-1.5">
                <Award className="w-4 h-4" />
                <span>Bilimsel Fırsatlar</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fikrini projeye dönüştürmek için doğru rehberi ve TÜBİTAK/TEKNOFEST fırsatını bul.
              </p>
              <span className="text-[11px] font-medium text-amber-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Fırsatları keşfet <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              to="/pomodoro"
              className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-sky-500/50 hover:bg-slate-800 transition-colors group block"
            >
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs sm:text-sm mb-1.5">
                <Clock className="w-4 h-4" />
                <span>Odaklanma Alanı</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dikkatini tek bir derse ver, molalarını planla ve bağımsız Pomodoro ritmini yakala.
              </p>
              <span className="text-[11px] font-medium text-indigo-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Odaklanmaya başla <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DERS DESTEĞİ İKİLİ ÇAĞRI (Öğrenen vs. Anlatan) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="max-w-2xl mb-8">
            <span className="text-sky-600 font-semibold text-xs uppercase tracking-wider">
              Çift Yönlü Akademik Dayanışma
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              Ders Desteği Sistemi Nasıl Çalışır?
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
              Her öğrenci hem öğrenen hem de öğretendir. Bir derste zorlanırken başka bir alanda başarılı olabilirsin.
              Bildiğin konuyu akranına aktar, desteğe ihtiyaç duyduğun alanda yardım al.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block p-2 rounded-md bg-sky-100 text-sky-700 mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Ders Desteği Almak İstiyorum
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Zorlandığın dersi ve alt konuyu seç. Kural tabanlı eşleştirme algoritması, konuya hakim ve zamanı sana uygun akranları listelesin.
                </p>
              </div>
              <Link
                to="/tutors"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md text-center text-xs transition-colors"
              >
                Akran Eğitmen Ara
              </Link>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block p-2 rounded-md bg-emerald-100 text-emerald-700 mb-3">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Ders Anlatmak İstiyorum
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Başarılı olduğun dersleri ve haftalık uygun saatlerini profiline ekle. Arkadaşlarına destek olarak kendi bilgilerini de pekiştir.
                </p>
              </div>
              <Link
                to="/profile"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-center text-xs transition-colors"
              >
                Anlatabileceğim Dersleri Belirt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DERSLER KATALOĞU ÖNİZLEME */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ders Kataloğu</h2>
            <p className="text-slate-500 text-xs mt-0.5">Akran desteği ve çalışma grupları bulunan temel dersler</p>
          </div>
          <Link to="/courses" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Tüm Dersleri Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {c.code}
                </span>
                <span className="text-[11px] text-slate-400">{c.topics?.length || 0} Konu</span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors text-sm mb-1">
                {c.name}
              </h3>
              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                {c.description || 'Bu ders için akran desteği ve çalışma grupları mevcuttur.'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. GÜNCEL BİLİMSEL FIRSATLAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Aktif Bilimsel Fırsatlar</h2>
            <p className="text-slate-500 text-xs mt-0.5">Resmî kurumlarca duyurulan araştırma destekleri ve yarışmalar</p>
          </div>
          <Link to="/opportunities" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Tüm Fırsatlar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {opp.category}
                  </span>
                  <span className="text-[11px] text-slate-500">{opp.organization}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1.5 line-clamp-2">
                  {opp.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                  {opp.summary || opp.requirements || 'Üniversite öğrencilerine yönelik proje çağrısı.'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2">
                {opp.prize_support && (
                  <p className="text-xs text-slate-700 font-medium mb-2.5">
                    Destek: <span className="font-semibold text-slate-900">{opp.prize_support}</span>
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    to="/opportunities"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                  >
                    Detayları Gör
                  </Link>
                  <a
                    href={opp.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    Resmî Duyuru <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SOSYAL FAYDA BÖLÜMÜ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-xl p-8 sm:p-10 text-white border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-300 text-xs font-semibold border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Sosyal Fayda Odaklı
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Eğitimde Fırsat Eşitliği ve Akran Dayanışması
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Üniversite eğitimi fahiş özel ders ücretleriyle veya ulaşılamayan kaynaklarla zorlaşmamalıdır.
                AKRAN, öğrencilerin bilgi ve zamanlarını karşılıksız paylaşarak birlikte yükselmelerini hedefler.
                Birbirine öğreten öğrenciler hem konuyu daha derin kavrar hem de iş birliğine dayalı bir çalışma kültürü kazanır.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 justify-center items-center lg:items-end">
              <Link
                to="/register"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs text-center transition-colors shadow-xs"
              >
                Topluluğa Katıl
              </Link>
              <Link
                to="/guides"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition-colors"
              >
                Proje Rehberlerini Oku
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
