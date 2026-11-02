import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course } from '../types';
import { Compass, ArrowLeft, AlertCircle } from 'lucide-react';

export const SupportCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const helperIdParam = searchParams.get('helper_id');
  const courseIdParam = searchParams.get('course_id');
  const topicParam = searchParams.get('topic');

  const [courses, setCourses] = useState<Course[]>([]);
  const [helperUser, setHelperUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    course_id: courseIdParam || '',
    topic_name: topicParam || '',
    description: '',
    preferred_schedule: '',
    mode: 'online',
    helper_id: helperIdParam ? parseInt(helperIdParam) : null,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiClient.get<Course[]>('/courses').then((res) => {
      setCourses(res.data);
      if (!formData.course_id && res.data.length > 0) {
        setFormData((prev) => ({ ...prev, course_id: res.data[0].id.toString() }));
      }
    });

    if (helperIdParam) {
      apiClient.get(`/users/${helperIdParam}`).then((res) => {
        setHelperUser(res.data);
      });
    }
  }, [helperIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.post('/support/requests', {
        course_id: parseInt(formData.course_id),
        topic_name: formData.topic_name,
        description: formData.description,
        preferred_schedule: formData.preferred_schedule,
        mode: formData.mode,
        helper_id: formData.helper_id,
      });
      navigate('/support-requests');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Talep oluşturulurken bir hata oluştu.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id.toString() === formData.course_id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Eğitmen Listesine Dön
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Akademik Destek Talebi
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ders Desteği Talebi Oluştur</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zorlandığınız konuyu ve uygun zaman aralığınızı belirtin.
          </p>
        </div>

        {/* If directed to a specific tutor */}
        {helperUser && (
          <div className="mb-6 p-4 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                {helperUser.full_name ? helperUser.full_name[0].toUpperCase() : 'Ö'}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-sky-900">Doğrudan Talep Gönderilecek Eğitmen:</p>
                <p className="text-sm font-bold text-slate-900">{helperUser.full_name}</p>
                <p className="text-[11px] text-slate-500">{helperUser.university} — {helperUser.department}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setHelperUser(null);
                setFormData({ ...formData, helper_id: null });
              }}
              className="text-xs text-sky-700 hover:underline font-medium"
            >
              Genel Talep Yap
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ders Seçimi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Destek Alınacak Ders *
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Konu Adı */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Zorlandığınız Konu *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: İkili Arama Ağaçları (BST) Silme İşlemi, SQL JOIN sorguları..."
              value={formData.topic_name}
              onChange={(e) => setFormData({ ...formData, topic_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            />
          </div>

          {/* Konu Önerileri */}
          {selectedCourse?.topics && selectedCourse.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-400 font-medium">Önerilen Konular:</span>
              {selectedCourse.topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, topic_name: t.name })}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* Görüşme Biçimi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Görüşme Tercihi
            </label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            >
              <option value="online">Çevrim İçi (Online Görüşme)</option>
              <option value="in_person">Yüz Yüze (Kampüs / Kütüphane)</option>
            </select>
          </div>

          {/* Uygun Zaman Aralığı */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Müsait Olduğunuz Gün ve Saat Aralığı
            </label>
            <input
              type="text"
              placeholder="Örn: Cumartesi 14:00 - 17:00 arası veya Hafta içi akşamları"
              value={formData.preferred_schedule}
              onChange={(e) => setFormData({ ...formData, preferred_schedule: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sorununuz veya İhtiyacınız Hakkında Detaylar
            </label>
            <textarea
              rows={3}
              placeholder="Konuda hangi kısımda takıldınız, belirli bir ödev veya soru tipi mi var?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Gönderiliyor...' : 'Destek Talebini Yayınla'}
          </button>
        </form>
      </div>
    </div>
  );
};
