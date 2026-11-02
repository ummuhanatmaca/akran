import { PomodoroSettings, PomodoroSession, PomodoroStats } from '../types';

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  dailyGoal: 4,
};

const SETTINGS_KEY = 'akran_pomodoro_settings';
const GUEST_SESSIONS_KEY = 'akran_pomodoro_guest_sessions';
const ACTIVE_STATE_KEY = 'akran_pomodoro_active_state';

// Load settings from localStorage
export function loadPomodoroSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      focusMinutes: Math.min(120, Math.max(1, Number(parsed.focusMinutes) || 25)),
      shortBreakMinutes: Math.min(60, Math.max(1, Number(parsed.shortBreakMinutes) || 5)),
      longBreakMinutes: Math.min(90, Math.max(1, Number(parsed.longBreakMinutes) || 15)),
      longBreakInterval: Math.min(12, Math.max(1, Number(parsed.longBreakInterval) || 4)),
      autoStartBreaks: Boolean(parsed.autoStartBreaks),
      autoStartFocus: Boolean(parsed.autoStartFocus),
      soundEnabled: parsed.soundEnabled !== undefined ? Boolean(parsed.soundEnabled) : true,
      dailyGoal: Math.min(30, Math.max(1, Number(parsed.dailyGoal) || 4)),
    };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

// Save settings to localStorage
export function savePomodoroSettings(settings: PomodoroSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Ayarlar kaydedilemedi:', e);
  }
}

// Generate client-side unique ID
export function generateClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'pomo-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

// Guest session storage (for unauthenticated users)
export function getGuestSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(GUEST_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGuestSession(session: PomodoroSession): void {
  try {
    const sessions = getGuestSessions();
    // Prepend new session
    const updated = [session, ...sessions.filter(s => s.client_id !== session.client_id)].slice(0, 100);
    localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Misafir oturumu kaydedilemedi:', e);
  }
}

export function removeGuestSession(clientId: string): void {
  try {
    const sessions = getGuestSessions();
    const filtered = sessions.filter(s => s.client_id !== clientId);
    localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Misafir oturumu silinemedi:', e);
  }
}

export function clearGuestSessions(): void {
  try {
    localStorage.removeItem(GUEST_SESSIONS_KEY);
  } catch (e) {
    console.error('Misafir oturumları temizlenemedi:', e);
  }
}

// Calculate statistics from guest sessions
export function calculateGuestStats(sessions: PomodoroSession[], dailyGoal: number): PomodoroStats {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCompleted = sessions.filter(
    s => s.session_type === 'focus' && s.completed && s.started_at.slice(0, 10) === todayStr
  );

  const todaySessionsCount = todayCompleted.length;
  const todayFocusSeconds = todayCompleted.reduce((acc, curr) => acc + curr.actual_duration, 0);
  const todayFocusMinutes = Math.floor(todayFocusSeconds / 60);

  const allCompleted = sessions.filter(s => s.session_type === 'focus' && s.completed);
  const totalCompletedPomodoros = allCompleted.length;
  const totalFocusSeconds = allCompleted.reduce((acc, curr) => acc + curr.actual_duration, 0);
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);

  const progressPercent = Math.min(100, Math.round((todaySessionsCount / dailyGoal) * 1000) / 10);

  return {
    today_sessions_count: todaySessionsCount,
    today_focus_minutes: todayFocusMinutes,
    total_completed_pomodoros: totalCompletedPomodoros,
    total_focus_minutes: totalFocusMinutes,
    daily_goal: dailyGoal,
    today_goal_progress_percent: progressPercent,
  };
}

export interface ActivePomodoroState {
  mode: 'focus' | 'short_break' | 'long_break';
  status: 'idle' | 'running' | 'paused';
  targetEndTime: number | null; // epoch ms when timer will complete
  remainingSeconds: number; // remaining seconds when paused or idle
  totalDurationSeconds: number;
  completedCycleCount: number; // 0..longBreakInterval-1
  sessionStartedAt: string | null;
  tag: string;
  clientId: string | null;
}

export function loadActiveState(): ActivePomodoroState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveState(state: ActivePomodoroState): void {
  try {
    localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Aktif oturum durumu kaydedilemedi:', e);
  }
}

export function clearActiveState(): void {
  try {
    localStorage.removeItem(ACTIVE_STATE_KEY);
  } catch (e) {
    console.error('Aktif oturum durumu temizlenemedi:', e);
  }
}

// Gentle Web Audio API synthesizer for session completion chime
export function playCompletionSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Harmonic two-tone chime
    playTone(523.25, 0, 0.4); // C5
    playTone(659.25, 0.15, 0.5); // E5
    playTone(783.99, 0.3, 0.7); // G5
  } catch (err) {
    // Graceful fallback if audio is not permitted by browser
    console.warn('Ses bildirimi çalınamadı:', err);
  }
}
