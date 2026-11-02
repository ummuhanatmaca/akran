import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  PomodoroMode,
  PomodoroSession,
  PomodoroStats,
  PomodoroSettings,
} from '../types';
import {
  DEFAULT_POMODORO_SETTINGS,
  loadPomodoroSettings,
  savePomodoroSettings,
  generateClientId,
  getGuestSessions,
  saveGuestSession,
  removeGuestSession,
  clearGuestSessions,
  calculateGuestStats,
  loadActiveState,
  saveActiveState,
  clearActiveState,
  playCompletionSound,
  ActivePomodoroState,
} from '../utils/pomodoro';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  Clock,
  Target,
  Flame,
  CheckCircle2,
  Volume2,
  VolumeX,
  Trash2,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const Pomodoro: React.FC = () => {
  const { user } = useAuth();

  // Settings
  const [settings, setSettings] = useState<PomodoroSettings>(loadPomodoroSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Zen / Distraction-free mode
  const [isZenMode, setIsZenMode] = useState(false);

  // Timer State
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return loadPomodoroSettings().focusMinutes * 60;
  });
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(() => {
    return loadPomodoroSettings().focusMinutes * 60;
  });
  const [completedCycleCount, setCompletedCycleCount] = useState<number>(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [tag, setTag] = useState<string>('');
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  // Completion notification modal / toast
  const [completedBanner, setCompletedBanner] = useState<{
    message: string;
    nextMode: PomodoroMode;
  } | null>(null);

  // Statistics & History
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Sync ref to avoid duplicate sync calls
  const syncAttemptedRef = useRef(false);

  // 1. Initial State Restoration from localStorage
  useEffect(() => {
    const saved = loadActiveState();
    if (saved) {
      setMode(saved.mode);
      setCompletedCycleCount(saved.completedCycleCount || 0);
      setTag(saved.tag || '');
      setTotalDurationSeconds(saved.totalDurationSeconds);
      setSessionStartedAt(saved.sessionStartedAt);
      setCurrentClientId(saved.clientId);

      if (saved.status === 'running' && saved.targetEndTime) {
        const now = Date.now();
        const diff = Math.round((saved.targetEndTime - now) / 1000);
        if (diff > 0) {
          setStatus('running');
          setTargetEndTime(saved.targetEndTime);
          setRemainingSeconds(diff);
        } else {
          // Completed while tab was closed/asleep
          setStatus('idle');
          setTargetEndTime(null);
          setRemainingSeconds(0);
          handleSessionCompletion(saved.mode, saved.sessionStartedAt, saved.totalDurationSeconds, saved.tag, saved.clientId);
        }
      } else if (saved.status === 'paused') {
        setStatus('paused');
        setTargetEndTime(null);
        setRemainingSeconds(saved.remainingSeconds);
      } else {
        setStatus('idle');
        setTargetEndTime(null);
        setRemainingSeconds(saved.remainingSeconds || saved.totalDurationSeconds);
      }
    }
  }, []);

  // 2. Fetch Sessions and Stats
  const refreshHistoryAndStats = async () => {
    setIsLoadingData(true);
    if (user) {
      try {
        // Sync guest sessions if any exist
        if (!syncAttemptedRef.current) {
          syncAttemptedRef.current = true;
          const guestSessions = getGuestSessions();
          if (guestSessions.length > 0) {
            try {
              await apiClient.post('/pomodoro/sync', { sessions: guestSessions });
              clearGuestSessions();
            } catch (err) {
              console.warn('Misafir oturumları senkronize edilirken hata:', err);
            }
          }
        }

        const [statsRes, sessionsRes] = await Promise.all([
          apiClient.get<PomodoroStats>(`/pomodoro/stats?daily_goal=${settings.dailyGoal}`),
          apiClient.get<PomodoroSession[]>('/pomodoro/sessions?limit=30'),
        ]);
        setStats(statsRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        console.error('Pomodoro verileri getirilemedi:', err);
      } finally {
        setIsLoadingData(false);
      }
    } else {
      // Guest mode
      const guest = getGuestSessions();
      setSessions(guest);
      setStats(calculateGuestStats(guest, settings.dailyGoal));
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    refreshHistoryAndStats();
  }, [user, settings.dailyGoal]);

  // 3. Document Title Countdown Sync
  useEffect(() => {
    const originalTitle = document.title;
    if (status === 'running' || status === 'paused') {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const modeLabel =
        mode === 'focus' ? 'Odaklanma' : mode === 'short_break' ? 'Kısa Mola' : 'Uzun Mola';
      document.title = `(${formatted}) ${modeLabel} - AKRAN`;
    } else {
      document.title = 'Odaklanma Alanı (Pomodoro) - AKRAN';
    }

    return () => {
      document.title = originalTitle;
    };
  }, [remainingSeconds, status, mode]);

  // 4. Timer Tick Effect (Reliable timestamp-based delta)
  useEffect(() => {
    if (status !== 'running' || !targetEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetEndTime - now;
      const diffSec = Math.max(0, Math.round(diffMs / 1000));

      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        clearInterval(interval);
        handleTimerExpired();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [status, targetEndTime]);

  // 5. Visibility Change (sync when tab regains focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running' && targetEndTime) {
        const now = Date.now();
        const diffSec = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setRemainingSeconds(diffSec);
        if (diffSec <= 0) {
          handleTimerExpired();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, targetEndTime]);

  // 6. Save Active State to LocalStorage on updates
  useEffect(() => {
    if (status === 'idle') {
      clearActiveState();
    } else {
      const stateToSave: ActivePomodoroState = {
        mode,
        status,
        targetEndTime,
        remainingSeconds,
        totalDurationSeconds,
        completedCycleCount,
        sessionStartedAt,
        tag,
        clientId: currentClientId,
      };
      saveActiveState(stateToSave);
    }
  }, [
    mode,
    status,
    targetEndTime,
    remainingSeconds,
    totalDurationSeconds,
    completedCycleCount,
    sessionStartedAt,
    tag,
    currentClientId,
  ]);

  // Handle Session Expiration
  const handleTimerExpired = () => {
    setStatus('idle');
    setTargetEndTime(null);
    setRemainingSeconds(0);

    handleSessionCompletion(
      mode,
      sessionStartedAt,
      totalDurationSeconds,
      tag,
      currentClientId
    );
  };

  // Completion logic & record creation
  const handleSessionCompletion = async (
    completedMode: PomodoroMode,
    startedAtIso: string | null,
    durationSec: number,
    sessionTag: string,
    cId: string | null
  ) => {
    const endedAtIso = new Date().toISOString();
    const effectiveStartedAt = startedAtIso || new Date(Date.now() - durationSec * 1000).toISOString();
    const clientId = cId || generateClientId();

    const newSession: PomodoroSession = {
      session_type: completedMode,
      planned_duration: durationSec,
      actual_duration: durationSec,
      started_at: effectiveStartedAt,
      ended_at: endedAtIso,
      completed: true,
      tag: sessionTag.trim() || undefined,
      client_id: clientId,
    };

    // Play chime if enabled
    if (settings.soundEnabled) {
      playCompletionSound();
    }

    // Determine next cycle count and next mode
    let nextCount = completedCycleCount;
    let nextMode: PomodoroMode = 'focus';

    if (completedMode === 'focus') {
      nextCount = completedCycleCount + 1;
      setCompletedCycleCount(nextCount);
      if (nextCount % settings.longBreakInterval === 0) {
        nextMode = 'long_break';
      } else {
        nextMode = 'short_break';
      }
    } else {
      // Break completed
      if (completedMode === 'long_break') {
        setCompletedCycleCount(0);
        nextCount = 0;
      }
      nextMode = 'focus';
    }

    // Save session (remote or local)
    if (user) {
      try {
        await apiClient.post('/pomodoro/sessions', newSession);
      } catch (err) {
        console.error('Oturum sunucuya kaydedilemedi, yerel belleğe alınıyor:', err);
        saveGuestSession(newSession);
      }
    } else {
      saveGuestSession(newSession);
    }

    // Refresh stats & list
    await refreshHistoryAndStats();

    // Auto-advance or wait for user confirmation
    const shouldAutoAdvance =
      (completedMode === 'focus' && settings.autoStartBreaks) ||
      (completedMode !== 'focus' && settings.autoStartFocus);

    const message =
      completedMode === 'focus'
        ? nextMode === 'long_break'
          ? `Tebrikler! ${settings.longBreakInterval} odaklanma oturumunu tamamladın. Şimdi hak ettiğin uzun bir mola zamanı.`
          : 'Harika bir odaklanma oturumu tamamlandı. Zihnini dinlendirmek için kısa bir mola ver.'
        : 'Mola süresi bitti. Enerjini toplayıp yeni bir odaklanma oturumuna başlamaya hazır mısın?';

    setCompletedBanner({
      message,
      nextMode,
    });

    if (shouldAutoAdvance) {
      switchMode(nextMode, true);
    } else {
      switchMode(nextMode, false);
    }
  };

  // Switch timer mode
  const switchMode = (newMode: PomodoroMode, autoStart: boolean = false) => {
    let minutes = settings.focusMinutes;
    if (newMode === 'short_break') minutes = settings.shortBreakMinutes;
    if (newMode === 'long_break') minutes = settings.longBreakMinutes;

    const durSec = minutes * 60;
    setMode(newMode);
    setTotalDurationSeconds(durSec);
    setRemainingSeconds(durSec);

    if (autoStart) {
      const now = Date.now();
      const endTime = now + durSec * 1000;
      setStatus('running');
      setTargetEndTime(endTime);
      setSessionStartedAt(new Date(now).toISOString());
      setCurrentClientId(generateClientId());
    } else {
      setStatus('idle');
      setTargetEndTime(null);
      setSessionStartedAt(null);
      setCurrentClientId(null);
    }
  };

  // Controls
  const handleStart = () => {
    const now = Date.now();
    const endTime = now + remainingSeconds * 1000;
    setStatus('running');
    setTargetEndTime(endTime);
    if (!sessionStartedAt) {
      setSessionStartedAt(new Date(now).toISOString());
      setCurrentClientId(generateClientId());
    }
  };

  const handlePause = () => {
    if (status !== 'running' || !targetEndTime) return;
    const now = Date.now();
    const diffSec = Math.max(0, Math.round((targetEndTime - now) / 1000));
    setStatus('paused');
    setTargetEndTime(null);
    setRemainingSeconds(diffSec);
  };

  const handleResume = () => {
    const now = Date.now();
    const endTime = now + remainingSeconds * 1000;
    setStatus('running');
    setTargetEndTime(endTime);
  };

  const handleReset = () => {
    setStatus('idle');
    setTargetEndTime(null);
    setSessionStartedAt(null);
    setCurrentClientId(null);

    let minutes = settings.focusMinutes;
    if (mode === 'short_break') minutes = settings.shortBreakMinutes;
    if (mode === 'long_break') minutes = settings.longBreakMinutes;
    const durSec = minutes * 60;
    setTotalDurationSeconds(durSec);
    setRemainingSeconds(durSec);
    clearActiveState();
  };

  const handleSkip = () => {
    let nextMode: PomodoroMode = 'focus';
    if (mode === 'focus') {
      const nextCount = completedCycleCount + 1;
      nextMode = nextCount % settings.longBreakInterval === 0 ? 'long_break' : 'short_break';
    } else {
      nextMode = 'focus';
    }
    switchMode(nextMode, false);
  };

  const handleDeleteSession = async (session: PomodoroSession) => {
    if (session.id && user) {
      try {
        await apiClient.delete(`/pomodoro/sessions/${session.id}`);
        await refreshHistoryAndStats();
      } catch (err) {
        console.error('Oturum silinemedi:', err);
      }
    } else if (session.client_id) {
      removeGuestSession(session.client_id);
      await refreshHistoryAndStats();
    }
  };

  // Fullscreen / Zen Toggle
  const toggleZenMode = () => {
    const nextVal = !isZenMode;
    setIsZenMode(nextVal);

    if (nextVal) {
      // Attempt browser fullscreen if available
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Format Time
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (totalDurationSeconds <= 0) return 0;
    const elapsed = totalDurationSeconds - remainingSeconds;
    return Math.min(100, Math.max(0, (elapsed / totalDurationSeconds) * 100));
  }, [totalDurationSeconds, remainingSeconds]);

  // Mode Display Info
  const modeInfo = {
    focus: {
      title: 'Odaklanma Oturumu',
      subtitle: 'Dikkatini dağıtan şeyleri uzaklaştır ve tek bir hedefe odaklan.',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      progressColor: 'stroke-sky-500',
    },
    short_break: {
      title: 'Kısa Mola',
      subtitle: 'Derin bir nefes al, su iç ve gözlerini ekrandan dinlendir.',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      progressColor: 'stroke-emerald-500',
    },
    long_break: {
      title: 'Uzun Mola',
      subtitle: 'Güzel bir çalışma döngüsünü tamamladın. Biraz yürüyüş yap veya atıştır.',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      progressColor: 'stroke-indigo-500',
    },
  }[mode];

  // Circle radius math for SVG progress ring
  const circleRadius = 154;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  // -------------------------------------------------------------
  // ZEN / DISTRACTION-FREE VIEW
  // -------------------------------------------------------------
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 animate-in fade-in select-none">
        {/* Zen Header */}
        <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${modeInfo.badgeColor}`}
            >
              {modeInfo.title}
            </span>
            {tag && (
              <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {tag}
              </span>
            )}
          </div>

          <button
            onClick={toggleZenMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Odaklanma Modundan Çık</span>
          </button>
        </div>

        {/* Central Timer */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="text-8xl sm:text-9xl md:text-[13rem] font-bold font-mono tracking-tighter text-white tabular-nums">
            {formattedMinutes}:{formattedSeconds}
          </div>

          <p className="text-sm text-slate-400 mt-4 max-w-md text-center">
            {modeInfo.subtitle}
          </p>

          {/* Minimal Controls */}
          <div className="flex items-center gap-4 mt-8">
            {status === 'idle' && (
              <button
                onClick={handleStart}
                className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-base transition-colors shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Başlat
              </button>
            )}

            {status === 'running' && (
              <button
                onClick={handlePause}
                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-base transition-colors border border-slate-700 inline-flex items-center gap-2"
              >
                <Pause className="w-5 h-5 fill-current" />
                Duraklat
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={handleResume}
                className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-base transition-colors shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Devam Et
              </button>
            )}

            <button
              onClick={handleReset}
              title="Oturumu Sıfırla"
              className="p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleSkip}
              title="Sonraki Aşamaya Geç"
              className="p-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zen Footer Cycle Progress */}
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
          {Array.from({ length: settings.longBreakInterval }).map((_, i) => {
            const isFilled = i < (completedCycleCount % settings.longBreakInterval);
            return (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isFilled ? 'bg-sky-400' : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-sky-400 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Bağımsız Odaklanma Aracı</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Odaklanma Alanı
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Küçük adımlarla ilerle, dikkatini tek bir işe ver ve molalarını ihmal etme. Çalışma
              ritmini kendine göre belirle.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={toggleZenMode}
              title="Dikkat dağıtmayan tam ekran odaklanma modu"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Odaklanma Modu (Zen)</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Zamanlayıcı Ayarları"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Completed Session Notification Banner */}
        {completedBanner && (
          <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{completedBanner.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sıradaki mod:{' '}
                  <span className="text-sky-300 font-medium">
                    {completedBanner.nextMode === 'focus'
                      ? 'Odaklanma'
                      : completedBanner.nextMode === 'short_break'
                      ? 'Kısa Mola'
                      : 'Uzun Mola'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  switchMode(completedBanner.nextMode, true);
                  setCompletedBanner(null);
                }}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Hemen Başlat
              </button>
              <button
                onClick={() => setCompletedBanner(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* Guest Storage Information Banner */}
        {!user && (
          <div className="px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Giriş yapmadan kullanıyorsunuz. Oturumlarınız bu tarayıcıda yerel olarak saklanır.
              </span>
            </div>
            <Link
              to="/login"
              className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 shrink-0"
            >
              Giriş yaparak verilerini kaydet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* MAIN POMODORO CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center relative overflow-hidden shadow-xl">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-8 relative z-10">
            <button
              onClick={() => switchMode('focus')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'focus'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Odaklanma ({settings.focusMinutes} dk)
            </button>
            <button
              onClick={() => switchMode('short_break')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'short_break'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Kısa Mola ({settings.shortBreakMinutes} dk)
            </button>
            <button
              onClick={() => switchMode('long_break')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'long_break'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Uzun Mola ({settings.longBreakMinutes} dk)
            </button>
          </div>

          {/* Circular Countdown Progress Centerpiece */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 340 340">
              {/* Background Ring */}
              <circle
                cx="170"
                cy="170"
                r={circleRadius}
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="170"
                cy="170"
                r={circleRadius}
                className={`${modeInfo.progressColor} transition-all duration-300 ease-linear`}
                strokeWidth="10"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Timer Text Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border mb-1 ${modeInfo.badgeColor}`}
              >
                {modeInfo.title}
              </span>
              <div className="text-6xl sm:text-7xl font-bold font-mono tracking-tight text-white tabular-nums">
                {formattedMinutes}:{formattedSeconds}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate">
                {tag ? `“${tag}”` : modeInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Cycle Progress Dots */}
          <div className="flex items-center gap-2 mt-4 mb-6">
            <span className="text-[11px] text-slate-500 font-medium mr-1">
              Döngü ({completedCycleCount % settings.longBreakInterval}/{settings.longBreakInterval}):
            </span>
            {Array.from({ length: settings.longBreakInterval }).map((_, i) => {
              const active = i < (completedCycleCount % settings.longBreakInterval);
              return (
                <div
                  key={i}
                  title={`${i + 1}. Odaklanma`}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    active ? 'bg-sky-400 ring-2 ring-sky-400/20' : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Task Tag Input (Optional Task Name) */}
          <div className="w-full max-w-sm mb-6">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Üzerinde çalıştığın konu / ders (İsteğe bağlı)"
              className="w-full px-3.5 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-sky-500 transition-colors text-center"
            />
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-3 relative z-10">
            {status === 'idle' && (
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-sky-600/20 hover:scale-[1.02] inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Başlat
              </button>
            )}

            {status === 'running' && (
              <button
                onClick={handlePause}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all border border-slate-700 hover:scale-[1.02] inline-flex items-center gap-2"
              >
                <Pause className="w-4 h-4 fill-current" />
                Duraklat
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={handleResume}
                className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-sky-600/20 hover:scale-[1.02] inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Devam Et
              </button>
            )}

            <button
              onClick={handleReset}
              title="Oturumu Sıfırla"
              className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkip}
              title="Sonraki Aşamaya Geç"
              className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STATISTICS & METRICS OVERVIEW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Bugün Tamamlanan</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats?.today_sessions_count ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">Oturum</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Bugün Odaklanma</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats?.today_focus_minutes ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">Dakika</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Günlük Hedef</span>
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats?.today_sessions_count ?? 0} / {settings.dailyGoal}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.today_goal_progress_percent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Toplam Pomodoro</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats?.total_completed_pomodoros ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">Oturum</span>
            </div>
          </div>
        </div>

        {/* RECENT SESSIONS HISTORY */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Son Çalışma Oturumları
            </h2>
            <span className="text-xs text-slate-500">
              {sessions.length} kayıt listeleniyor
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">Henüz kaydedilmiş oturum yok</p>
              <p className="text-xs text-slate-500 mt-1">
                İlk Pomodoro oturumunu başlatarak odaklanma serüvenine başla.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-medium">Tarih & Saat</th>
                    <th className="py-2.5 font-medium">Tür</th>
                    <th className="py-2.5 font-medium">Konu / Etiket</th>
                    <th className="py-2.5 font-medium">Süre</th>
                    <th className="py-2.5 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessions.map((s, idx) => {
                    const sessionDate = new Date(s.started_at);
                    const formattedDate = sessionDate.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const formattedHour = sessionDate.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isFocus = s.session_type === 'focus';
                    const isLongBreak = s.session_type === 'long_break';

                    return (
                      <tr key={s.id || s.client_id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-slate-300 whitespace-nowrap">
                          {formattedDate}, {formattedHour}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              isFocus
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : isLongBreak
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isFocus ? 'Odaklanma' : isLongBreak ? 'Uzun Mola' : 'Kısa Mola'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 max-w-[200px] truncate">
                          {s.tag || '—'}
                        </td>
                        <td className="py-3 text-slate-300 tabular-nums font-mono">
                          {Math.floor(s.actual_duration / 60)} dk
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteSession(s)}
                            title="Oturumu Sil"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SETTINGS MODAL */}
      {/* ------------------------------------------------------------- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-sky-400" />
                Zamanlayıcı Ayarları
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Durations */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Odaklanma (dk)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.focusMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        focusMinutes: Math.max(1, Math.min(120, Number(e.target.value) || 25)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-center font-mono focus:border-sky-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kısa Mola (dk)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.shortBreakMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shortBreakMinutes: Math.max(1, Math.min(60, Number(e.target.value) || 5)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-center font-mono focus:border-sky-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Uzun Mola (dk)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.longBreakMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        longBreakMinutes: Math.max(1, Math.min(90, Number(e.target.value) || 15)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-center font-mono focus:border-sky-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Intervals & Goal */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Uzun Mola Aralığı</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={settings.longBreakInterval}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        longBreakInterval: Math.max(1, Math.min(12, Number(e.target.value) || 4)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-center font-mono focus:border-sky-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Kaç çalışma oturumunda bir uzun mola
                  </span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Günlük Hedef (Adet)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.dailyGoal}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dailyGoal: Math.max(1, Math.min(30, Number(e.target.value) || 4)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-center font-mono focus:border-sky-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Hedeflenen Pomodoro sayısı
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Molaya otomatik geçiş yap</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings({ ...settings, autoStartBreaks: e.target.checked })}
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Odaklanmaya otomatik geçiş yap</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartFocus}
                    onChange={(e) => setSettings({ ...settings, autoStartFocus: e.target.checked })}
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Süre bittiğinde sesli bildirim çal</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSettings(DEFAULT_POMODORO_SETTINGS);
                  savePomodoroSettings(DEFAULT_POMODORO_SETTINGS);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Varsayılanlara Dön
              </button>

              <button
                type="button"
                onClick={() => {
                  savePomodoroSettings(settings);
                  setIsSettingsOpen(false);
                  // If timer is idle, apply new duration immediately
                  if (status === 'idle') {
                    let m = settings.focusMinutes;
                    if (mode === 'short_break') m = settings.shortBreakMinutes;
                    if (mode === 'long_break') m = settings.longBreakMinutes;
                    setTotalDurationSeconds(m * 60);
                    setRemainingSeconds(m * 60);
                  }
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Kaydet ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pomodoro;
