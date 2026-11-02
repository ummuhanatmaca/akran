import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpen,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  Compass
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-sky-700 text-xs font-semibold border border-slate-200">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Platform Hakkında</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Öğrenciden Öğrenciye Açık ve Dayanışmacı Üniversite Kültürü
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          AKRAN, üniversite öğrencilerinin öğrenme engellerini akran dayanışmasıyla aşmalarını sağlamak,
          ders kaynaklarını demokratikleştirmek ve bilimsel proje imkânlarına erişimi kolaylaştırmak için
          geliştirilmiş sosyal fayda odaklı bir web platformudur.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Ücretsiz & Gönüllülük Esaslı</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            AKRAN üzerinde verilen akran desteği için herhangi bir ücret talep edilemez.
            Öğrenciler bildiklerini paylaşarak birbirlerinin akademik başarısına katkıda bulunur.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Kural Tabanlı Akıllı Eşleştirme</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Desteğe ihtiyaç duyulan alt konu, haftalık müsaitlik takvimi ve yüz yüze/çevrim içi tercihler
            şeffaf bir kural motoruyla değerlendirilerek en uygun akran listelenir.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Bilimsel Proje İş Birliği</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            TÜBİTAK 2209-A/B destekleri, TEKNOFEST yarışmaları ve hackathonlar için doğrulanmış takvim,
            hazırlık rehberleri ve disiplinler arası takım arama imkânı sunulur.
          </p>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900">
          "Her Öğrenci Hem Öğrenen Hem de Öğretendir"
        </h2>
        <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
          <p>
            Geleneksel üniversite hiyerarşisinde dersi zor anlayan öğrenci ile konuyu iyi bilen öğrenci
            arasındaki mesafe genellikle dağınıktır. Özel ders ücretleri birçok öğrencinin bütçesini aşarken,
            akademik danışmanların yoğunluğu bire bir ilgi ihtiyacını her zaman karşılayamaz.
          </p>
          <p>
            AKRAN, öğrencilerin birbirlerinin dilinden anladığı gerçeğine dayanır. Veri Yapıları dersinde
            bağlı listeleri kavramakta güçlük çeken bir öğrenci, aynı zamanda Python programlama veya
            Calculus konusunda diğer bir akranına yol gösterebilir. Bu döngü yalnızca akademik başarıyı
            değil; iletişim becerilerini, empatiyi ve birlikte üretme kültürünü geliştirir.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Bilgisayar Mühendisliği Bitirme Projesi Kapsamında Geliştirilmiştir
          </span>
          <Link
            to="/tutors"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Akran Eğitmenlerini Keşfet
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
