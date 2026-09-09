import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Search, Plus, Info, Edit, Trash2, User, Mail, Phone, DollarSign, Calendar } from 'lucide-react';
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { estudiantesAPI } from '../../lib/api';
import { filterNombre, filterTelefono, validateNombre, validateTelefono } from '../../lib/validators';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_completo: string; email: string; telefono: string;
}
const emptyForm: FormState = { nombre_completo: '', email: '', telefono: '' };

function ModalContent({ type, estudiante, form, onChange, onSubmit }: {
  type: 'view' | 'edit' | 'add'; estudiante?: any;
  form: FormState; onChange: (f: keyof FormState, v: string) => void; onSubmit: () => void;
}) {
  const [nombreErr, setNombreErr] = useState('');
  const [telErr, setTelErr] = useState('');

  if (type === 'view' && estudiante) {
    const saldo = Number(estudiante.monto_total || 0) - Number(estudiante.monto_pagado || 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminDetailSection title="INFORMACIÓN PERSONAL" icon={<User style={{ width: '20px', height: '20px' }} />} color="green">
          <AdminDetailRow label="Nombre completo"  value={estudiante.nombre_completo} />
          <AdminDetailGrid>
            <AdminDetailRow label="Email"    value={estudiante.email} />
            <AdminDetailRow label="Teléfono" value={estudiante.telefono} />
          </AdminDetailGrid>
          <AdminDetailRow label="Matrículas" value={String(estudiante.total_matriculas || 0)} />
        </AdminDetailSection>
        <AdminDetailSection title="PAGOS" icon={<DollarSign style={{ width: '20px', height: '20px' }} />} color="gold">
          <AdminDetailGrid>
            <AdminDetailRow label="Monto total"     value={`$${Number(estudiante.monto_total || 0).toLocaleString('es-CO')} COP`} />
            <AdminDetailRow label="Monto pagado"    value={`$${Number(estudiante.monto_pagado || 0).toLocaleString('es-CO')} COP`} />
          </AdminDetailGrid>
          <AdminDetailRow
            label="Saldo pendiente"
            badge={saldo > 0
              ? { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', text: `$${saldo.toLocaleString('es-CO')} COP pendiente` }
              : { bg: '#D1FAE5', color: '#065F46', text: 'Al día ✓' }
            }
          />
        </AdminDetailSection>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Nombre Completo *</label>
        <input type="text" value={form.nombre_completo}
          onChange={e => { const { value, error } = filterNombre(e.target.value); setNombreErr(error); onChange('nombre_completo', value); }}
          placeholder="Ej: María González" style={{ ...iStyle, borderColor: nombreErr ? '#DC2626' : undefined }} />
        {nombreErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {nombreErr}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={lStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="maria@email.com" style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Teléfono</label>
          <input type="tel" value={form.telefono}
            onChange={e => { const { value, error } = filterTelefono(e.target.value); setTelErr(error); onChange('telefono', value); }}
            placeholder="3001234567" style={{ ...iStyle, borderColor: telErr ? '#DC2626' : undefined }} />
          {telErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {telErr}</p>}
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
        const ne = validateNombre(form.nombre_completo); if (ne) { setNombreErr(ne); return toast.error(ne); }
        const te = validateTelefono(form.telefono); if (te) { setTelErr(te); return toast.error(te); }
        onSubmit();
      }}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Agregar Estudiante' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const data = await estudiantesAPI.getAll();
      setEstudiantes(data.estudiantes);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar estudiantes');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', e?: any) => {
    setModalType(type);
    setSelected(e || null);
    if (type === 'edit' && e) {
      setForm({
        nombre_completo: e.nombre_completo || '',
        email: e.email || '',
        telefono: e.telefono || '',
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_completo) return toast.error('El nombre es obligatorio');
    try {
      if (modalType === 'add') {
        await estudiantesAPI.create(form);
        toast.success('Estudiante agregado correctamente');
      } else if (modalType === 'edit' && selected) {
        await estudiantesAPI.update(selected.id_estudiante, form);
        toast.success('Estudiante actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const toggleEstado = async (e: any) => {
    try {
      await estudiantesAPI.update(e.id_estudiante, { estado: !e.estado });
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (Number(toDelete.total_matriculas) > 0) {
      toast.error('No se puede eliminar: el estudiante tiene matrículas registradas');
      setShowDeleteModal(false);
      setToDelete(null);
      return;
    }
    try {
      // Soft delete — desactivar
      await estudiantesAPI.update(toDelete.id_estudiante, { estado: false });
      toast.success('Estudiante desactivado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = estudiantes.filter(e =>
    (e.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activos = estudiantes.filter(e => e.estado).length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <GraduationCap style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Estudiantes</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{estudiantes.length} estudiantes registrados</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{activos} activos</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar estudiantes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '280px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Estudiante
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.3 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando estudiantes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['ESTUDIANTE', 'CONTACTO', 'MATRÍCULAS', 'PAGOS', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['MATRÍCULAS', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((e, i) => {
                  const saldo = Number(e.monto_total || 0) - Number(e.monto_pagado || 0);
                  return (
                    <motion.tr key={e.id_estudiante}
                      initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                              {(e.nombre_completo || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontWeight: 600, color: '#2D4B39', fontSize: '14px' }}>{e.nombre_completo}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>{e.email || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{e.telefono || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(45,75,57,0.08)', color: '#2D4B39', fontSize: '13px', fontWeight: 700 }}>
                          <GraduationCap style={{ width: '13px', height: '13px' }} />
                          {e.total_matriculas || 0}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '2px' }}>Total: ${Number(e.monto_total || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: saldo > 0 ? '#EF4444' : '#10B981' }}>
                          {saldo > 0 ? `Pendiente: $${saldo.toLocaleString()}` : '✓ Al día'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button onClick={() => toggleEstado(e)}
                          style={{ position: 'relative', display: 'inline-flex', height: '24px', width: '44px', alignItems: 'center', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: e.estado ? '#10B981' : '#9CA3AF', transition: 'background 0.3s' }}>
                          <span style={{ display: 'inline-block', height: '16px', width: '16px', transform: e.estado ? 'translateX(24px)' : 'translateX(4px)', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s' }} />
                        </button>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Tooltip text="Ver información">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', e)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Editar estudiante">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', e)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Eliminar estudiante">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(e); setShowDeleteModal(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron estudiantes</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nuevo Estudiante' : modalType === 'edit' ? 'Editar Estudiante' : 'Información del Estudiante'}>
          <ModalContent type={modalType} estudiante={selected} form={form}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_completo} itemType="Estudiante" />
      )}
    </motion.div>
  );
}
