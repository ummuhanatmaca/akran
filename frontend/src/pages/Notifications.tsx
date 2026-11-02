import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { NotificationItem } from '../types';
import {
  Bell,
  CheckCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            İletişim & Güncellemeler
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Bildirimler</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Ders talepleri, oturum güncellemeleri ve sistem bilgilendirmeleri.
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-sky-600" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Bildirimler yükleniyor...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Henüz bir bildiriminiz bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                notif.is_read
                  ? 'bg-white border-slate-200'
                  : 'bg-sky-50/40 border-sky-200 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type.includes('accepted')
                      ? 'bg-emerald-50 text-emerald-700'
                      : notif.type.includes('rejected')
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{notif.message}</p>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    {new Date(notif.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              {notif.link && (
                <Link
                  to={notif.link}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md shrink-0 inline-flex items-center gap-1 transition-colors"
                >
                  Görüntüle
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
