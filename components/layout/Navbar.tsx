"use client";

import { useEffect, useState, type JSX } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TruckIcon,
  ChevronDownIcon,
  CheckIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES, type Locale, useLanguage } from "@/lib/i18n";

function LocaleFlag({ locale, className = "h-4 w-6" }: { locale: Locale; className?: string }) {
  const flags: Record<Locale, JSX.Element> = {
    es: (
      <svg viewBox="0 0 640 480" className="h-full w-full" aria-hidden>
        <path fill="#c60b1e" d="M0 0h640v480H0z" />
        <path fill="#ffc400" d="M0 120h640v240H0z" />
      </svg>
    ),
    en: (
      <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden>
        <path fill="#012169" d="M0 0h60v30H0z" />
        <path stroke="#fff" strokeWidth="6" d="m0 0 60 30M60 0 0 30" />
        <path stroke="#C8102E" strokeWidth="2.4" d="m0 0 60 30M60 0 0 30" />
        <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
        <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
      </svg>
    ),
    fr: (
      <svg viewBox="0 0 640 480" className="h-full w-full" aria-hidden>
        <path fill="#002395" d="M0 0h213.3v480H0z" />
        <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        <path fill="#ed2939" d="M426.7 0H640v480H426.7z" />
      </svg>
    ),
    de: (
      <svg viewBox="0 0 640 480" className="h-full w-full" aria-hidden>
        <path fill="#000" d="M0 0h640v160H0z" />
        <path fill="#d00" d="M0 160h640v160H0z" />
        <path fill="#ffce00" d="M0 320h640v160H0z" />
      </svg>
    ),
    it: (
      <svg viewBox="0 0 640 480" className="h-full w-full" aria-hidden>
        <path fill="#009246" d="M0 0h213.3v480H0z" />
        <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-black/10 ${className}`}>
      {flags[locale]}
    </span>
  );
}

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadReports, setUnreadReports] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();

  // Función para cargar reportes no leídos
  const loadUnreadReports = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any).rpc('obtener_reportes_usuario', { usuario_uuid: userId });

      if (!error && data) {
        const noLeidos = data.filter((reporte: any) => !reporte.leido).length;
        setUnreadReports(noLeidos);
      }
    } catch (error) {
      console.error('Error cargando reportes no leídos:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setIsAdmin(session.user.user_metadata?.is_admin === true);
        // Cargar reportes no leídos
        loadUnreadReports(session.user.id);
      }
    };

    checkUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAdmin(session.user.user_metadata?.is_admin === true);
        // Cargar reportes no leídos cuando cambia la sesión
        loadUnreadReports(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setUnreadReports(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowLangMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Actualizar reportes no leídos cada 30 segundos si hay usuario
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadReports(user.id);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      
      // 1. Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // 2. Limpiar TODAS las cookies de autenticación
      document.cookie.split(";").forEach(function(c) { 
        const cookieName = c.trim().split("=")[0];
        if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
          document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        }
      });
      
      // 3. Limpiar localStorage (mantener solo preferencias de UI)
      const keysToPreserve = ['hasSeenWelcome', 'fc_lang'];
      const itemsToPreserve: Record<string, string> = {};
      
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) itemsToPreserve[key] = value;
      });
      
      localStorage.clear();
      
      // Restaurar preferencias
      Object.entries(itemsToPreserve).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      // 4. Limpiar sessionStorage
      sessionStorage.clear();
      
      // 5. Actualizar estado local
      setUser(null);
      setIsAdmin(false);
      setShowUserMenu(false);
      
      // 6. Redirigir al home
      window.location.href = "/";
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar limpieza y redirección incluso si hay error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-primary-600 text-white shadow-lg z-30 shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 md:h-16 gap-2">
          {/* Logo */}
          <Link
            href={user ? "/mapa" : "/"}
            className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo-furgocasa.png"
              alt="Furgocasa"
              width={180}
              height={40}
              className="h-8 md:h-10 w-auto max-w-[132px] md:max-w-none"
              priority
            />
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/mapa"
              className={`text-white font-semibold hover:text-primary-100 transition-colors ${
                pathname === "/mapa" ? "border-b-2 border-white pb-1" : ""
              }`}
            >
              {t('nav_mapa')}
            </Link>
            <Link
              href="/talleres"
              className={`text-white font-semibold hover:text-primary-100 transition-colors ${
                pathname.startsWith("/taller") ? "border-b-2 border-white pb-1" : ""
              }`}
            >
              {t('nav_talleres')}
            </Link>
            <Link
              href="/ruta"
              className={`text-white font-semibold hover:text-primary-100 transition-colors ${
                pathname === "/ruta" ? "border-b-2 border-white pb-1" : ""
              }`}
            >
              {t('nav_ruta')}
            </Link>
            <Link
              href="/accidente"
              className={`text-white font-semibold hover:text-primary-100 transition-colors ${
                pathname === "/accidente" ? "border-b-2 border-white pb-1" : ""
              }`}
            >
              {t('nav_reportar_full')}
            </Link>
          </nav>

          {/* Usuario / Login */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLangMenu((open) => !open);
                  setShowUserMenu(false);
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-1.5 md:gap-2 h-10 md:h-12 px-2 md:px-3 bg-white/15 text-white border border-white/25 rounded-lg hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
                aria-label="Idioma"
                aria-haspopup="listbox"
                aria-expanded={showLangMenu}
              >
                <LocaleFlag locale={locale} className="h-4 w-6 md:h-5 md:w-7" />
                <span className="hidden sm:inline text-sm font-semibold tracking-wide">{LOCALE_LABELS[locale]}</span>
                <ChevronDownIcon
                  className={`hidden sm:block w-4 h-4 opacity-80 transition-transform ${showLangMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div
                    role="listbox"
                    aria-label="Idioma"
                    className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden py-1"
                  >
                    {LOCALES.map((code) => {
                      const selected = code === locale;
                      return (
                        <button
                          key={code}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setLocale(code);
                            setShowLangMenu(false);
                            router.refresh();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? "bg-primary-50 text-primary-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <LocaleFlag locale={code} className="h-4 w-6" />
                          <span className="text-sm font-semibold tracking-wide w-7">
                            {LOCALE_LABELS[code]}
                          </span>
                          <span className="text-sm flex-1">{LOCALE_NAMES[code]}</span>
                          {selected && <CheckIcon className="w-4 h-4 text-primary-600" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {user && (
              <Link
                href="/mis-autocaravanas"
                className={`flex items-center gap-1.5 h-10 md:h-12 px-2.5 md:px-3 bg-white/15 text-white border border-white/25 rounded-lg hover:bg-white/25 transition-colors ${
                  pathname === "/mis-autocaravanas" ? "ring-2 ring-white/50" : ""
                }`}
                title={t('nav_vehicles')}
              >
                <TruckIcon className="w-5 h-5" />
                <span className="hidden lg:inline text-sm font-semibold">{t('nav_furgo')}</span>
                {unreadReports > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {unreadReports}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowLangMenu(false);
                  }}
                  className="flex items-center gap-2 h-10 md:h-12 px-2.5 md:px-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors relative"
                >
                  {user.user_metadata?.profile_photo &&
                  user.user_metadata.profile_photo !== "default_profile.png" ? (
                    <div className="relative">
                      <img
                        src={user.user_metadata.profile_photo}
                        alt={user.user_metadata?.full_name || user.email}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {unreadReports > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {unreadReports}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <UserCircleIcon className="w-8 h-8" />
                      {unreadReports > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {unreadReports}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm">
                    {user.user_metadata?.first_name ||
                      user.email?.split("@")[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />

                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.user_metadata?.full_name || "Usuario"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Cog6ToothIcon className="w-5 h-5" />
                            {t('nav_admin')}
                          </Link>
                        )}
                        <Link
                          href="/perfil"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UserCircleIcon className="w-5 h-5" />
                          {t('nav_profile')}
                        </Link>
                        <Link
                          href="/mis-autocaravanas"
                          className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center gap-3">
                            <TruckIcon className="w-5 h-5" />
                            {t('nav_vehicles')}
                          </div>
                          {unreadReports > 0 && (
                            <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {unreadReports}
                            </span>
                          )}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          {t('nav_logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center h-10 md:h-12 px-3 md:px-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-sm"
              >
                <span className="sm:hidden">{t('nav_login_short')}</span>
                <span className="hidden sm:inline">{t('nav_login')}</span>
              </Link>
            )}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white/15 border border-white/25 hover:bg-white/25 transition-colors"
              aria-label={t('nav_menu')}
              aria-expanded={showMobileMenu}
              onClick={() => {
                setShowMobileMenu((open) => !open);
                setShowLangMenu(false);
                setShowUserMenu(false);
              }}
            >
              {showMobileMenu ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        {showMobileMenu && (
          <nav className="md:hidden border-t border-white/20 py-2 pb-3">
            <Link
              href="/mapa"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-3 rounded-lg font-semibold ${
                pathname === "/mapa" ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              {t('nav_mapa')}
            </Link>
            <Link
              href="/talleres"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-3 rounded-lg font-semibold ${
                pathname.startsWith("/taller") ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              {t('nav_talleres')}
            </Link>
            <Link
              href="/ruta"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-3 rounded-lg font-semibold ${
                pathname === "/ruta" ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              {t('nav_ruta')}
            </Link>
            <Link
              href="/accidente"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-3 rounded-lg font-semibold ${
                pathname === "/accidente" ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              {t('nav_reportar_full')}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
