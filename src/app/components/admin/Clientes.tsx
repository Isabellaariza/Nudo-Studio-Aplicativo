import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, Info, Edit, Trash2, User, Mail, Phone, MapPin, ShoppingBag, DollarSign, UserCheck } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { clientesAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_completo: string; email: string; telefono: string; ciudad: string;
}
const emptyForm: FormState = { nombre_completo: '', email: '', telefono: '', ciudad: '' };

function ModalContent({ type, cliente, form, onChange, onSubmit }: {
  type: 'view' | 'edit' | 'add'; cliente?: any;
  form: FormState; onChange: (f: keyof FormState, v: string) => void; onSubmit: () => void;
}) {
  if (type === 'view' && cliente) {
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
        <Row icon={User}      label="Nombre completo"  value={cliente.nombre_completo} />
        <Row icon={Mail}      label="Email"             value={cliente.email} />
        <Row icon={Phone}     label="Teléfono"          value={cliente.telefono} />
        <Row icon={MapPin}    label="Ciudad"            value={cliente.ciudad} />
        <Row icon={ShoppingBag} label="Origen"         value={cliente.origen === 'usuario' ? 'Usuario registrado' : 'Cliente directo'} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: cliente.estado ? '#D1FAE5' : '#FEE2E2', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: cliente.estado ? '#065F46' : '#991B1B' }}>
            {cliente.estado ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Nombre Completo *</label>
        <input type="text" value={form.nombre_completo} onChange={e => onChange('nombre_completo', e.target.value)} placeholder="Ej: María González" style={iStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Email</label>
        <input type="email" value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="correo@ejemplo.com" style={iStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={lStyle}>Teléfono</label>
          <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value)} placeholder="300 000 0000" style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Ciudad</label>
          <input type="text" value={form.ciudad} onChange={e => onChange('ciudad', e.target.value)} placeholder="Ej: Medellín" style={iStyle} />
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Registrar Cliente' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const data = await clientesAPI.getAll();
      setClientes(data.clientes);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar clientes');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', c?: any) => {
    setModalType(type);
    setSelected(c || null);
    if (type === 'edit' && c) {
      setForm({ nombre_completo: c.nombre_completo || '', email: c.email || '', telefono: c.telefono || '', ciudad: c.ciudad || '' });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_completo) return toast.error('El nombre es obligatorio');
    try {
      if (modalType === 'add') {
        await clientesAPI.create(form);
        toast.success('Cliente registrado correctamente');
      } else if (modalType === 'edit' && selected) {
        await clientesAPI.update(selected.id_cliente, form);
        toast.success('Cliente actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const handleToggle = async (c: any) => {
    if (!c.id_cliente) return toast.error('Este cliente viene de usuarios — cambia su estado desde el módulo de Usuarios');
    try {
      await clientesAPI.update(c.id_cliente, { estado: !c.estado });
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await clientesAPI.delete(toDelete.id_cliente);
      toast.success('Cliente eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'No se puede eliminar: el cliente tiene ventas o pedidos registrados'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = clientes.filter(c =>
    (c.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activos = clientes.filter(c => c.estado).length;
  const desdeUsuarios = clientes.filter(c => c.origen === 'usuario').length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <Users style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Gestión de Clientes</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{clientes.length} clientes registrados</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{activos} activos</span>
                </div>
                {desdeUsuarios > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck style={{ width: '12px', height: '12px', color: '#6366F1' }} />
                    <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600 }}>{desdeUsuarios} desde usuarios</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar clientes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Cliente
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando clientes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['CLIENTE', 'CONTACTO', 'CIUDAD', 'ORIGEN', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['ORIGEN', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id_cliente ?? `u-${c.id_usuarios}`}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User style={{ width: '16px', height: '16px', color: '#fff' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{c.nombre_completo}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>{c.email || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.telefono || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>{c.ciudad || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: c.origen === 'usuario' ? 'rgba(99,102,241,0.1)' : 'rgba(45,75,57,0.08)', color: c.origen === 'usuario' ? '#6366F1' : '#2D4B39' }}>
                        {c.origen === 'usuario' ? 'Usuario' : 'Directo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button onClick={() => handleToggle(c)} disabled={c.origen === 'usuario'}
                        style={{ position: 'relative', display: 'inline-flex', height: '24px', width: '44px', alignItems: 'center', borderRadius: '9999px', border: 'none', cursor: c.origen === 'usuario' ? 'not-allowed' : 'pointer', background: c.estado ? '#10B981' : '#9CA3AF', opacity: c.origen === 'usuario' ? 0.6 : 1 }}>
                        <span style={{ display: 'inline-block', height: '16px', width: '16px', transform: c.estado ? 'translateX(24px)' : 'translateX(4px)', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s' }} />
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', c)}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                        </motion.button>
                        {c.id_cliente && (
                          <>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', c)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(c); setShowDeleteModal(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nuevo Cliente' : modalType === 'edit' ? 'Editar Cliente' : 'Detalle del Cliente'}>
          <ModalContent type={modalType} cliente={selected} form={form}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setToDelete(null); }}
          onConfirm={confirmDelete} itemName={toDelete.nombre_completo} itemType="Cliente" />
      )}
    </motion.div>
  );
}
