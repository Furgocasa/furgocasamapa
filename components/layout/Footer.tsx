"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [totalAreas, setTotalAreas] = useState(3600); // fallback hasta cargar conteo real

  useEffect(() => {
    const loadTotalAreas = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await (supabase as any)
          .from("areas")
          .select("*", { count: "exact", head: true })
          .eq("activo", true);

        if (!error && typeof count === "number") {
          setTotalAreas(count);
        }
      } catch (err) {
        console.error("Error cargando total de áreas:", err);
      }
    };

    loadTotalAreas();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Columna 1: Sobre Furgocasa */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo-furgocasa.png"
                alt="Furgocasa"
                width={180}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tu guía completa de áreas para autocaravanas, campers y furgonetas
              camperizadas en Europa y Latinoamérica.
            </p>
            <div className="mt-4 flex gap-3">
              {/* Redes sociales */}
              <a
                href="https://www.facebook.com/furgocasa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/furgocasa/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCBILltjVWRle5MKm3M50_CA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/mapa"
                  className="hover:text-white transition-colors"
                >
                  🗺️ Mapa de Áreas
                </Link>
              </li>
              <li>
                <Link
                  href="/ruta"
                  className="hover:text-white transition-colors"
                >
                  🚗 Planificador de Rutas
                </Link>
              </li>
              <li>
                <Link
                  href="/perfil"
                  className="hover:text-white transition-colors"
                >
                  👤 Mi Perfil
                </Link>
              </li>
              <li>
                <Link
                  href="/accidente"
                  className="hover:text-white transition-colors"
                >
                  🚨 Reportar Accidente
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="hover:text-white transition-colors"
                >
                  📝 Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Información</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="hover:text-white transition-colors"
                >
                  ℹ️ Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="hover:text-white transition-colors"
                >
                  📧 Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="hover:text-white transition-colors"
                >
                  ❓ Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link
                  href="/condiciones"
                  className="hover:text-white transition-colors"
                >
                  📜 Condiciones del Servicio
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="hover:text-white transition-colors"
                >
                  🔒 Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/comparativa"
                  className="hover:text-white transition-colors text-primary-400 font-semibold"
                >
                  ⚡ vs Park4Night
                </Link>
              </li>
              <li>
                <Link
                  href="/valoracion-ia-vehiculos"
                  className="hover:text-white transition-colors text-purple-400 font-semibold"
                >
                  🤖 Valoración IA
                </Link>
              </li>
              <li>
                <Link
                  href="/sistema-reporte-accidentes"
                  className="hover:text-white transition-colors text-orange-400 font-semibold"
                >
                  🚨 Sistema de Alertas
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Estadísticas */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Comunidad</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="bg-primary-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                  🚐
                </div>
                <div>
                  <div className="text-white font-semibold">
                    +{totalAreas} Áreas
                  </div>
                  <div className="text-xs text-gray-500">Europa y LATAM</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                  👥
                </div>
                <div>
                  <div className="text-white font-semibold">
                    Comunidad activa
                  </div>
                  <div className="text-xs text-gray-500">Viajeros como tú</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p className="text-center md:text-left">
              © {currentYear} Mapa Furgocasa. Todos los derechos reservados.
            </p>
            <p className="flex flex-col sm:flex-row items-center gap-1 text-center md:text-right">
              <span className="flex items-center gap-1">
                Una empresa de{" "}
                <a
                  href="https://www.furgocasa.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  www.furgocasa.com
                </a>
              </span>
              <span className="hidden sm:inline">-</span>
              <span className="flex items-center gap-1">
                Hecho con <span className="text-red-500">❤️</span> en España
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
