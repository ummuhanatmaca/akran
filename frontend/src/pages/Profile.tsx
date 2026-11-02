import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Course, CoursePreference, StudentAvailability } from '../types';
import {
  User,
  BookOpen,
  Calendar,
  Save,
  Trash2,
  Clock
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [preferences, setPreferences] = useState<CoursePreference[]>([]);
  const [availabilities, setAvailabilities] = useState<StudentAvailability[]>([]);

  // Profile Edit State
  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    department: '',
    grade: '',
    bio: '',
    interests: '',
  });

  // New Course Preference State
  const [newPref, setNewPref] = useState({
    course_id: '',
    preference_type: 'teach',
    topics_list: '',
    mode_preference: 'both',
  });

  // New Availability State
  const [newAvail, setNewAvail] = useState({
    day_of_week: 'Cumartesi',
    start_time: '14:00',
    end_time: '16:00',
    mode: 'both',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [cRes, pRes, aRes] = await Promise.all([
        apiClient.get<Course[]>('/courses'),
        apiClient.get<CoursePreference[]>('/users/preferences'),
        apiClient.get<StudentAvailability[]>('/users/availability'),
      ]);
      setCourses(cRes.data);
      setPreferences(pRes.data);
      setAvailabilities(aRes.data);
      if (cRes.data.length > 0 && !newPref.course_id) {
        setNewPref(prev => ({ ...prev, course_id: cRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || '',
        university: user.profile.university || '',
        department: user.profile.department || '',
        grade: user.profile.grade || '1. Sınıf',
        bio: user.profile.bio || '',
        interests: user.profile.interests || '',
      });
    }
    loadData();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await apiClient.put('/users/profile', formData);
      await refreshUser();
      setProfileMessage('Profil bilgileriniz başarıyla güncellendi.');
    } catch (err) {
      setProfileMessage('Profil güncellenirken bir hata oluştu.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users/preferences', {
        course_id: parseInt(newPref.course_id),
        preference_type: newPref.preference_type,
        topics_list: newPref.topics_list,
        mode_preference: newPref.mode_preference,
      });
      setNewPref(prev => ({ ...prev, topics_list: '' }));
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ders tercihi eklenemedi.');
    }
  };

  const handleDeletePreference = async (prefId: number) => {
    try {
      await apiClient.delete(`/users/preferences/${prefId}`);
      await loadData();
    } catch (err) {
      alert('Ders tercihi silinemedi.');
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users/availability', newAvail);
      await loadData();
    } catch (err) {
      alert('Uygunluk zamanı eklenemedi.');
    }
  };

  const handleDeleteAvailability = async (availId: number) => {
    try {
      await apiClient.delete(`/users/availability/${availId}`);
      await loadData();
    } catch (err) {
      alert('Uygunluk silinemedi.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
          Kullanıcı Paneli & Tercihler
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Profilim ve Akademik Tercihlerim
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Kişisel bilgilerinizi, ders anlatabileceğiniz veya destek aradığınız konuları ve haftalık müsait takviminizi yönetin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info Form */}
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0">
              {formData.full_name ? formData.full_name[0].toUpperCase() : 'Ö'}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 text-sm truncate">{formData.full_name || 'Öğrenci'}</h2>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {profileMessage && (
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs">
              {profileMessage}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Ad Soyad</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Üniversite</label>
              <input
                type="text"
                required
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Bölüm</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Sınıf</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              >
                <option value="Hazırlık">Hazırlık Sınıfı</option>
                <option value="1. Sınıf">1. Sınıf</option>
                <option value="2. Sınıf">2. Sınıf</option>
                <option value="3. Sınıf">3. Sınıf</option>
                <option value="4. Sınıf">4. Sınıf</option>
                <option value="Yüksek Lisans">Yüksek Lisans / Doktora</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">İlgi Alanları</label>
              <input
                type="text"
                placeholder="Örn: Yapay Zekâ, Web, Algoritmalar"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Kısa Biyografi</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Akranlarınızın sizi tanıması için kısa bir tanıtım..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {savingProfile ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Course Preferences & Availability */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Teach / Learn Preferences */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                Ders Tercihlerim (Anlatıcı / Öğrenen)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hangi derslerde akranlarınıza destek verebilirsiniz? Hangi derslerde desteğe ihtiyacınız var?
              </p>
            </div>

            {/* List current preferences */}
            {preferences.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">Henüz bir ders tercihi eklemediniz.</p>
            ) : (
              <div className="space-y-2">
                {preferences.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{p.course?.code} — {p.course?.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            p.preference_type === 'teach'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {p.preference_type === 'teach' ? 'Destek Veriyorum' : 'Destek İstiyorum'}
                        </span>
                      </div>
                      {p.topics_list && (
                        <p className="text-[11px] text-slate-600 mt-1">
                          Konular: <strong>{p.topics_list}</strong>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePreference(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Preference Form */}
            <form onSubmit={handleAddPreference} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-slate-800 block">+ Yeni Ders Tercihi Ekle</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Ders</label>
                  <select
                    value={newPref.course_id}
                    onChange={(e) => setNewPref({ ...newPref, course_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Rol</label>
                  <select
                    value={newPref.preference_type}
                    onChange={(e) => setNewPref({ ...newPref, preference_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="teach">Ders Anlatmak İstiyorum</option>
                    <option value="learn">Destek Almak İstiyorum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Görüşme Tercihi</label>
                  <select
                    value={newPref.mode_preference}
                    onChange={(e) => setNewPref({ ...newPref, mode_preference: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="both">Online ve Yüz Yüze</option>
                    <option value="online">Yalnızca Çevrim İçi</option>
                    <option value="in_person">Yalnızca Yüz Yüze</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-600 mb-1">
                  Yetkin / İhtiyaç Duyulan Konular (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bağlı Listeler, Ağaçlar, Sıralama Algoritmaları"
                  value={newPref.topics_list}
                  onChange={(e) => setNewPref({ ...newPref, topics_list: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs shadow-xs transition-colors"
              >
                Tercihi Kaydet
              </button>
            </form>
          </div>

          {/* Section B: Weekly Availability Schedule */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Haftalık Müsaitlik Takvimim
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Eşleştirme motoru bu saat aralıklarını kullanarak sizi destek arayan akranlarınızla eşleştirir.
              </p>
            </div>

            {/* List Availabilities */}
            {availabilities.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">Henüz uygun gün ve saat eklemediniz.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availabilities.map((av) => (
                  <div
                    key={av.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <strong className="text-slate-800">{av.day_of_week}</strong> ({av.start_time} - {av.end_time})
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAvailability(av.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Availability Form */}
            <form onSubmit={handleAddAvailability} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-slate-800 block">+ Müsait Zaman Ekle</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Gün</label>
                  <select
                    value={newAvail.day_of_week}
                    onChange={(e) => setNewAvail({ ...newAvail, day_of_week: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Pazartesi">Pazartesi</option>
                    <option value="Salı">Salı</option>
                    <option value="Çarşamba">Çarşamba</option>
                    <option value="Perşembe">Perşembe</option>
                    <option value="Cuma">Cuma</option>
                    <option value="Cumartesi">Cumartesi</option>
                    <option value="Pazar">Pazar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={newAvail.start_time}
                    onChange={(e) => setNewAvail({ ...newAvail, start_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={newAvail.end_time}
                    onChange={(e) => setNewAvail({ ...newAvail, end_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs shadow-xs transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
