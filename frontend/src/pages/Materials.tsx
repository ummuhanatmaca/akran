import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StudyMaterial, Course } from '../types';
import {
  FileText,
  Download,
  Search,
  PlusCircle,
  AlertTriangle,
  Loader2,
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const Materials: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [extension, setExtension] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Report Modal State
  const [reportingMaterial, setReportingMaterial] = useState<StudyMaterial | null>(null);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.append('course_id', selectedCourseId);
      if (search) params.append('search', search);
      if (extension) params.append('extension', extension);

      const [mRes, cRes] = await Promise.all([
        apiClient.get<StudyMaterial[]>(`/materials?${params.toString()}`),
        apiClient.get<Course[]>('/courses'),
      ]);
      setMaterials(mRes.data);
      setCourses(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedCourseId, extension]);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (material: StudyMaterial) => {
    setDownloadingId(material.id);
    try {
      const res = await apiClient.get(`/materials/${material.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: material.mime_type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.file_name || 'ders-notu.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMaterials(prev =>
        prev.map(m => m.id === material.id ? { ...m, download_count: m.download_count + 1 } : m)
      );
    } catch (err: any) {
      console.error(err);
      alert('Dosya indirilemedi: ' + (err.response?.data?.detail || 'Dosya sunucuda bulunamadı veya bağlantı koptu.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMaterial) return;

    setIsSubmittingReport(true);
    try {
      await apiClient.post(`/materials/${reportingMaterial.id}/report`, {
        reason: reportReason,
        details: reportDetails
      });
      alert('Bildiriminiz platform yöneticisine iletildi. İnceleme için teşekkür ederiz.');
      setReportingMaterial(null);
      setReportDetails('');
    } catch (err) {
      console.error(err);
      alert('Bildiri gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleOpenEditModal = (m: StudyMaterial) => {
    setEditingMaterial(m);
    setEditTitle(m.title);
    setEditDescription(m.description || '');
    setEditCourseId(m.course_id.toString());
    setEditTopicId(m.topic_id ? m.topic_id.toString() : '');
    setEditFile(null);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    if (!editTitle.trim()) {
      setEditError('Lütfen not başlığı giriniz.');
      return;
    }
    if (!editCourseId) {
      setEditError('Lütfen bir ders seçiniz.');
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('course_id', editCourseId);
      if (editTopicId) {
        formData.append('topic_id', editTopicId);
      } else {
        formData.append('topic_id', '0');
      }
      formData.append('description', editDescription.trim());
      if (editFile) {
        formData.append('file', editFile);
      }

      const res = await apiClient.put<StudyMaterial>(`/materials/${editingMaterial.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Güncellenen veriyi state'e yansıt
      setMaterials(prev => prev.map(m => (m.id === editingMaterial.id ? res.data : m)));
      setEditingMaterial(null);
      alert('Ders notunuz başarıyla güncellendi.');
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.detail || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMaterial = async (m: StudyMaterial) => {
    if (!window.confirm(`"${m.title}" başlıklı ders notunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await apiClient.delete(`/materials/${m.id}`);
      setMaterials(prev => prev.filter(item => item.id !== m.id));
      alert('Ders notu başarıyla silindi.');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Ders notu silinirken bir hata oluştu.');
    }
  };

  const selectedEditCourse = courses.find(c => c.id.toString() === editCourseId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
            Akademik Paylaşım Havuzu
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Ders Notları ve Kaynaklar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Öğrenciler tarafından paylaşılan ders özetleri, vize/final hazırlık notları ve çalışma dokümanları.
          </p>
        </div>

        <Link
          to="/materials/upload"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Ders Notu Paylaş
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Ders Filtresi</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
          >
            <option value="">Tüm Dersler</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Dosya Türü</label>
          <select
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
          >
            <option value="">Tüm Dosya Formatları</option>
            <option value="pdf">PDF Dokümanları (.pdf)</option>
            <option value="docx">Word Dokümanları (.docx)</option>
            <option value="png">Görsel / Şemalar (.png, .jpg)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Arama</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Not başlığı veya anahtar kelime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
            />
            <button
              onClick={fetchMaterials}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              Ara
            </button>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Materyaller taranıyor...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Seçilen kriterlerde materyal bulunamadı.</p>
          <p className="text-xs text-slate-500">İlk notu yükleyerek akranlarınıza katkıda bulunabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Ders Kodu, Ders Adı ve Dosya Formatı */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                      {m.course?.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1" title={m.course?.name}>
                      {m.course?.name}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {m.file_extension.replace('.', '')}
                  </span>
                </div>
                {m.topic?.name && (
                  <div className="mb-2">
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded inline-block">
                      Konu: {m.topic.name}
                    </span>
                  </div>
                )}

                <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">{m.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {m.description || 'Ekstra bir açıklama girilmedi.'}
                </p>

                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span>Yükleyen: <strong className="text-slate-600 font-medium">{m.uploader_name}</strong></span>
                    <span>{(m.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{new Date(m.created_at).toLocaleDateString('tr-TR')}</span>
                    <span className="text-sky-700 font-medium">{m.download_count} İndirme</span>
                  </div>
                </div>
                {m.scan_status === 'quarantined' ? (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Güvenlik / Telif İncelemesinde (Erişime Kapalı)</span>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Güvenlik Taramasından Geçti (Temiz)</span>
                  </div>
                )}
              </div>

              {/* Alt Butonlar */}
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {user && (user.id === m.uploader_id || user.role === 'admin') ? (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="text-xs text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 transition-colors bg-sky-50 px-2 py-1 rounded border border-sky-200 hover:bg-sky-100 cursor-pointer"
                        title="Ders notunu düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m)}
                        className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Ders notunu sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setReportingMaterial(m)}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Telif veya uygunsuz içerik bildir"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Bildir
                    </button>
                  )}
                </div>

                {m.scan_status === 'quarantined' ? (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-400 font-medium rounded-lg text-xs flex items-center gap-1.5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5" />
                    Erişime Kapalı
                  </span>
                ) : (
                  <button
                    onClick={() => handleDownload(m)}
                    disabled={downloadingId === m.id}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {downloadingId === m.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        İndiriliyor...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        İndir
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600" />
                Ders Notunu Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ders Seçimi *</label>
                <select
                  required
                  value={editCourseId}
                  onChange={(e) => {
                    setEditCourseId(e.target.value);
                    setEditTopicId('');
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEditCourse?.topics && selectedEditCourse.topics.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">İlgili Müfredat Konusu (İsteğe bağlı)</label>
                  <select
                    value={editTopicId}
                    onChange={(e) => setEditTopicId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                  >
                    <option value="">Genel / Konu Seçilmedi</option>
                    {selectedEditCourse.topics.map((t) => (
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
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Örn: Vize Çalışma Soruları ve Çözümleri"
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Not hakkında kısa açıklama, vize/final kapsamı veya çalışma ipuçları..."
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dosyayı Değiştir (İsteğe bağlı)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Mevcut dosya: <span className="font-semibold text-slate-700">{editingMaterial.file_name}</span> ({(editingMaterial.file_size / (1024 * 1024)).toFixed(2)} MB). Yeni dosya seçmezseniz mevcut dosyanız korunur.
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      if (f.size > 15 * 1024 * 1024) {
                        setEditError('Yeni dosya boyutu 15MB sınırını aşamaz.');
                        return;
                      }
                      setEditError(null);
                      setEditFile(f);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Değişiklikleri Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingMaterial && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                İçerik Raporla
              </h3>
              <button
                onClick={() => setReportingMaterial(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"{reportingMaterial.title}"</strong> adlı materyalle ilgili bildirim nedeninizi belirtiniz.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bildirim Nedeni</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                >
                  <option value="copyright">Telif Hakkı İhlali (İzinsiz Kitap/Soru Taraması)</option>
                  <option value="inappropriate">Uygunsuz / Yanıltıcı İçerik</option>
                  <option value="cheating">Akademik Kopya / Sınav Sorusu</option>
                  <option value="corrupted">Bozuk veya Okunamayan Dosya</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Açıklama (İsteğe bağlı)</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Yönetici değerlendirmesi için detay ekleyebilirsiniz..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingMaterial(null)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {isSubmittingReport ? 'İletiliyor...' : 'Bildiriyi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
