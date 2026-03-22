'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Siren, Store, Building2, CreditCard, Settings, Search, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Users, Package, Clock, Zap, Activity, Target, Power } from 'lucide-react'

// ✨ PALETTE & CONFIG ✨
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
const ESTADOS = ['CDMX', 'Jalisco', 'Nuevo León', 'Estado de México', 'Puebla', 'Querétaro', 'Guanajuato', 'Otro']
const TIPOS_ACC = ['Colisión vial', 'Caída propia', 'Atropellamiento', 'Colisión múltiple', 'Otro']
const OUTCOMES = ['Chip escaneado por paramédico', 'Contacto de emergencia notificado', 'Información médica utilizada', 'Solo chip leído', 'No confirmado']
const PLANES = ['Individual ($349)', 'Pareja ($549)', 'Familiar ($949)']
const CANALES = ['Tienda web', 'Rodada', 'Taller consignación', 'Venta directa', 'Instagram DM', 'WhatsApp', 'Referido', 'Otro']
const SEVERIDADES = ['leve', 'moderado', 'grave', 'critico']
const STAGE_LABELS: Record<string, string> = { prospecto: 'Prospecto', contactado: 'Contactado', reunion_agendada: 'Reunión', demo_realizada: 'Demo', propuesta_enviada: 'Propuesta', negociacion: 'Negociación', cerrado_ganado: 'Ganado', cerrado_perdido: 'Perdido', pausado: 'Pausado' }
const WS_STATUS_LABELS: Record<string, string> = { prospecto: 'Prospecto', contactado: 'Contactado', activo: 'Activo', inactivo: 'Inactivo', pausado: 'Pausado' }

// 🧮 HELPERS
const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const planPrice = (plan: string) => plan.includes('349') ? 349 : plan.includes('549') ? 549 : 949

// 🧱 COMPONENTS
function StatCard({ label, value, sub, color = 'text-white', icon: Icon, trend }: any) {
  return (
    <div className="bg-[#161b22] border border-[#2d3139] rounded-xl p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-3">
        <div className="text-[#8b949e] text-[11px] font-mono uppercase tracking-wider">{label}</div>
        {Icon && <Icon size={16} className="text-[#8b949e]" />}
      </div>
      <div>
        <div className={`text-2xl font-semibold font-mono tabular-nums tracking-tight ${color}`}>{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : trend < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-gray-400'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}{Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-[#8b949e] text-xs">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

function Tag({ children, colorClass }: any) {
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap border ${colorClass}`}>{children}</span>
}

function Modal({ title, onClose, children, wide }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-[#161b22] border border-[#2d3139] rounded-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex justify-between items-center p-5 border-b border-[#2d3139] sticky top-0 bg-[#161b22] z-10">
          <h3 className="text-[#f0f6fc] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors"><XCircle size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, half }: any) {
  return (
    <div className={`mb-4 ${half ? 'w-[calc(50%-8px)]' : 'w-full'}`}>
      <label className="block text-[#8b949e] text-[10px] uppercase font-mono tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "bg-[#0d1117] border border-[#2d3139] text-[#f0f6fc] rounded-lg px-3 py-2.5 w-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-sans"

// 🚀 MAIN APP
export default function AdminDashboard() {
  const supabase = createClient()
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shuttingDown, setShuttingDown] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const [emergencies, setEmergencies] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [workshops, setWorkshops] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [profiles, setProfiles] = useState({ total: 0, withPhone: 0 })

  const [accForm, setAccForm] = useState({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0], medical_info_used: false, family_notified: false, hospital_notified: false, hospital_name: '', user_age: '', survived: '', user_still_active: '', media_worthy: false, b2b_case_study: false, mins_to_scan: '', mins_to_family_contact: '', mins_to_medical_attention: '', notes: '', paramedic_name: '' })
  const [saleForm, setSaleForm] = useState({ sale_date: new Date().toISOString().split('T')[0], plan: PLANES[0], qty: 1, channel: 'Tienda web', source: '', customer_name: '', customer_phone: '', customer_email: '', notes: '' })
  const [wsForm, setWsForm] = useState({ name: '', owner_name: '', phone: '', email: '', address: '', municipio: '', estado: 'CDMX', status: 'prospecto', chips_consigned: 0, price_per_chip: 299, first_consignment_date: '', notes: '' })
  const [b2bForm, setB2bForm] = useState({ company_name: '', company_type: '', contact_name: '', contact_role: '', contact_phone: '', contact_email: '', stage: 'prospecto', estimated_chips: '', estimated_value: '', probability: 10, first_contact_date: new Date().toISOString().split('T')[0], next_action_date: '', next_action: '', notes: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [emRes, saRes, wsRes, b2bRes, prRes] = await Promise.all([
      supabase.from('admin_emergencies').select('*').order('incident_date', { ascending: false }),
      supabase.from('admin_sales').select('*').order('sale_date', { ascending: false }),
      supabase.from('admin_workshops').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_b2b_pipeline').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, phone')
    ])
    if (emRes.data) setEmergencies(emRes.data)
    if (saRes.data) setSales(saRes.data)
    if (wsRes.data) setWorkshops(wsRes.data)
    if (b2bRes.data) setPipeline(b2bRes.data)
    if (prRes.data) setProfiles({ total: prRes.data.length, withPhone: prRes.data.filter((p: any) => p.phone).length })
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const totalRevenue = sales.reduce((s, x) => s + planPrice(x.plan) * (x.qty || 1), 0)
  const totalUnits = sales.reduce((s, x) => s + (x.qty || 1), 0)
  const accidents = emergencies.length
  const scanned = emergencies.filter(e => e.outcome === OUTCOMES[0]).length
  const scanRate = accidents ? Math.round(scanned / accidents * 100) : 0
  const activeWorkshops = workshops.filter(w => w.status === 'activo').length
  const wsInventory = workshops.reduce((s, w) => s + (w.chips_consigned - w.chips_sold - w.chips_returned), 0)
  const b2bValue = pipeline.filter(p => !['cerrado_perdido', 'pausado'].includes(p.stage)).reduce((s, p) => s + (p.estimated_value || 0), 0)

  const monthlySales = (() => {
    const m: Record<string, { revenue: number; units: number }> = {}
    sales.forEach(s => {
      const k = s.sale_date?.slice(0, 7) || ''; const p = planPrice(s.plan)
      if (!m[k]) m[k] = { revenue: 0, units: 0 }
      m[k].revenue += p * (s.qty || 1); m[k].units += (s.qty || 1)
    })
    return Object.entries(m).sort().map(([k, v]) => ({ mes: k.slice(5), ...v }))
  })()

  const channelData = (() => {
    const c: Record<string, number> = {}; sales.forEach(s => { c[s.channel] = (c[s.channel] || 0) + (s.qty || 1) })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  })()

  // 🛠 ACTIONS
  async function saveData(table: string, payload: any) {
    setSaving(true)
    if (editItem) await supabase.from(table).update(payload).eq('id', editItem.id)
    else await supabase.from(table).insert(payload)
    await loadData(); setModal(null); setEditItem(null); setSaving(false)
  }

  function handleSaveAcc() {
    saveData('admin_emergencies', {
      ...accForm, user_age: accForm.user_age ? parseInt(accForm.user_age) : null,
      survived: accForm.survived === '' ? null : accForm.survived === 'true',
      mins_to_scan: accForm.mins_to_scan ? parseInt(accForm.mins_to_scan) : null
    })
  }

  function handleSaveSale() { saveData('admin_sales', { ...saleForm, unit_price: planPrice(saleForm.plan), entry_type: 'manual' }) }
  function handleSaveWs() { saveData('admin_workshops', wsForm) }
  function handleSaveB2b() { saveData('admin_b2b_pipeline', { ...b2bForm, estimated_chips: b2bForm.estimated_chips ? parseInt(b2bForm.estimated_chips as string) : null, estimated_value: b2bForm.estimated_value ? parseInt(b2bForm.estimated_value as string) : null }) }

  async function deleteItem(table: string, id: string) {
    if (!confirm('¿Eliminar registro?')) return
    await supabase.from(table).delete().eq('id', id); await loadData()
  }

  function resetForms() {
    setEditItem(null)
    setAccForm({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', estado: 'CDMX', municipio: '', tipo: TIPOS_ACC[0], severidad: 'moderado', chip_folio: '', chip_scanned: false, outcome: OUTCOMES[0], medical_info_used: false, family_notified: false, hospital_notified: false, hospital_name: '', user_age: '', survived: '', user_still_active: '', media_worthy: false, b2b_case_study: false, mins_to_scan: '', mins_to_family_contact: '', mins_to_medical_attention: '', notes: '', paramedic_name: '' })
    setSaleForm({ sale_date: new Date().toISOString().split('T')[0], plan: PLANES[0], qty: 1, channel: 'Tienda web', source: '', customer_name: '', customer_phone: '', customer_email: '', notes: '' })
    setWsForm({ name: '', owner_name: '', phone: '', email: '', address: '', municipio: '', estado: 'CDMX', status: 'prospecto', chips_consigned: 0, price_per_chip: 299, first_consignment_date: '', notes: '' })
    setB2bForm({ company_name: '', company_type: '', contact_name: '', contact_role: '', contact_phone: '', contact_email: '', stage: 'prospecto', estimated_chips: '', estimated_value: '', probability: 10, first_contact_date: new Date().toISOString().split('T')[0], next_action_date: '', next_action: '', notes: '' })
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'emergencies', label: 'Emergencias', count: accidents, icon: Siren },
    { id: 'sales', label: 'Ventas', count: totalUnits, icon: CreditCard },
    { id: 'workshops', label: 'Talleres', count: workshops.length, icon: Store },
    { id: 'b2b', label: 'B2B', count: pipeline.length, icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: Activity },
  ]

  async function handleShutdown() {
    if (!confirm('¿Seguro que quieres apagar la PC?')) return
    setShuttingDown(true)
    try {
      await fetch('/api/shutdown', { method: 'POST' })
    } finally {
      setShuttingDown(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-[#8b949e] font-mono animate-pulse flex items-center gap-3">
        <Zap className="text-red-500 animate-bounce" size={20} /> Loading rescue_admin...
      </div>
    </div>
  )

  return (
    <div className="bg-[#0f1117] text-[#f0f6fc] font-sans selection:bg-red-500/30" style={{ minHeight: 'auto', paddingBottom: '32px' }}>

      {/* 🧭 HEADER & MOBILE TABS */}
      <div className="sticky top-0 bg-[#0f1117]/90 backdrop-blur-md border-b border-[#2d3139] z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <h1 className="font-mono font-bold tracking-widest text-sm">RESCUECHIP<span className="text-[#8b949e] ml-1">/admin</span></h1>
          </div>
          <button
            onClick={handleShutdown}
            disabled={shuttingDown}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-mono disabled:opacity-50"
            title="Apagar PC"
          >
            <Power size={14} />
            {shuttingDown ? 'Apagando...' : 'Apagar PC'}
          </button>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-[#2d3139]/50 px-2 lg:px-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.id ? 'border-white text-white' : 'border-transparent text-[#8b949e] hover:text-white/80'}`}>
              <t.icon size={16} />
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 bg-[#2d3139] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">

        {/* 1️⃣ OVERVIEW */}
        {tab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <StatCard label="Ingresos" value={fmt(totalRevenue)} color="text-emerald-400" icon={CreditCard} sub={`${totalUnits} unids`} />
              <StatCard label="Usuarios" value={profiles.total} icon={Users} color="text-amber-400" sub={`${profiles.withPhone} actv`} />
              <StatCard label="Emergencias" value={accidents} icon={Siren} color="text-red-500" sub={scanRate > 0 ? `${scanRate}% escaneo` : 'Sin datos'} />
              <StatCard label="Pipeline" value={fmt(b2bValue)} icon={Building2} color="text-purple-400" sub={`${pipeline.length} opps`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#161b22] border border-[#2d3139] rounded-xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-[#8b949e] text-[11px] font-mono uppercase tracking-wider">Flujo de Ingresos (MXN)</div>
                </div>
                {monthlySales.length === 0 ? <div className="text-[#8b949e] text-sm text-center py-10">Sin ventas registradas</div> : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlySales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
                        <XAxis dataKey="mes" stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#2d3139', color: '#f0f6fc', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => fmt(v)} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-[#161b22] border border-[#2d3139] rounded-xl p-5">
                {accidents === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#2d3139] rounded-xl">
                    <Target size={32} className="text-[#8b949e] mb-3" />
                    <h4 className="text-[#f0f6fc] font-medium text-sm mb-1">North Star Pendiente</h4>
                    <p className="text-[#8b949e] text-xs">Acelera distribución hasta la primera emergencia documentada.</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-red-500/10"><Siren size={100} /></div>
                    <div className="relative z-10">
                      <div className="text-red-400 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={12} /> North Star Hit</div>
                      <div className="text-3xl font-mono font-bold text-white mb-2">{accidents} casos</div>
                      <p className="text-[#8b949e] text-xs leading-relaxed">Vidas tocadas en el campo. Oro puro para B2B.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2️⃣ EMERGENCIAS */}
        {tab === 'emergencies' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {accidents === 0 ? (
              <div className="bg-[#161b22] border border-[#2d3139] rounded-xl p-12 text-center text-[#8b949e]">No hay incidencias registradas.</div>
            ) : (
              <div className="grid gap-3">
                {emergencies.map(e => (
                  <div key={e.id} className={`bg-[#161b22] border rounded-xl p-4 ${e.b2b_case_study ? 'border-purple-500/30' : e.media_worthy ? 'border-red-500/30' : 'border-[#2d3139]'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        {e.media_worthy && <Tag colorClass="bg-red-500/10 text-red-400 border-red-500/20">MEDIÁTICO</Tag>}
                        {e.b2b_case_study && <Tag colorClass="bg-purple-500/10 text-purple-400 border-purple-500/20">CASO B2B</Tag>}
                        <Tag colorClass={['grave', 'critico'].includes(e.severidad) ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}>{e.severidad.toUpperCase()}</Tag>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#8b949e] font-mono text-xs">{fmtDate(e.incident_date)}</span>
                        <button onClick={() => { setEditItem(e); setAccForm(e); setModal('accident') }} className="text-[#8b949e] hover:text-white">Editar</button>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Siren size={14} className="text-red-500" />
                      {e.tipo} en {e.estado}
                      {e.chip_folio && <span className="font-mono text-amber-400 ml-1">[{e.chip_folio}]</span>}
                    </div>
                    <div className="text-xs text-[#8b949e] flex gap-3 mt-3 pt-3 border-t border-[#2d3139]/50">
                      {e.chip_scanned && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Escaneado</span>}
                      {e.family_notified && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Familia</span>}
                      {e.mins_to_scan && <span className="flex items-center gap-1"><Clock size={12} /> {e.mins_to_scan} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3️⃣ VENTAS */}
        {tab === 'sales' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-2">
              <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 px-4 py-2 text-[10px] font-mono uppercase text-[#8b949e]">
                <div className="col-span-1">Fecha</div>
                <div className="col-span-2 lg:col-span-3">Detalle</div>
                <div className="col-span-1 text-right">Monto</div>
              </div>
              {sales.map(s => (
                <div key={s.id} onClick={() => { setEditItem(s); setSaleForm(s); setModal('sale') }} className="bg-[#161b22] hover:bg-[#1c2128] border border-[#2d3139] rounded-lg p-3 lg:p-4 flex cursor-pointer transition-colors text-sm">
                  <div className="w-1/4 font-mono text-[#8b949e] flex items-center">{fmtDate(s.sale_date)}</div>
                  <div className="w-2/4 lg:w-3/4 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                    <span className="font-medium truncate">{s.plan} {s.qty > 1 && <span className="font-mono text-emerald-400">x{s.qty}</span>}</span>
                    <div className="flex gap-2 items-center">
                      <Tag colorClass={s.entry_type === 'stripe' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-800 text-gray-300 border-gray-700'}>{s.channel}</Tag>
                      {s.customer_name && <span className="text-xs text-[#8b949e] hidden lg:inline">{s.customer_name}</span>}
                    </div>
                  </div>
                  <div className="w-1/4 flex justify-end items-center font-mono font-bold text-emerald-400">
                    {fmt(planPrice(s.plan) * (s.qty || 1))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4️⃣ TALLERES & B2B (Simplified standard table layout for mobile & desktop) */}
        {(tab === 'workshops' || tab === 'b2b') && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid gap-3">
            {(tab === 'workshops' ? workshops : pipeline).length === 0 ? (
              <div className="bg-[#161b22] border border-[#2d3139] rounded-xl p-12 text-center text-[#8b949e]">Lista vacía.</div>
            ) : (
              (tab === 'workshops' ? workshops : pipeline).map(item => (
                <div key={item.id} onClick={() => { setEditItem(item); tab === 'workshops' ? setWsForm(item) : setB2bForm(item); setModal(tab) }} className="bg-[#161b22] border border-[#2d3139] hover:bg-[#1c2128] cursor-pointer rounded-xl p-4 transition-colors">
                  <div className="flex justify-between mb-3">
                    <h4 className="font-semibold text-[15px]">{tab === 'workshops' ? item.name : item.company_name}</h4>
                    <Tag colorClass="bg-white/10 text-[#f0f6fc] border-white/10">{tab === 'workshops' ? WS_STATUS_LABELS[item.status] : STAGE_LABELS[item.stage]}</Tag>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#8b949e]">
                    {tab === 'workshops' ? (
                      <>
                        <span>Stock: <strong className="text-white">{item.chips_consigned - item.chips_sold - item.chips_returned}</strong></span>
                        <span className={item.pending_payment > 0 ? 'text-red-400' : ''}>Deuda: {fmt(item.pending_payment || 0)}</span>
                      </>
                    ) : (
                      <>
                        <span>Valor: <strong className="text-emerald-400">{fmt(item.estimated_value)}</strong></span>
                        <span className="text-amber-400">{item.probability}% Win</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5️⃣ ANALYTICS */}
        {tab === 'analytics' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid gap-4">
            <div className="bg-[#161b22] border border-[#2d3139] rounded-xl p-5">
              <h3 className="text-[#8b949e] text-[11px] font-mono uppercase tracking-wider mb-4">Usuarios Funnel</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { l: 'Adquiridos', v: totalUnits, c: 'text-white' },
                  { l: 'Registrados', v: profiles.total, c: 'text-blue-400' },
                  { l: 'Con Teléfono', v: profiles.withPhone, c: 'text-amber-400' },
                  { l: 'Emergencias', v: accidents, c: 'text-red-400' }
                ].map(x => (
                  <div key={x.l} className="bg-[#0f1117] border border-[#2d3139] rounded-lg p-3 text-center">
                    <div className={`text-xl font-mono font-bold mb-1 ${x.c}`}>{x.v}</div>
                    <div className="text-[10px] text-[#8b949e] uppercase font-mono">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Insights Banner */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-5">
              <h3 className="text-blue-400 text-sm font-semibold mb-2 flex items-center gap-2"><Zap size={16} /> Insights Generados</h3>
              <ul className="text-sm text-[#8b949e] space-y-2 list-disc list-inside">
                {totalUnits < 50 && <li>Fase Seed: Enfócate en los 100 usuarios (hacer de mano en mano)</li>}
                {profiles.total > 0 && <li>Tasa Veracidad Celular: {Math.round((profiles.withPhone / (profiles.total || 1)) * 100)}% (Potencial N8N)</li>}
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* 🔴 MOBILE FAB (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button onClick={() => {
          resetForms()
          if (tab === 'overview' || tab === 'sales') setModal('sale')
          else if (tab === 'emergencies') setModal('accident')
          else if (tab === 'workshops') setModal('workshop')
          else if (tab === 'b2b') setModal('b2b')
          else setModal('sale')
        }} className="bg-red-600 text-white w-14 h-14 rounded-full shadow-lg shadow-red-900/50 flex items-center justify-center border border-red-500 active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      {/* 🖥 DESKTOP QUICK ACTIONS */}
      {tab === 'overview' && <div className="hidden lg:flex fixed bottom-6 right-6 z-30 gap-3">
        <button onClick={() => { resetForms(); setModal('sale') }} className="bg-[#161b22] border border-[#2d3139] text-[#f0f6fc] px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-[#21262d]">Registrar Venta</button>
        <button onClick={() => { resetForms(); setModal('accident') }} className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg shadow-red-900/50 border border-red-500 text-sm font-medium hover:bg-red-500">Registrar Emergencia</button>
      </div>}

      {/* 🔮 MODALS */}
      {modal === 'sale' && (
        <Modal title={`${editItem ? 'Editar' : 'Nueva'} Venta`} onClose={() => setModal(null)}>
          <div className="flex flex-wrap gap-x-3">
            <Field label="Fecha" half><input type="date" value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} className={inputClass} /></Field>
            <Field label="Cant." half><input type="number" min={1} value={saleForm.qty} onChange={e => setSaleForm({ ...saleForm, qty: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label="Plan">
              <select value={saleForm.plan} onChange={e => setSaleForm({ ...saleForm, plan: e.target.value })} className={inputClass}>
                {PLANES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Canal">
              <select value={saleForm.channel} onChange={e => setSaleForm({ ...saleForm, channel: e.target.value })} className={inputClass}>
                {CANALES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <button onClick={handleSaveSale} disabled={saving} className="w-full bg-white text-black font-semibold rounded-lg py-3 mt-4 hover:bg-gray-200">{saving ? 'Guardando...' : 'Guardar Venta'}</button>
          </div>
        </Modal>
      )}

      {modal === 'accident' && (
        <Modal title={`${editItem ? 'Editar' : 'Registrar'} Emergencia`} onClose={() => setModal(null)} wide>
          <div className="flex flex-wrap gap-x-3">
            <Field label="Fecha" half><input type="date" value={accForm.incident_date} onChange={e => setAccForm({ ...accForm, incident_date: e.target.value })} className={inputClass} /></Field>
            <Field label="Hora aprox." half><input type="time" value={accForm.incident_time} onChange={e => setAccForm({ ...accForm, incident_time: e.target.value })} className={inputClass} /></Field>
            <Field label="Estado" half>
              <select value={accForm.estado} onChange={e => setAccForm({ ...accForm, estado: e.target.value })} className={inputClass}>{ESTADOS.map(s => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Tipo" half>
              <select value={accForm.tipo} onChange={e => setAccForm({ ...accForm, tipo: e.target.value })} className={inputClass}>{TIPOS_ACC.map(t => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Severidad" half>
              <select value={accForm.severidad} onChange={e => setAccForm({ ...accForm, severidad: e.target.value })} className={inputClass}>{SEVERIDADES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select>
            </Field>
            <Field label="Folio RSC" half><input placeholder="RSC-XXXXX" value={accForm.chip_folio} onChange={e => setAccForm({ ...accForm, chip_folio: e.target.value })} className={inputClass} /></Field>
          </div>
          <Field label="Outcome del chip">
            <select value={accForm.outcome} onChange={e => setAccForm({ ...accForm, outcome: e.target.value })} className={inputClass}>{OUTCOMES.map(o => <option key={o}>{o}</option>)}</select>
          </Field>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[['chip_scanned', 'Chip escaneado'], ['medical_info_used', 'Info médica usada'], ['family_notified', 'Familia notificada'], ['hospital_notified', 'Hospital notificado'], ['media_worthy', 'Mediático'], ['b2b_case_study', 'Caso B2B']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-xs text-[#8b949e]">
                <input type="checkbox" checked={(accForm as any)[k]} onChange={e => setAccForm({ ...accForm, [k]: e.target.checked })} className="accent-red-500 bg-[#0d1117] border-[#2d3139]" />
                {l}
              </label>
            ))}
          </div>

          <Field label="Detalles del caso">
            <textarea placeholder="Contexto..." value={accForm.notes} onChange={e => setAccForm({ ...accForm, notes: e.target.value })} className={`${inputClass} min-h-[80px]`} />
          </Field>
          <button onClick={handleSaveAcc} disabled={saving} className="w-full bg-red-600 text-white font-semibold rounded-lg py-3 hover:bg-red-500 transition-colors">{saving ? 'Guardando...' : 'Guardar Emergencia'}</button>
        </Modal>
      )}

      {modal === 'workshop' && (
        <Modal title={`${editItem ? 'Editar' : 'Agregar'} Taller`} onClose={() => setModal(null)} wide>
          <div className="flex flex-wrap gap-x-3">
            <Field label="Nombre" half><input placeholder="Taller Sur..." value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} className={inputClass} /></Field>
            <Field label="Dueño/Contacto" half><input value={wsForm.owner_name} onChange={e => setWsForm({ ...wsForm, owner_name: e.target.value })} className={inputClass} /></Field>
            <Field label="Teléfono" half><input type="tel" value={wsForm.phone} onChange={e => setWsForm({ ...wsForm, phone: e.target.value })} className={inputClass} /></Field>
            <Field label="Estado" half>
              <select value={wsForm.estado} onChange={e => setWsForm({ ...wsForm, estado: e.target.value })} className={inputClass}>{ESTADOS.map(s => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Estatus">
              <select value={wsForm.status} onChange={e => setWsForm({ ...wsForm, status: e.target.value })} className={inputClass}>{Object.entries(WS_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <Field label="Chips consignados" half><input type="number" min={0} value={wsForm.chips_consigned} onChange={e => setWsForm({ ...wsForm, chips_consigned: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label="Precio base" half><input type="number" min={0} value={wsForm.price_per_chip} onChange={e => setWsForm({ ...wsForm, price_per_chip: Number(e.target.value) })} className={inputClass} /></Field>
          </div>
          <button onClick={handleSaveWs} disabled={saving} className="w-full bg-white text-black font-semibold rounded-lg py-3 mt-4 hover:bg-gray-200">{saving ? 'Guardando...' : 'Guardar Taller'}</button>
        </Modal>
      )}

      {modal === 'b2b' && (
        <Modal title={`${editItem ? 'Editar' : 'Nueva'} Oportunidad B2B`} onClose={() => setModal(null)} wide>
          <div className="flex flex-wrap gap-x-3">
            <Field label="Empresa" half><input placeholder="GNP..." value={b2bForm.company_name} onChange={e => setB2bForm({ ...b2bForm, company_name: e.target.value })} className={inputClass} /></Field>
            <Field label="Etapa" half>
              <select value={b2bForm.stage} onChange={e => setB2bForm({ ...b2bForm, stage: e.target.value })} className={inputClass}>{Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <Field label="Contacto" half><input value={b2bForm.contact_name} onChange={e => setB2bForm({ ...b2bForm, contact_name: e.target.value })} className={inputClass} /></Field>
            <Field label="Teléfono" half><input type="tel" value={b2bForm.contact_phone} onChange={e => setB2bForm({ ...b2bForm, contact_phone: e.target.value })} className={inputClass} /></Field>
            <Field label="Chips estim." half><input type="number" value={b2bForm.estimated_chips} onChange={e => setB2bForm({ ...b2bForm, estimated_chips: e.target.value })} className={inputClass} /></Field>
            <Field label="Valor (MXN)" half><input type="number" value={b2bForm.estimated_value} onChange={e => setB2bForm({ ...b2bForm, estimated_value: e.target.value })} className={inputClass} /></Field>
            <Field label={`Probabilidad: ${b2bForm.probability}%`}>
              <input type="range" min={0} max={100} step={10} value={b2bForm.probability} onChange={e => setB2bForm({ ...b2bForm, probability: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Field>
            <Field label="Notas">
              <textarea placeholder="Contexto de la negociación..." value={b2bForm.notes} onChange={e => setB2bForm({ ...b2bForm, notes: e.target.value })} className={`${inputClass} min-h-[60px]`} />
            </Field>
          </div>
          <button onClick={handleSaveB2b} disabled={saving} className="w-full bg-white text-black font-semibold rounded-lg py-3 hover:bg-gray-200">{saving ? 'Guardando...' : 'Guardar Oportunidad'}</button>
        </Modal>
      )}

    </div>
  )
}
