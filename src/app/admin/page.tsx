'use client'
// src/app/admin/page.tsx
// ============================================================
// RESCUECHIP — Dashboard Admin Completo
// Ruta: rescue-chip.com/admin
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── PALETA ──────────────────────────────────────────────────
const C = {
  red: '#C0392B', redDim: 'rgba(192,57,43,0.12)',
  bg: '#0D0D0D', surface: '#161616', card: '#1C1C1C', border: '#2A2A2A',
  text: '#F0F0F0', muted: '#888', faint: '#333',
  green: '#27AE60', greenDim: 'rgba(39,174,96,0.12)',
  amber: '#F39C12', amberDim: 'rgba(243,156,18,0.12)',
  blue: '#2980B9', blueDim: 'rgba(41,128,185,0.12)',
  navy: '#1A3A5C', purple: '#8E44AD',
}

const PIE_COLORS = [C.red, C.amber, C.blue, C.green, C.purple, '#1ABC9C']

// ── CONSTANTES ───────────────────────────────────────────────
const ESTADOS = ['CDMX', 'Jalisco', 'Nuevo León', 'Estado de México', 'Puebla', 'Querétaro', 'Guanajuato', 'Otro']
const TIPOS_ACC = ['Colisión vial', 'Caída propia', 'Atropellamiento', 'Colisión múltiple', 'Otro']
const OUTCOMES = ['Chip escaneado por paramédico', 'Contacto de emergencia notificado', 'Información médica utilizada', 'Solo chip leído', 'No confirmado']
const PLANES = ['Individual ($349)', 'Pareja ($549)', 'Familiar ($949)']
const CANALES = ['Tienda web', 'Rodada', 'Taller consignación', 'Venta directa', 'Instagram DM', 'WhatsApp', 'Referido', 'Otro']
const SEVERIDADES = ['leve', 'moderado', 'grave', 'critico']
const STAGE_LABELS: Record<string, string> = {
  prospecto: '🔵 Prospecto', contactado: '📞 Contactado',
  reunion_agendada: '📅 Reunión agendada', demo_realizada: '🎯 Demo realizada',
  propuesta_enviada: '📋 Propuesta enviada', negociacion: '🤝 Negociación',
  cerrado_ganado: '✅ Ganado', cerrado_perdido: '❌ Perdido', pausado: '⏸ Pausado'
}
const WS_STATUS_LABELS: Record<string, string> = {
  prospecto: '🔵 Prospecto', contactado: '📞 Contactado',
  activo: '✅ Activo', inactivo: '⚫ Inactivo', pausado: '⏸ Pausado'
}

// ── HELPERS ──────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const planPrice = (plan: string) => plan.includes('349') ? 349 : plan.includes('549') ? 549 : 949

// ── COMPONENTES BASE ─────────────────────────────────────────
function Stat({ label, value, sub, color = C.text }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800, lineHeight: 1.1, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: '100%', maxWidth: wide ? 680 : 520, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.card, zIndex: 1 }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ marginBottom: 14, flex: half ? '1 1 45%' : '1 1 100%' }}>
      <label style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 5, fontFamily: 'monospace' }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 6, padding: '8px 11px', width: '100%', fontSize: 13,
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
}

function Btn({ onClick, children, color = C.surface, textColor = C.text, border = true }: {
  onClick: () => void; children: React.ReactNode; color?: string; textColor?: string; border?: boolean
}) {
  return (
    <button onClick={onClick} style={{ background: color, border: border ? `1px solid ${C.border}` : 'none', color: textColor, borderRadius: 7, padding: '9px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function AdminDashboard() {
  const supabase = createClient()

  // Estado general
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Datos desde Supabase
  const [emergencies, setEmergencies] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [workshops, setWorkshops] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [profiles, setProfiles] = useState<{ total: number; withPhone: number; activated: number }>({ total: 0, withPhone: 0, activated: 0 })

  // Formularios
  const [accForm, setAccForm] = useState({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0], medical_info_used: false, family_notified: false, hospital_notified: false, hospital_name: '', user_age: '', survived: '', user_still_active: '', media_worthy: false, b2b_case_study: false, mins_to_scan: '', mins_to_family_contact: '', mins_to_medical_attention: '', notes: '', paramedic_name: '' })
  const [saleForm, setSaleForm] = useState({ sale_date: new Date().toISOString().split('T')[0], plan: PLANES[0], qty: 1, channel: 'Tienda web', source: '', customer_name: '', customer_phone: '', customer_email: '', notes: '' })
  const [wsForm, setWsForm] = useState({ name: '', owner_name: '', phone: '', email: '', address: '', municipio: '', estado: 'CDMX', status: 'prospecto', chips_consigned: 0, price_per_chip: 299, first_consignment_date: '', notes: '' })
  const [b2bForm, setB2bForm] = useState({ company_name: '', company_type: '', contact_name: '', contact_role: '', contact_phone: '', contact_email: '', stage: 'prospecto', estimated_chips: '', estimated_value: '', probability: 10, first_contact_date: new Date().toISOString().split('T')[0], next_action_date: '', next_action: '', notes: '' })
  const [editItem, setEditItem] = useState<any>(null)

  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true)
    const [emRes, saRes, wsRes, b2bRes, prRes] = await Promise.all([
      supabase.from('admin_emergencies').select('*').order('incident_date', { ascending: false }),
      supabase.from('admin_sales').select('*').order('sale_date', { ascending: false }),
      supabase.from('admin_workshops').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_b2b_pipeline').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, phone, created_at'),
    ])
    if (emRes.data) setEmergencies(emRes.data)
    if (saRes.data) setSales(saRes.data)
    if (wsRes.data) setWorkshops(wsRes.data)
    if (b2bRes.data) setPipeline(b2bRes.data)
    if (prRes.data) {
      setProfiles({
        total: prRes.data.length,
        withPhone: prRes.data.filter((p: any) => p.phone).length,
        activated: prRes.data.length,
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── COMPUTED ──────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, x) => s + planPrice(x.plan) * (x.qty || 1), 0)
  const totalUnits = sales.reduce((s, x) => s + (x.qty || 1), 0)
  const accidents = emergencies.length
  const scanned = emergencies.filter(e => e.outcome === OUTCOMES[0]).length
  const scanRate = accidents ? Math.round(scanned / accidents * 100) : 0

  const monthlySales = (() => {
    const m: Record<string, { revenue: number; units: number }> = {}
    sales.forEach(s => {
      const k = s.sale_date?.slice(0, 7) || ''
      const p = planPrice(s.plan)
      if (!m[k]) m[k] = { revenue: 0, units: 0 }
      m[k].revenue += p * (s.qty || 1)
      m[k].units += (s.qty || 1)
    })
    return Object.entries(m).sort().map(([k, v]) => ({ mes: k.slice(5), ...v }))
  })()

  const channelData = (() => {
    const c: Record<string, number> = {}
    sales.forEach(s => { c[s.channel] = (c[s.channel] || 0) + (s.qty || 1) })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  })()

  const planData = (() => {
    const c: Record<string, number> = {}
    sales.forEach(s => { const k = s.plan.split(' ')[0]; c[k] = (c[k] || 0) + (s.qty || 1) })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  })()

  const byStateData = (() => {
    const c: Record<string, number> = {}
    emergencies.forEach(e => { c[e.estado] = (c[e.estado] || 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  })()

  const b2bPiplineValue = pipeline
    .filter(p => !['cerrado_perdido', 'pausado'].includes(p.stage))
    .reduce((s, p) => s + (p.estimated_value || 0), 0)

  const activeWorkshops = workshops.filter(w => w.status === 'activo').length
  const wsInventory = workshops.reduce((s, w) => s + (w.chips_consigned - w.chips_sold - w.chips_returned), 0)
  const wsPendingPayment = workshops.reduce((s, w) => s + (w.pending_payment || 0), 0)

  // ── ACTIONS ───────────────────────────────────────────────
  async function saveEmergency() {
    setSaving(true)
    const payload = {
      ...accForm,
      user_age: accForm.user_age ? parseInt(accForm.user_age) : null,
      survived: accForm.survived === '' ? null : accForm.survived === 'true',
      user_still_active: accForm.user_still_active === '' ? null : accForm.user_still_active === 'true',
      mins_to_scan: accForm.mins_to_scan ? parseInt(accForm.mins_to_scan) : null,
      mins_to_family_contact: accForm.mins_to_family_contact ? parseInt(accForm.mins_to_family_contact) : null,
      mins_to_medical_attention: accForm.mins_to_medical_attention ? parseInt(accForm.mins_to_medical_attention) : null,
    }
    if (editItem) {
      await supabase.from('admin_emergencies').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('admin_emergencies').insert(payload)
    }
    await loadData()
    setModal(null)
    setEditItem(null)
    setSaving(false)
  }

  async function saveSale() {
    setSaving(true)
    const payload = { ...saleForm, unit_price: planPrice(saleForm.plan), entry_type: 'manual' }
    if (editItem) {
      await supabase.from('admin_sales').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('admin_sales').insert(payload)
    }
    await loadData()
    setModal(null)
    setEditItem(null)
    setSaving(false)
  }

  async function saveWorkshop() {
    setSaving(true)
    if (editItem) {
      await supabase.from('admin_workshops').update(wsForm).eq('id', editItem.id)
    } else {
      await supabase.from('admin_workshops').insert(wsForm)
    }
    await loadData()
    setModal(null)
    setEditItem(null)
    setSaving(false)
  }

  async function saveB2b() {
    setSaving(true)
    const payload = {
      ...b2bForm,
      estimated_chips: b2bForm.estimated_chips ? parseInt(b2bForm.estimated_chips as string) : null,
      estimated_value: b2bForm.estimated_value ? parseInt(b2bForm.estimated_value as string) : null,
    }
    if (editItem) {
      await supabase.from('admin_b2b_pipeline').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('admin_b2b_pipeline').insert(payload)
    }
    await loadData()
    setModal(null)
    setEditItem(null)
    setSaving(false)
  }

  async function deleteItem(table: string, id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from(table).delete().eq('id', id)
    await loadData()
  }

  function openEditAcc(item: any) {
    setEditItem(item)
    setAccForm({ ...item, user_age: item.user_age?.toString() || '', survived: item.survived === null ? '' : item.survived?.toString(), user_still_active: item.user_still_active === null ? '' : item.user_still_active?.toString(), mins_to_scan: item.mins_to_scan?.toString() || '', mins_to_family_contact: item.mins_to_family_contact?.toString() || '', mins_to_medical_attention: item.mins_to_medical_attention?.toString() || '' })
    setModal('accident')
  }

  function openEditSale(item: any) { setEditItem(item); setSaleForm(item); setModal('sale') }
  function openEditWs(item: any) { setEditItem(item); setWsForm(item); setModal('workshop') }
  function openEditB2b(item: any) { setEditItem(item); setB2bForm({ ...item, estimated_chips: item.estimated_chips?.toString() || '', estimated_value: item.estimated_value?.toString() || '' }); setModal('b2b') }

  function resetForms() {
    setEditItem(null)
    setAccForm({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0], medical_info_used: false, family_notified: false, hospital_notified: false, hospital_name: '', user_age: '', survived: '', user_still_active: '', media_worthy: false, b2b_case_study: false, mins_to_scan: '', mins_to_family_contact: '', mins_to_medical_attention: '', notes: '', paramedic_name: '' })
    setSaleForm({ sale_date: new Date().toISOString().split('T')[0], plan: PLANES[0], qty: 1, channel: 'Tienda web', source: '', customer_name: '', customer_phone: '', customer_email: '', notes: '' })
    setWsForm({ name: '', owner_name: '', phone: '', email: '', address: '', municipio: '', estado: 'CDMX', status: 'prospecto', chips_consigned: 0, price_per_chip: 299, first_consignment_date: '', notes: '' })
    setB2bForm({ company_name: '', company_type: '', contact_name: '', contact_role: '', contact_phone: '', contact_email: '', stage: 'prospecto', estimated_chips: '', estimated_value: '', probability: 10, first_contact_date: new Date().toISOString().split('T')[0], next_action_date: '', next_action: '', notes: '' })
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'emergencies', label: `Emergencias (${accidents})` },
    { id: 'sales', label: `Ventas (${totalUnits})` },
    { id: 'workshops', label: `Talleres (${workshops.length})` },
    { id: 'b2b', label: `B2B (${pipeline.length})` },
    { id: 'analytics', label: 'Analytics' },
  ]

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontFamily: 'monospace' }}>Cargando datos...</div>
    </div>
  )

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: C.text }}>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, position: 'sticky', top: 0, background: C.bg, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em' }}>RESCUECHIP</span>
          <span style={{ color: C.faint, fontSize: 11, fontFamily: 'monospace' }}>/admin</span>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <Btn onClick={() => { resetForms(); setModal('workshop') }}>🏪 Taller</Btn>
          <Btn onClick={() => { resetForms(); setModal('b2b') }}>🤝 B2B</Btn>
          <Btn onClick={() => { resetForms(); setModal('sale') }}>+ Venta</Btn>
          <Btn onClick={() => { resetForms(); setModal('accident') }} color={C.red} textColor="#fff" border={false}>⚡ Emergencia</Btn>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 20px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${C.red}` : '2px solid transparent', color: tab === t.id ? C.text : C.muted, padding: '12px 14px', fontSize: 12, cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>

        {/* ── OVERVIEW ─────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
              <Stat label="Ingresos totales" value={fmt(totalRevenue)} color={C.green} sub={`${totalUnits} unidades`} />
              <Stat label="Usuarios totales" value={profiles.total} sub={`${profiles.withPhone} con celular`} color={C.amber} />
              <Stat label="Emergencias reales" value={accidents} color={C.red} sub="documentadas" />
              <Stat label="Tasa de escaneo" value={`${scanRate}%`} color={scanRate > 50 ? C.green : C.amber} />
              <Stat label="Talleres activos" value={activeWorkshops} sub={`${wsInventory} chips en campo`} color={C.blue} />
              <Stat label="Pipeline B2B" value={fmt(b2bPiplineValue)} sub={`${pipeline.filter(p => !['cerrado_perdido', 'pausado'].includes(p.stage)).length} oportunidades`} color={C.purple} />
            </div>

            {/* North Star */}
            {accidents === 0 ? (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 10, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏍️</div>
                <div style={{ color: C.muted, fontSize: 13 }}>North Star: primer emergencia real documentada</div>
                <div style={{ color: C.faint, fontSize: 11, marginTop: 4 }}>Ese momento activa todo lo demás.</div>
              </div>
            ) : (
              <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 24 }}>🚨</div>
                <div>
                  <div style={{ color: C.red, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>North Star alcanzado 🎯</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{accidents} emergencia{accidents !== 1 ? 's' : ''} real documentada{accidents !== 1 ? 's' : ''}. Dato oro para pitch B2B.</div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Ingresos por mes (MXN)</div>
                {monthlySales.length === 0 ? (
                  <div style={{ color: C.faint, fontSize: 12, textAlign: 'center', padding: '36px 0' }}>Registra tu primera venta</div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={monthlySales}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="mes" stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} />
                      <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11 }} formatter={(v: any) => [fmt(v), 'Ingresos']} />
                      <Area type="monotone" dataKey="revenue" stroke={C.red} fill="url(#rev)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Por plan</div>
                {planData.length === 0 ? <div style={{ color: C.faint, fontSize: 12, textAlign: 'center', padding: '36px 0' }}>Sin datos</div> : (
                  <>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={planData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
                          {planData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {planData.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: C.muted }}>{p.name}</span>
                          <span style={{ color: C.text, marginLeft: 'auto', fontFamily: 'monospace' }}>{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EMERGENCIAS ──────────────────────────── */}
        {tab === 'emergencies' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Registro de Emergencias Reales</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Cada caso es prueba de impacto real y activo B2B.</div>
              </div>
              <Btn onClick={() => { resetForms(); setModal('accident') }} color={C.red} textColor="#fff" border={false}>⚡ Registrar</Btn>
            </div>
            {accidents > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 9, marginBottom: 18 }}>
                <Stat label="Total" value={accidents} color={C.red} />
                <Stat label="Chip escaneado" value={emergencies.filter(e => e.chip_scanned).length} color={C.green} />
                <Stat label="Familia notificada" value={emergencies.filter(e => e.family_notified).length} color={C.amber} />
                <Stat label="Casos B2B" value={emergencies.filter(e => e.b2b_case_study).length} color={C.blue} />
                <Stat label="Graves/críticos" value={emergencies.filter(e => ['grave', 'critico'].includes(e.severidad)).length} color={C.red} />
              </div>
            )}
            {accidents === 0 ? (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏍️</div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sin emergencias registradas</div>
                <div style={{ color: C.muted, fontSize: 12, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>Cuando un usuario tenga un accidente y el chip sea usado, regístralo aquí con todos los detalles.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {emergencies.map(e => (
                  <div key={e.id} style={{ background: C.card, border: `1px solid ${e.media_worthy ? C.red + '66' : C.border}`, borderRadius: 9, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {e.media_worthy && <Tag color={C.red}>⚡ MEDIÁTICO</Tag>}
                        {e.b2b_case_study && <Tag color={C.purple}>📊 CASO B2B</Tag>}
                        <Tag color={SEVERIDADES.indexOf(e.severidad) > 1 ? C.red : C.amber}>{e.severidad}</Tag>
                        <Tag color={C.blue}>{e.tipo}</Tag>
                        <Tag color={C.muted}>{e.estado}</Tag>
                        {e.chip_scanned && <Tag color={C.green}>Chip escaneado ✓</Tag>}
                        {e.family_notified && <Tag color={C.green}>Familia ✓</Tag>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: C.muted, fontSize: 11, fontFamily: 'monospace' }}>{fmtDate(e.incident_date)}</span>
                        <button onClick={() => openEditAcc(e)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>✎</button>
                        <button onClick={() => deleteItem('admin_emergencies', e.id)} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 15 }}>×</button>
                      </div>
                    </div>
                    <div style={{ color: C.muted, fontSize: 11 }}>
                      {e.outcome}
                      {e.chip_folio && <> · <span style={{ color: C.amber, fontFamily: 'monospace' }}>{e.chip_folio}</span></>}
                      {e.user_age && <> · {e.user_age} años</>}
                      {e.mins_to_scan && <> · ⏱ {e.mins_to_scan} min al escaneo</>}
                    </div>
                    {e.notes && <div style={{ color: C.faint, fontSize: 11, fontStyle: 'italic', borderTop: `1px solid ${C.border}`, paddingTop: 7, marginTop: 6 }}>{e.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VENTAS ───────────────────────────────── */}
        {tab === 'sales' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Registro de Ventas</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Historial completo. Las ventas de Stripe se registran automáticamente.</div>
              </div>
              <Btn onClick={() => { resetForms(); setModal('sale') }}>+ Nueva venta</Btn>
            </div>
            {sales.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 9, marginBottom: 18 }}>
                <Stat label="Ingresos" value={fmt(totalRevenue)} color={C.green} />
                <Stat label="Unidades" value={totalUnits} />
                <Stat label="Ticket prom." value={totalUnits ? fmt(Math.round(totalRevenue / totalUnits)) : '$0'} color={C.amber} />
                <Stat label="Órdenes" value={sales.length} />
              </div>
            )}
            {sales.length === 0 ? (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sin ventas registradas</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {sales.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: C.muted, fontSize: 11, fontFamily: 'monospace', width: 78 }}>{fmtDate(s.sale_date)}</span>
                      <Tag color={s.entry_type === 'stripe' ? C.green : C.blue}>{s.channel}</Tag>
                      <span style={{ color: C.text, fontSize: 12 }}>{s.plan}</span>
                      {s.qty > 1 && <span style={{ color: C.muted, fontSize: 11 }}>×{s.qty}</span>}
                      {s.customer_name && <span style={{ color: C.muted, fontSize: 11 }}>{s.customer_name}</span>}
                      {s.entry_type === 'stripe' && <Tag color={C.green}>Stripe ✓</Tag>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: C.green, fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{fmt(planPrice(s.plan) * (s.qty || 1))}</span>
                      <button onClick={() => openEditSale(s)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>✎</button>
                      <button onClick={() => deleteItem('admin_sales', s.id)} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 15 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TALLERES ─────────────────────────────── */}
        {tab === 'workshops' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Talleres en Consignación</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Inventario, liquidaciones y estado de cada punto de venta.</div>
              </div>
              <Btn onClick={() => { resetForms(); setModal('workshop') }}>🏪 Agregar taller</Btn>
            </div>
            {workshops.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 9, marginBottom: 18 }}>
                <Stat label="Total talleres" value={workshops.length} />
                <Stat label="Talleres activos" value={activeWorkshops} color={C.green} />
                <Stat label="Chips en campo" value={wsInventory} color={C.amber} />
                <Stat label="Por cobrar" value={fmt(wsPendingPayment)} color={wsPendingPayment > 0 ? C.red : C.green} />
              </div>
            )}
            {workshops.length === 0 ? (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sin talleres registrados</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Agrega talleres donde dejaste chips en consignación.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {workshops.map(w => {
                  const available = w.chips_consigned - w.chips_sold - w.chips_returned
                  return (
                    <div key={w.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{w.name}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <Tag color={w.status === 'activo' ? C.green : w.status === 'prospecto' ? C.blue : C.muted}>{WS_STATUS_LABELS[w.status]}</Tag>
                            {w.municipio && <Tag color={C.muted}>{w.municipio}</Tag>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button onClick={() => openEditWs(w)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>✎</button>
                          <button onClick={() => deleteItem('admin_workshops', w.id)} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 15 }}>×</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
                        {[['Consignados', w.chips_consigned, C.text], ['Vendidos', w.chips_sold, C.green], ['Disponibles', available, available > 0 ? C.amber : C.faint], ['Por cobrar', fmt(w.pending_payment || 0), w.pending_payment > 0 ? C.red : C.green]].map(([label, val, color]: any) => (
                          <div key={label as string} style={{ background: C.surface, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ color: color, fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>{val}</div>
                            <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      {w.owner_name && <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Contacto: {w.owner_name}{w.phone && ` · ${w.phone}`}</div>}
                      {w.next_review_date && <div style={{ color: C.amber, fontSize: 11 }}>Próxima revisión: {fmtDate(w.next_review_date)}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── B2B PIPELINE ─────────────────────────── */}
        {tab === 'b2b' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Pipeline B2B</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Aseguradoras, ambulancias privadas y distribuidores.</div>
              </div>
              <Btn onClick={() => { resetForms(); setModal('b2b') }}>🤝 Agregar</Btn>
            </div>
            {pipeline.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 9, marginBottom: 18 }}>
                <Stat label="Oportunidades" value={pipeline.filter(p => !['cerrado_perdido', 'pausado'].includes(p.stage)).length} color={C.blue} />
                <Stat label="Valor pipeline" value={fmt(b2bPiplineValue)} color={C.purple} />
                <Stat label="Cerrados ganados" value={pipeline.filter(p => p.stage === 'cerrado_ganado').length} color={C.green} />
                <Stat label="Chips estimados" value={pipeline.filter(p => !['cerrado_perdido', 'pausado'].includes(p.stage)).reduce((s, p) => s + (p.estimated_chips || 0), 0)} color={C.amber} />
              </div>
            )}
            {pipeline.length === 0 ? (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sin empresas en el pipeline</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Agrega aseguradoras, ambulancias o empresas con las que estés hablando.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {pipeline.map(p => (
                  <div key={p.id} style={{ background: C.card, border: `1px solid ${p.stage === 'cerrado_ganado' ? C.green + '66' : p.stage === 'cerrado_perdido' ? C.faint : C.border}`, borderRadius: 9, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.company_name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Tag color={p.stage === 'cerrado_ganado' ? C.green : p.stage === 'cerrado_perdido' ? C.faint : C.blue}>{STAGE_LABELS[p.stage]}</Tag>
                          {p.company_type && <Tag color={C.muted}>{p.company_type}</Tag>}
                          {p.probability > 0 && <Tag color={C.amber}>{p.probability}% prob.</Tag>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => openEditB2b(p)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>✎</button>
                        <button onClick={() => deleteItem('admin_b2b_pipeline', p.id)} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 15 }}>×</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, color: C.muted, fontSize: 11 }}>
                      {p.contact_name && <span>👤 {p.contact_name}{p.contact_role && ` (${p.contact_role})`}</span>}
                      {p.estimated_chips && <span>📦 ~{p.estimated_chips} chips</span>}
                      {p.estimated_value && <span style={{ color: C.green }}>{fmt(p.estimated_value)}</span>}
                    </div>
                    {p.next_action && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: C.surface, borderRadius: 5, fontSize: 11 }}>
                        <span style={{ color: C.amber }}>→ {p.next_action}</span>
                        {p.next_action_date && <span style={{ color: C.muted }}> · {fmtDate(p.next_action_date)}</span>}
                      </div>
                    )}
                    {p.notes && <div style={{ color: C.faint, fontSize: 11, fontStyle: 'italic', marginTop: 6 }}>{p.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ────────────────────────────── */}
        {tab === 'analytics' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Analytics & Insights</div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Cuanto más registres, más precisos los datos.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Unidades por canal</div>
                {channelData.length === 0 ? <div style={{ color: C.faint, fontSize: 12, textAlign: 'center', padding: '36px 0' }}>Sin datos</div> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={channelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                      <XAxis type="number" stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} width={90} />
                      <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11 }} />
                      <Bar dataKey="value" fill={C.red} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Emergencias por estado</div>
                {byStateData.length === 0 ? <div style={{ color: C.faint, fontSize: 12, textAlign: 'center', padding: '36px 0' }}>Sin emergencias</div> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={byStateData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                      <XAxis type="number" stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: 10 }} width={90} />
                      <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11 }} />
                      <Bar dataKey="value" fill={C.amber} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Embudo usuarios */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'monospace' }}>Embudo de usuarios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Registrados', value: profiles.total, color: C.text },
                  { label: 'Con celular', value: profiles.withPhone, color: C.blue },
                  { label: 'Ventas (chips)', value: totalUnits, color: C.amber },
                  { label: 'Emergencias', value: accidents, color: C.red },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ color: s.color, fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ color: C.muted, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Insights clave</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  totalUnits < 50 && { icon: '📍', text: 'Fase seed. Enfócate en los primeros 50 usuarios antes de optimizar canales.', color: C.amber },
                  profiles.withPhone / profiles.total < 0.5 && profiles.total > 5 && { icon: '📱', text: `Solo ${Math.round(profiles.withPhone / profiles.total * 100)}% de usuarios tienen celular registrado. Más campo para el chatbot de N8N.`, color: C.blue },
                  accidents > 0 && { icon: '🚨', text: `${accidents} emergencia${accidents !== 1 ? 's' : ''} real documentada${accidents !== 1 ? 's' : ''}. Dato oro para pitch B2B con aseguradoras.`, color: C.red },
                  wsPendingPayment > 0 && { icon: '💸', text: `${fmt(wsPendingPayment)} pendientes de cobro en talleres. Revisa liquidaciones.`, color: C.amber },
                  pipeline.filter(p => p.stage === 'propuesta_enviada').length > 0 && { icon: '⏳', text: `${pipeline.filter(p => p.stage === 'propuesta_enviada').length} propuesta${pipeline.filter(p => p.stage === 'propuesta_enviada').length > 1 ? 's' : ''} B2B enviada${pipeline.filter(p => p.stage === 'propuesta_enviada').length > 1 ? 's' : ''} sin respuesta. Haz follow up.`, color: C.purple },
                  accidents === 0 && totalUnits > 0 && { icon: '🎯', text: 'North Star pendiente. Sigue distribuyendo, el primer caso llegará.', color: C.blue },
                  totalUnits === 0 && { icon: '💡', text: 'Los insights aparecerán conforme registres ventas y emergencias.', color: C.faint },
                ].filter(Boolean).map((ins: any, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: ins.color + '11', border: `1px solid ${ins.color}33`, borderRadius: 7 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{ins.icon}</span>
                    <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════ */}

      {/* MODAL EMERGENCIA */}
      {modal === 'accident' && (
        <Modal title={`${editItem ? '✎ Editar' : '⚡ Registrar'} Emergencia Real`} onClose={() => { setModal(null); setEditItem(null) }} wide>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Fecha del incidente" half><input type="date" value={accForm.incident_date} onChange={e => setAccForm({ ...accForm, incident_date: e.target.value })} style={inp} /></Field>
            <Field label="Hora aprox." half><input type="time" value={accForm.incident_time} onChange={e => setAccForm({ ...accForm, incident_time: e.target.value })} style={inp} /></Field>
            <Field label="Estado" half>
              <select value={accForm.estado} onChange={e => setAccForm({ ...accForm, estado: e.target.value })} style={inp}>
                {ESTADOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Municipio/Colonia" half><input placeholder="Iztapalapa, Narvarte..." value={accForm.municipio} onChange={e => setAccForm({ ...accForm, municipio: e.target.value })} style={inp} /></Field>
            <Field label="Tipo de accidente" half>
              <select value={accForm.tipo} onChange={e => setAccForm({ ...accForm, tipo: e.target.value })} style={inp}>
                {TIPOS_ACC.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Severidad" half>
              <select value={accForm.severidad} onChange={e => setAccForm({ ...accForm, severidad: e.target.value })} style={inp}>
                {SEVERIDADES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Folio RSC del chip" half><input placeholder="RSC-XXXXX" value={accForm.chip_folio} onChange={e => setAccForm({ ...accForm, chip_folio: e.target.value })} style={inp} /></Field>
            <Field label="Edad aprox. del usuario" half><input type="number" placeholder="28" value={accForm.user_age} onChange={e => setAccForm({ ...accForm, user_age: e.target.value })} style={inp} /></Field>
          </div>
          <Field label="Outcome del chip">
            <select value={accForm.outcome} onChange={e => setAccForm({ ...accForm, outcome: e.target.value })} style={inp}>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Tiempo al escaneo (min)" half><input type="number" placeholder="5" value={accForm.mins_to_scan} onChange={e => setAccForm({ ...accForm, mins_to_scan: e.target.value })} style={inp} /></Field>
            <Field label="Tiempo a contacto familia (min)" half><input type="number" placeholder="15" value={accForm.mins_to_family_contact} onChange={e => setAccForm({ ...accForm, mins_to_family_contact: e.target.value })} style={inp} /></Field>
            <Field label="Hospital" half><input placeholder="Hospital General, Cruz Roja..." value={accForm.hospital_name} onChange={e => setAccForm({ ...accForm, hospital_name: e.target.value })} style={inp} /></Field>
            <Field label="Nombre del paramédico" half><input placeholder="Opcional" value={accForm.paramedic_name} onChange={e => setAccForm({ ...accForm, paramedic_name: e.target.value })} style={inp} /></Field>
            <Field label="¿Sobrevivió?" half>
              <select value={accForm.survived} onChange={e => setAccForm({ ...accForm, survived: e.target.value })} style={inp}>
                <option value="">— No confirmado —</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field label="¿Sigue activo en RescueChip?" half>
              <select value={accForm.user_still_active} onChange={e => setAccForm({ ...accForm, user_still_active: e.target.value })} style={inp}>
                <option value="">— No verificado —</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['chip_scanned', 'Chip escaneado'], ['medical_info_used', 'Info médica usada'], ['family_notified', 'Familia notificada'], ['hospital_notified', 'Hospital notificado'], ['media_worthy', 'Caso mediático'], ['b2b_case_study', 'Caso de estudio B2B']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: C.muted }}>
                <input type="checkbox" checked={(accForm as any)[k]} onChange={e => setAccForm({ ...accForm, [k]: e.target.checked })} />
                {l}
              </label>
            ))}
          </div>
          <Field label="Notas / detalles del caso">
            <textarea placeholder="Contexto, cómo te enteraste, conversación con paramédico, hospital..." value={accForm.notes} onChange={e => setAccForm({ ...accForm, notes: e.target.value })} style={{ ...inp, minHeight: 80, resize: 'vertical' }} />
          </Field>
          <button onClick={saveEmergency} disabled={saving} style={{ background: C.red, border: 'none', color: '#fff', borderRadius: 8, padding: '11px 0', fontSize: 13, cursor: 'pointer', fontWeight: 700, width: '100%' }}>
            {saving ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Registrar emergencia'}
          </button>
        </Modal>
      )}

      {/* MODAL VENTA */}
      {modal === 'sale' && (
        <Modal title={`${editItem ? '✎ Editar' : '+'} Venta`} onClose={() => { setModal(null); setEditItem(null) }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Fecha" half><input type="date" value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} style={inp} /></Field>
            <Field label="Cantidad" half><input type="number" min={1} value={saleForm.qty} onChange={e => setSaleForm({ ...saleForm, qty: Number(e.target.value) })} style={inp} /></Field>
          </div>
          <Field label="Plan">
            <select value={saleForm.plan} onChange={e => setSaleForm({ ...saleForm, plan: e.target.value })} style={inp}>
              {PLANES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Canal" half>
              <select value={saleForm.channel} onChange={e => setSaleForm({ ...saleForm, channel: e.target.value })} style={inp}>
                {CANALES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fuente (taller, evento...)" half><input placeholder="Rodada Xochimilco, Taller Moto Sur..." value={saleForm.source} onChange={e => setSaleForm({ ...saleForm, source: e.target.value })} style={inp} /></Field>
            <Field label="Nombre del cliente" half><input value={saleForm.customer_name} onChange={e => setSaleForm({ ...saleForm, customer_name: e.target.value })} style={inp} /></Field>
            <Field label="Celular del cliente" half><input type="tel" placeholder="5512345678" value={saleForm.customer_phone} onChange={e => setSaleForm({ ...saleForm, customer_phone: e.target.value })} style={inp} /></Field>
          </div>
          <Field label="Email del cliente"><input type="email" value={saleForm.customer_email} onChange={e => setSaleForm({ ...saleForm, customer_email: e.target.value })} style={inp} /></Field>
          <Field label="Notas"><input placeholder="Folios entregados, observaciones..." value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} style={inp} /></Field>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 7, marginBottom: 14 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>Total calculado:</span>
            <span style={{ color: C.green, fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>{fmt(planPrice(saleForm.plan) * saleForm.qty)}</span>
          </div>
          <button onClick={saveSale} disabled={saving} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '11px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            {saving ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Registrar venta'}
          </button>
        </Modal>
      )}

      {/* MODAL TALLER */}
      {modal === 'workshop' && (
        <Modal title={`${editItem ? '✎ Editar' : '🏪'} Taller`} onClose={() => { setModal(null); setEditItem(null) }} wide>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Nombre del taller"><input placeholder="Taller Moto Sur" value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} style={inp} /></Field>
            <Field label="Nombre del dueño/contacto" half><input value={wsForm.owner_name} onChange={e => setWsForm({ ...wsForm, owner_name: e.target.value })} style={inp} /></Field>
            <Field label="Teléfono" half><input type="tel" placeholder="5512345678" value={wsForm.phone} onChange={e => setWsForm({ ...wsForm, phone: e.target.value })} style={inp} /></Field>
            <Field label="Estado" half>
              <select value={wsForm.estado} onChange={e => setWsForm({ ...wsForm, estado: e.target.value })} style={inp}>
                {ESTADOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Municipio" half><input placeholder="Iztapalapa" value={wsForm.municipio} onChange={e => setWsForm({ ...wsForm, municipio: e.target.value })} style={inp} /></Field>
            <Field label="Estatus de relación">
              <select value={wsForm.status} onChange={e => setWsForm({ ...wsForm, status: e.target.value })} style={inp}>
                {Object.entries(WS_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Chips consignados" half><input type="number" min={0} value={wsForm.chips_consigned} onChange={e => setWsForm({ ...wsForm, chips_consigned: Number(e.target.value) })} style={inp} /></Field>
            <Field label="Precio por chip (MXN)" half><input type="number" min={0} value={wsForm.price_per_chip} onChange={e => setWsForm({ ...wsForm, price_per_chip: Number(e.target.value) })} style={inp} /></Field>
            <Field label="Fecha primera consignación" half><input type="date" value={wsForm.first_consignment_date} onChange={e => setWsForm({ ...wsForm, first_consignment_date: e.target.value })} style={inp} /></Field>
          </div>
          <Field label="Notas">
            <textarea value={wsForm.notes} onChange={e => setWsForm({ ...wsForm, notes: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical' }} />
          </Field>
          <button onClick={saveWorkshop} disabled={saving} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '11px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            {saving ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Agregar taller'}
          </button>
        </Modal>
      )}

      {/* MODAL B2B */}
      {modal === 'b2b' && (
        <Modal title={`${editItem ? '✎ Editar' : '🤝'} Oportunidad B2B`} onClose={() => { setModal(null); setEditItem(null) }} wide>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Nombre de la empresa"><input placeholder="GNP Seguros, Cruz Verde..." value={b2bForm.company_name} onChange={e => setB2bForm({ ...b2bForm, company_name: e.target.value })} style={inp} /></Field>
            <Field label="Tipo de empresa" half><input placeholder="Aseguradora, Ambulancia, Hospital..." value={b2bForm.company_type} onChange={e => setB2bForm({ ...b2bForm, company_type: e.target.value })} style={inp} /></Field>
            <Field label="Etapa del pipeline">
              <select value={b2bForm.stage} onChange={e => setB2bForm({ ...b2bForm, stage: e.target.value })} style={inp}>
                {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Contacto principal" half><input placeholder="Nombre del ejecutivo" value={b2bForm.contact_name} onChange={e => setB2bForm({ ...b2bForm, contact_name: e.target.value })} style={inp} /></Field>
            <Field label="Cargo" half><input placeholder="Director de producto, VP..." value={b2bForm.contact_role} onChange={e => setB2bForm({ ...b2bForm, contact_role: e.target.value })} style={inp} /></Field>
            <Field label="Teléfono contacto" half><input type="tel" value={b2bForm.contact_phone} onChange={e => setB2bForm({ ...b2bForm, contact_phone: e.target.value })} style={inp} /></Field>
            <Field label="Email contacto" half><input type="email" value={b2bForm.contact_email} onChange={e => setB2bForm({ ...b2bForm, contact_email: e.target.value })} style={inp} /></Field>
            <Field label="Chips estimados" half><input type="number" placeholder="500" value={b2bForm.estimated_chips} onChange={e => setB2bForm({ ...b2bForm, estimated_chips: e.target.value })} style={inp} /></Field>
            <Field label="Valor estimado (MXN)" half><input type="number" placeholder="60000" value={b2bForm.estimated_value} onChange={e => setB2bForm({ ...b2bForm, estimated_value: e.target.value })} style={inp} /></Field>
            <Field label="Probabilidad de cierre (%)">
              <input type="range" min={0} max={100} step={10} value={b2bForm.probability} onChange={e => setB2bForm({ ...b2bForm, probability: Number(e.target.value) })} style={{ width: '100%' }} />
              <div style={{ color: C.amber, fontSize: 12, textAlign: 'center', marginTop: 4 }}>{b2bForm.probability}%</div>
            </Field>
            <Field label="Próxima acción"><input placeholder="Enviar propuesta, hacer demo, follow up..." value={b2bForm.next_action} onChange={e => setB2bForm({ ...b2bForm, next_action: e.target.value })} style={inp} /></Field>
            <Field label="Fecha próxima acción" half><input type="date" value={b2bForm.next_action_date} onChange={e => setB2bForm({ ...b2bForm, next_action_date: e.target.value })} style={inp} /></Field>
            <Field label="Primer contacto" half><input type="date" value={b2bForm.first_contact_date} onChange={e => setB2bForm({ ...b2bForm, first_contact_date: e.target.value })} style={inp} /></Field>
          </div>
          <Field label="Notas">
            <textarea placeholder="Contexto de la relación, intereses, objeciones, historial..." value={b2bForm.notes} onChange={e => setB2bForm({ ...b2bForm, notes: e.target.value })} style={{ ...inp, minHeight: 70, resize: 'vertical' }} />
          </Field>
          <button onClick={saveB2b} disabled={saving} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '11px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            {saving ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Agregar al pipeline'}
          </button>
        </Modal>
      )}

    </div>
  )
}
