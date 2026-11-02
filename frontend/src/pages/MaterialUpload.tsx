import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Course } from '../types';
import { ArrowLeft, AlertCircle, FileText, UploadCloud, ShieldCheck, Loader2 } from 'lucide-react';

export const MaterialUpload: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Course[]>('/courses').then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) {
        setCourseId(res.data[0].id.toString());
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 15 * 1024 * 1024) {
        setError('Dosya boyutu 15MB sınırını aşamaz.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Lütfen yüklenecek bir dosya seçin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('course_id', courseId);
      if (topicId) formData.append('topic_id', topicId);
      if (description) formData.append('description', description);
      formData.append('file', file);

      await apiClient.post('/materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Ders notu başarıyla yüklendi! Katkınız için teşekkür ederiz.');
      navigate('/materials');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id.toString() === courseId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link to="/materials" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Materyal Listesine Dön
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Akademik Paylaşım
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ders Notu veya Kaynak Yükle</h1>
          <p className="text-xs text-slate-500 mt-1">
            Desteklenen dosya formatları: PDF, DOCX, PNG, JPG (Maksimum 15 MB)
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ders *</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setTopicId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse?.topics && selectedCourse.topics.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">İlgili Konu (İsteğe bağlı)</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
              >
                <option value="">Genel / Tüm Konular</option>
                {selectedCourse.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Not Başlığı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Veri Yapıları Vize Özeti ve Çıkmış Soru Çözümleri"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Açıklama</label>
            <textarea
              rows={3}
              placeholder="Notun içeriği, hangi haftaları kapsadığı veya önemli formüller hakkında kısa bilgi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
            />
          </div>

          {/* File input box */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dosya Seçin *</label>
            <div className="border border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-sky-600 hover:underline">
                  Dosya seçmek için tıklayın
                </span>
                <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, PNG veya JPG (Maks. 15MB)</p>
              </label>

              {file && (
                <div className="mt-3 p-2 bg-sky-50 border border-sky-200 rounded-lg inline-flex items-center gap-2 text-xs font-medium text-sky-900">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>{file.name}</span>
                  <span className="text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-lg text-[11px] text-emerald-800 leading-relaxed border border-emerald-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-950 font-bold block mb-0.5">Otomatik Güvenlik & Doğrulama Protokolü:</strong>
              Yüklenen dosyalar anında virüs, gizli makro, kod enjeksiyonu ve ikili imza (Magic Bytes) denetiminden geçirilir. SHA-256 bütünlük özeti hesaplanarak güvenle arşivlenir.
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Güvenlik Taraması & Yükleme Yapılıyor...</span>
              </>
            ) : (
              'Ders Notunu Güvenle Paylaş'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
