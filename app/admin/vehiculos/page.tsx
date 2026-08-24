"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminTable, AdminTableColumn } from "@/components/admin/AdminTable";
import Link from "next/link";
import {
  TruckIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface AnalisisMarcaModelo {
  marca: string;
  modelo: string;
  cantidad: number;
  cantidad_vendidos: number;
  año_promedio: number;
  km_promedio: number;
  precio_compra_promedio: number;
  valor_actual_promedio: number;
  depreciacion_media: number;
  coste_mantenimiento_anual: number;
  coste_averias_total: number;
  num_reportes_accidentes: number;
}

interface DashboardMetricas {
  total_vehiculos: number;
  vehiculos_mes_actual: number;
  valor_total_parque: number;
  total_reportes_accidentes: number;
  reportes_pendientes: number;
  datos_mercado_verificados: number;
  datos_mercado_pendientes: number;
  usuarios_con_vehiculos: number;
  usuarios_compartiendo_datos: number;
}

export default function AdminVehiculosPage() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisMarcaModelo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push("/mapa");
      return;
    }

    await Promise.all([loadMetricas(), loadAnalisis()]);

    setLoading(false);
  };

  const loadMetricas = async () => {
    try {
      const supabase = createClient();

      // Cargar vehículos
      const { data: vehiculos, error: vehiculosError } = await (supabase as any)
        .from("vehiculos_registrados")
        .select("*")
        .eq("activo", true);

      // Cargar datos económicos
      const { data: valoracionesEco } = await (supabase as any)
        .from("vehiculo_valoracion_economica")
        .select("precio_compra, vehiculo_id");

      // Cargar reportes
      const { data: reportes } = await (supabase as any)
        .from("reportes_accidentes")
        .select("id, cerrado");

      // Cargar datos de mercado
      const { data: datosMercado } = await (supabase as any)
        .from("datos_mercado_autocaravanas")
        .select("id, verificado");

      // Calcular métricas
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const total_vehiculos = vehiculos?.length || 0;
      const vehiculos_mes_actual =
        vehiculos?.filter((v: any) => new Date(v.created_at) >= inicioMes)
          .length || 0;

      const valor_total_parque =
        valoracionesEco?.reduce(
          (sum: any, v: any) => sum + (v.precio_compra || 0),
          0
        ) || 0;

      const total_reportes_accidentes = reportes?.length || 0;
      const reportes_pendientes =
        reportes?.filter((r: any) => !r.cerrado).length || 0;

      const datos_mercado_verificados =
        datosMercado?.filter((d: any) => d.verificado).length || 0;
      const datos_mercado_pendientes =
        datosMercado?.filter((d: any) => !d.verificado).length || 0;

      // Contar usuarios únicos con vehículos
      const usuariosUnicos = new Set(vehiculos?.map((v: any) => v.user_id));
      const usuarios_con_vehiculos = usuariosUnicos.size;

      // Usuarios compartiendo datos (con datos económicos)
      const vehiculosConDatos = new Set(
        valoracionesEco?.map((v: any) => v.vehiculo_id)
      );
      const usuarios_compartiendo_datos =
        vehiculos
          ?.filter((v: any) => vehiculosConDatos.has(v.id))
          .map((v: any) => v.user_id)
          .filter((v: any, i: any, arr: any) => arr.indexOf(v) === i).length ||
        0;

      setMetricas({
        total_vehiculos,
        vehiculos_mes_actual,
        valor_total_parque,
        total_reportes_accidentes,
        reportes_pendientes,
        datos_mercado_verificados,
        datos_mercado_pendientes,
        usuarios_con_vehiculos,
        usuarios_compartiendo_datos,
      });

      console.log("✅ Métricas calculadas:", {
        total_vehiculos,
        valor_total_parque,
        usuarios_con_vehiculos,
      });
    } catch (error: any) {
      console.error("Error cargando métricas:", error);
      setError(
        `Error: ${error.message || "Error desconocido al cargar métricas"}`
      );
      // Establecer valores por defecto si hay error
      setMetricas({
        total_vehiculos: 0,
        vehiculos_mes_actual: 0,
        valor_total_parque: 0,
        total_reportes_accidentes: 0,
        reportes_pendientes: 0,
        datos_mercado_verificados: 0,
        datos_mercado_pendientes: 0,
        usuarios_con_vehiculos: 0,
        usuarios_compartiendo_datos: 0,
      });
    }
  };

  const loadAnalisis = async () => {
    try {
      const supabase = createClient();

      console.log("🚐 Cargando vehículos directamente desde las tablas...");

      // Cargar vehículos registrados
      const { data: vehiculos, error: vehiculosError } = await (supabase as any)
        .from("vehiculos_registrados")
        .select("*")
        .eq("activo", true);

      if (vehiculosError) {
        console.error("Error cargando vehículos:", vehiculosError);
        setError(`Error cargando vehículos: ${vehiculosError.message}`);
        return;
      }

      // Cargar datos económicos
      const { data: valoracionesEconomicas, error: valEcoError } = await (
        supabase as any
      )
        .from("vehiculo_valoracion_economica")
        .select("*");

      if (valEcoError) {
        console.error("Error cargando valoraciones económicas:", valEcoError);
      }

      // Cargar mantenimientos
      const { data: mantenimientos, error: mantError } = await (supabase as any)
        .from("mantenimientos")
        .select("*");

      if (mantError) {
        console.error("Error cargando mantenimientos:", mantError);
      }

      // Cargar averías
      const { data: averias, error: averiasError } = await (supabase as any)
        .from("averias")
        .select("*");

      if (averiasError) {
        console.error("Error cargando averías:", averiasError);
      }

      // Cargar reportes de accidentes
      const { data: reportes, error: reportesError } = await (supabase as any)
        .from("reportes_accidentes")
        .select("*");

      if (reportesError) {
        console.error("Error cargando reportes:", reportesError);
      }

      // Cargar kilometrajes (último de cada vehículo)
      const { data: kilometrajes, error: kmError } = await (supabase as any)
        .from("vehiculo_kilometraje")
        .select("vehiculo_id, kilometros, fecha");

      if (kmError) {
        console.error("Error cargando kilometrajes:", kmError);
      }

      console.log(`✅ ${vehiculos?.length || 0} vehículos cargados`);

      // Agrupar por marca y modelo
      const agrupados = new Map<string, AnalisisMarcaModelo>();

      vehiculos?.forEach((v: any) => {
        const marca = v.marca || "Sin marca";
        const modelo = v.modelo || "Sin modelo";
        const key = `${marca}-${modelo}`;

        if (!agrupados.has(key)) {
          agrupados.set(key, {
            marca,
            modelo,
            cantidad: 0,
            cantidad_vendidos: 0,
            año_promedio: 0,
            km_promedio: 0,
            precio_compra_promedio: 0,
            valor_actual_promedio: 0,
            depreciacion_media: 0,
            coste_mantenimiento_anual: 0,
            coste_averias_total: 0,
            num_reportes_accidentes: 0,
          });
        }

        const grupo = agrupados.get(key)!;
        grupo.cantidad++;

        // Sumar años
        if (v.año) {
          grupo.año_promedio += v.año;
        }

        // Buscar datos económicos de este vehículo
        const valEco = valoracionesEconomicas?.find(
          (ve: any) => ve.vehiculo_id === v.id
        );
        if (valEco) {
          if (valEco.precio_compra) {
            grupo.precio_compra_promedio += valEco.precio_compra;
          }

          // Obtener último kilometraje de vehiculo_kilometraje
          const kmsVehiculo = kilometrajes
            ?.filter((k: any) => k.vehiculo_id === v.id)
            .sort(
              (a: any, b: any) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );

          if (
            kmsVehiculo &&
            kmsVehiculo.length > 0 &&
            kmsVehiculo[0].kilometros
          ) {
            grupo.km_promedio += kmsVehiculo[0].kilometros;
          }

          // Contar si está vendido
          if (valEco.vendido) {
            grupo.cantidad_vendidos++;
          }

          // Valor actual: Si está vendido, usar precio_venta_final, sino valor_estimado_actual
          if (valEco.vendido && valEco.precio_venta_final) {
            grupo.valor_actual_promedio += valEco.precio_venta_final;
          } else if (valEco.valor_estimado_actual) {
            grupo.valor_actual_promedio += valEco.valor_estimado_actual;
          }
        }

        // Calcular mantenimientos
        const mantVehiculo =
          mantenimientos?.filter((m: any) => m.vehiculo_id === v.id) || [];
        const costoMant = mantVehiculo.reduce(
          (sum: any, m: any) => sum + (m.coste || 0),
          0
        );
        grupo.coste_mantenimiento_anual += costoMant;

        // Calcular averías
        const averiasVehiculo =
          averias?.filter((a: any) => a.vehiculo_id === v.id) || [];
        const costoAverias = averiasVehiculo.reduce(
          (sum: any, a: any) => sum + (a.coste_total || 0),
          0
        );
        grupo.coste_averias_total += costoAverias;

        // Contar reportes de accidentes
        const reportesVehiculo =
          reportes?.filter((r: any) => r.vehiculo_afectado_id === v.id) || [];
        grupo.num_reportes_accidentes += reportesVehiculo.length;
      });

      // Calcular promedios
      const analisisArray: AnalisisMarcaModelo[] = [];
      agrupados.forEach((grupo: any) => {
        grupo.año_promedio =
          grupo.año_promedio > 0
            ? Math.round(grupo.año_promedio / grupo.cantidad)
            : 0;
        grupo.km_promedio =
          grupo.km_promedio > 0
            ? Math.round(grupo.km_promedio / grupo.cantidad)
            : 0;
        grupo.precio_compra_promedio =
          grupo.precio_compra_promedio > 0
            ? Math.round(grupo.precio_compra_promedio / grupo.cantidad)
            : 0;
        grupo.coste_mantenimiento_anual =
          grupo.coste_mantenimiento_anual > 0
            ? Math.round(grupo.coste_mantenimiento_anual / grupo.cantidad)
            : 0;
        grupo.coste_averias_total = Math.round(
          grupo.coste_averias_total / grupo.cantidad
        );

        // Calcular depreciación (simplificado)
        if (
          grupo.precio_compra_promedio > 0 &&
          grupo.valor_actual_promedio > 0
        ) {
          grupo.depreciacion_media =
            ((grupo.precio_compra_promedio - grupo.valor_actual_promedio) /
              grupo.precio_compra_promedio) *
            100;
        }

        analisisArray.push(grupo);
      });

      console.log(`✅ ${analisisArray.length} grupos de marca/modelo`);
      setAnalisis(analisisArray);
      setError(null);
    } catch (error: any) {
      console.error("Error cargando análisis:", error);
      setError(
        `Error: ${error.message || "Error desconocido al cargar vehículos"}`
      );
      setAnalisis([]);
    }
  };

  // Definir columnas para AdminTable
  const columns: AdminTableColumn<AnalisisMarcaModelo>[] = [
    {
      key: "marca",
      title: "Marca",
      sortable: true,
      className: "w-[16%]",
      nowrap: false,
      searchable: true,
      render: (item) => (
        <div className="flex items-center">
          <TruckIcon className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {item.marca}
            </div>
            <div className="text-sm text-gray-500">{item.modelo}</div>
          </div>
        </div>
      ),
      exportValue: (item) => `${item.marca} ${item.modelo}`,
    },
    {
      key: "cantidad",
      title: "Cantidad",
      sortable: true,
      className: "w-[8%]",
      render: (item) => (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {item.cantidad}
        </span>
      ),
    },
    {
      key: "cantidad_vendidos",
      title: "Vendidos",
      sortable: true,
      className: "w-[8%]",
      render: (item) =>
        item.cantidad_vendidos > 0 ? (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            ✓ {item.cantidad_vendidos}
          </span>
        ) : (
          <span className="text-gray-400">0</span>
        ),
    },
    {
      key: "año_promedio",
      title: "Año Prom.",
      sortable: true,
      className: "w-[9%]",
      render: (item) => (
        <span className="text-sm text-gray-900">
          {formatNumber(item.año_promedio)}
        </span>
      ),
    },
    {
      key: "km_promedio",
      title: "Km Prom.",
      sortable: true,
      className: "w-[10%]",
      render: (item) => (
        <span className="text-sm text-gray-900">
          {formatNumber(item.km_promedio)} km
        </span>
      ),
    },
    {
      key: "precio_compra_promedio",
      title: "Precio Compra",
      sortable: true,
      className: "w-[11%]",
      render: (item) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(item.precio_compra_promedio)}
        </span>
      ),
    },
    {
      key: "valor_actual_promedio",
      title: "Valor Actual",
      sortable: true,
      className: "w-[11%]",
      render: (item) => (
        <span className="text-sm font-medium text-green-600">
          {formatCurrency(item.valor_actual_promedio)}
        </span>
      ),
    },
    {
      key: "depreciacion_media",
      title: "Depreciación",
      sortable: true,
      className: "w-[10%]",
      render: (item) =>
        item.depreciacion_media !== null ? (
          <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              item.depreciacion_media > 25
                ? "bg-red-100 text-red-800" // Pérdida alta (>25%)
                : item.depreciacion_media > 10
                ? "bg-orange-100 text-orange-800" // Pérdida media (10-25%)
                : item.depreciacion_media > 0
                ? "bg-yellow-100 text-yellow-800" // Pérdida baja (0-10%)
                : "bg-gray-100 text-gray-600" // Sin datos o 0%
            }`}
          >
            -{formatNumber(item.depreciacion_media)}%
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        ),
    },
    {
      key: "coste_mantenimiento_anual",
      title: "Mant./Año",
      sortable: true,
      className: "w-[9%]",
      render: (item) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(item.coste_mantenimiento_anual)}
        </span>
      ),
    },
    {
      key: "num_reportes_accidentes",
      title: "Accidentes",
      sortable: true,
      className: "w-[8%]",
      render: (item) =>
        item.num_reportes_accidentes > 0 ? (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            {item.num_reportes_accidentes}
          </span>
        ) : (
          <span className="text-gray-400">0</span>
        ),
    },
  ];

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Panel
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <TruckIcon className="w-10 h-10 text-cyan-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Gestión de Vehículos
            </h1>
          </div>
          <p className="text-gray-600">
            Análisis completo del parque de autocaravanas registradas
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Error al cargar datos
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas Clave */}
        {metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Vehículos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metricas.total_vehiculos}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    +{metricas.vehiculos_mes_actual} este mes
                  </p>
                </div>
                <TruckIcon className="w-12 h-12 text-cyan-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Valor Total Parque
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metricas.valor_total_parque)}
                  </p>
                </div>
                <CurrencyEuroIcon className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Datos de Mercado</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-blue-600">
                      {metricas.datos_mercado_verificados}
                    </p>
                    <span className="text-sm font-medium text-blue-600">verificados</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {metricas.datos_mercado_pendientes}
                    </span>
                    <span className="text-xs text-gray-400">estimaciones IA</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Transacciones reales + valoraciones
                  </p>
                </div>
                <ChartBarIcon className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {metricas.usuarios_con_vehiculos}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {metricas.usuarios_compartiendo_datos} compartiendo datos
                  </p>
                </div>
                <ChartBarIcon className="w-12 h-12 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Análisis con AdminTable */}
        <AdminTable
          data={analisis}
          columns={columns}
          loading={loading}
          emptyMessage="No hay datos de vehículos disponibles"
          searchPlaceholder="Buscar por marca, modelo..."
          exportFilename="vehiculos_analisis"
          initialSortColumn="cantidad"
          initialSortDirection="desc"
        />
      </div>
    </div>
  );
}
