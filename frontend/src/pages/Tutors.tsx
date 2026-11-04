import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course, TutorMatchResult } from '../types';
import {
  Compass,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';

export const Tutors: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('course_id') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('both');
  const [day, setDay] = useState('');

  const [tutors, setTutors] = useState<TutorMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    apiClient.get<Course[]>('/courses')
      .then((res) => {
        setCourses(res.data);
        if (res.data.length > 0 && !selectedCourseId) {
          const defaultC = res.data.find(c => c.code === 'CS201') || res.data[0];
          setSelectedCourseId(defaultC.id.toString());
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      handleSearch();
    }
  }, [selectedCourseId]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCourseId) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        course_id: selectedCourseId,
        mode: mode,
      });
      if (topic) params.append('topic', topic);
      if (day) params.append('day', day);

      const res = await apiClient.get<TutorMatchResult[]>(`/users/tutors/search?${params.toString()}`);
      setTutors(res.data);
    } catch (err) {
      console.error(err);
      setTutors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id.toString() === selectedCourseId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Kural Tabanlı Eşleştirme Motoru
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Akran Ders Anlatıcılarını Keşfet
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Zorlandığınız dersi ve konuyu seçin; kural tabanlı sistemimiz konu yetkinliği, zaman uygunluğu
            ve görüşme biçimi tercihlerinize göre en uygun öğrencileri şeffaf bir gerekçeyle sıralasın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/support-requests"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            Taleplerim & Destek Havuzu <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/support/create"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            + Destek Talebi Aç
          </Link>
        </div>
      </div>

      {/* Filter / Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ders Seçimi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ders Seçin *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sky-500 outline-none transition-colors text-slate-800"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Konu Filtresi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Destek İstediğiniz Konu
            </label>
            <input
              type="text"
              placeholder="Örn: Bağlı Listeler, SQL, Limit..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sky-500 outline-none transition-colors text-slate-800"
            />
          </div>

          {/* Görüşme Biçimi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Görüşme Biçimi
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sky-500 outline-none transition-colors text-slate-800"
            >
              <option value="both">Fark Etmez (Tümü)</option>
              <option value="online">Yalnızca Çevrim İçi (Online)</option>
              <option value="in_person">Yalnızca Yüz Yüze</option>
            </select>
          </div>

          {/* Gün Uygunluğu */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Müsait Gün
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sky-500 outline-none transition-colors text-slate-800"
            >
              <option value="">Tüm Günler</option>
              <option value="Pazartesi">Pazartesi</option>
              <option value="Salı">Salı</option>
              <option value="Çarşamba">Çarşamba</option>
              <option value="Perşembe">Perşembe</option>
              <option value="Cuma">Cuma</option>
              <option value="Cumartesi">Cumartesi</option>
              <option value="Pazar">Pazar</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Akran anlatımları tamamen ücretsiz ve gönüllülük esasına dayanır.</span>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Eşleşen Akranları Listele
          </button>
        </div>
      </form>

      {/* Suggested Topics Pill bar */}
      {selectedCourse?.topics && selectedCourse.topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Konu Başlıkları:</span>
          {selectedCourse.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTopic(t.name);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                topic === t.name
                  ? 'bg-sky-50 text-sky-800 border-sky-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t.name}
            </button>
          ))}
          {topic && (
            <button
              onClick={() => setTopic('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {selectedCourse ? `${selectedCourse.code} — ${selectedCourse.name}` : 'Arama Sonuçları'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {tutors.length} akran anlatıcı bulundu
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Uygun akranlar hesaplanıyor...</p>
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8 space-y-3">
            <Compass className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Bu kriterlere uyan akran bulunamadı
            </h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
              Konu veya gün filtresini esnetebilir ya da genel bir ders desteği talebi açarak gönüllü bir akranın size ulaşmasını sağlayabilirsiniz.
            </p>
            <div className="pt-2">
              <Link
                to={`/support/create?course_id=${selectedCourseId}&topic=${encodeURIComponent(topic)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Genel Destek Talebi Aç
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tutors.map((tutor) => (
              <div
                key={tutor.user_id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Tutor Header & Match Score */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {tutor.full_name ? tutor.full_name[0].toUpperCase() : 'Ö'}
                      </div>
                      <div>
                        <Link
                          to={`/users/${tutor.user_id}`}
                          className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors"
                        >
                          {tutor.full_name}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {tutor.university} — {tutor.department} ({tutor.grade})
                        </p>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shrink-0">
                      <Sparkles className="w-3 h-3" />
                      %{tutor.match_score} Uygun
                    </span>
                  </div>

                  {/* Algorithm match explanation */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed mb-3">
                    <strong className="text-slate-900 font-medium">Eşleşme Gerekçesi:</strong> {tutor.match_explanation}
                  </div>

                  {/* Bio */}
                  {tutor.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      "{tutor.bio}"
                    </p>
                  )}

                  {/* Availabilities */}
                  {tutor.availabilities && tutor.availabilities.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        Müsait Zamanları:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tutor.availabilities.map((av, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {av}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between gap-3">
                  <Link
                    to={`/users/${tutor.user_id}`}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Profili İncele
                  </Link>

                  <Link
                    to={`/support/create?helper_id=${tutor.user_id}&course_id=${selectedCourseId}&topic=${encodeURIComponent(
                      topic || selectedCourse?.topics?.[0]?.name || ''
                    )}`}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    Ders Talebi Gönder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
