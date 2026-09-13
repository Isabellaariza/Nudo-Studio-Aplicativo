import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Users, DollarSign, Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, MapPin } from 'lucide-react';

const fmt12 = (hora: string) => {
  if (!hora) return '—';
  const [h, m] = hora.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
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
  id_empleado: number | '';
  fecha: string; hora: string; lugar: string;
}
const emptyForm: FormState = { id_programacion: '', id_empleado: '', fecha: '', hora: '', lugar: '' };

const estadoStyle = (estado: boolean, estado_sesion?: string) => {
  if (estado_sesion === 'COMPLETADO') return { bg: '#D1FAE5', color: '#065F46', label: 'Completado' };
  return estado
    ? { bg: '#DBEAFE', color: '#1E40AF', label: 'Programado' }
    : { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' };
};

function ModalContent({ type, taller, form, onChange, onSubmit, programaciones, instructores, conflicto }: {
  type: 'view' | 'edit' | 'add'; taller?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; programaciones: any[]; instructores: any[];
  conflicto: string | null;
}) {
  if (type === 'view' && taller) {
    const b = estadoStyle(taller.estado, taller.estado_sesion);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminDetailSection title="INFORMACIÓN DEL TALLER" icon={<Calendar style={{ width: '20px', height: '20px' }} />} color="green">
          <AdminDetailRow label="Instructor" value={taller.instructor_nombre || taller.nombre_instructor} />
          <AdminDetailGrid>
            <AdminDetailRow label="Fecha"  value={taller.fecha ? new Date(taller.fecha).toLocaleDateString('es-CO') : '—'} />
            <AdminDetailRow label="Hora"   value={taller.hora ? fmt12(taller.hora) : '—'} />
          </AdminDetailGrid>
          <AdminDetailGrid>
            <AdminDetailRow label="Lugar"  value={taller.lugar || '—'} />
            <AdminDetailRow label="Inscritos" value={`${taller.cupos_ocupados || 0} estudiante(s)`} />
          </AdminDetailGrid>
          <AdminDetailGrid>
            <AdminDetailRow label="Precio" value={`$${Number(taller.precio).toLocaleString('es-CO')} COP`} />
            {taller.materiales && <AdminDetailRow label="Materiales" value={taller.materiales} />}
          </AdminDetailGrid>
        </AdminDetailSection>
        <AdminDetailSection title="ESTADO" icon={<CheckCircle style={{ width: '20px', height: '20px' }} />} color="teal">
          <AdminDetailRow
            label="Estado del taller"
            badge={{ bg: b.bg, color: b.color, text: b.label }}
          />
        </AdminDetailSection>
      </div>
    );
  }

  return (
    <div>
      {type === 'add' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={lStyle}>Taller *</label>
          <select value={form.id_programacion} onChange={e => onChange('id_programacion', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
            <option value="">Seleccionar taller...</option>
            {programaciones.filter((p: any) => p.estado).map((p: any) => (
              <option key={p.id_programacion_taller} value={p.id_programacion_taller}>
                {p.nombre_taller}
              </option>
            ))}
          </select>
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Instructor *</label>
        <select value={form.id_empleado} onChange={e => onChange('id_empleado', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Seleccionar instructor...</option>
          {instructores.map((i: any) => (
            <option key={i.id_empleado} value={i.id_empleado}>{i.nombre_completo}</option>
          ))}
        </select>
        {conflicto && (
          <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: '12px', color: '#92400E' }}>
            ⚠️ Este instructor ya tiene el taller "{conflicto}" en esa fecha
          </div>
        )}
      </div>
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
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Lugar</label>
        <input type="text" value={form.lugar} onChange={e => onChange('lugar', e.target.value)} placeholder="Ej: Sede principal, CC Florida" style={iStyle} />
      </div>
      {type === 'edit' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={lStyle}>Instructor</label>
            <select value={form.id_empleado} onChange={e => onChange('id_empleado', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
              <option value="">Seleccionar instructor...</option>
              {instructores.map((i: any) => (
                <option key={i.id_empleado} value={i.id_empleado}>{i.nombre_completo}</option>
              ))}
            </select>
            {conflicto && (
              <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '8px', background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: '12px', color: '#92400E' }}>
                ⚠️ Este instructor ya tiene el taller "{conflicto}" en esa fecha
              </div>
            )}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={lStyle}>Estado</label>
            <select style={iStyle} onChange={e => onChange('estado' as any, e.target.value === 'true')}>
              <option value="true">Programado</option>
              <option value="false">Cancelado</option>
            </select>
          </div>
        </>
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
  const [instructores, setInstructores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [completando, setCompletando] = useState<number | null>(null);
  const [conflicto, setConflicto] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const [tData, pData, iData] = await Promise.all([talleresAPI.getAll(), programacionAPI.getAll(), talleresAPI.getInstructores()]);
      setTalleres(tData.talleres);
      setProgramaciones(pData.programaciones);
      setInstructores(iData.instructores);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar talleres');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', t?: any) => {
    setModalType(type);
    setSelected(t || null);
    setConflicto(null);
    if (type === 'edit' && t) {
      setForm({
        id_programacion: t.id_programacion || '',
        id_empleado: t.id_empleado || '',
        fecha: t.fecha ? t.fecha.split('T')[0] : '',
        hora: t.hora ? t.hora.slice(0, 5) : '',
        lugar: t.lugar || '',
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); setConflicto(null); };

  const handleFormChange = async (f: keyof FormState, v: any) => {
    const newForm = { ...form, [f]: v };
    setForm(newForm);
    // Verificar conflicto cuando cambia instructor o fecha
    if ((f === 'id_empleado' || f === 'fecha') && newForm.id_empleado && newForm.fecha) {
      try {
        const excluir = modalType === 'edit' && selected ? selected.id_talleres : undefined;
        const data = await talleresAPI.verificarDisponibilidad(Number(newForm.id_empleado), newForm.fecha, excluir);
        setConflicto(data.disponible ? null : data.conflicto?.nombre_taller || 'otro taller');
      } catch { setConflicto(null); }
    }
  };

  const handleSubmit = async () => {
    if (modalType === 'add' && !form.id_programacion) return toast.error('Selecciona un taller');
    if (!form.id_empleado) return toast.error('El instructor es obligatorio');
    if (!form.fecha) return toast.error('La fecha es obligatoria');
    if (conflicto) return toast.error(`El instructor ya tiene el taller "${conflicto}" en esa fecha`);
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
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Programación de Talleres</h1>
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
                const ocupados = Number(t.cupos_ocupados) || 0;
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
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>{t.hora ? fmt12(t.hora) : '—'}</span>
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

                    {/* Inscritos */}
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users style={{ width: '14px', height: '14px', color: '#B8860B' }} />
                      <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{ocupados} inscrito(s)</span>
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Tooltip text="Ver información del taller">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openModal('view', t)}
                          style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(107,114,128,0.08)', color: '#6B7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Eye size={14} /> Ver
                        </motion.button>
                      </Tooltip>
                      {!completado && (
                        <>
                          <Tooltip text="Editar taller">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openModal('edit', t)}
                              style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(184,134,11,0.1)', color: '#B8860B', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Edit size={14} /> Editar
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Marcar como completado y descontar stock">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleCompletar(t)}
                              disabled={completando === t.id_talleres}
                              style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#065F46', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: completando === t.id_talleres ? 0.5 : 1 }}>
                              <CheckCircle size={14} /> Completar
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Eliminar taller">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setToDelete(t); setShowDeleteModal(true); }}
                              style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Trash2 size={14} /> Borrar
                            </motion.button>
                          </Tooltip>
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
            instructores={instructores} conflicto={conflicto}
            onChange={handleFormChange} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_taller} itemType="Taller" />
      )}
    </motion.div>
  );
}
