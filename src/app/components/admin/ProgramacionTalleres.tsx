import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Plus, Info, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { programacionAPI, talleresAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_taller: string; nombre_instructor: string;
  precio: number; descripcion: string; id_empleado: number | '';
}
const emptyForm: FormState = { nombre_taller: '', nombre_instructor: '', precio: 0, descripcion: '', id_empleado: '' };

function ModalContent({ type, prog, form, onChange, onSubmit, instructores }: {
  type: 'view' | 'edit' | 'add'; prog?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; instructores: any[];
}) {
  if (type === 'view' && prog) {
    const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(45,75,57,0.03)', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: accent ? '#B8860B' : '#2D4B39' }}>{value || '—'}</div>
      </div>
    );
    return (
      <div>
        <Row label="Nombre del Taller"  value={prog.nombre_taller} />
        <Row label="Instructor"         value={prog.instructor_nombre || prog.nombre_instructor} />
        <Row label="Precio"             value={`$${Number(prog.precio).toLocaleString()} COP`} accent />
        <Row label="Descripción"        value={prog.descripcion} />
        <Row label="Materiales"         value={`${prog.total_materiales || 0} material(es) asignado(s)`} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: prog.estado ? '#D1FAE5' : '#FEE2E2', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: prog.estado ? '#065F46' : '#991B1B' }}>
            {prog.estado ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Nombre del Taller *</label>
        <input type="text" value={form.nombre_taller} onChange={e => onChange('nombre_taller', e.target.value)} placeholder="Ej: Macramé Básico" style={iStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Instructor *</label>
        <select value={form.id_empleado} onChange={e => {
          const id = e.target.value ? Number(e.target.value) : '';
          onChange('id_empleado', id);
          if (id) {
            const inst = instructores.find((i: any) => i.id_empleado === Number(id));
            if (inst) onChange('nombre_instructor', inst.nombre_completo);
          }
        }} style={iStyle}>
          <option value="">Seleccionar instructor...</option>
          {instructores.map((i: any) => (
            <option key={i.id_empleado} value={i.id_empleado}>{i.nombre_completo}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Precio (COP) *</label>
        <input type="number" min={0} value={form.precio} onChange={e => onChange('precio', Number(e.target.value))} style={iStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Descripción</label>
        <textarea value={form.descripcion} onChange={e => onChange('descripcion', e.target.value)}
          placeholder="Describe el taller, qué aprenderán los estudiantes..."
          rows={3} style={{ ...iStyle, resize: 'vertical' }} />
      </div>
      {type === 'edit' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={lStyle}>Estado</label>
          <select style={iStyle} onChange={e => onChange('estado' as any, e.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      )}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Crear Programación de Taller' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function ProgramacionTalleres() {
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const [pData, iData] = await Promise.all([programacionAPI.getAll(), talleresAPI.getInstructores()]);
      setProgramaciones(pData.programaciones);
      setInstructores(iData.instructores);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', p?: any) => {
    setModalType(type);
    setSelected(p || null);
    if (type === 'edit' && p) {
      setForm({
        nombre_taller: p.nombre_taller || '',
        nombre_instructor: p.nombre_instructor || '',
        precio: Number(p.precio) || 0,
        descripcion: p.descripcion || '',
        id_empleado: p.id_empleado || '',
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_taller) return toast.error('El nombre es obligatorio');
    if (!form.id_empleado) return toast.error('El instructor es obligatorio');
    if (!form.precio) return toast.error('El precio es obligatorio');
    try {
      if (modalType === 'add') {
        await programacionAPI.create(form);
        toast.success('Archivo de taller creado');
      } else if (modalType === 'edit' && selected) {
        await programacionAPI.update(selected.id_programacion_taller, form);
        toast.success('Archivo actualizado');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await programacionAPI.delete(toDelete.id_programacion_taller);
      toast.success('Archivo eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = programaciones.filter(p =>
    (p.nombre_taller || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.instructor_nombre || p.nombre_instructor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activos = programaciones.filter(p => p.estado).length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <BookOpen style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Programación de Talleres</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{programaciones.length} talleres registrados</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{activos} activos</span>
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
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Programación
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['TALLER', 'INSTRUCTOR', 'PRECIO', 'MATERIALES', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['PRECIO', 'MATERIALES', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id_programacion_taller}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen style={{ width: '14px', height: '14px', color: '#fff' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{p.nombre_taller}</div>
                          {p.descripcion && <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users style={{ width: '13px', height: '13px', color: '#B8860B' }} />
                        {p.instructor_nombre || p.nombre_instructor || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <DollarSign style={{ width: '13px', height: '13px', color: '#B8860B' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#B8860B' }}>${Number(p.precio).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                      {p.total_materiales || 0} material(es)
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: p.estado ? '#D1FAE5' : '#FEE2E2', color: p.estado ? '#065F46' : '#991B1B' }}>
                        {p.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', p)}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', p)}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(p); setShowDeleteModal(true); }}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron talleres</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nueva Programación de Taller' : modalType === 'edit' ? 'Editar Archivo' : 'Detalle del Taller'}>
          <ModalContent type={modalType} prog={selected} form={form} instructores={instructores}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_taller} itemType="Archivo de Taller" />
      )}
    </motion.div>
  );
}
