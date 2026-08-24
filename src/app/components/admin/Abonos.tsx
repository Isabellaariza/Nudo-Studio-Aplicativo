import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Search, Plus, Info, X, CheckCircle, XCircle, Receipt, Ban, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Modal';
import { abonosAPI, estudiantesAPI, talleresAPI } from '../../lib/api';

interface Abono {
  id: number;
  estudiante: string;
  correo: string;
  celular: string;
  taller: string;
  montoAbonado: number;
  saldoPendiente: number;
  montoTotal: number;
  porcentajeAbono: number;
  fechaAbono: string;
  estado: 'por_verificar' | 'aprobado' | 'completo' | 'rechazado' | 'cancelado';
  id_estudiante?: number;
  id_taller?: number;
  id_matricula?: number;
  comprobante_pago?: string | null;
  motivo_rechazo?: string | null;
}

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload';
const CLOUDINARY_PRESET = 'nudo_studio';

export function Abonos() {
  const [abonos, setAbonos]               = useState<Abono[]>([]);
  const [estudiantes, setEstudiantes]     = useState<any[]>([]);
  const [talleres, setTalleres]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');

  // modales
  const [showInfoModal, setShowInfoModal]         = useState(false);
  const [showFormModal, setShowFormModal]         = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showComprobante, setShowComprobante]     = useState<string | null>(null);
  const [selected, setSelected]                   = useState<Abono | null>(null);

  // form nuevo abono
  const [formData, setFormData]   = useState<any>({});
  const [uploading, setUploading] = useState(false);

  // rechazo
  const [rechazarId, setRechazarId]         = useState<number | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoCustom, setMotivoCustom]     = useState('');

const MOTIVOS_RECHAZO = [
  'Monto de transferencia incorrecto',
  'Comprobante de pago falso o ya utilizado',
  'Imagen del comprobante borrosa o ilegible',
  'No se visualiza la transferencia en la cuenta bancaria',
  'Otro motivo (especificar abajo)',
];

const motivoFinal = motivoSeleccionado === 'Otro motivo (especificar abajo)' ? motivoCustom : motivoSeleccionado;

  const cargar = async () => {
    try {
      const [aData, eData, tData] = await Promise.all([
        abonosAPI.getAll(),
        estudiantesAPI.getAll(),
        talleresAPI.getAll(),
      ]);
      setAbonos(aData.abonos.map((a: any): Abono => {
        const monto = Number(a.monto_abono) || 0;
        const saldo = Number(a.saldo_pendiente) || 0;
        const total = monto + saldo;
        return {
          id:               a.id_abono,
          estudiante:       a.estudiante || '—',
          correo:           a.correo_estudiante || '—',
          celular:          a.celular_estudiante || '—',
          taller:           a.taller || '—',
          montoAbonado:     monto,
          saldoPendiente:   saldo,
          montoTotal:       total,
          porcentajeAbono:  total > 0 ? Math.round((monto / total) * 100) : 0,
          fechaAbono:       a.fecha_abono ? a.fecha_abono.split('T')[0] : '',
          estado:           a.estado || 'por_verificar',
          id_estudiante:    a.id_estudiante,
          id_taller:        a.id_taller,
          id_matricula:     a.id_matricula,
          comprobante_pago: a.comprobante_pago,
          motivo_rechazo:   a.motivo_rechazo,
        };
      }));
      setEstudiantes(eData.estudiantes || []);
      setTalleres(tData.talleres || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar abonos');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtered = abonos.filter(a =>
    a.estudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.taller.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ESTADO_LABEL: Record<string, string> = {
    por_verificar: 'Por verificar',
    aprobado:      'Aprobado',
    completo:      'Completo',
    rechazado:     'Rechazado',
    cancelado:     'Cancelado',
  };

  const estadoColor = (estado: string) => {
    if (estado === 'completo')      return { bg: 'rgba(16,185,129,0.1)',  text: '#10B981', border: 'rgba(16,185,129,0.2)' };
    if (estado === 'aprobado')      return { bg: 'rgba(59,130,246,0.1)',  text: '#3B82F6', border: 'rgba(59,130,246,0.2)' };
    if (estado === 'rechazado')     return { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444', border: 'rgba(239,68,68,0.2)' };
    if (estado === 'cancelado')     return { bg: 'rgba(107,114,128,0.1)', text: '#6B7280', border: 'rgba(107,114,128,0.2)' };
    return                                 { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B', border: 'rgba(245,158,11,0.2)' }; // por_verificar
  };

  // ── acciones ──────────────────────────────────────────────────────────────

  const handleAprobar = async (id: number) => {
    try {
      await abonosAPI.aprobar(id);
      toast.success('Abono aprobado y matrícula creada');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al aprobar'); }
  };

  const handleRechazar = async () => {
    if (!rechazarId || !motivoFinal.trim()) return;
    try {
      await abonosAPI.rechazar(rechazarId, motivoFinal);
      toast.success('Abono rechazado');
      setShowRechazarModal(false);
      setMotivoSeleccionado('');
      setMotivoCustom('');
      setRechazarId(null);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al rechazar'); }
  };

  const handleAnular = async (id: number) => {
    try {
      await abonosAPI.delete(id);
      toast.success('Abono anulado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al anular'); }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_estudiante) return toast.error('El estudiante es obligatorio');
    try {
      await abonosAPI.create({
        id_estudiante:  Number(formData.id_estudiante),
        id_taller:      formData.id_taller ? Number(formData.id_taller) : null,
        monto_abono:    formData.monto_abono,
        saldo_pendiente: formData.saldo_pendiente,
        metodo_pago:    'Transferencia',
        fecha_abono:    formData.fecha_abono,
        comprobante_pago: formData.comprobante_pago || null,
      });
      toast.success('Abono registrado');
      setShowFormModal(false);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const handleUploadComprobante = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setFormData((p: any) => ({ ...p, comprobante_pago: data.secure_url }));
      toast.success('Comprobante subido');
    } catch { toast.error('No se pudo subir el comprobante'); }
    finally { setUploading(false); }
  };

  const abrirNuevo = () => {
    setFormData({
      id_estudiante: '', id_taller: '',
      monto_abono: 0, saldo_pendiente: 0,
      fecha_abono: new Date().toISOString().split('T')[0],
      comprobante_pago: null,
    });
    setShowFormModal(true);
  };


  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <DollarSign style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '4px' }}>Gestión de Abonos</h1>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>{filtered.length} abonos registrados</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar estudiante o taller..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={abrirNuevo}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Abono
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando abonos...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['ESTUDIANTE', 'TALLER', 'ABONADO', 'SALDO', 'PROGRESO', 'FECHA', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['PROGRESO', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((a, i) => {
                  const col = estadoColor(a.estado);
                  return (
                    <motion.tr key={a.id}
                      initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>

                      {/* Estudiante */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{a.estudiante}</span>
                      </td>

                      {/* Taller */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '13px', color: '#B8860B', fontWeight: 500 }}>{a.taller}</span>
                      </td>

                      {/* Abonado */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>${a.montoAbonado.toLocaleString('es-CO')}</span>
                      </td>

                      {/* Saldo */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: a.saldoPendiente > 0 ? '#EF4444' : '#10B981' }}>
                          ${a.saldoPendiente.toLocaleString('es-CO')}
                        </span>
                      </td>

                      {/* Progreso */}
                      <td style={{ padding: '14px 20px', textAlign: 'center', minWidth: '100px' }}>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{a.porcentajeAbono}%</div>
                        <div style={{ width: '80px', height: '6px', background: 'rgba(45,75,57,0.1)', borderRadius: '3px', overflow: 'hidden', margin: '0 auto' }}>
                          <div style={{ width: `${a.porcentajeAbono}%`, height: '100%', background: a.porcentajeAbono === 100 ? '#10B981' : '#F59E0B', borderRadius: '3px' }} />
                        </div>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{a.fechaAbono || '—'}</span>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                          {ESTADO_LABEL[a.estado] || a.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          {/* Ver detalle */}
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setSelected(a); setShowInfoModal(true); }}
                            title="Ver detalle"
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>

                          {/* Comprobante */}
                          {a.comprobante_pago && (
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => setShowComprobante(a.comprobante_pago!)}
                              title="Ver comprobante"
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Receipt style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                          )}

                          {/* Aprobar / Rechazar — solo abonos por verificar */}
                          {a.estado === 'por_verificar' && (
                            <>
                              <motion.button whileHover={{ scale: 1.15 }} onClick={() => handleAprobar(a.id)}
                                title="Aprobar"
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <CheckCircle style={{ width: '15px', height: '15px', color: '#10B981' }} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setRechazarId(a.id); setMotivoSeleccionado(''); setMotivoCustom(''); setShowRechazarModal(true); }}
                                title="Rechazar"
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <XCircle style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                              </motion.button>
                            </>
                          )}

                          {/* Anular */}
                          {(a.estado === 'por_verificar' || a.estado === 'aprobado') && (
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => handleAnular(a.id)}
                              title="Anular"
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Ban style={{ width: '15px', height: '15px', color: '#9CA3AF' }} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No hay abonos registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>


      {/* MODAL INFO */}
      {showInfoModal && selected && (
        <Modal isOpen={true} onClose={() => setShowInfoModal(false)} title="Detalles del Abono">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Estudiante y taller */}
            <div style={{ padding: '20px', background: 'rgba(45,75,57,0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info style={{ width: '15px', height: '15px', color: '#fff' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', letterSpacing: '0.05em' }}>DATOS DEL ESTUDIANTE</span>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Nombre Completo</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D4B39' }}>{selected.estudiante}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Correo</label>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D4B39' }}>{selected.correo}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Celular</label>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D4B39' }}>{selected.celular}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Taller Inscrito</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#B8860B' }}>{selected.taller}</div>
                </div>
              </div>
            </div>

            {/* Resumen financiero */}
            <div style={{ padding: '20px', background: 'rgba(16,185,129,0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign style={{ width: '15px', height: '15px', color: '#fff' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', letterSpacing: '0.05em' }}>RESUMEN DE PAGOS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Monto Total</label>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39' }}>${selected.montoTotal.toLocaleString('es-CO')} COP</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Monto Abonado</label>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>${selected.montoAbonado.toLocaleString('es-CO')} COP</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Saldo Pendiente</label>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444' }}>${selected.saldoPendiente.toLocaleString('es-CO')} COP</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Estado</label>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: estadoColor(selected.estado).bg, color: estadoColor(selected.estado).text, border: `1px solid ${estadoColor(selected.estado).border}` }}>
                    {ESTADO_LABEL[selected.estado] || selected.estado}
                  </div>
                </div>
              </div>
              {/* Barra de progreso */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>PROGRESO</span>
                  <span style={{ fontSize: '12px', color: '#2D4B39', fontWeight: 700 }}>{selected.porcentajeAbono}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(45,75,57,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${selected.porcentajeAbono}%`, height: '100%', background: selected.porcentajeAbono === 100 ? '#10B981' : '#F59E0B', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {/* Fecha y matrícula */}
            <div style={{ padding: '20px', background: 'rgba(184,134,11,0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#B8860B,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt style={{ width: '15px', height: '15px', color: '#fff' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', letterSpacing: '0.05em' }}>SEGUIMIENTO</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Fecha de Abono</label>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
                    {selected.fechaAbono ? new Date(selected.fechaAbono).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Matrícula Creada</label>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: selected.id_matricula ? '#10B981' : '#9CA3AF' }}>
                    {selected.id_matricula ? `✓ #${selected.id_matricula}` : 'Pendiente'}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón comprobante */}
            {selected.comprobante_pago && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowInfoModal(false); setShowComprobante(selected.comprobante_pago!); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: '1px solid rgba(184,134,11,0.3)', background: 'rgba(184,134,11,0.04)', color: '#B8860B', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                <Eye style={{ width: '16px', height: '16px' }} /> Ver Comprobante de Pago
              </motion.button>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL NUEVO ABONO */}
      {showFormModal && (
        <Modal isOpen={true} onClose={() => setShowFormModal(false)} title="Nuevo Abono">
          <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>ESTUDIANTE *</label>
              <select value={formData.id_estudiante} onChange={e => setFormData((p: any) => ({ ...p, id_estudiante: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', background: 'white' }}>
                <option value="">Seleccionar estudiante...</option>
                {estudiantes.map((e: any) => <option key={e.id_estudiante} value={e.id_estudiante}>{e.nombre_completo}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>TALLER</label>
              <select value={formData.id_taller} onChange={e => setFormData((p: any) => ({ ...p, id_taller: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', background: 'white' }}>
                <option value="">Sin taller asociado</option>
                {talleres.map((t: any) => <option key={t.id_talleres} value={t.id_talleres}>{t.nombre_taller}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>MONTO ABONO</label>
                <input type="number" value={formData.monto_abono} onChange={e => setFormData((p: any) => ({ ...p, monto_abono: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>SALDO PENDIENTE</label>
                <input type="number" value={formData.saldo_pendiente} onChange={e => setFormData((p: any) => ({ ...p, saldo_pendiente: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>FECHA ABONO</label>
              <input type="date" value={formData.fecha_abono} onChange={e => setFormData((p: any) => ({ ...p, fecha_abono: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>COMPROBANTE DE PAGO</label>
              <input type="file" accept="image/*,.pdf"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadComprobante(f); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
              {uploading && <p style={{ fontSize: '12px', color: '#B8860B', marginTop: '4px' }}>Subiendo imagen...</p>}
              {formData.comprobante_pago && !uploading && <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>✓ Comprobante subido a Cloudinary</p>}
            </div>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={uploading}
              style={{ padding: '14px', borderRadius: '10px', border: 'none', background: uploading ? '#9CA3AF' : 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
              Guardar Abono
            </motion.button>
          </form>
        </Modal>
      )}

      {/* MODAL RECHAZAR */}
      <AnimatePresence>
        {showRechazarModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowRechazarModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px rgba(239,68,68,0.2)' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#991B1B', margin: 0 }}>Rechazar Comprobante</h2>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Se notificará al cliente por correo electrónico</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowRechazarModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', flexShrink: 0 }}>
                  <X style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                </motion.button>
              </div>

              {/* Motivos predefinidos */}
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selecciona el motivo *</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {MOTIVOS_RECHAZO.map(motivo => (
                  <motion.button key={motivo} whileTap={{ scale: 0.98 }}
                    onClick={() => setMotivoSeleccionado(motivo)}
                    style={{
                      padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#EF4444' : 'rgba(239,68,68,0.15)'}`,
                      background: motivoSeleccionado === motivo ? 'rgba(239,68,68,0.06)' : '#fff',
                      color: motivoSeleccionado === motivo ? '#991B1B' : '#4B5563',
                      fontSize: '13px', fontWeight: motivoSeleccionado === motivo ? 600 : 400,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                    <span style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${motivoSeleccionado === motivo ? '#EF4444' : '#D1D5DB'}`,
                      background: motivoSeleccionado === motivo ? '#EF4444' : 'transparent',
                      display: 'inline-block'
                    }} />
                    {motivo}
                  </motion.button>
                ))}
              </div>

              {/* Textarea solo si elige "Otro" */}
              <AnimatePresence>
                {motivoSeleccionado === 'Otro motivo (especificar abajo)' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '16px' }}>
                    <textarea value={motivoCustom} onChange={e => setMotivoCustom(e.target.value)}
                      placeholder="Describe el motivo del rechazo..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.3)', fontSize: '13px', outline: 'none', resize: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#374151' }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowRechazarModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(107,114,128,0.25)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRechazar}
                  disabled={!motivoFinal.trim()}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: motivoFinal.trim() ? '#EF4444' : '#9CA3AF', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: motivoFinal.trim() ? 'pointer' : 'not-allowed' }}>
                  Confirmar Rechazo
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL COMPROBANTE */}
      <AnimatePresence>
        {showComprobante && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowComprobante(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Comprobante de Pago</h3>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowComprobante(null)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                  <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                </motion.button>
              </div>
              {showComprobante.match(/\.(pdf)$/i) ? (
                <iframe src={showComprobante} style={{ width: '100%', height: '70vh', borderRadius: '12px', border: 'none' }} title="Comprobante" />
              ) : (
                <img src={showComprobante} alt="Comprobante" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
