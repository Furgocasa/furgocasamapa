"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  TableCellsIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface DatoMercado {
  id: string;
  marca: string | null;
  modelo: string | null;
  chasis: string | null;
  año: number | null;
  precio: number | null;
  kilometros: number | null;
  verificado: boolean;
  estado: string | null;
  origen: string | null;
  tipo_dato: string | null;
  fecha_transaccion: string | null;
  created_at: string;
}

export default function DatosMercadoPage() {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<DatoMercado[]>([]);
  const [filteredDatos, setFilteredDatos] = useState<DatoMercado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroVerificado, setFiltroVerificado] = useState<"todos" | "verificados" | "no_verificados">("todos");
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null); // Datos extraídos pendientes de confirmar
  const [saving, setSaving] = useState(false);

  // 📊 Estados para ordenación y paginación
  const [sortColumn, setSortColumn] = useState<keyof DatoMercado | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // 🖱️ Estados para drag-to-scroll (scroll suave como móvil)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  const router = useRouter();

  // 🖱️ Funciones para drag-to-scroll con inercia (como móvil)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // No activar drag si se hace click en un botón o enlace
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('th')) {
      return;
    }
    
    const container = e.currentTarget;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    setLastX(e.pageX);
    setLastTime(Date.now());
    setVelocity(0);
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
    
    // Cancelar cualquier animación de inercia en curso
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      applyInertia(e.currentTarget);
      setIsDragging(false);
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      applyInertia(e.currentTarget);
      setIsDragging(false);
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const container = e.currentTarget;
    const x = e.pageX - container.offsetLeft;
    const currentTime = Date.now();
    
    // Calcular velocidad para la inercia
    const deltaX = e.pageX - lastX;
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > 0) {
      setVelocity(deltaX / deltaTime);
    }
    
    setLastX(e.pageX);
    setLastTime(currentTime);
    
    // Scroll directo (1:1 como en móvil)
    const walk = x - startX;
    container.scrollLeft = scrollLeft - walk;
  };

  // Aplicar inercia después de soltar (efecto momentum como en móvil)
  const applyInertia = (container: HTMLDivElement) => {
    let currentVelocity = velocity * 50; // Amplificar velocidad
    const friction = 0.92; // Fricción para desacelerar gradualmente
    const minVelocity = 0.5; // Velocidad mínima antes de detenerse
    
    const animate = () => {
      if (Math.abs(currentVelocity) < minVelocity) {
        return; // Detener animación
      }
      
      container.scrollLeft -= currentVelocity;
      currentVelocity *= friction; // Aplicar fricción
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (Math.abs(currentVelocity) >= minVelocity) {
      animate();
    }
  };

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [datos, busqueda, filtroVerificado]);

  const checkAdminAndLoad = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user || !session.user.user_metadata?.is_admin) {
      router.push("/mapa");
      return;
    }

    await loadDatos();
    setLoading(false);
  };

  const loadDatos = async () => {
    try {
      const response = await fetch("/api/admin/datos-mercado");
      const data = await response.json();

      if (response.ok) {
        setDatos(data.datos || []);
      } else {
        setError(data.error || "Error al cargar datos");
      }
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      setError(err.message);
    }
  };

  const applyFilters = () => {
    let filtered = [...datos];

    // Filtro por verificado
    if (filtroVerificado === "verificados") {
      filtered = filtered.filter((d) => d.verificado);
    } else if (filtroVerificado === "no_verificados") {
      filtered = filtered.filter((d) => !d.verificado);
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.marca?.toLowerCase().includes(searchLower) ||
          d.modelo?.toLowerCase().includes(searchLower) ||
          d.estado?.toLowerCase().includes(searchLower) ||
          d.origen?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDatos(filtered);
    setCurrentPage(1); // Reset a página 1 cuando cambian filtros
  };

  // 🔄 Función de ordenación
  const handleSort = (column: keyof DatoMercado) => {
    if (sortColumn === column) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nueva columna, ordenar descendente por defecto
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // 📄 Aplicar ordenación y paginación
  const getSortedAndPaginatedData = () => {
    let sorted = [...filteredDatos];

    // Ordenar
    if (sortColumn) {
      sorted.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Manejar nulos
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        // Comparar
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          return sortDirection === "asc"
            ? (aVal ? 1 : 0) - (bVal ? 1 : 0)
            : (bVal ? 1 : 0) - (aVal ? 1 : 0);
        }

        return 0;
      });
    }

    // Paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      data: paginated,
      totalPages: Math.ceil(sorted.length / itemsPerPage),
      totalItems: sorted.length,
    };
  };

  // 🔍 PASO 1: Extraer datos de la URL (solo extracción, NO guarda)
  const handleExtractFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtracting(true);
    setExtractMessage(null);
    setExtractedData(null);

    try {
      // Llamar al endpoint pero con parámetro para NO guardar
      const response = await fetch("/api/admin/datos-mercado/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extractUrl, preview: true }), // preview: true = solo extraer
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar datos extraídos para vista previa
        setExtractedData(data);
        setExtractMessage({
          type: "success",
          text: `✅ Datos extraídos correctamente. Revisa y confirma para guardar.`,
        });
      } else {
        setExtractMessage({
          type: "error",
          text: data.error || "Error al extraer datos",
        });
      }
    } catch (err: any) {
      console.error("Error extrayendo datos:", err);
      setExtractMessage({
        type: "error",
        text: err.message || "Error de conexión",
      });
    } finally {
      setExtracting(false);
    }
  };

  // ✅ PASO 2: Confirmar y guardar en BD
  const handleConfirmAndSave = async () => {
    if (!extractedData) return;

    setSaving(true);
    setExtractMessage(null);

    try {
      const response = await fetch("/api/admin/datos-mercado/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData),
      });

      const data = await response.json();

      if (response.ok) {
        setExtractMessage({
          type: "success",
          text: `✅ Guardado exitosamente en la base de datos`,
        });
        setExtractUrl("");
        setExtractedData(null);
        
        // Cerrar modal después de 1 segundo
        setTimeout(() => {
          setShowExtractorModal(false);
          setExtractMessage(null);
        }, 1500);

        await loadDatos();
      } else {
        setExtractMessage({
          type: "error",
          text: `❌ Error al guardar: ${data.error || "Error desconocido"}${data.details ? ` - ${data.details}` : ""}`,
        });
      }
    } catch (err: any) {
      console.error("Error guardando datos:", err);
      setExtractMessage({
        type: "error",
        text: `❌ Error de conexión: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // 🔄 Reiniciar extractor
  const handleResetExtractor = () => {
    setExtractUrl("");
    setExtractedData(null);
    setExtractMessage(null);
    setExtracting(false);
    setSaving(false);
  };

  const handleDeleteDato = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este dato de mercado?")) return;

    try {
      const response = await fetch(`/api/admin/datos-mercado/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadDatos();
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (err: any) {
      console.error("Error eliminando dato:", err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Volver al Panel Admin
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TableCellsIcon className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Datos de Mercado
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona los comparables para valoraciones IA
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExtractorModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Extraer de URL
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Datos</p>
                <p className="text-2xl font-bold text-gray-900">{datos.length}</p>
              </div>
              <TableCellsIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verificados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {datos.filter((d) => d.verificado).length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimaciones IA</p>
                <p className="text-2xl font-bold text-gray-900">
                  {datos.filter((d) => !d.verificado).length}
                </p>
              </div>
              <XCircleIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Marca, modelo, origen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Verificado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FunnelIcon className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={filtroVerificado}
                onChange={(e) =>
                  setFiltroVerificado(e.target.value as any)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="verificados">Solo Verificados</option>
                <option value="no_verificados">Solo Estimaciones</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selector de items por página */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Mostrar:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">registros por página</span>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{filteredDatos.length}</span> registros
            {            (busqueda || filtroVerificado !== "todos") && ` (de ${datos.length} totales)`}
          </div>
        </div>

        {/* Tabla de datos con ordenación */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div 
            className="overflow-x-auto" 
            style={{ 
              width: '100%', 
              maxWidth: '100%', 
              cursor: 'grab',
              WebkitOverflowScrolling: 'touch', // Scroll suave en webkit (Safari)
              scrollBehavior: 'auto' // Auto para drag manual, smooth se aplica en inercia
            }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <table className="divide-y divide-gray-200" style={{ width: '100%', minWidth: '1600px', tableLayout: 'fixed' }}>
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {/* Vehículo */}
                  <th
                    onClick={() => handleSort("marca")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-56 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Vehículo
                      {sortColumn === "marca" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Chasis */}
                  <th
                    onClick={() => handleSort("chasis")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-40 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Chasis
                      {sortColumn === "chasis" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Precio */}
                  <th
                    onClick={() => handleSort("precio")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-32 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Precio
                      {sortColumn === "precio" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* KM */}
                  <th
                    onClick={() => handleSort("kilometros")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-32 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      KM
                      {sortColumn === "kilometros" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Año */}
                  <th
                    onClick={() => handleSort("año")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-24 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Año
                      {sortColumn === "año" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Origen */}
                  <th
                    onClick={() => handleSort("origen")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-40 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Origen
                      {sortColumn === "origen" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Estado */}
                  <th
                    onClick={() => handleSort("estado")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-48 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Estado
                      {sortColumn === "estado" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Fecha */}
                  <th
                    onClick={() => handleSort("created_at")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none w-32 bg-gray-50"
                  >
                    <div className="flex items-center gap-1">
                      Fecha
                      {sortColumn === "created_at" && (
                        sortDirection === "asc" ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  {/* Acciones */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 bg-gray-50">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const { data: paginatedData } = getSortedAndPaginatedData();
                  return paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {busqueda || filtroVerificado !== "todos"
                          ? "No se encontraron resultados"
                          : "No hay datos de mercado"}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((dato) => (
                      <tr key={dato.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {dato.verificado ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={`${dato.marca || "-"} ${dato.modelo || "-"}`}>
                                {dato.marca || "-"} {dato.modelo || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 max-w-full truncate" title={dato.chasis || "No especificado"}>
                            {dato.chasis || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dato.precio
                            ? new Intl.NumberFormat("es-ES", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 0,
                              }).format(dato.precio)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dato.kilometros
                            ? `${new Intl.NumberFormat("es-ES").format(
                                dato.kilometros
                              )} km`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dato.año || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-full truncate" title={dato.origen || "Desconocido"}>
                            {dato.origen || "Desconocido"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate" title={dato.estado || "-"}>
                            {dato.estado || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dato.fecha_transaccion
                            ? new Date(dato.fecha_transaccion).toLocaleDateString(
                                "es-ES"
                              )
                            : new Date(dato.created_at).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteDato(dato.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {(() => {
          const { totalPages, totalItems } = getSortedAndPaginatedData();
          if (totalPages <= 1) return null;

          const pages = [];
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

          if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }

          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }

          return (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                de <span className="font-semibold">{totalItems}</span> registros
              </div>

              <div className="flex items-center gap-2">
                {/* Botón Anterior */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {/* Primera página */}
                {startPage > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      1
                    </button>
                    {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                  </>
                )}

                {/* Páginas visibles */}
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Última página */}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Botón Siguiente */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal Extractor de URL con Vista Previa */}
      {showExtractorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {extractedData ? "Vista Previa de Datos" : "Extraer Datos de URL"}
              </h2>
              <button
                onClick={() => {
                  setShowExtractorModal(false);
                  handleResetExtractor();
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* PASO 1: Formulario de extracción */}
            {!extractedData && (
              <>
                <p className="text-gray-600 mb-4">
                  Pega la URL de un anuncio de autocaravana y extraeremos
                  automáticamente los datos (marca, modelo, año, precio, km).
                </p>

                <form onSubmit={handleExtractFromUrl}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del Anuncio
                    </label>
                    <input
                      type="url"
                      value={extractUrl}
                      onChange={(e) => setExtractUrl(e.target.value)}
                      placeholder="https://www.coches.net/autocaravana..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      disabled={extracting}
                    />
                  </div>

                  {extractMessage && (
                    <div
                      className={`mb-4 p-4 rounded-lg ${
                        extractMessage.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {extractMessage.text}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExtractorModal(false);
                        handleResetExtractor();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={extracting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={extracting || !extractUrl}
                    >
                      {extracting ? (
                        <>
                          <span className="animate-spin inline-block mr-2">⏳</span>
                          Extrayendo...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-5 h-5 inline mr-2" />
                          Extraer Datos
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* PASO 2: Vista previa de datos extraídos */}
            {extractedData && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>✅ Extracción completada.</strong> Revisa los datos y confirma para guardarlos en la base de datos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Marca */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Marca
                    </label>
                    <p className="text-lg font-bold text-gray-900">
                      {extractedData.marca || <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Modelo */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Modelo
                    </label>
                    <p className="text-lg font-bold text-gray-900">
                      {extractedData.modelo || <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Chasis */}
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <label className="block text-xs font-medium text-indigo-700 uppercase mb-1">
                      Chasis
                    </label>
                    <p className="text-lg font-bold text-indigo-900">
                      {extractedData.chasis || <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Año */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Año
                    </label>
                    <p className="text-lg font-bold text-gray-900">
                      {extractedData.año || <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <label className="block text-xs font-medium text-green-700 uppercase mb-1">
                      Precio
                    </label>
                    <p className="text-lg font-bold text-green-900">
                      {extractedData.precio
                        ? new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          }).format(extractedData.precio)
                        : <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Kilómetros */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <label className="block text-xs font-medium text-orange-700 uppercase mb-1">
                      Kilómetros
                    </label>
                    <p className="text-lg font-bold text-orange-900">
                      {extractedData.kilometros
                        ? `${new Intl.NumberFormat("es-ES").format(extractedData.kilometros)} km`
                        : <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Estado
                    </label>
                    <p className="text-lg font-bold text-gray-900">
                      {extractedData.estado || <span className="text-gray-400">-</span>}
                    </p>
                  </div>
                </div>

                {extractMessage && (
                  <div
                    className={`mb-4 p-4 rounded-lg ${
                      extractMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {extractMessage.text}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleResetExtractor}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={saving}
                  >
                    Intentar Otra URL
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin inline-block mr-2">⏳</span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                        Confirmar y Guardar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
