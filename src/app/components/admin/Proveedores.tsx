import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Search, Plus, Info, Edit, Trash2, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { proveedoresAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_empresa: string; nit: string; telefono: string; email: string; direccion: string;
}
const emptyForm: FormState = { nombre_empresa: '', nit: '', telefono: '', email: '', direccion: '' };

function ModalContent({ type, proveedor, form, onChange, onSubmit }: {
  type: 'view' | 'edit' | 'add'; proveedor?: any;
  form: FormState; onChange: (f: keyof FormState, v: string) => void; onSubmit: () => void;
}) {
  if (type === 'view' && proveedor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminDetailSection title="INFORMACIÓN DE LA EMPRESA" icon={<Truck style={{ width: '20px', height: '20px' }} />} color="green">
          <AdminDetailRow label="Nombre de empresa" value={proveedor.nombre_empresa} />
          <AdminDetailGrid>
            <AdminDetailRow label="NIT"      value={proveedor.nit} />
            <AdminDetailRow label="Teléfono" value={proveedor.telefono} />
          </AdminDetailGrid>
          <AdminDetailRow label="Email"    value={proveedor.email} />
          <AdminDetailRow label="Dirección" value={proveedor.direccion} />
        </AdminDetailSection>
        <AdminDetailSection title="ESTADO" icon={<Building2 style={{ width: '20px', height: '20px' }} />} color="teal">
          <AdminDetailGrid>
            <AdminDetailRow
              label="Estado"
              badge={{ bg: proveedor.estado ? '#D1FAE5' : '#FEE2E2', color: proveedor.estado ? '#065F46' : '#991B1B', text: proveedor.estado ? 'Activo' : 'Inactivo' }}
            />
            {proveedor.total_compras > 0 && (
              <AdminDetailRow label="Compras registradas" value={`${proveedor.total_compras}`} />
            )}
          </AdminDetailGrid>
        </AdminDetailSection>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Nombre de la Empresa *</label>
        <input type="text" value={form.nombre_empresa} onChange={e => onChange('nombre_empresa', e.target.value)} placeholder="Ej: Textiles Andinos S.A.S" style={iStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={lStyle}>NIT</label>
          <input type="text" value={form.nit} onChange={e => onChange('nit', e.target.value)} placeholder="900.123.456-7" style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Teléfono</label>
          <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value)} placeholder="601 234 5678" style={iStyle} />
        </div>
      </div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Email</label>
        <input type="email" value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="ventas@empresa.com" style={iStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Dirección</label>
        <input type="text" value={form.direccion} onChange={e => onChange('direccion', e.target.value)} placeholder="Calle 45 #12-34, Bogotá" style={iStyle} />
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Registrar Proveedor' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function Proveedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const data = await proveedoresAPI.getAll();
      setProveedores(data.proveedores);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar proveedores');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', p?: any) => {
    setModalType(type);
    setSelected(p || null);
    if (type === 'edit' && p) {
      setForm({ nombre_empresa: p.nombre_empresa || '', nit: p.nit || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_empresa) return toast.error('El nombre de la empresa es obligatorio');
    try {
      if (modalType === 'add') {
        await proveedoresAPI.create(form);
        toast.success('Proveedor registrado correctamente');
      } else if (modalType === 'edit' && selected) {
        await proveedoresAPI.update(selected.id_proveedor, form);
        toast.success('Proveedor actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const toggleEstado = async (p: any) => {
    try {
      await proveedoresAPI.update(p.id_proveedor, { estado: !p.estado });
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await proveedoresAPI.delete(toDelete.id_proveedor);
      toast.success('Proveedor eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = proveedores.filter(p =>
    (p.nombre_empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px' }}>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
                <Truck style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Proveedores</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{proveedores.length} proveedores registrados</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{proveedores.filter(p => p.estado).length} activos</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} />
                <input type="text" placeholder="Buscar por nombre, NIT o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', width: '300px', outline: 'none' }} />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Proveedor
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.3 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando proveedores...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#2D4B39', color: '#fff' }}>
                <tr>
                  {['EMPRESA', 'NIT', 'EMAIL', 'TELÉFONO', 'DIRECCIÓN', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((p, i) => (
                    <motion.tr key={p.id_proveedor}
                      initial={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.04 * i }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Truck style={{ width: '15px', height: '15px', color: '#fff' }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#2D4B39', fontSize: '14px' }}>{p.nombre_empresa}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{p.nit || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{p.email || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280' }}>{p.telefono || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.direccion || '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <button onClick={() => toggleEstado(p)}
                          style={{ position: 'relative', display: 'inline-flex', height: '24px', width: '44px', alignItems: 'center', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: p.estado ? '#10B981' : '#9CA3AF', transition: 'background 0.3s' }}>
                          <span style={{ display: 'inline-block', height: '16px', width: '16px', transform: p.estado ? 'translateX(24px)' : 'translateX(4px)', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s' }} />
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Tooltip text="Ver detalles">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', p)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Editar proveedor">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', p)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Eliminar proveedor">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(p); setShowDeleteModal(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron proveedores</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal} title={modalType === 'add' ? 'Nuevo Proveedor' : modalType === 'edit' ? 'Editar Proveedor' : 'Información del Proveedor'}>
          <ModalContent type={modalType} proveedor={selected} form={form} onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} itemName={toDelete.nombre_empresa} itemType="Proveedor" />
      )}
    </motion.div>
  );
}
