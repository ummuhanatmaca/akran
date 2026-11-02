import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { UserProfile } from '../types';
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Compass,
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react';

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    apiClient.get(`/users/${id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Profil bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">Öğrenci profili bulunamadı.</p>
        <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700">
          <ArrowLeft className="w-4 h-4" /> Eğitmenler Listesine Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Eğitmen Listesine Dön
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0">
            {profile.full_name ? profile.full_name[0].toUpperCase() : 'Ö'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.full_name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.university} — {profile.department} ({profile.grade})
            </p>
            {profile.interests && (
              <p className="text-xs text-sky-700 mt-1 font-medium">
                İlgi Alanları: {profile.interests}
              </p>
            )}
          </div>
        </div>

        {profile.teach_courses?.length > 0 && (
          <Link
            to={`/support/create?helper_id=${profile.id}&course_id=${profile.teach_courses[0].course_id}`}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Compass className="w-4 h-4" />
            Ders Talebi Gönder
          </Link>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hakkında</h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">"{profile.bio}"</p>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teach courses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Destek Verebileceği Dersler
          </h3>
          {profile.teach_courses?.length === 0 ? (
            <p className="text-xs text-slate-400">Belirtilmemiş.</p>
          ) : (
            <div className="space-y-2">
              {profile.teach_courses.map((c: any, idx: number) => (
                <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{c.course_code} — {c.course_name}</strong>
                    <Link
                      to={`/support/create?helper_id=${profile.id}&course_id=${c.course_id}&topic=${encodeURIComponent(c.topics || '')}`}
                      className="text-emerald-700 font-semibold hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      Talep Et <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {c.topics && (
                    <p className="text-slate-600 mt-1">Konular: {c.topics}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learn courses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-sky-600" />
            Destek Almak İstediği Dersler
          </h3>
          {profile.learn_courses?.length === 0 ? (
            <p className="text-xs text-slate-400">Belirtilmemiş.</p>
          ) : (
            <div className="space-y-2">
              {profile.learn_courses.map((c: any, idx: number) => (
                <div key={idx} className="p-3 bg-sky-50/50 border border-sky-100 rounded-lg text-xs">
                  <strong className="text-slate-900">{c.course_code} — {c.course_name}</strong>
                  {c.topics && (
                    <p className="text-slate-600 mt-1">Konular: {c.topics}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Availability Schedule */}
      {profile.availabilities && profile.availabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            Haftalık Müsaitlik Takvimi
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.availabilities.map((av: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-semibold text-slate-900 block">{av.day_of_week}</span>
                <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {av.start_time} - {av.end_time}
                </span>
                <span className="text-[10px] text-sky-700 mt-1 block">
                  {av.mode === 'both' ? 'Online & Yüz Yüze' : av.mode === 'online' ? 'Çevrim İçi' : 'Yüz Yüze'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
