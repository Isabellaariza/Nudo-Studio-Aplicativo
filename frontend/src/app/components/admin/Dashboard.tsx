import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
  Award,
  CalendarCheck,
  UserCheck,
  Calendar,
  Loader2
} from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { dashboardAPI } from '../../lib/api';

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getMedalColor = (rank: number) => {
  switch (rank) {
    case 1: return '#FFD700';
    case 2: return '#C0C0C0';
    case 3: return '#CD7F32';
    default: return '#2D4B39';
  }
};

export function Dashboard({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { isDesktop } = useMediaQuery();
  const [salesPeriod, setSalesPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const cargar = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const d = await dashboardAPI.getStats();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#2D4B39', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '12px' }}>
        <AlertTriangle style={{ width: '32px', height: '32px', color: '#EF4444' }} />
        <p style={{ color: '#EF4444', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  const { resumen, talleres_hoy = [], top_productos = [], ventas_semana = [], ventas_mensual = [], ventas_anual = [] } = data || {};

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const activeVentas = salesPeriod === 'weekly' ? ventas_semana : salesPeriod === 'monthly' ? ventas_mensual : ventas_anual;

  // Construir tarjetas de alertas con datos reales
  const alertCards = [
    { id: 'stock',      title: 'Stock Crítico',     value: String(resumen?.stock_critico ?? 0),     icon: AlertTriangle, color: '#EF4444', action: 'Ver insumos →',    navigate: 'stock' },
    { id: 'products',  title: 'Productos',          value: String(resumen?.total_productos ?? 0),   icon: Package,       color: '#B8860B', action: 'En catálogo',      navigate: undefined },
    { id: 'orders',    title: 'Pedidos',            value: String(resumen?.pedidos_pendientes ?? 0), icon: ShoppingCart,  color: '#10B981', action: 'Pendientes',       navigate: undefined },
    { id: 'matriculas', title: 'Matrículas',        value: String(resumen?.matriculas_activas ?? 0), icon: UserCheck,     color: '#6366F1', action: 'Activas',          navigate: undefined },
  ];

  const chartValues = activeVentas.length > 0
    ? activeVentas.map((v: any) => Number(v.total))
    : Array(salesPeriod === 'yearly' ? 12 : 7).fill(0);
  const chartLabels = activeVentas.length > 0
    ? activeVentas.map((v: any) => {
        if (salesPeriod === 'yearly') {
          const [, m] = (v.mes as string).split('-');
          return monthNames[parseInt(m, 10) - 1];
        }
        const d = new Date(v.fecha);
        return salesPeriod === 'weekly'
          ? weekDays[d.getDay() === 0 ? 6 : d.getDay() - 1]
          : `${d.getDate()}/${d.getMonth() + 1}`;
      })
    : salesPeriod === 'yearly' ? monthNames.slice(0, 12) : weekDays;
  const maxVal = Math.max(...chartValues, 1);
  const barPercentages = chartValues.map((v: number) => (v / maxVal) * 100);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // Top productos
  const topMax = top_productos[0]?.ventas || 1;

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: isDesktop ? '1536px' : '100%', margin: '0 auto', padding: isDesktop ? '32px 8px 80px 8px' : '24px 8px 60px 8px' }}>

        {/* BARRA SUPERIOR: fecha + botón refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isDesktop ? '24px' : '16px' }}>
          <p style={{ fontSize: '14px', color: '#6B7280', textTransform: 'capitalize', margin: 0 }}>{currentDate}</p>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => cargar(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(45,75,57,0.2)', background: '#fff', cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, color: '#2D4B39', boxShadow: '0 2px 8px rgba(45,75,57,0.06)' }}
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw style={{ width: '15px', height: '15px' }} />
            </motion.div>
            {refreshing ? 'Actualizando...' : 'Actualizar datos'}
          </motion.button>
        </div>

        {/* GRID 1 — TARJETAS ALERTAS */}
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: isDesktop ? '24px' : '16px', marginBottom: isDesktop ? '24px' : '16px' }}>
          {alertCards.map((card, index) => {
            const Icon = card.icon;
            const showDot = parseInt(card.value) > 0;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ translateY: -4, boxShadow: '0 8px 24px rgba(45, 75, 57, 0.12)', transition: { duration: 0.2 } }}
                onClick={() => card.navigate && onNavigate?.(card.navigate)}
                style={{ background: '#ffffff', border: '1px solid rgba(224, 209, 192, 0.2)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(45, 75, 57, 0.04)', position: 'relative', overflow: 'hidden', cursor: card.navigate ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <Icon style={{ width: '24px', height: '24px', color: card.color }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#2D4B39' }}>{card.value}</span>
                    {showDot && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: card.color }} />}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#2D4B39', marginBottom: '8px' }}>{card.title}</p>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>{card.action}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* GRID 2 — VENTAS Y TOP PRODUCTOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '32px' }}>

          {/* TARJETA VENTAS */}
          <motion.div
            initial={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 32px rgba(45, 75, 57, 0.12)', border: '1px solid rgba(184, 134, 11, 0.1)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(184, 134, 11, 0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(184, 134, 11, 0.25)' }}>
                  <TrendingUp style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#2D4B39', marginBottom: '2px' }}>
                    Ventas {salesPeriod === 'weekly' ? 'Semanales' : salesPeriod === 'monthly' ? 'Mensuales' : 'Anuales'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                    {salesPeriod === 'weekly' ? 'Últimos 7 días' : salesPeriod === 'monthly' ? 'Últimos 30 días' : 'Últimos 12 meses'}
                  </p>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                  style={{ padding: '10px 16px', background: 'rgba(184, 134, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(184, 134, 11, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#B8860B' }}
                >
                  <Calendar style={{ width: '16px', height: '16px' }} />
                  {salesPeriod === 'weekly' ? 'Semanal' : salesPeriod === 'monthly' ? 'Mensual' : 'Anual'}
                </motion.button>
                {showPeriodMenu && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', top: '50px', right: 0, background: '#ffffff', border: '1px solid rgba(184, 134, 11, 0.2)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(45, 75, 57, 0.15)', zIndex: 50, overflow: 'hidden', minWidth: '140px' }}>
                    {[{ label: 'Semanal', value: 'weekly' }, { label: 'Mensual', value: 'monthly' }, { label: 'Anual', value: 'yearly' }].map((p) => (
                      <motion.button key={p.value} whileHover={{ backgroundColor: 'rgba(184, 134, 11, 0.05)' }}
                        onClick={() => { setSalesPeriod(p.value as any); setShowPeriodMenu(false); }}
                        style={{ display: 'block', width: '100%', padding: '12px 16px', fontSize: '14px', color: salesPeriod === p.value ? '#B8860B' : '#2D4B39', background: salesPeriod === p.value ? 'rgba(184, 134, 11, 0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: salesPeriod === p.value ? 700 : 500 }}
                      >{p.label}</motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* GRÁFICA */}
            <div style={{ position: 'relative', height: '260px', marginTop: '24px' }}>
              <div style={{ position: 'absolute', inset: '0 0 32px 90px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{ width: '100%', height: '1px', background: i === 0 ? 'rgba(45, 75, 57, 0.15)' : 'rgba(45, 75, 57, 0.06)', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '-90px', top: '-8px', fontSize: '10px', color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {formatCOP(Math.round((4 - i) * maxVal / 4))}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: '32px', left: '90px', right: '0', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                {barPercentages.map((pct: number, index: number) => {
                  const barHeight = (pct / 100) * 200;
                  const isMax = pct === Math.max(...barPercentages);
                  return (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}
                        style={{ fontSize: '12px', fontWeight: 700, color: isMax ? '#B8860B' : '#6B7280', marginBottom: '4px' }}>
                        {formatCOP(chartValues[index])}
                      </motion.div>
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: `${barHeight}px` }} transition={{ delay: 0.1 * index, duration: 0.6, ease: 'easeOut' }}
                        whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                        style={{ width: '100%', borderRadius: '8px 8px 0 0', background: isMax ? 'linear-gradient(180deg, #B8860B 0%, #DAA520 100%)' : 'linear-gradient(180deg, #2D4B39 0%, #3F5243 100%)', boxShadow: isMax ? '0 4px 12px rgba(184, 134, 11, 0.3)' : '0 4px 12px rgba(45, 75, 57, 0.15)', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)', borderRadius: '8px 8px 0 0' }} />
                      </motion.div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: isMax ? '#B8860B' : '#6B7280', textAlign: 'center', marginTop: '8px' }}>
                        {chartLabels[index]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* TARJETA TOP PRODUCTOS */}
          <motion.div
            initial={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ boxShadow: '0 12px 40px rgba(45, 75, 57, 0.15)', transition: { duration: 0.3 } }}
            style={{ background: '#ffffff', border: '1px solid rgba(224, 209, 192, 0.2)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 32px rgba(45, 75, 57, 0.08)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2D4B39', marginBottom: '4px' }}>Top 5 Productos</h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Los más vendidos del mes</p>
              </div>
              <Award style={{ width: '24px', height: '24px', color: '#B8860B' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {top_productos.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '24px 0' }}>Sin datos de ventas aún</p>
              ) : top_productos.map((product: any, index: number) => {
                const rank = index + 1;
                const medalColor = getMedalColor(rank);
                const pct = Math.round((Number(product.ventas) / Number(topMax)) * 100);
                return (
                  <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', fontWeight: 700, color: '#ffffff', background: medalColor, boxShadow: `0 4px 12px ${medalColor}40`, flexShrink: 0 }}>
                      {rank}
                    </motion.div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2D4B39' }}>{product.nombre}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: medalColor }}>{product.ventas}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.7 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                          style={{ height: '8px', borderRadius: '9999px', background: medalColor }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* GRID 3 — INGRESOS Y TALLERES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>

          {/* TARJETA INGRESOS */}
          <motion.div
            initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
            style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#10B981' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>Ingresos del Mes</h3>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                {formatCOP(Number(resumen?.ingresos_mes ?? resumen?.monto_ventas ?? 0))}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(16,185,129,0.7)', fontWeight: 500 }}>Ventas + abonos del mes</p>
            </div>
            <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#2D4B39' }}>Total clientes activos</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{resumen?.total_clientes ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#2D4B39' }}>Matrículas activas</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{resumen?.matriculas_activas ?? 0}</span>
              </div>
            </div>
          </motion.div>

          {/* TARJETA TALLERES */}
          <motion.div
            initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
            style={{ background: '#ffffff', border: '1px solid rgba(224, 209, 192, 0.2)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(45, 75, 57, 0.04)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2D4B39', marginBottom: '4px' }}>Talleres de Hoy</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', textTransform: 'capitalize' }}>{currentDate}</p>
              </div>
              <CalendarCheck style={{ width: '24px', height: '24px', color: '#B8860B' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {talleres_hoy.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '24px 0' }}>No hay talleres programados para hoy</p>
              ) : talleres_hoy.map((t: any, index: number) => (
                <div key={index} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(45, 75, 57, 0.05)', borderLeft: '4px solid #B8860B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39', flex: 1 }}>{t.taller}</h4>
                    <span style={{ padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', whiteSpace: 'nowrap', marginLeft: '8px' }}>{t.estado}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar style={{ width: '12px', height: '12px' }} />
                      <span>{t.hora_inicio} - {t.hora_fin}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck style={{ width: '12px', height: '12px' }} />
                      <span>{t.inscritos}/{t.cupos_disponibles}</span>
                    </div>
                  </div>
                  {t.instructor && <p style={{ fontSize: '12px', color: '#B8860B' }}>Instructor: {t.instructor}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
