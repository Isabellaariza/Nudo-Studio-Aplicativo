import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, Info, Edit, User, Trash2, Mail, Phone, Shield, CheckCircle, MapPin, FileText, CreditCard } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { usuariosAPI, rolesAPI } from '../../lib/api';

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45, 75, 57, 0.15)', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box' as const, background: 'white'
};
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre: string; correo: string; contrasena: string;
  tipo_documento: string; numero_documento: string;
  telefono: string; direccion: string; estado: boolean; id_rol: number | '';
}

const emptyForm: FormState = {
  nombre: '', correo: '', contrasena: '', tipo_documento: 'Cédula de Ciudadanía',
  numero_documento: '', telefono: '', direccion: '', estado: true, id_rol: ''
};

const TIPOS_DOC = ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Tarjeta de Identidad', 'Pasaporte'];

function ModalContent({ type, user, form, onChange, onSubmit, roles }: {
  type: 'view' | 'edit' | 'add'; user?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; roles: any[];
}) {
  if (type === 'view' && user) {
    const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderRadius: '12px', background: 'rgba(45,75,57,0.03)', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg, #2D4B39, #1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px', flexShrink: 0 }}>
          <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{value || '—'}</div>
        </div>
      </div>
    );
    return (
      <div>
        <Row icon={User}        label="Nombre completo"     value={user.name} />
        <Row icon={FileText}    label="Tipo de documento"   value={user.tipo_documento} />
        <Row icon={CreditCard}  label="Número de documento" value={user.numero_documento} />
        <Row icon={Mail}        label="Correo electrónico"  value={user.email} />
        <Row icon={Phone}       label="Teléfono"            value={user.phone} />
        <Row icon={MapPin}      label="Dirección"           value={user.direccion} />
        <Row icon={Shield}      label="Rol"                 value={user.role} />
        <Row icon={CheckCircle} label="Estado"              value={user.status ? 'Activo' : 'Inactivo'} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Nombre Completo *</label>
        <input type="text" value={form.nombre} onChange={e => onChange('nombre', e.target.value)} placeholder="Ej: María García" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>Tipo de Documento</label>
          <select value={form.tipo_documento} onChange={e => onChange('tipo_documento', e.target.value)} style={inputStyle}>
            {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Número de Documento</label>
          <input type="text" value={form.numero_documento} onChange={e => onChange('numero_documento', e.target.value)} placeholder="1234567890" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Correo Electrónico *</label>
        <input type="email" value={form.correo} onChange={e => onChange('correo', e.target.value)}
          placeholder="usuario@email.com"
          style={{ ...inputStyle, background: type === 'edit' ? '#f9fafb' : 'white' }}
          disabled={type === 'edit'} />
      </div>

      {type === 'add' && (
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Contraseña *</label>
          <input type="password" value={form.contrasena} onChange={e => onChange('contrasena', e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
        </div>
      )}

      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Rol *</label>
        <select value={form.id_rol} onChange={e => onChange('id_rol', e.target.value ? Number(e.target.value) : '')} style={inputStyle}>
          <option value="">Seleccionar rol...</option>
          {roles.map(r => <option key={r.id_rol} value={r.id_rol} style={{ textTransform: 'capitalize' }}>{r.nombre}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value)} placeholder="300-123-4567" style={inputStyle} />
        </div>
        {type === 'edit' && (
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={String(form.estado)} onChange={e => onChange('estado', e.target.value === 'true')} style={inputStyle}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Dirección</label>
        <input type="text" value={form.direccion} onChange={e => onChange('direccion', e.target.value)} placeholder="Calle 123 #45-67, Ciudad" style={inputStyle} />
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2D4B39, #1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Agregar Usuario' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargarUsuarios = async () => {
    try {
      const [uData, rData] = await Promise.all([usuariosAPI.getAll(), rolesAPI.getAll()]);
      setRoles(rData || []);
      setUsers(uData.usuarios.map((u: any) => ({
        id: u.id_usuarios,
        name: u.nombre,
        tipo_documento: u.tipo_documento || '',
        numero_documento: u.numero_documento || '',
        email: u.email,
        phone: u.telefono || '',
        direccion: u.direccion || '',
        role: u.rol || '',
        id_rol: u.id_rol || '',
        status: u.estado,
        isAdmin: (u.rol || '').toLowerCase() === 'administrador',
      })));
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar usuarios');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', user?: any) => {
    setModalType(type);
    setSelectedUser(user || null);
    if (type === 'edit' && user) {
      setForm({
        nombre: user.name, correo: user.email, contrasena: '',
        tipo_documento: user.tipo_documento || 'Cédula de Ciudadanía',
        numero_documento: user.numero_documento, telefono: user.phone,
        direccion: user.direccion, estado: user.status, id_rol: user.id_rol || ''
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelectedUser(null); };

  const handleSubmit = async () => {
    try {
      if (modalType === 'add') {
        if (!form.nombre || !form.correo || !form.contrasena)
          return toast.error('Nombre, correo y contraseña son obligatorios');
        if (!form.id_rol) return toast.error('El rol es obligatorio');
        await usuariosAPI.create({
          nombre: form.nombre, correo: form.correo, contrasena: form.contrasena,
          tipo_documento: form.tipo_documento, numero_documento: form.numero_documento,
          telefono: form.telefono, direccion: form.direccion, id_rol: form.id_rol
        });
        toast.success('Usuario creado correctamente');
      } else if (modalType === 'edit' && selectedUser) {
        await usuariosAPI.update(selectedUser.id, {
          nombre: form.nombre, tipo_documento: form.tipo_documento,
          numero_documento: form.numero_documento, telefono: form.telefono,
          direccion: form.direccion, estado: form.estado,
          id_rol: form.id_rol || null
        });
        toast.success('Usuario actualizado correctamente');
      }
      closeModal();
      cargarUsuarios();
    } catch (err: any) { toast.error(err.message || 'Error al guardar usuario'); }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await usuariosAPI.delete(userToDelete.id);
      toast.success('Usuario eliminado');
      cargarUsuarios();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const toggleUserStatus = async (user: any) => {
    if (user.isAdmin) return;
    try {
      await usuariosAPI.update(user.id, { estado: !user.status });
      cargarUsuarios();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.numero_documento || '').includes(searchTerm)
  );

  const getRoleBadge = (role: string) => {
    switch ((role || '').toLowerCase()) {
      case 'administrador': return { bg: '#F3E8FF', color: '#5B21B6' };
      case 'empleado':      return { bg: '#FEF3C7', color: '#92400E' };
      case 'cliente':       return { bg: '#ECFDF5', color: '#065F46' };
      default:              return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px' }}>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2D4B39, #1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
                <Users style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Usuarios</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{users.length} usuarios registrados</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{users.filter(u => u.status).length} activos</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} />
                <input type="text" placeholder="Buscar por nombre, correo o documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', width: '320px', outline: 'none' }} />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg, #2D4B39, #1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Usuario
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.3 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando usuarios...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#2D4B39', color: '#fff' }}>
                <tr>
                  {['USUARIO', 'DOCUMENTO', 'EMAIL', 'TELÉFONO', 'DIRECCIÓN', 'ROL', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '16px 18px', textAlign: 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((user, i) => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <motion.tr key={user.id}
                        initial={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.04 * i }}
                        style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #2D4B39, #1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User style={{ width: '16px', height: '16px', color: '#fff' }} />
                            </div>
                            <span style={{ fontWeight: 600, color: '#2D4B39', fontSize: '14px' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '2px' }}>{user.tipo_documento || '—'}</div>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{user.numero_documento || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', color: '#6B7280' }}>{user.email}</td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', color: '#6B7280' }}>{user.phone || '—'}</td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.direccion || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: badge.bg, color: badge.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            {user.role || 'Sin rol'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <button onClick={() => toggleUserStatus(user)} disabled={user.isAdmin}
                            style={{ position: 'relative', display: 'inline-flex', height: '24px', width: '44px', alignItems: 'center', borderRadius: '9999px', border: 'none', cursor: user.isAdmin ? 'not-allowed' : 'pointer', background: user.isAdmin ? '#9CA3AF' : user.status ? '#10B981' : '#6B7280', transition: 'background 0.3s' }}>
                            <span style={{ display: 'inline-block', height: '16px', width: '16px', transform: user.status ? 'translateX(24px)' : 'translateX(4px)', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s' }} />
                          </button>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', user)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', user)}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                            {!user.isAdmin && (
                              <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal} title={modalType === 'add' ? 'Agregar Nuevo Usuario' : modalType === 'edit' ? 'Editar Usuario' : 'Información del Usuario'}>
          <ModalContent type={modalType} user={selectedUser} form={form} roles={roles}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && userToDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} itemName={userToDelete.name} itemType="Usuario" />
      )}
    </motion.div>
  );
}
