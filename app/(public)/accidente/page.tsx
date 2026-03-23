"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Loader } from "@googlemaps/js-api-loader";
import { createClient } from "@/lib/supabase/client";

// Tipos simplificados para Google Maps (se cargan dinámicamente)
type GoogleMap = any;
type GoogleMarker = any;
type GoogleGeocoder = any;

export default function ReporteAccidentePage() {
  const [busquedaMatricula, setBusquedaMatricula] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ubicacion, setUbicacion] = useState<{
    lat: number;
    lng: number;
    direccion?: string;
  } | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [mapa, setMapa] = useState<GoogleMap | null>(null);
  const [marcador, setMarcador] = useState<GoogleMarker | null>(null);
  const [mapaCargado, setMapaCargado] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [ubicacionAjustada, setUbicacionAjustada] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    matricula_tercero: "",
    descripcion_tercero: "",
    testigo_nombre: "",
    testigo_email: "",
    testigo_telefono: "",
    descripcion: "",
    tipo_dano: "" as "Rayón" | "Abolladura" | "Choque" | "Rotura" | "Otro" | "",
    fecha_accidente: new Date().toISOString().slice(0, 16),
    ubicacion_descripcion: "",
    fotos: [] as File[],
    es_anonimo: false, // Por defecto NO anónimo
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Cargar matrícula desde URL si existe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matriculaParam = params.get("matricula");

    if (matriculaParam) {
      setBusquedaMatricula(matriculaParam.toUpperCase());
      // Auto-buscar el vehículo
      buscarVehiculoPorMatricula(matriculaParam.toUpperCase());
    } else {
      setCargandoInicial(false);
    }
  }, []);

  useEffect(() => {
    if (ubicacion && !mapaCargado && !mapa) {
      inicializarMapa();
    }
  }, [ubicacion, mapaCargado, mapa]);

  const buscarVehiculoPorMatricula = async (matricula: string) => {
    setBuscando(true);
    setNoEncontrado(false);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/vehiculos/buscar-matricula?matricula=${encodeURIComponent(
          matricula
        )}`
      );
      const data = await response.json();

      if (response.ok && data.existe) {
        setVehiculo(data.vehiculo);
        setNoEncontrado(false);
        setMessage({
          type: "success",
          text: `✅ Vehículo encontrado: ${data.vehiculo.marca} ${data.vehiculo.modelo} - ${data.vehiculo.matricula}`,
        });
      } else {
        setVehiculo(null);
        setNoEncontrado(true);
        setMessage({
          type: "error",
          text: "No tenemos a este vehículo en nuestra base de datos para avisarle automáticamente. ¡Pero aún puedes ayudar! Déjale una nota en el parabrisas con lo que has visto, el dueño te lo agradecerá eternamente.",
        });
      }
    } catch (error) {
      console.error("Error buscando vehículo:", error);
      setMessage({
        type: "error",
        text: "Error al buscar el vehículo. Inténtalo de nuevo.",
      });
    } finally {
      setBuscando(false);
      setCargandoInicial(false);
    }
  };

  const buscarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!busquedaMatricula.trim()) {
      setMessage({ type: "error", text: "Por favor, introduce una matrícula" });
      return;
    }

    await buscarVehiculoPorMatricula(busquedaMatricula.trim());
  };

  const obtenerUbicacion = () => {
    setObteniendoUbicacion(true);

    if (!navigator.geolocation) {
      setMessage({
        type: "error",
        text: "Tu navegador no soporta geolocalización",
      });
      setObteniendoUbicacion(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Geocoding reverso para obtener dirección
        try {
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
            version: "weekly",
          });

          await loader.load();
          const google = (window as any).google;
          const geocoder = new google.maps.Geocoder() as GoogleGeocoder;

          const result = await geocoder.geocode({ location: { lat, lng } });

          if (result.results && result.results[0]) {
            const direccion = result.results[0].formatted_address;
            setUbicacion({ lat, lng, direccion });
            setFormData((prev) => ({
              ...prev,
              ubicacion_descripcion: direccion,
            }));
          } else {
            setUbicacion({ lat, lng });
          }

          setMessage({
            type: "success",
            text: "Ubicación obtenida correctamente",
          });
        } catch (error) {
          console.error("Error en geocoding:", error);
          setUbicacion({ lat, lng });
          setMessage({
            type: "success",
            text: "Ubicación obtenida (sin dirección)",
          });
        }

        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setMessage({
          type: "error",
          text: "No se pudo obtener tu ubicación. Verifica los permisos.",
        });
        setObteniendoUbicacion(false);
      }
    );
  };

  const inicializarMapa = async () => {
    if (!ubicacion || mapaCargado) return;

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
      });

      await loader.load();
      const google = (window as any).google;

      const mapElement = document.getElementById("map");
      if (!mapElement) return;

      const newMap = new google.maps.Map(mapElement, {
        center: { lat: ubicacion.lat, lng: ubicacion.lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      }) as GoogleMap;

      // Crear marcador ARRASTRABLE
      const newMarker = new google.maps.Marker({
        position: { lat: ubicacion.lat, lng: ubicacion.lng },
        map: newMap,
        title: "Arrastra para ajustar la ubicación exacta",
        draggable: true,
        animation: google.maps.Animation.DROP,
      }) as GoogleMarker;

      // Listener para cuando se arrastra el marcador
      google.maps.event.addListener(newMarker, 'dragend', async function(event: any) {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        setUbicacionAjustada(true);

        // Actualizar ubicación
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat: newLat, lng: newLng } });

          if (result.results && result.results[0]) {
            const nuevaDireccion = result.results[0].formatted_address;
            setUbicacion({ lat: newLat, lng: newLng, direccion: nuevaDireccion });
            setFormData((prev) => ({
              ...prev,
              ubicacion_descripcion: nuevaDireccion,
            }));
            setMessage({
              type: "success",
              text: "✅ Ubicación ajustada correctamente",
            });
          } else {
            setUbicacion({ lat: newLat, lng: newLng });
          }
        } catch (error) {
          console.error("Error en geocoding:", error);
          setUbicacion({ lat: newLat, lng: newLng });
        }
      });

      setMarcador(newMarker);
      setMapa(newMap);
      setMapaCargado(true);
    } catch (error) {
      console.error("Error inicializando mapa:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehiculo) {
      setMessage({
        type: "error",
        text: "Primero debes buscar y encontrar un vehículo",
      });
      return;
    }

    if (
      !formData.testigo_nombre ||
      !formData.testigo_email ||
      !formData.descripcion ||
      !formData.tipo_dano
    ) {
      setMessage({
        type: "error",
        text: "Por favor, completa todos los campos obligatorios",
      });
      return;
    }

    if (!ubicacion) {
      setMessage({
        type: "error",
        text: "Por favor, obtén tu ubicación antes de enviar el reporte",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      console.log('📸 [Frontend] Fotos en formData.fotos:', formData.fotos.length, formData.fotos);

      // ============================================================
      // NUEVO: Subir fotos DIRECTAMENTE a Supabase Storage
      // Bypasea AWS Amplify completamente
      // ============================================================
      let fotosUrls: string[] = [];

      if (formData.fotos.length > 0) {
        console.log('📸 [Frontend] Subiendo fotos directamente a Supabase Storage...');
        const supabase = createClient();
        const timestamp = Date.now();

        for (let i = 0; i < formData.fotos.length; i++) {
          const foto = formData.fotos[i];
          console.log(`📸 [Frontend] Subiendo foto ${i + 1}/${formData.fotos.length}: ${foto.name}`);

          // Validar tamaño (máx 10MB)
          if (foto.size > 10 * 1024 * 1024) {
            console.warn(`⚠️ Foto ${i + 1} excede 10MB, se omite`);
            continue;
          }

          const fileExt = foto.name.split('.').pop() || 'jpg';
          const fileName = `reportes/${vehiculo.id}/${timestamp}_${i}.${fileExt}`;

          // Subir directamente a Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('vehiculos')
            .upload(fileName, foto, {
              contentType: foto.type || 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ Error subiendo foto ${i + 1}:`, uploadError);
            continue;
          }

          // Obtener URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('vehiculos')
            .getPublicUrl(fileName);

          console.log(`✅ Foto ${i + 1} subida: ${publicUrl}`);
          fotosUrls.push(publicUrl);
        }

        console.log(`📸 [Frontend] Total fotos subidas: ${fotosUrls.length}`);
      }

      // ============================================================
      // Enviar reporte con JSON (NO FormData)
      // Incluye las URLs de las fotos ya subidas
      // ============================================================
      const reporteData = {
        matricula: vehiculo.matricula,
        matricula_tercero: formData.matricula_tercero || null,
        descripcion_tercero: formData.descripcion_tercero || null,
        testigo_nombre: formData.testigo_nombre,
        testigo_email: formData.testigo_email || null,
        testigo_telefono: formData.testigo_telefono || null,
        descripcion: formData.descripcion,
        tipo_dano: formData.tipo_dano || null,
        fecha_accidente: formData.fecha_accidente,
        ubicacion_lat: ubicacion.lat,
        ubicacion_lng: ubicacion.lng,
        ubicacion_direccion: ubicacion.direccion || null,
        ubicacion_descripcion: formData.ubicacion_descripcion || null,
        es_anonimo: formData.es_anonimo,
        fotos_urls: fotosUrls // URLs ya subidas a Supabase
      };

      console.log('📤 [Frontend] Enviando reporte con JSON:', reporteData);

      const response = await fetch("/api/reportes", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reporteData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "¡Reporte enviado con éxito! El propietario será notificado.",
        });
        // Resetear formulario
        setFormData({
          matricula_tercero: "",
          descripcion_tercero: "",
          testigo_nombre: "",
          testigo_email: "",
          testigo_telefono: "",
          descripcion: "",
          tipo_dano: "",
          fecha_accidente: new Date().toISOString().slice(0, 16),
          ubicacion_descripcion: "",
          fotos: [],
          es_anonimo: false,
        });
        setVehiculo(null);
        setBusquedaMatricula("");
        setUbicacion(null);
        setMapa(null);
        setMapaCargado(false);
      } else {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Error al enviar el reporte";

        console.error("Error del servidor:", data);
        setMessage({
          type: "error",
          text: errorMsg,
        });
      }
    } catch (error) {
      console.error("Error enviando reporte:", error);
      setMessage({
        type: "error",
        text: "Error al enviar el reporte. Inténtalo de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (cargandoInicial) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">
              Cargando información del vehículo...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* JSON-LD Structured Data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Reportar Accidente de Autocaravana",
            "description": "Sistema gratuito para reportar accidentes, golpes y daños a autocaravanas. Ayuda al propietario reportando incidentes con fotos y ubicación GPS.",
            "url": "https://www.mapafurgocasa.com/accidente",
            "mainEntity": {
              "@type": "Service",
              "name": "Sistema de Reportes de Accidentes para Autocaravanas",
              "provider": {
                "@type": "Organization",
                "name": "Mapa Furgocasa",
                "url": "https://www.mapafurgocasa.com"
              },
              "serviceType": "Reporte de Incidentes",
              "areaServed": {
                "@type": "Place",
                "name": "Europa y América"
              },
              "description": "Permite a testigos reportar accidentes, golpes y daños a autocaravanas de forma anónima. El propietario recibe una notificación instantánea con fotos, ubicación GPS y descripción del incidente.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              }
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Inicio",
                  "item": "https://www.mapafurgocasa.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Reportar Accidente",
                  "item": "https://www.mapafurgocasa.com/accidente"
                }
              ]
            }
          })
        }}
      />

      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 lg:px-6 py-8">
        {/* Header mejorado */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-4 animate-pulse">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🚐 ¿Viste algo? ¡Ayuda a un compañero viajero!
          </h1>

          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-4 leading-relaxed">
            Si has sido testigo de un golpe, rayón o accidente a una autocaravana,
            <span className="font-semibold text-primary-600"> tu ayuda puede marcar la diferencia</span>.
          </p>

          {/* Frases motivadoras */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 max-w-2xl mx-auto border-l-4 border-primary-500">
            <p className="text-xl font-bold text-gray-800 mb-2">
              💙 "Haz por otros lo que te gustaría que hicieran por ti"
            </p>
            <p className="text-gray-600 italic">
              Seas campista o un vecino que pasaba por allí, hoy por él, mañana por ti. Ayúdale a no pagar de su bolsillo un golpe ajeno.
            </p>
            <p className="text-sm text-gray-500 mt-3">
              🕐 Solo te llevará <span className="font-semibold">2 minutos</span> •
              🎭 <span className="font-semibold">100% anónimo</span> •
              ✨ Serás un <span className="font-semibold">héroe viajero</span>
            </p>
          </div>

          {/* Mensaje adicional con humor */}
          <p className="text-sm text-gray-500 mt-4 italic">
            <span className="font-medium">Dato curioso:</span> 8 de cada 10 propietarios nunca
            descubren quién rayó su autocaravana. ¡Tú puedes cambiar eso! 🦸‍♂️
          </p>
        </div>

        {/* Cómo funciona */}
        {!vehiculo && !buscando && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-2xl mb-4">🔍</div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">1. Busca la matrícula</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Comprobamos al instante si el dueño está registrado en nuestra plataforma.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4">📸</div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">2. Cuenta qué pasó</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Sube fotos y ubicación del incidente. Puedes hacerlo de forma <strong>100% anónima</strong>.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mb-4">📨</div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">3. Avisamos al dueño</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Le llega una alerta al móvil para que pueda dar parte a su seguro gracias a ti.</p>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {message && (
          message.type === "success" ? (
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircleIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    🎉 ¡Eres un héroe viajero!
                  </h3>
                  <p className="text-green-800 mb-3 text-lg">
                    Tu reporte ha sido enviado con éxito. El propietario acaba de recibir una
                    <span className="font-bold"> notificación instantánea</span>.
                  </p>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Gracias por tu solidaridad.</span>
                      Personas como tú hacen que la comunidad viajera sea especial. 💚
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      "El karma viajero existe: lo que das, vuelve" 🔄✨
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <p>{message.text}</p>
              </div>
            </div>
          )
        )}

        {/* Paso 1: Buscar Vehículo */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold text-sm">
              1
            </span>
            Buscar Vehículo por Matrícula
          </h2>

          <form onSubmit={buscarVehiculo} className="flex gap-3">
            <div className="flex-grow">
              <input
                type="text"
                value={busquedaMatricula}
                onChange={(e) =>
                  setBusquedaMatricula(e.target.value.toUpperCase())
                }
                placeholder="Ej: 1234ABC"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                disabled={buscando || vehiculo !== null}
              />
            </div>
            <button
              type="submit"
              disabled={buscando || vehiculo !== null}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {buscando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </form>

          {vehiculo && (
            <div className="mt-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0 mt-1 animate-bounce" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-lg mb-2 flex items-center gap-2">
                    🎉 ¡Genial! Vehículo encontrado
                  </h3>
                  <p className="text-green-800 mb-3">
                    <span className="font-semibold text-lg">{vehiculo.marca} {vehiculo.modelo}</span>
                    <span className="text-green-700"> • Matrícula: {vehiculo.matricula}</span>
                  </p>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-green-700 text-sm mb-2">
                      Ahora solo completa el formulario. El propietario recibirá una
                      <span className="font-semibold"> notificación instantánea</span> con tu reporte.
                    </p>
                    <p className="text-green-600 text-xs italic">
                      ¡Gracias por ser parte de la comunidad viajera! 🚐💚
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setVehiculo(null);
                  setBusquedaMatricula("");
                  setNoEncontrado(false);
                }}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline flex items-center gap-1"
              >
                ← Buscar otro vehículo
              </button>
            </div>
          )}
        </div>

        {/* 🎯 BANNER CTA: Protege tu autocaravana */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-2xl shadow-2xl p-8 mb-6 border-4 border-primary-400 relative overflow-hidden">
          {/* Efecto decorativo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Título principal */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                <span className="text-4xl">🛡️</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-3 leading-tight">
                ¿Quieres que TU autocaravana esté protegida?
              </h3>
              <p className="text-xl text-white/90 font-semibold">
                Aparece en nuestro buscador y recibe alertas al instante
              </p>
            </div>

            {/* Beneficios en 3 columnas */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl mb-2">🚨</div>
                <h4 className="font-bold text-white mb-1">Alertas Instantáneas</h4>
                <p className="text-sm text-white/80">
                  Recibe notificación inmediata si alguien reporta un golpe
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl mb-2">📸</div>
                <h4 className="font-bold text-white mb-1">Fotos y Ubicación</h4>
                <p className="text-sm text-white/80">
                  Testigos documentan con fotos y GPS del incidente
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl mb-2">🏛️</div>
                <h4 className="font-bold text-white mb-1">Para tu Seguro</h4>
                <p className="text-sm text-white/80">
                  Toda la información lista para tu aseguradora
                </p>
              </div>
            </div>

            {/* Texto persuasivo */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 border border-white/20">
              <p className="text-white/95 text-center leading-relaxed">
                <span className="font-bold text-lg">💙 Únete a la comunidad viajera</span>
                <br />
                <span className="text-white/80">
                  Registra tu vehículo gratis y viaja con la tranquilidad de que cualquier testigo podrá avisarte.
                  Además, accede a gestión completa: mantenimientos, averías, valoración automática con IA y mucho más.
                </span>
              </p>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <a
                href="/auth/registro?redirect=/perfil?tab=vehiculos"
                className="inline-flex items-center gap-3 bg-white text-primary-700 px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span className="text-2xl">🚐</span>
                ¡Registrarme y Proteger mi Autocaravana GRATIS!
                <span className="text-2xl">✨</span>
              </a>
              <p className="text-white/60 text-xs mt-3 italic">
                🎁 100% gratis • Sin tarjeta • Sin compromiso • Registro en 1 minuto
              </p>
            </div>

            {/* Llamada de atención final */}
            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm">
                <span className="font-semibold">¿Ya tienes cuenta?</span>{" "}
                <a href="/auth/login" className="text-white underline hover:text-white/90 font-bold">
                  Inicia sesión aquí
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Reporte (solo si se encontró vehículo) */}
        {vehiculo && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 2: Ubicación */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold text-sm">
                  2
                </span>
                Ubicación del Accidente
              </h2>

              {!ubicacion ? (
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={obteniendoUbicacion}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {obteniendoUbicacion ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      <MapPinIcon className="w-5 h-5" />
                      Obtener Mi Ubicación
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        Ubicación obtenida
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      {ubicacion.direccion ||
                        `Lat: ${ubicacion.lat.toFixed(
                          6
                        )}, Lng: ${ubicacion.lng.toFixed(6)}`}
                    </p>
                  </div>

                  {/* Mensaje de advertencia para ajustar ubicación */}
                  <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900 mb-1">
                          ⚠️ Verifica la ubicación en el mapa
                        </p>
                        <p className="text-sm text-yellow-700">
                          Si la ubicación no es correcta, <strong>arrastra el marcador rojo</strong> en el mapa hasta el lugar exacto del accidente. La dirección se actualizará automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mapa */}
                  <div
                    id="map"
                    className="w-full h-64 rounded-lg border border-gray-300 shadow-sm"
                  ></div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la Ubicación (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.ubicacion_descripcion}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ubicacion_descripcion: e.target.value,
                        }))
                      }
                      placeholder="Ej: Frente al supermercado Mercadona"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Paso 3: Información del Testigo */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold text-sm">
                  3
                </span>
                Tus Datos (Testigo)
              </h2>

              {/* Checkbox para reporte anónimo */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_anonimo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        es_anonimo: e.target.checked,
                      }))
                    }
                    className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎭</span>
                      <span className="font-bold text-gray-900">
                        Hacer este reporte anónimo
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Si marcas esta opción, el propietario <strong>NO verá tu nombre, email ni teléfono</strong>.
                      Solo recibirá la información del accidente. Tu privacidad está garantizada.
                    </p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.testigo_nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        testigo_nombre: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={formData.es_anonimo ? "Solo para nosotros (no se mostrará)" : "Tu nombre completo"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.testigo_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        testigo_email: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={formData.es_anonimo ? "Solo para nosotros (no se mostrará)" : "tu@email.com"}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.testigo_telefono}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        testigo_telefono: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={formData.es_anonimo ? "Opcional (no se mostrará si es anónimo)" : "Tu teléfono"}
                  />
                </div>
              </div>

              {formData.es_anonimo && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <span>🔒</span>
                    <span>
                      <strong>Modo anónimo activado:</strong> El propietario solo verá la información del accidente,
                      pero no tus datos personales. Tu identidad permanecerá privada.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Paso 4: Detalles del Accidente */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold text-sm">
                  4
                </span>
                Detalles del Accidente
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Daño <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.tipo_dano}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_dano: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="Rayón">Rayón</option>
                    <option value="Abolladura">Abolladura</option>
                    <option value="Choque">Choque</option>
                    <option value="Rotura">Rotura</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora del Accidente{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_accidente}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fecha_accidente: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Accidente{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                    placeholder="Describe lo que sucedió con el mayor detalle posible..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matrícula del Tercero Responsable (si aplica)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Tranquilo, esta información solo se le entrega a la víctima para su seguro. Nosotros no la hacemos pública.
                  </p>
                  <input
                    type="text"
                    value={formData.matricula_tercero}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        matricula_tercero: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Ej: 5678XYZ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Tercero Responsable (si aplica)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.descripcion_tercero}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descripcion_tercero: e.target.value,
                      }))
                    }
                    placeholder="Ej: Furgoneta blanca, marca Ford, con un golpe en la puerta trasera..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-5">
                  <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CameraIcon className="w-6 h-6 text-blue-600" />
                    Fotos del Accidente (opcional pero <span className="text-blue-600">MUY útiles</span>)
                  </label>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-400 mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      📸 <span className="font-semibold">Una imagen vale más que mil palabras</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Sube hasta <span className="font-semibold">5 fotos</span> (máx. <span className="font-semibold">10 MB</span> cada una).
                      Pueden ser del daño, del vehículo responsable, o del contexto del accidente.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);

                      // Validar cantidad
                      if (files.length > 5) {
                        setMessage({
                          type: 'error',
                          text: 'Máximo 5 fotos permitidas'
                        });
                        return;
                      }

                      // Validar tamaño
                      const maxSize = 10 * 1024 * 1024; // 10MB
                      const fotosGrandes = files.filter((f: any) => f.size > maxSize);
                      if (fotosGrandes.length > 0) {
                        const nombresFotos = fotosGrandes.map((f: any) => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
                        setMessage({
                          type: 'error',
                          text: `Estas fotos exceden 10 MB: ${nombresFotos}`
                        });
                        return;
                      }

                      setFormData((prev) => ({ ...prev, fotos: files }));
                      setMessage(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-blue-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-semibold hover:file:bg-blue-600 file:cursor-pointer cursor-pointer"
                  />

                  {formData.fotos.length > 0 && (
                    <div className="mt-4 bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                      <p className="text-sm font-bold text-green-700 flex items-center gap-2 mb-3">
                        <CheckCircleIcon className="w-5 h-5" />
                        ¡Perfecto! {formData.fotos.length} foto(s) lista(s) para enviar:
                      </p>
                      <div className="space-y-2">
                        {formData.fotos.map((foto: any, idx: any) => (
                          <div key={idx} className="flex items-center gap-2 text-xs bg-green-50 p-2 rounded border-l-4 border-green-400">
                            <span className="text-green-700">📷</span>
                            <span className="flex-1 text-gray-700 truncate">{foto.name}</span>
                            <span className="text-green-600 font-semibold whitespace-nowrap">
                              {(foto.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {/* Botón para eliminar foto */}
                            <button
                              type="button"
                              onClick={() => {
                                const nuevasFotos = Array.from(formData.fotos).filter((_: any, i: any) => i !== idx)
                                setFormData({ ...formData, fotos: nuevasFotos })
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1.5 rounded transition-colors"
                              title="Eliminar foto"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={submitting || !ubicacion}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-5 px-6 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Enviando tu buena acción...
                </>
              ) : (
                <>
                  <span className="text-2xl">🦸‍♂️</span>
                  ¡Enviar Reporte y Ser un Héroe!
                  <span className="text-2xl">✨</span>
                </>
              )}
            </button>

            {/* Mensaje de privacidad */}
            <p className="text-center text-xs text-gray-500 -mt-3">
              🔒 Tus datos son privados. Solo el propietario verá tu reporte.
              <br />
              No compartimos tu información con nadie más.
            </p>
          </form>
        )}

        {/* FAQ - Preguntas Frecuentes */}
        <div className="mt-16 bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-lg">❓</span> 
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary-500">▪</span> ¿Es realmente anónimo?
              </h3>
              <p className="text-gray-600 pl-4 border-l-2 border-gray-100">
                Sí. Si marcas la opción "Hacer este reporte anónimo" en el paso 3, el propietario de la autocaravana solo recibirá los detalles del incidente y las fotos, pero <strong>nunca</strong> sabrá tu nombre, email o teléfono.
              </p>
            </div>
            
            <div className="h-px bg-gray-100"></div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary-500">▪</span> ¿Me meteré en problemas legales por reportar esto?
              </h3>
              <p className="text-gray-600 pl-4 border-l-2 border-gray-100">
                En absoluto. Al usar esta plataforma solo actúas como un "buen samaritano" informando de un hecho. No estás interponiendo una denuncia oficial, solo estás facilitando información privada a la víctima para que pueda reclamar a su seguro y no tenga que pagar la reparación de su bolsillo.
              </p>
            </div>
            
            <div className="h-px bg-gray-100"></div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-primary-500">▪</span> No soy campista, ¿puedo reportar un accidente?
              </h3>
              <p className="text-gray-600 pl-4 border-l-2 border-gray-100">
                ¡Por supuesto! Seas vecino del barrio, un peatón paseando a su perro o un conductor que pasaba por ahí. Tu ayuda es vital para construir una comunidad más solidaria.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
