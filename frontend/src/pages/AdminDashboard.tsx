import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { AdminStats, User, Opportunity } from '../types';
import {
  ShieldAlert,
  Users,
  Compass,
  FileText,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
  Award,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  X
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'stats' | 'users' | 'opportunities' | 'reports' | 'sync_logs' | 'security'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [securityMaterials, setSecurityMaterials] = useState<any[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isRescanningId, setIsRescanningId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // New Opportunity Form State
  const [newOpp, setNewOpp] = useState({
    title: '',
    organization: '',
    summary: '',
    category: 'TÜBİTAK',
    fields: '',
    target_audience: '',
    application_type: 'both',
    requirements: '',
    prize_support: '',
    official_url: '',
    application_url: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sRes, uRes, oRes, rRes, lRes, mRes] = await Promise.all([
        apiClient.get<AdminStats>('/admin/stats'),
        apiClient.get<User[]>('/admin/users'),
        apiClient.get<Opportunity[]>('/opportunities'),
        apiClient.get<any[]>('/admin/reports'),
        apiClient.get<any[]>('/admin/opportunities/sync-logs').catch(() => ({ data: [] })),
        apiClient.get<any[]>('/admin/materials/security-audit').catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setOpportunities(oRes.data);
      setReports(rRes.data);
      setSyncLogs(lRes.data);
      setSecurityMaterials(mRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiClient.post('/admin/opportunities/sync');
      setSyncResult(res.data);
      await fetchData();
    } catch (err: any) {
      alert('Senkronizasyon işlemi başarısız oldu: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleUserStatus = async (userObj: User) => {
    try {
      await apiClient.put(`/admin/users/${userObj.id}`, {
        is_active: !userObj.is_active,
      });
      await fetchData();
    } catch (err) {
      alert('Kullanıcı durumu güncellenemedi.');
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/opportunities', newOpp);
      alert('Bilimsel fırsat başarıyla eklendi.');
      setNewOpp({
        title: '',
        organization: '',
        summary: '',
        category: 'TÜBİTAK',
        fields: '',
        target_audience: '',
        application_type: 'both',
        requirements: '',
        prize_support: '',
        official_url: '',
        application_url: '',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Fırsat eklenemedi.');
    }
  };

  const handleDeleteOpportunity = async (oppId: number) => {
    if (!window.confirm('Bu fırsatı silmek istediğinize emin misiniz?')) return;
    try {
      await apiClient.delete(`/admin/opportunities/${oppId}`);
      await fetchData();
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  const handleResolveReport = async (reportId: number, action: 'dismiss' | 'remove_material') => {
    try {
      await apiClient.put(`/admin/reports/${reportId}?action=${action}`);
      await fetchData();
    } catch (err) {
      alert('İşlem başarısız.');
    }
  };

  const handleRescanMaterial = async (matId: number) => {
    setIsRescanningId(matId);
    try {
      const res = await apiClient.post(`/admin/materials/${matId}/rescan`);
      alert(`Tarama sonucu: ${res.data.status === 'clean' ? 'Temiz & Güvenli' : 'Karantinada'}\n${res.data.note}`);
      await fetchData();
    } catch (err: any) {
      alert('Yeniden tarama başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsRescanningId(null);
    }
  };

  const handleToggleQuarantine = async (matId: number, currentStatus: string) => {
    const willQuarantine = currentStatus !== 'quarantined';
    const actionText = willQuarantine ? 'karantinaya almak' : 'karantinadan çıkarmak';
    if (!window.confirm(`Bu materyali ${actionText} istediğinize emin misiniz?`)) return;
    try {
      await apiClient.put(`/admin/materials/${matId}/quarantine?quarantine=${willQuarantine}`);
      await fetchData();
    } catch (err: any) {
      alert('İşlem başarısız: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteSecurityMaterial = async (matId: number) => {
    if (!window.confirm('Bu dosyayı ve sistem kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await apiClient.delete(`/materials/${matId}`);
      await fetchData();
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Yeni parola en az 8 karakter olmalıdır.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Yeni parolalar birbiriyle eşleşmiyor.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Yönetici parolanız başarıyla güncellendi!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Parola değiştirilemedi. Lütfen mevcut parolanızı kontrol edin.';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Yönetici paneli yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Yönetim & Moderasyon
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Yönetici Paneli</h1>
          <p className="text-xs text-slate-500 mt-1">
            Canlı veritabanı metrikleri, fırsat senkronizasyonu, kullanıcı hesap kısıtlamaları ve moderasyon.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-white" />
            <span>Yönetici Parolasını Değiştir</span>
          </button>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Doğrulanıyor...' : 'Resmî Kaynakları Denetle'}</span>
          </button>
        </div>
      </div>

      {/* Sync result alert if any */}
      {syncResult && (
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Kaynak Doğrulama Başarılı</span>
          </div>
          <p className="text-slate-300">
            {syncResult.items_checked} fırsat denetlendi, {syncResult.items_updated} kayıt güvenle güncellendi.
          </p>
          {syncResult.errors && syncResult.errors.length > 0 && (
            <p className="text-amber-300 font-mono text-[11px] pt-1">
              Uyarılar: {syncResult.errors.join('; ')}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setTab('stats')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            tab === 'stats' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Sistem İstatistikleri
        </button>
        <button
          onClick={() => setTab('opportunities')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            tab === 'opportunities' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Fırsat Yönetimi ({opportunities.length})
        </button>
        <button
          onClick={() => setTab('sync_logs')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            tab === 'sync_logs' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Doğrulama Günlükleri ({syncLogs.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            tab === 'users' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kullanıcılar ({users.length})
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            tab === 'reports' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Telif & Şikayetler ({reports.length})
        </button>
        <button
          onClick={() => setTab('security')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === 'security' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          <span>Dosya Güvenlik Denetimi ({securityMaterials.length})</span>
        </button>
      </div>

      {/* TAB 1: STATS */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Toplam Kullanıcı</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total_users}</span>
            <span className="text-xs text-emerald-600 block mt-1 font-medium">{stats.active_users} Aktif Hesap</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Ders Talepleri</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total_support_requests}</span>
            <span className="text-xs text-sky-600 block mt-1 font-medium">{stats.completed_sessions} Tamamlanan Oturum</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Ders Notları</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total_materials}</span>
            <span className="text-xs text-slate-500 block mt-1">Onaylı Doküman</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Bilimsel Fırsatlar</span>
            <span className="text-2xl font-bold text-slate-900">{stats.active_opportunities}</span>
            <span className="text-xs text-amber-600 block mt-1 font-medium">Doğrulanmış İlan</span>
          </div>
        </div>
      )}

      {/* TAB 2: OPPORTUNITIES MANAGEMENT */}
      {tab === 'opportunities' && (
        <div className="space-y-6">
          {/* Add Opportunity Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Yeni Bilimsel Fırsat / Yarışma Ekle</span>
            </h3>

            <form onSubmit={handleCreateOpportunity} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Program Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri..."
                    value={newOpp.title}
                    onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Kurum *</label>
                  <input
                    type="text"
                    required
                    placeholder="TÜBİTAK BİDEB / T3 Vakfı"
                    value={newOpp.organization}
                    onChange={(e) => setNewOpp({ ...newOpp, organization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kısa ve Açıklayıcı Özet</label>
                <textarea
                  rows={2}
                  placeholder="Programın amacı ve öğrencilere sağladığı araştırma katkısı..."
                  value={newOpp.summary}
                  onChange={(e) => setNewOpp({ ...newOpp, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Kategori *</label>
                  <select
                    value={newOpp.category}
                    onChange={(e) => setNewOpp({ ...newOpp, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="TÜBİTAK">TÜBİTAK</option>
                    <option value="TEKNOFEST">TEKNOFEST</option>
                    <option value="Yarışma">Yarışma</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Burs">Burs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Destek / Ödül</label>
                  <input
                    type="text"
                    placeholder="Hibe Desteği / Ödül"
                    value={newOpp.prize_support}
                    onChange={(e) => setNewOpp({ ...newOpp, prize_support: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Resmî Duyuru URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://tubitak.gov.tr/..."
                    value={newOpp.official_url}
                    onChange={(e) => setNewOpp({ ...newOpp, official_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Doğrudan Başvuru URL</label>
                  <input
                    type="url"
                    placeholder="https://tybs.tubitak.gov.tr"
                    value={newOpp.application_url}
                    onChange={(e) => setNewOpp({ ...newOpp, application_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Fırsatı Kaydet
              </button>
            </form>
          </div>

          {/* List of Opportunities */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm">Kayıtlı Fırsatlar ({opportunities.length})</h3>
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-4 text-xs hover:border-slate-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {opp.category}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">{opp.organization}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{opp.status}</span>
                    </div>
                    <span className="font-bold text-slate-900 block truncate">{opp.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={opp.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
                      title="Resmî Bağlantıyı Aç"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYNC LOGS */}
      {tab === 'sync_logs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Resmî Kaynak Doğrulama ve Güncelleme Günlükleri</h3>
            <span className="text-xs text-slate-400">Son 20 Denetim</span>
          </div>

          {syncLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Henüz doğrulama günlüğü kaydı bulunmamaktadır.</p>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'warning'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                      <span className="font-medium text-slate-800">{log.source_name}</span>
                    </div>
                    <p className="text-slate-600">{log.message}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    {new Date(log.checked_at).toLocaleString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Kayıtlı Kullanıcı Hesapları</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Öğrenci / E-posta</th>
                  <th className="px-4 py-3">Üniversite & Bölüm</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">{u.profile?.full_name || 'İsimsiz'}</span>
                      <span className="text-slate-500 text-[11px]">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.profile ? `${u.profile.university} - ${u.profile.department}` : 'Profil eksik'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {u.role === 'admin' ? 'Yönetici' : 'Öğrenci'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.is_active ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            u.is_active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.is_active ? 'Kısıtla' : 'Aktifleştir'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {tab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Telif Bildirimleri ve İçerik Şikayetleri</span>
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">İncelenmeyi bekleyen şikayet bulunmamaktadır.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.material_title}</span>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {r.reason}
                    </span>
                  </div>
                  <p className="text-slate-600">{r.details || 'Açıklama girilmedi.'}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-400">Bildiren: {r.reporter_name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReport(r.id, 'dismiss')}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'remove_material')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
                      >
                        Materyali Kaldır
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: FILE SECURITY AUDIT */}
      {tab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Çok Katmanlı Dosya & Zararlı Yazılım Güvenlik Protokolü</span>
              </div>
              <h2 className="text-base font-bold text-white">Yüklenen Akademik Dosya Denetimleri</h2>
              <p className="text-xs text-slate-400">
                Magic Bytes ikili başlık doğrulama, PE/MZ yürütülebilir kod tespiti, aktif PDF JavaScript engelleme ve SHA-256 kriptografik parmak izleri.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-3 py-2 rounded-lg text-center border border-slate-700">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Toplam Dosya</span>
                <span className="text-sm font-bold text-white">{securityMaterials.length}</span>
              </div>
              <div className="bg-emerald-950/60 px-3 py-2 rounded-lg text-center border border-emerald-800/60">
                <span className="block text-[10px] text-emerald-400 uppercase font-semibold">Güvenli / Temiz</span>
                <span className="text-sm font-bold text-emerald-400">
                  {securityMaterials.filter((m) => m.scan_status === 'clean').length}
                </span>
              </div>
              <div className="bg-rose-950/60 px-3 py-2 rounded-lg text-center border border-rose-800/60">
                <span className="block text-[10px] text-rose-400 uppercase font-semibold">Karantinada</span>
                <span className="text-sm font-bold text-rose-400">
                  {securityMaterials.filter((m) => m.scan_status === 'quarantined').length}
                </span>
              </div>
            </div>
          </div>

          {securityMaterials.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Sistemde Henüz Yüklenmiş Dosya Yok</p>
              <p className="text-xs text-slate-500">
                Öğrenciler ders notu veya kaynak yüklediğinde tüm güvenlik tarama verileri bu panelde gerçek zamanlı listelenecektir.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-4">Dosya & Not Başlığı</th>
                      <th className="py-3 px-4">Ders / Yükleyen</th>
                      <th className="py-3 px-4">Boyut & Format</th>
                      <th className="py-3 px-4">SHA-256 Parmak İzi</th>
                      <th className="py-3 px-4">Tarama Durumu</th>
                      <th className="py-3 px-4 text-right">Güvenlik İşlemleri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {securityMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{mat.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]" title={mat.file_name}>
                            {mat.file_name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700 mr-1.5">
                            {mat.course_code || 'GENEL'}
                          </span>
                          <span className="text-slate-600 text-[11px]">{mat.uploader_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-slate-700 uppercase">
                            {mat.file_extension}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            ({(mat.file_size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {mat.sha256_hash ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {mat.sha256_hash.slice(0, 12)}...{mat.sha256_hash.slice(-6)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(mat.sha256_hash)}
                                title="SHA-256 Kopyala"
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                              >
                                {copiedHash === mat.sha256_hash ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Hesaplanmadı</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {mat.scan_status === 'quarantined' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                <Lock className="w-3 h-3" />
                                Karantinada
                              </span>
                              {mat.security_note && (
                                <p className="text-[10px] text-rose-600 max-w-[220px] truncate" title={mat.security_note}>
                                  {mat.security_note}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Temiz & Güvenli
                              </span>
                              {mat.security_note && (
                                <p className="text-[10px] text-slate-400 max-w-[220px] truncate" title={mat.security_note}>
                                  {mat.security_note}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRescanMaterial(mat.id)}
                              disabled={isRescanningId === mat.id}
                              className="p-1 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                              title="Dosyayı Tekrar Tara"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isRescanningId === mat.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleToggleQuarantine(mat.id, mat.scan_status)}
                              className={`p-1 rounded border transition-colors ${
                                mat.scan_status === 'quarantined'
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                              }`}
                              title={mat.scan_status === 'quarantined' ? 'Karantinayı Kaldır' : 'Karantinaya Al'}
                            >
                              {mat.scan_status === 'quarantined' ? (
                                <Unlock className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSecurityMaterial(mat.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                              title="Kalıcı Olarak Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Yönetici Parolasını Değiştir</h3>
                  <p className="text-[11px] text-slate-500">Hesabınıza sadece sizin erişebilmeniz için güçlü bir parola belirleyin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setPasswordMsg(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mevcut Parola
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Güvenli Parola <span className="text-[10px] text-slate-400 font-normal">(En az 8 karakter)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Parola (Tekrar)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPasswordMsg(null); }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Güncelleniyor...</span>
                    </>
                  ) : (
                    <span>Parolayı Güncelle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
