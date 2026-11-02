import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course } from '../types';
import { BookOpen, Search, Compass, Users, FileText, ArrowRight, Loader2 } from 'lucide-react';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Course[]>('/courses')
      .then((res) => setCourses(res.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Müfredat & Akademik Program
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ders Kataloğu
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Mühendislik ve fen bilimleri dersleri, alt konular ve akran desteği seçenekleri.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ders adı veya kodu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-800"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Dersler yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {c.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {c.faculty || 'Mühendislik Fakültesi'}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 text-base mb-2">{c.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {c.description || 'Bu ders için akran desteği ve materyaller mevcuttur.'}
                </p>

                {c.topics && c.topics.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Alt Konular ({c.topics.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.topics.slice(0, 3).map((t) => (
                        <span key={t.id} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.name}
                        </span>
                      ))}
                      {c.topics.length > 3 && (
                        <span className="text-[11px] px-1.5 py-0.5 text-slate-400 font-medium">
                          +{c.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
                <Link
                  to={`/courses/${c.id}`}
                  className="text-xs font-semibold text-slate-700 hover:text-sky-600 transition-colors inline-flex items-center gap-1"
                >
                  Ders Detayları
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/materials?course_id=${c.id}`}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-md hover:bg-slate-50 transition-colors"
                    title="Ders Notları"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/tutors?course_id=${c.id}`}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    Eğitmen Bul
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
