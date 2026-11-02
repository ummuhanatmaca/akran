import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course, TutorMatchResult, StudyMaterial } from '../types';
import {
  BookOpen,
  Compass,
  FileText,
  Users,
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [tutors, setTutors] = useState<TutorMatchResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (m: StudyMaterial) => {
    setDownloadingId(m.id);
    try {
      const res = await apiClient.get(`/materials/${m.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: m.mime_type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', m.file_name || 'ders-notu.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      let errorMsg = 'Dosya sunucuda bulunamadı veya bağlantı koptu.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) errorMsg = json.detail;
        } catch (_) {}
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      alert('Dosya indirilemedi: ' + errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      apiClient.get<Course>(`/courses/${id}`),
      apiClient.get<TutorMatchResult[]>(`/users/tutors/search?course_id=${id}`),
      apiClient.get<StudyMaterial[]>(`/materials?course_id=${id}`),
    ])
      .then(([cRes, tRes, mRes]) => {
        setCourse(cRes.data);
        setTutors(tRes.data);
        setMaterials(mRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Ders detayları yükleniyor...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Ders bulunamadı.</p>
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700">
          <ArrowLeft className="w-4 h-4" /> Ders Kataloğuna Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Ders Kataloğuna Dön
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
              {course.code}
            </span>
            <span className="text-xs text-slate-500 font-medium">{course.faculty}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{course.name}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">{course.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <Link
            to={`/tutors?course_id=${course.id}`}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4" /> Akran Eğitmen Bul
          </Link>
          <Link
            to={`/support/create?course_id=${course.id}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            Destek Talebi Aç
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Topics Syllabus */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" />
            Ders Konu Başlıkları ({course.topics?.length || 0})
          </h2>

          {course.topics && course.topics.length > 0 ? (
            <div className="space-y-2">
              {course.topics.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs"
                >
                  <span className="font-mono font-semibold text-sky-600 shrink-0">{idx + 1}.</span>
                  <div>
                    <strong className="text-slate-800 font-medium">{t.name}</strong>
                    {t.description && <p className="text-slate-500 text-[11px] mt-0.5">{t.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Konu listesi eklenmemiş.</p>
          )}
        </div>

        {/* Right 2 Cols: Available Tutors and Materials */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Tutors for this course */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                Bu Derste Destek Veren Akranlar ({tutors.length})
              </h2>
              <Link to={`/tutors?course_id=${course.id}`} className="text-xs font-semibold text-sky-600 hover:text-sky-800">
                Tümünü Gör
              </Link>
            </div>

            {tutors.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                Bu ders için henüz bir akran eğitmen kaydı bulunmuyor.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tutors.slice(0, 4).map((t) => (
                  <div
                    key={t.user_id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Link to={`/users/${t.user_id}`} className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors">
                          {t.full_name}
                        </Link>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          %{t.match_score}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{t.university} — {t.department}</p>
                      {t.topics && (
                        <p className="text-[11px] text-slate-700 font-medium mt-1">Konular: {t.topics}</p>
                      )}
                    </div>
                    <Link
                      to={`/support/create?helper_id=${t.user_id}&course_id=${course.id}`}
                      className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      Talep Gönder <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Study Materials */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                Ders Notları ve Kaynaklar ({materials.length})
              </h2>
              <Link to={`/materials?course_id=${course.id}`} className="text-xs font-semibold text-sky-600 hover:text-sky-800">
                Tüm Notlar
              </Link>
            </div>

            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                Bu ders için henüz not paylaşılmamış. İlk notu siz paylaşabilirsiniz.
              </p>
            ) : (
              <div className="space-y-2">
                {materials.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {m.uploader_name} • {(m.file_size / (1024 * 1024)).toFixed(2)} MB • {m.download_count} İndirme
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownload(m)}
                      disabled={downloadingId === m.id}
                      className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      title="İndir"
                    >
                      {downloadingId === m.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
