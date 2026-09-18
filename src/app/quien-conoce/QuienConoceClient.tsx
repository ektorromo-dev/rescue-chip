'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  X, 
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';

export interface PersonalCapacitado {
  id: string;
  nombre: string;
  folio: string;
  organizacion: string;
  fecha_capacitacion: string;
  duracion_horas: number | null;
  sede: string | null;
  created_at?: string;
}

interface QuienConoceClientProps {
  personal: PersonalCapacitado[];
  initialFolio?: string;
}

export default function QuienConoceClient({ personal, initialFolio = '' }: QuienConoceClientProps) {
  const [search, setSearch] = useState(initialFolio);
  const [selectedOrg, setSelectedOrg] = useState('Todas');
  const [showAll, setShowAll] = useState(Boolean(initialFolio));

  // Organizaciones únicas calculadas dinámicamente
  const organizaciones = useMemo(() => {
    const orgs = personal
      .map((p) => p.organizacion?.trim())
      .filter((org): org is string => Boolean(org));
    return Array.from(new Set(orgs)).sort((a, b) => a.localeCompare(b, 'es'));
  }, [personal]);

  // Última fecha de capacitación
  const ultimaCapacitacion = useMemo(() => {
    if (personal.length === 0) return '—';
    const dates = personal
      .map((p) => p.fecha_capacitacion?.trim())
      .filter(Boolean);
    if (dates.length === 0) return '—';
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    return sorted[0];
  }, [personal]);

  // Filtrado de personal en el cliente
  const filteredPersonal = useMemo(() => {
    const query = search.trim().toLowerCase();
    return personal
      .filter((item) => {
        const matchOrg = 
          selectedOrg === 'Todas' || 
          item.organizacion?.trim().toLowerCase() === selectedOrg.toLowerCase();

        if (!matchOrg) return false;
        if (!query) return true;

        const matchName = item.nombre?.toLowerCase().includes(query) || false;
        const matchFolio = item.folio?.toLowerCase().includes(query) || false;
        const matchOrgText = item.organizacion?.toLowerCase().includes(query) || false;
        const matchSede = item.sede?.toLowerCase().includes(query) || false;

        return matchName || matchFolio || matchOrgText || matchSede;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [personal, search, selectedOrg]);

  // Decisión de mostrar u ocultar la lista de resultados
  const hasActiveSearch = search.trim().length > 0;
  const hasOrgFilter = selectedOrg !== 'Todas';
  const shouldRenderList = hasActiveSearch || hasOrgFilter || showAll;

  // Verificación si el folio ingresado coincide exactamente con un registro (caso QR)
  const exactFolioMatch = useMemo(() => {
    if (!search.trim()) return null;
    return personal.find((p) => p.folio.trim().toLowerCase() === search.trim().toLowerCase()) || null;
  }, [personal, search]);

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedOrg('Todas');
    setShowAll(false);
  };

  return (
    <div 
      className="min-h-screen font-sans antialiased"
      style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#0A0A08' }}
    >
      {/* Estilos CSS dedicados para garantizar fidelidad tipográfica, espaciado y tema claro */}
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          background-color: #FFFFFF !important;
          color: #0A0A08 !important;
        }
        .max-w-5xl,
        .qc-wrap {
          max-width: 1024px !important;
          margin: 0 auto !important;
          padding: 28px 16px 64px 16px;
          box-sizing: border-box !important;
          width: 100% !important;
        }
        @media (min-width: 640px) {
          .max-w-5xl,
          .qc-wrap {
            padding: 44px 24px 80px 24px;
          }
        }
        .qc-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 28px;
        }
        @media (min-width: 640px) {
          .qc-header {
            margin-bottom: 36px;
          }
        }
        .qc-title {
          font-size: 28px;
          font-weight: 800;
          color: #0A0A08;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        @media (min-width: 640px) {
          .qc-title {
            font-size: 38px;
          }
        }
        .qc-subtitle {
          max-width: 640px;
          font-size: 14.5px;
          color: #5A554E;
          line-height: 1.55;
          margin: 0 0 16px 0;
        }
        @media (min-width: 640px) {
          .qc-subtitle {
            font-size: 16.5px;
          }
        }
        .qc-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          color: #6B6B66;
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 0 !important;
        }
        @media (min-width: 640px) {
          .qc-status {
            font-size: 13.5px;
          }
        }
        .qc-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #2FA758;
          flex-shrink: 0;
        }
        .qc-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        @media (min-width: 640px) {
          .qc-stats-grid {
            gap: 16px;
            margin-bottom: 32px;
          }
        }
        .qc-stat-card {
          background-color: rgba(242, 238, 235, 0.95);
          border: 1px solid rgba(10, 10, 8, 0.06);
          border-radius: 16px;
          padding: 16px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        @media (min-width: 640px) {
          .qc-stat-card {
            padding: 20px 16px;
            border-radius: 20px;
          }
        }
        .qc-stat-num {
          font-size: 22px;
          font-weight: 800;
          color: #E8231A;
          line-height: 1.1;
        }
        @media (min-width: 640px) {
          .qc-stat-num {
            font-size: 32px;
          }
        }
        .qc-stat-label {
          font-size: 12px;
          font-weight: 500;
          color: #6B6B66;
          text-transform: none !important;
          letter-spacing: normal !important;
          margin-top: 4px;
        }
        @media (min-width: 640px) {
          .qc-stat-label {
            font-size: 13px;
          }
        }
        .qc-search-wrap {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
        }
        input.qc-search-input,
        input.qc-search-input:not([type="checkbox"]):not([type="radio"]),
        input.quien-conoce-input,
        input.quien-conoce-input:not([type="checkbox"]):not([type="radio"]) {
          width: 100% !important;
          background-color: #FFFFFF !important;
          color: #0A0A08 !important;
          border: 1.5px solid #E2DCD5 !important;
          border-radius: 16px !important;
          padding: 14px 44px 14px 46px !important;
          font-size: 15px !important;
          font-weight: 500 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
          transition: all 0.2s ease !important;
          box-sizing: border-box !important;
          display: block !important;
        }
        input.qc-search-input:focus,
        input.qc-search-input:not([type="checkbox"]):not([type="radio"]):focus,
        input.quien-conoce-input:focus,
        input.quien-conoce-input:not([type="checkbox"]):not([type="radio"]):focus {
          border-color: #E8231A !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(232, 35, 26, 0.12) !important;
        }
        input.qc-search-input::placeholder,
        input.qc-search-input:not([type="checkbox"]):not([type="radio"])::placeholder,
        input.quien-conoce-input::placeholder,
        input.quien-conoce-input:not([type="checkbox"]):not([type="radio"])::placeholder {
          color: #8C827A !important;
        }
        .qc-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A746D;
          pointer-events: none;
        }
        .qc-clear-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7A746D;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qc-clear-btn:hover {
          color: #0A0A08;
        }
        .qc-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .qc-tab {
          font-size: 13px;
          font-weight: 600;
          padding: 7px 16px;
          border-radius: 999px;
          border: 1px solid rgba(10, 10, 8, 0.08);
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          background-color: #F2EEEB;
          color: #5A554E;
        }
        .qc-tab:hover {
          background-color: #E7E2DD;
          color: #0A0A08;
        }
        .qc-tab.active {
          background-color: #E8231A;
          color: #FFFFFF;
          border-color: #E8231A;
        }
        .qc-empty-box {
          text-align: center;
          padding: 36px 20px;
          background-color: rgba(242, 238, 235, 0.5);
          border: 1.5px dashed rgba(10, 10, 8, 0.12);
          border-radius: 16px;
          margin-bottom: 28px;
        }
        .qc-empty-desc {
          font-size: 14px;
          color: #6B6B66;
          max-width: 440px;
          margin: 0 auto 16px auto;
          line-height: 1.55;
        }
        .qc-show-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #E8231A;
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .qc-show-all-btn:hover {
          background-color: rgba(232, 35, 26, 0.07);
        }
        .qc-results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 32px;
        }
        @media (min-width: 640px) {
          .qc-results-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }
        .qc-card {
          background-color: #F2EEEB;
          border: 1px solid rgba(10, 10, 8, 0.06);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: border-color 0.2s ease;
        }
        .qc-card:hover {
          border-color: rgba(232, 35, 26, 0.35);
        }
        .qc-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .qc-card-org {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #5A554E;
        }
        .qc-card-folio {
          background-color: #F5E3E2;
          color: #C94A45;
          border: 1px solid rgba(201, 74, 69, 0.2);
          font-family: monospace;
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: -0.01em;
        }
        .qc-card-name {
          font-size: 16px;
          font-weight: 700;
          color: #0A0A08;
          margin: 0 0 14px 0;
          line-height: 1.35;
        }
        .qc-card-footer {
          padding-top: 12px;
          border-top: 1px solid rgba(10, 10, 8, 0.06);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 12px;
          color: #5A554E;
        }
        .qc-footer {
          text-align: center;
          font-size: 12px;
          color: #7A746D;
          margin-top: 48px;
          font-weight: 500;
        }
      `}} />

      {/* Franja superior decorativa */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#E8231A' }} />

      <div className="max-w-5xl qc-wrap mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Cabecera centrada con Logo Oficial Horizontal */}
        <header className="qc-header">
          <Link 
            href="/" 
            style={{ display: 'inline-block', marginBottom: '20px' }}
            title="Ir a inicio de RescueChip"
          >
            <Image
              src="/logo-horizontal.png"
              alt="RescueChip"
              width={322}
              height={84}
              priority
              style={{ height: '84px', width: '322px' }}
            />
          </Link>

          <h1 className="qc-title">
            Personal capacitado
          </h1>
          <p className="qc-subtitle">
            Paramédicos y personal de emergencias que ya conocen cómo identificar y usar RescueChip en atención prehospitalaria.
          </p>

          {/* Status badge de referencia */}
          <div className="qc-status">
            <span className="qc-status-dot" />
            <span>Directorio <b style={{ color: '#2FA758', fontWeight: 700 }}>verificado</b> · actualizado a Septiembre 2026</span>
          </div>
        </header>

        {/* 3 Estadísticas centradas con tarjetas bg-[#F2EEEB] */}
        <section className="qc-stats-grid" aria-label="Estadísticas de capacitación">
          {/* Stat 1: Capacitados */}
          <div className="qc-stat-card">
            <div className="qc-stat-num">
              {personal.length}
            </div>
            <div className="qc-stat-label">
              Capacitados
            </div>
          </div>

          {/* Stat 2: Organización */}
          <div className="qc-stat-card">
            <div className="qc-stat-num">
              {organizaciones.length}
            </div>
            <div className="qc-stat-label">
              Organización
            </div>
          </div>

          {/* Stat 3: Última sesión */}
          <div className="qc-stat-card">
            <div 
              className="qc-stat-num"
              style={{ 
                fontSize: ultimaCapacitacion.length > 10 ? '16px' : undefined,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {ultimaCapacitacion}
            </div>
            <div className="qc-stat-label">
              Última sesión
            </div>
          </div>
        </section>

        {/* Buscador Principal Amplio */}
        <section className="qc-search-wrap" aria-label="Buscador de personal">
          <Search className="qc-search-icon" style={{ width: '20px', height: '20px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca por nombre o folio (ej. RSC-CERT-...)"
            aria-label="Busca por nombre o folio"
            className="qc-search-input quien-conoce-input"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Borrar búsqueda"
              className="qc-clear-btn"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          )}
        </section>

        {/* Filtros por Organización */}
        {organizaciones.length > 0 && (
          <section className="qc-tabs" aria-label="Filtro por organización">
            <button
              type="button"
              onClick={() => setSelectedOrg('Todas')}
              className={`qc-tab ${selectedOrg === 'Todas' ? 'active' : ''}`}
            >
              Todas ({personal.length})
            </button>
            {organizaciones.map((org) => {
              const count = personal.filter((p) => p.organizacion?.trim() === org).length;
              const isSelected = selectedOrg.toLowerCase() === org.toLowerCase();
              return (
                <button
                  key={org}
                  type="button"
                  onClick={() => setSelectedOrg(org)}
                  className={`qc-tab ${isSelected ? 'active' : ''}`}
                >
                  {org} ({count})
                </button>
              );
            })}
          </section>
        )}

        {/* Aviso de verificación por Folio Exacto (caso QR constancia) */}
        {exactFolioMatch && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#064E3B',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#059669', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
              <p style={{ fontWeight: 700, margin: 0, color: '#064E3B' }}>
                Constancia de capacitación verificada
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#065F46' }}>
                El folio <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{exactFolioMatch.folio}</span> pertenece a <strong>{exactFolioMatch.nombre}</strong>, acreditado(a) por <strong>{exactFolioMatch.organizacion}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Bloque Inicial: Buscador primero. Si no hay búsqueda ni filtro activo y showAll es false */}
        {!shouldRenderList ? (
          <div className="qc-empty-box">
            <p className="qc-empty-desc">
              Ingresa un nombre o folio para buscar en el directorio, o consulta la lista completa.
            </p>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="qc-show-all-btn"
            >
              <span>Ver todos los registros ({personal.length})</span>
              <ChevronDown style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        ) : (
          /* Lista de Tarjetas de Resultado */
          <main aria-label="Resultados de personal capacitado">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '16px' }}>
              <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#7A746D', margin: 0, flex: 1 }}>
                Mostrando <span style={{ fontWeight: 700, color: '#0A0A08' }}>{filteredPersonal.length}</span> {filteredPersonal.length === 1 ? 'persona capacitada' : 'personas capacitadas'}
                {hasActiveSearch && <span> para &quot;{search}&quot;</span>}
              </p>
              {showAll && !hasActiveSearch && !hasOrgFilter && (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  style={{ fontSize: '12px', color: '#7A746D', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Ocultar lista completa
                </button>
              )}
            </div>

            {filteredPersonal.length === 0 ? (
              <div className="qc-empty-box">
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A08', margin: '0 0 6px 0' }}>
                  No se encontraron registros
                </p>
                <p style={{ fontSize: '13px', color: '#7A746D', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                  No hay personas capacitadas que coincidan con la búsqueda o filtro seleccionado.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#E8231A', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Restablecer búsqueda y filtros
                </button>
              </div>
            ) : (
              /* Grilla responsive: 1 columna en móvil / 2 columnas en desktop */
              <div className="qc-results-grid">
                {filteredPersonal.map((persona) => (
                  <article
                    key={persona.id}
                    className="qc-card"
                  >
                    <div>
                      {/* Cabecera de la tarjeta: Folio Badge y Organización */}
                      <div className="qc-card-header">
                        <div className="qc-card-org">
                          <Building2 style={{ width: '14px', height: '14px', color: '#0A0A08' }} />
                          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {persona.organizacion}
                          </span>
                        </div>
                        {/* Badge de Folio */}
                        <span className="qc-card-folio">
                          {persona.folio}
                        </span>
                      </div>

                      {/* Nombre */}
                      <h2 className="qc-card-name">
                        {persona.nombre}
                      </h2>
                    </div>

                    {/* Metadatos: Fecha, Horas, Sede */}
                    <div className="qc-card-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar style={{ width: '14px', height: '14px', color: '#E8231A', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{persona.fecha_capacitacion}</span>
                      </div>

                      {persona.duracion_horas ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <Clock style={{ width: '14px', height: '14px', color: '#7A746D', flexShrink: 0 }} />
                          <span>{persona.duracion_horas} {persona.duracion_horas === 1 ? 'hora' : 'horas'}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: '#047857', fontWeight: 600 }}>
                          <CheckCircle2 style={{ width: '14px', height: '14px', color: '#059669', flexShrink: 0 }} />
                          <span>Acreditado</span>
                        </div>
                      )}

                      {persona.sede && (
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7A746D', paddingTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <MapPin style={{ width: '12px', height: '12px', color: '#7A746D', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sede: {persona.sede}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        )}

        {/* Footer oficial de referencia */}
        <footer className="qc-footer">
          NOM&#8209;034&#8209;SSA3&#8209;2013 &nbsp;·&nbsp; <b style={{ color: '#0A0A08' }}>rescue-chip.com</b>
        </footer>
      </div>
    </div>
  );
}
