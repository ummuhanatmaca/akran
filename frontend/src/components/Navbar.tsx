import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  GraduationCap,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  Calendar,
  Compass,
  BookOpen,
  Target,
  Users,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notifications
  useEffect(() => {
    if (user) {
      apiClient.get('/notifications')
        .then(res => {
          const unread = res.data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Pomodoro', path: '/pomodoro' },
    { name: 'Ders Desteği', path: '/tutors' },
    { name: 'Dersler', path: '/courses' },
    { name: 'Ders Notları', path: '/materials' },
    { name: 'Çalışma Grupları', path: '/study-groups' },
    { name: 'Bilimsel Fırsatlar', path: '/opportunities' },
    { name: 'Proje Rehberleri', path: '/guides' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 focus:outline-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white leading-none">
                AKRAN
              </span>
              <span className="text-[10px] text-slate-400 font-normal leading-tight hidden sm:block mt-0.5">
                Akademik Destek Platformu
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'text-white bg-slate-800 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-white border border-rose-500/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Yönetici Paneli</span>
              </Link>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  aria-label="Bildirimler"
                  className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-400 rounded-full" />
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-expanded={userDropdownOpen}
                    className="flex items-center gap-2 py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {user.profile?.full_name ? user.profile.full_name[0].toUpperCase() : 'Ö'}
                    </div>
                    <span className="text-slate-200 font-medium max-w-[120px] truncate">
                      {user.profile?.full_name || user.email.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in">
                      <div className="px-3.5 py-2.5 border-b border-slate-800">
                        <p className="font-semibold text-white truncate">
                          {user.profile?.full_name || 'Öğrenci'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {role === 'admin' ? 'Yönetici' : 'Öğrenci'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                          Öğrenci Paneli
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          Profil & Ders Tercihleri
                        </Link>
                        <Link
                          to="/support-requests"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          Destek Taleplerim
                        </Link>
                        <Link
                          to="/sessions"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Ders Oturumlarım
                        </Link>
                        <Link
                          to="/goals"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          Öğrenme Hedeflerim
                        </Link>
                        <Link
                          to="/team-finder"
                          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Takım Arkadaşı İlanları
                        </Link>

                        {role === 'admin' && (
                          <div className="border-t border-slate-800 my-1 pt-1">
                            <Link
                              to="/admin"
                              className="flex items-center gap-2 px-3.5 py-2 text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 transition-colors"
                            >
                              <Shield className="w-3.5 h-3.5 text-rose-400" />
                              Yönetici Paneli
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-slate-800 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors shadow-xs"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <Link
                to="/notifications"
                aria-label="Bildirimler"
                className="relative p-2 text-slate-300"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-400 rounded-full" />
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menüyü aç/kapat"
              className="p-2 text-slate-400 hover:text-white rounded-md focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="border-t border-slate-800 pt-3 mt-3">
            {user ? (
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-sky-400 font-medium"
                >
                  Öğrenci Paneli
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300"
                >
                  Profil & Ders Tercihleri
                </Link>
                <Link
                  to="/support-requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300"
                >
                  Destek Taleplerim
                </Link>
                <Link
                  to="/sessions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300"
                >
                  Ders Oturumlarım
                </Link>
                <Link
                  to="/goals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300"
                >
                  Öğrenme Hedeflerim
                </Link>
                <Link
                  to="/team-finder"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300"
                >
                  Takım Arkadaşı İlanları
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-rose-400 font-semibold"
                  >
                    Yönetici Paneli
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-400 font-medium pt-2 border-t border-slate-800 mt-2"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-medium text-slate-200 bg-slate-800 rounded-md"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-white bg-sky-600 rounded-md"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
