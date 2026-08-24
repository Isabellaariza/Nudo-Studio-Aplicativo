import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Users, DollarSign, Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, MapPin } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { talleresAPI, programacionAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  id_programacion: number | '';
  fecha: string; hora: string; lugar: string; cupos: number;
}
const emptyForm: FormState = { id_programacion: '', fecha: '', hora: '', lugar: '', cupos: 10 };

const estadoStyle = (estado: boolean, estado_sesion?: string) => {
  if (estado_sesion === 'COMPLETADO') return { bg: '#D1FAE5', color: '#065F46', label: 'Completado' };
  return estado
    ? { bg: '#DBEAFE', color: '#1E40AF', label: 'Programado' }
    : { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' };
};

function ModalContent({ type, taller, form, onChange, onSubmit, programaciones }: {
  type: 'view' | 'edit' | 'add'; taller?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; programaciones: any[];
}) {
  if (type === 'view' && taller) {
    const b = estadoStyle(taller.estado, taller.estado_sesion);
    const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'rgba(45,75,57,0.03)', marginBottom: '8px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
          <Icon style={{ width: '15px', height: '15px', color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{value || '—'}</div>
        </div>
      </div>
    );
    return (
      <div>
        <Row icon={Users}      label="Instructor"  value={taller.instructor_nombre || taller.nombre_instructor} />
        <Row icon={Calendar}   label="Fecha"       value={taller.fecha ? new Date(taller.fecha).toLocaleDateString('es-CO') : '—'} />
        <Row icon={Clock}      label="Hora"        value={taller.hora ? taller.hora.slice(0, 5) : '—'} />
        <Row icon={MapPin}     label="Lugar"       value={taller.lugar || '—'} />
        <Row icon={Users}      label="Cupos"       value={`${taller.cupos_ocupados || 0} inscritos / ${taller.cupos} cupos`} />
        <Row icon={DollarSign} label="Precio"      value={`$${Number(taller.precio).toLocaleString()} COP`} />
        {taller.materiales && <Row icon={Calendar} label="Materiales" value={taller.materiales} />}
        <div style={{ marginTop: '8px' }}>
          <span style={{ padding: '4px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: estadoStyle(taller.estado, taller.estado_sesion).bg, color: estadoStyle(taller.estado, taller.estado_sesion).color }}>
            {estadoStyle(taller.estado, taller.estado_sesion).label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {type === 'add' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={lStyle}>Taller (Archivo) *</label>
          <select value={form.id_programacion} onChange={e => onChange('id_programacion', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
            <option value="">Seleccionar taller...</option>
            {programaciones.filter((p: any) => p.estado).map((p: any) => (
              <option key={p.id_programacion_taller} value={p.id_programacion_taller}>
                {p.nombre_taller} — {p.instructor_nombre || p.nombre_instructor}
              </option>
            ))}
          </select>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={lStyle}>Fecha *</label>
          <input type="date" value={form.fecha} onChange={e => onChange('fecha', e.target.value)} style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Hora</label>
          <input type="time" value={form.hora} onChange={e => onChange('hora', e.target.value)} style={iStyle} />
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Lugar</label>
        <input type="text" value={form.lugar} onChange={e => onChange('lugar', e.target.value)} placeholder="Ej: Sede principal, CC Florida" style={iStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Cupos</label>
        <input type="number" min={1} value={form.cupos} onChange={e => onChange('cupos', Number(e.target.value))} style={iStyle} />
      </div>
      {type === 'edit' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={lStyle}>Estado</label>
          <select style={iStyle} onChange={e => onChange('estado' as any, e.target.value === 'true')}>
            <option value="true">Programado</option>
            <option value="false">Cancelado</option>
          </select>
        </div>
      )}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
        {type === 'add' ? 'Publicar Taller' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

export function Talleres() {
  const [talleres, setTalleres] = useState<any[]>([]);
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [completando, setCompletando] = useState<number | null>(null);

  const cargar = async () => {
    try {
      const [tData, pData] = await Promise.all([talleresAPI.getAll(), programacionAPI.getAll()]);
      setTalleres(tData.talleres);
      setProgramaciones(pData.programaciones);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar talleres');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', t?: any) => {
    setModalType(type);
    setSelected(t || null);
    if (type === 'edit' && t) {
      setForm({
        id_programacion: t.id_programacion || '',
        fecha: t.fecha ? t.fecha.split('T')[0] : '',
        hora: t.hora ? t.hora.slice(0, 5) : '',
        lugar: t.lugar || '',
        cupos: Number(t.cupos) || 10,
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (modalType === 'add' && !form.id_programacion) return toast.error('Selecciona un taller del archivo');
    if (!form.fecha) return toast.error('La fecha es obligatoria');
    try {
      if (modalType === 'add') {
        await talleresAPI.create(form);
        toast.success('Taller publicado correctamente');
      } else if (modalType === 'edit' && selected) {
        await talleresAPI.update(selected.id_talleres, form);
        toast.success('Taller actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await talleresAPI.delete(toDelete.id_talleres);
      toast.success('Taller eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const handleCompletar = async (t: any) => {
    if (!window.confirm(`¿Confirmas que el taller "${t.nombre_taller}" se realizó? Esto descontará el stock de los insumos usados.`)) return;
    setCompletando(t.id_talleres);
    try {
      const data = await talleresAPI.completar(t.id_talleres);
      toast.success(`Taller completado. ${data.materiales_descontados} insumo(s) descontados del stock.`);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al completar'); }
    finally { setCompletando(null); }
  };

  const filtered = talleres.filter(t =>
    (t.nombre_taller || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.instructor_nombre || t.nombre_instructor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const current = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const programados = talleres.filter(t => t.estado && t.estado_sesion !== 'COMPLETADO').length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '40px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', padding: '32px 40px', marginBottom: '32px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <Calendar style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Talleres Publicados</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{talleres.length} talleres publicados</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1E40AF' }} />
                  <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>{programados} programados</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar talleres..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Publicar Taller
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* CARDS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Cargando talleres...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: totalPages > 1 ? '32px' : '0' }}>
            <AnimatePresence>
              {current.map((t, i) => {
                const b = estadoStyle(t.estado, t.estado_sesion);
                const completado = t.estado_sesion === 'COMPLETADO';
                const cupos = Number(t.cupos) || 0;
                const ocupados = Number(t.cupos_ocupados) || 0;
                const pct = cupos > 0 ? Math.round((ocupados / cupos) * 100) : 0;
                return (
                  <motion.div key={t.id_talleres}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(45,75,57,0.15)' }}
                    style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid rgba(45,75,57,0.1)', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', opacity: completado ? 0.85 : 1 }}>

                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '5px 12px', borderRadius: '20px', background: b.bg, color: b.color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {b.label}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39', marginBottom: '16px', paddingRight: '90px', lineHeight: 1.4, minHeight: '50px', display: 'flex', alignItems: 'center' }}>
                      {t.nombre_taller}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{t.instructor_nombre || t.nombre_instructor || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{t.fecha ? new Date(t.fecha).toLocaleDateString('es-CO') : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{t.hora ? t.hora.slice(0, 5) : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{t.lugar || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign style={{ width: '15px', height: '15px', color: '#B8860B', flexShrink: 0 }} />
                        <span style={{ fontSize: '15px', color: '#2D4B39', fontWeight: 700 }}>${Number(t.precio).toLocaleString()} COP</span>
                      </div>
                    </div>

                    {/* Barra cupos */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Cupos</span>
                        <span style={{ fontSize: '12px', color: '#2D4B39', fontWeight: 700 }}>{ocupados}/{cupos}</span>
                      </div>
                      <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '4px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981', borderRadius: '4px', transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openModal('view', t)}
                        style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(107,114,128,0.08)', color: '#6B7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Eye size={14} /> Ver
                      </motion.button>
                      {!completado && (
                        <>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openModal('edit', t)}
                            style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(184,134,11,0.1)', color: '#B8860B', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Edit size={14} /> Editar
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleCompletar(t)}
                            disabled={completando === t.id_talleres}
                            title="Marcar como completado y descontar stock"
                            style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#065F46', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: completando === t.id_talleres ? 0.5 : 1 }}>
                            <CheckCircle size={14} /> Completar
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setToDelete(t); setShowDeleteModal(true); }}
                            style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Trash2 size={14} /> Borrar
                          </motion.button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {current.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron talleres publicados</div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: currentPage === 1 ? '#9CA3AF' : '#2D4B39', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft style={{ width: '16px', height: '16px' }} /> Anterior
              </motion.button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <motion.button key={p} whileHover={{ scale: 1.1 }} onClick={() => setCurrentPage(p)}
                  style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: currentPage === p ? 'linear-gradient(135deg,#2D4B39,#1a2f23)' : 'rgba(224,209,192,0.1)', color: currentPage === p ? '#fff' : '#2D4B39', cursor: 'pointer', fontSize: '14px', fontWeight: 600, minWidth: '44px' }}>
                  {p}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: currentPage === totalPages ? '#9CA3AF' : '#2D4B39', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                Siguiente <ChevronRight style={{ width: '16px', height: '16px' }} />
              </motion.button>
            </div>
          )}
        </>
      )}

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Publicar Taller' : modalType === 'edit' ? 'Editar Taller' : 'Detalle del Taller'}>
          <ModalContent type={modalType} taller={selected} form={form} programaciones={programaciones}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_taller} itemType="Taller" />
      )}
    </motion.div>
  );
}
