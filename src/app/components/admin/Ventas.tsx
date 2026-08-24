import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Search, Info, X, ShoppingBag, DollarSign, CheckCircle, XCircle, Clock, User, Ban, FileDown, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { ventasAPI } from '../../lib/api';

type EstadoVenta = 'Pendiente' | 'Completada' | 'Cancelada';

interface Venta {
  id: number;
  numeroPedido: string;
  fecha: string;
  cliente: string;
  empleado: string;
  producto: string;
  cantidad: number;
  total: number;
  estado: EstadoVenta;
  estadoRaw: boolean | null;
}

const estadoStyle = (estado: EstadoVenta) => {
  switch (estado) {
    case 'Completada': return { bg: '#D1FAE5', color: '#065F46', icon: CheckCircle };
    case 'Cancelada':  return { bg: '#FEE2E2', color: '#991B1B', icon: XCircle };
    default:           return { bg: '#FEF3C7', color: '#92400E', icon: Clock };
  }
};

const mapEstado = (raw: boolean | null): EstadoVenta => {
  if (raw === false) return 'Cancelada';
  if (raw === true)  return 'Completada';
  return 'Pendiente';
};

function ViewModal({ venta, onClose, onAnular, onCompletar }: {
  venta: Venta; onClose: () => void;
  onAnular: () => void; onCompletar: () => void;
}) {
  const s = estadoStyle(venta.estado);
  const Icon = s.icon;
  const canComplete = venta.estado === 'Pendiente';
  const canCancel   = venta.estado === 'Pendiente';

  const Row = ({ icon: I, label, value }: { icon: any; label: string; value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'rgba(45,75,57,0.03)', marginBottom: '8px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
        <I style={{ width: '15px', height: '15px', color: '#fff' }} />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div>
      <Row icon={User}        label="Cliente"    value={venta.cliente} />
      <Row icon={ShoppingBag} label="Producto"   value={venta.producto} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <Row icon={TrendingUp} label="Cantidad"  value={String(venta.cantidad)} />
        <Row icon={DollarSign} label="Total"     value={`$${Number(venta.total).toLocaleString()} COP`} />
      </div>
      <Row icon={Calendar}    label="Fecha"      value={venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-CO') : '—'} />
      <Row icon={User}        label="Empleado"   value={venta.empleado} />

      {/* Estado badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9999px', background: s.bg, marginBottom: '24px' }}>
        <Icon style={{ width: '14px', height: '14px', color: s.color }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{venta.estado}</span>
      </div>

      {/* Acciones */}
      {(canComplete || canCancel) && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {canComplete && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCompletar}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#065F46,#047857)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle style={{ width: '15px', height: '15px' }} /> Marcar Completada
            </motion.button>
          )}
          {canCancel && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onAnular}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#DC2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Ban style={{ width: '15px', height: '15px' }} /> Cancelar Venta
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

export function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Venta | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toCancel, setToCancel] = useState<Venta | null>(null);

  const cargar = async () => {
    try {
      const data = await ventasAPI.getAll();
      setVentas(data.ventas.map((v: any): Venta => ({
        id: v.id_ventas,
        numeroPedido: `VTA-${String(v.id_ventas).padStart(4, '0')}`,
        fecha: v.fecha || '',
        cliente: v.cliente || '—',
        empleado: v.empleado || '—',
        producto: v.producto || '—',
        cantidad: Number(v.cantidad) || 1,
        total: Number(v.total) || 0,
        estadoRaw: v.estado,
        estado: mapEstado(v.estado),
      })));
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar ventas');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleCompletar = async (venta: Venta) => {
    try {
      await ventasAPI.updateEstado(venta.id, true);
      toast.success('Venta marcada como completada');
      setShowViewModal(false);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al actualizar'); }
  };

  const handleAnular = async () => {
    if (!toCancel) return;
    try {
      await ventasAPI.updateEstado(toCancel.id, false);
      toast.success('Venta cancelada');
      setShowViewModal(false);
      setShowDeleteModal(false);
      setToCancel(null);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al cancelar'); }
  };

  const descargarPDF = (v: Venta) => {
    const doc = new jsPDF();
    doc.setFillColor(45, 75, 57);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprobante de Venta', 14, 20);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const col1 = 14, col2 = 110, lh = 10;
    let y = 45;

    const field = (label: string, value: string, x: number, yPos: number) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100);
      doc.text(label, x, yPos);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
      doc.text(value, x, yPos + 6);
    };

    field('N° Venta',  v.numeroPedido, col1, y);
    field('Fecha',     v.fecha ? new Date(v.fecha).toLocaleDateString('es-CO') : '—', col2, y); y += lh * 2;
    field('Cliente',   v.cliente, col1, y);
    field('Empleado',  v.empleado, col2, y); y += lh * 2;
    field('Producto',  v.producto, col1, y); y += lh * 2;
    field('Cantidad',  String(v.cantidad), col1, y); y += lh * 2;

    doc.setDrawColor(45, 75, 57);
    doc.line(14, y, 196, y); y += 8;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 75, 57);
    doc.text('TOTAL', col1, y);
    doc.text(`$${v.total.toLocaleString()} COP`, col2, y); y += lh;

    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
    doc.text(`Estado: ${v.estado}`, col1, y + 4);
    doc.save(`venta-${v.numeroPedido}.pdf`);
  };

  const filtered = ventas.filter(v =>
    v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCompletadas = ventas.filter(v => v.estado === 'Completada').reduce((s, v) => s + v.total, 0);
  const pendientes = ventas.filter(v => v.estado === 'Pendiente').length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <TrendingUp style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Gestión de Ventas</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{ventas.length} ventas registradas</span>
                {pendientes > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>{pendientes} pendientes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
            <input type="text" placeholder="Buscar por cliente, producto o N° venta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '360px', outline: 'none' }} />
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando ventas...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['N° VENTA', 'FECHA', 'CLIENTE', 'PRODUCTO', 'CANT.', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['CANT.', 'TOTAL', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((v, i) => {
                  const s = estadoStyle(v.estado);
                  const Icon = s.icon;
                  return (
                    <motion.tr key={v.id}
                      initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>{v.numeroPedido}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>
                        {v.fecha ? new Date(v.fecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{v.cliente}</td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>{v.producto}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{v.cantidad}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#B8860B' }}>
                        ${Number(v.total).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '9999px', background: s.bg }}>
                          <Icon style={{ width: '13px', height: '13px', color: s.color }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: s.color }}>{v.estado}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setSelected(v); setShowViewModal(true); }}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                          {v.estado === 'Pendiente' && (
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToCancel(v); setShowDeleteModal(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Ban style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          )}
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => descargarPDF(v)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <FileDown style={{ width: '15px', height: '15px', color: '#2D4B39' }} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
                  {ventas.length === 0 ? 'No hay ventas registradas aún' : 'No se encontraron ventas'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* MODAL VER + ACCIONES */}
      {showViewModal && selected && (
        <Modal isOpen={true} onClose={() => setShowViewModal(false)} title={`Detalle — ${selected.numeroPedido}`}>
          <ViewModal
            venta={selected}
            onClose={() => setShowViewModal(false)}
            onCompletar={() => handleCompletar(selected)}
            onAnular={() => { setToCancel(selected); setShowViewModal(false); setShowDeleteModal(true); }}
          />
        </Modal>
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN */}
      {showDeleteModal && toCancel && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setToCancel(null); }}
          onConfirm={handleAnular}
          itemName={`venta ${toCancel.numeroPedido}`}
          itemType="Venta"
        />
      )}
    </motion.div>
  );
}
