import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  Settings, Shield, Search, Plus, Edit, Trash2, 
  Info, AlertTriangle, CheckSquare, Square, FileText
} from 'lucide-react';
import { Modal } from './Modal';
import { rolesAPI } from '../../lib/api';
import { toast } from 'sonner';

const rolesConfig: Record<string, any> = {
  administrador: { color: '#2D4B39', bg: 'rgba(45, 75, 57, 0.1)' },
  cliente: { color: '#B8860B', bg: 'rgba(184, 134, 11, 0.1)' },
  estudiante: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  docente: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' },
};

const PERMISOS_MAESTROS = [
  { id: 1, nombre: 'Configuración', descripcion: 'Gestión global y ajustes del sistema' },
  { id: 2, nombre: 'Usuarios', descripcion: 'Administración de cuentas y perfiles' },
  { id: 3, nombre: 'Compras', descripcion: 'Gestión de insumos y pedidos a proveedores' },
  { id: 4, nombre: 'Producción', descripcion: 'Control de procesos y manufactura' },
  { id: 5, nombre: 'Talleres', descripcion: 'Gestión de cursos, clases y alumnos' },
  { id: 6, nombre: 'Ventas', descripcion: 'Registro de transacciones y facturación' },
];

export function GestionConfiguracion() {
  const [roles, setRoles] = useState<any[]>([]);
  const [searchRoles, setSearchRoles] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 🔄 Cargar roles desde el Backend/Neon al montar el componente
  const cargarRoles = async () => {
    try {
      const data = await rolesAPI.getAll();
      setRoles(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar roles');
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  // 🛡️ Guardar / Modificar un Rol mandando los datos a la DB
  const handleGuardarRol = async () => {
    if (!selectedItem?.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      const payload = { nombre: selectedItem.nombre, permisos: selectedItem.permisos, activo: selectedItem.estado };
      if (modalType === 'add') {
        await rolesAPI.create(payload);
        toast.success('Rol creado correctamente');
      } else {
        await rolesAPI.update(selectedItem.id_rol, payload);
        toast.success('Rol actualizado correctamente');
      }
      setIsModalOpen(false);
      cargarRoles();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar rol');
    }
  };

  // 🛡️ Cambiar estado desde el switch (Toggle)
  const toggleRolEstado = async (rol: any) => {
    if ((rol.nombre || '').toLowerCase() === 'administrador') {
      toast.error('El rol Administrador no puede ser desactivado.');
      return;
    }
    try {
      await rolesAPI.update(rol.id_rol, { activo: !rol.estado });
      cargarRoles();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const handleEliminarRol = async () => {
    if (!selectedItem) return;
    try {
      await rolesAPI.delete(selectedItem.id_rol);
      toast.success('Rol eliminado correctamente');
      setShowDeleteModal(false);
      setSelectedItem(null);
      cargarRoles();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar rol');
      setShowDeleteModal(false);
    }
  };

  const handleTogglePermiso = (nombrePermiso: string) => {
    if (modalType === 'view') return;
    if ((selectedItem?.nombre || '').toLowerCase() === 'administrador') {
      toast.error('Los permisos del Administrador no pueden ser modificados.');
      return;
    }
    
    const permisosActuales = selectedItem.permisos || [];
    const nuevosPermisos = permisosActuales.includes(nombrePermiso)
      ? permisosActuales.filter((p: string) => p !== nombrePermiso)
      : [...permisosActuales, nombrePermiso];

    setSelectedItem({ ...selectedItem, permisos: nuevosPermisos });
  };

  const getRolesParaPermiso = (nombrePermiso: string) => {
    return roles.filter(rol => rol.permisos?.includes(nombrePermiso)).map(rol => ({
      nombre: rol.nombre,
      config: rolesConfig[rol.nombre?.toLowerCase()] || { color: '#64748B', bg: '#F1F5F9' }
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}
      style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}
    >
      {/* --- HEADER SECTION --- */}
      <div style={{ background: 'white', border: '1px solid rgba(45, 75, 57, 0.1)', borderRadius: '24px', padding: '32px 40px', marginBottom: '40px', boxShadow: '0 8px 32px rgba(45, 75, 57, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #2D4B39 0%, #1F3A2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings style={{ width: '28px', height: '28px', color: '#ffffff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Configuración del Sistema</h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>Administre los roles de acceso y el diccionario de permisos globales.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
              <input 
                placeholder="Buscar..." value={searchRoles} onChange={(e) => setSearchRoles(e.target.value)}
                style={{ padding: '10px 15px 10px 40px', borderRadius: '12px', border: '1px solid #E2E8F0', width: '240px', outline: 'none' }}
              />
            </div>
            <button
              onClick={() => { setModalType('add'); setSelectedItem({nombre: '', permisos: [], estado: true}); setIsModalOpen(true); }}
              style={{ background: '#2D4B39', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Nuevo Rol
            </button>
          </div>
        </div>
      </div>

      {/* --- TABLA 1: ROLES --- */}
      <h2 style={{ color: '#2D4B39', fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={22} /> Gestión de Roles</h2>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45, 75, 57, 0.08)', overflow: 'hidden', marginBottom: '48px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #1F3A2E 100%)', color: '#ffffff' }}>
            <tr>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px' }}>NOMBRE DEL ROL</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px' }}>PERMISOS ASIGNADOS</th>
              <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '13px' }}>ESTADO</th>
              <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {roles.filter(r => r.nombre?.toLowerCase().includes(searchRoles.toLowerCase())).map((rol) => (
              <tr key={rol.id_rol} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>{rol.nombre}</td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {rol.permisos?.map((p: string) => (
                      <span key={p} style={{ background: 'rgba(45, 75, 57, 0.08)', color: '#2D4B39', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div 
                      onClick={() => toggleRolEstado(rol)}
                      style={{ width: '40px', height: '20px', backgroundColor: rol.estado ? '#10B981' : '#D1D5DB', borderRadius: '20px', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: rol.estado ? 'flex-end' : 'flex-start' }}
                    >
                      <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => { setSelectedItem(rol); setModalType('view'); setIsModalOpen(true); }} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}><Info size={16} /></button>
                    <button 
                      onClick={() => { 
                        if ((rol.nombre || '').toLowerCase() === 'administrador') {
                          toast.error('El rol Administrador no puede ser modificado.');
                          return;
                        }
                        setSelectedItem(rol); setModalType('edit'); setIsModalOpen(true); 
                      }} 
                      style={{ color: '#B8860B', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => { 
                        if ((rol.nombre || '').toLowerCase() === 'administrador') {
                          setShowRestrictedModal(true);
                        } else {
                          setSelectedItem(rol); setShowDeleteModal(true); 
                        }
                      }} 
                      style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- TABLA 2: PERMISOS --- */}
      <h2 style={{ color: '#2D4B39', fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={22} /> Diccionario de Permisos</h2>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45, 75, 57, 0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #1F3A2E 100%)', color: '#ffffff' }}>
            <tr>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px' }}>NOMBRE DEL PERMISO</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px' }}>DEFINICIÓN FUNCIONAL</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px' }}>ROLES CON ACCESO</th>
            </tr>
          </thead>
          <tbody>
            {PERMISOS_MAESTROS.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '20px 24px', fontWeight: 700, color: '#2D4B39' }}>{p.nombre}</td>
                <td style={{ padding: '20px 24px', color: '#64748B', fontSize: '14px' }}>{p.descripcion}</td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {getRolesParaPermiso(p.nombre).map(rolInfo => (
                      <span key={rolInfo.nombre} style={{ background: rolInfo.config.bg, color: rolInfo.config.color, padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>
                        {rolInfo.nombre}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODALES DE CONFIRMACIÓN --- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteModal(false)}>
            <div style={{ width: '380px', background: 'white', borderRadius: '24px', padding: '32px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#FEF2F2', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><AlertTriangle color="#EF4444" size={32} /></div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>¿Eliminar Rol?</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Esta acción borrará permanentemente el rol <b style={{textTransform:'capitalize'}}>"{selectedItem?.nombre}"</b>.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: 'white', fontWeight: 600 }}>Cancelar</button>
                <button onClick={handleEliminarRol} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 600 }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {showRestrictedModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRestrictedModal(false)}>
            <div style={{ width: '400px', background: 'white', borderRadius: '24px', padding: '32px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: '#FFF7ED', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Shield color="#EA580C" size={32} /></div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>Acción Restringida</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>El rol <b>"Administrador"</b> es crucial y no puede ser eliminado del sistema.</p>
              <button onClick={() => setShowRestrictedModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#2D4B39', color: 'white', fontWeight: 600 }}>Entendido</button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL FORMULARIO --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'add' ? 'Crear Nuevo Rol' : modalType === 'edit' ? 'Editar Rol' : 'Información del Rol'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#2D4B39', fontSize: '14px' }}>Nombre del Rol</label>
            <input 
              readOnly={modalType === 'view'} 
              value={selectedItem?.nombre || ''} 
              onChange={(e) => setSelectedItem({ ...selectedItem, nombre: e.target.value })}
              placeholder="Ej: Supervisor de Planta"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', textTransform: 'capitalize' }} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#2D4B39', fontSize: '14px' }}>Asignación de Permisos</label>
            <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', maxHeight: '180px', overflowY: 'auto', background: '#F8FAFC' }}>
              {PERMISOS_MAESTROS.map(p => (
                <div key={p.id} onClick={() => handleTogglePermiso(p.nombre)} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #F1F5F9', cursor: modalType === 'view' ? 'default' : 'pointer' }}>
                  {selectedItem?.permisos?.includes(p.nombre) ? <CheckSquare color="#2D4B39" size={20} /> : <Square color="#CBD5E1" size={20} />}
                  <div style={{ marginLeft: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{p.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{p.descripcion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {modalType !== 'view' && (
            <button onClick={handleGuardarRol} style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #1F3A2E 100%)', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}>
              {modalType === 'add' ? 'Crear Rol' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}