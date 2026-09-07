import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Search, Plus, Info, Edit, Trash2, AlignLeft, Layout, Package } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { categoriasProductosAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState { nombre: string; descripcion: string; }
const emptyForm: FormState = { nombre: '', descripcion: '' };

function ModalContent({ type, categoria, form, onChange, onSubmit }: {
  type: 'view' | 'edit' | 'add'; categoria?: any;
  form: FormState; onChange: (f: keyof FormState, v: string) => void; onSubmit: () => void;
}) {
  if (type === 'view' && categoria) {
    return (
      <div>
        <div style={{ padding: '16px', background: 'rgba(45,75,57,0.04)', borderRadius: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '6px' }}>NOMBRE</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#2D4B39' }}>{categoria.nombre}</div>
        </div>
        <div style={{ padding: '16px', background: 'rgba(45,75,57,0.04)', borderRadius: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '6px' }}>DESCRIPCIÓN</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>{categoria.descripcion || '—'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'rgba(184,134,11,0.06)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '6px' }}>PRODUCTOS</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#B8860B' }}>{categoria.total_productos || 0}</div>
          </div>
          <div style={{ padding: '16px', background: categoria.estado ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '6px' }}>ESTADO</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: categoria.estado ? '#065F46' : '#991B1B' }}>
              {categoria.estado ? 'Activa' : 'Inactiva'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Nombre de la Categoría *</label>
        <div style={{ position: 'relative' }}>
          <Layout style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#9CA3AF' }} />
          <input type="text" value={form.nombre} onChange={e => onChange('nombre', e.target.value)}
            placeholder="Ej: Macramé" style={{ ...iStyle, paddingLeft: '38px' }} />
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Descripción</label>
        <div style={{ position: 'relative' }}>
          <AlignLeft style={{ position: 'absolute', left: '12px', top: '14px', width: '16px', color: '#9CA3AF' }} />
          <textarea value={form.descripcion} onChange={e => onChange('descripcion', e.target.value)}
            placeholder="Describe la categoría..." rows={3}
            style={{ ...iStyle, paddingLeft: '38px', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Crear Categoría' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function CategoriaProductos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const data = await categoriasProductosAPI.getAll();
      setCategorias(data.categorias);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar categorías');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', c?: any) => {
    setModalType(type);
    setSelected(c || null);
    if (type === 'edit' && c) setForm({ nombre: c.nombre, descripcion: c.descripcion || '' });
    else if (type === 'add') setForm(emptyForm);
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre) return toast.error('El nombre es obligatorio');
    try {
      if (modalType === 'add') {
        await categoriasProductosAPI.create(form);
        toast.success('Categoría creada correctamente');
      } else if (modalType === 'edit' && selected) {
        await categoriasProductosAPI.update(selected.id_categoria_prod, form);
        toast.success('Categoría actualizada correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const toggleEstado = async (c: any) => {
    try {
      await categoriasProductosAPI.update(c.id_categoria_prod, { estado: !c.estado });
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await categoriasProductosAPI.delete(toDelete.id_categoria_prod);
      toast.success('Categoría eliminada');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = categorias.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <Tag style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Categorías de Productos</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{categorias.length} categorías registradas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{categorias.filter(c => c.estado).length} activas</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar categorías..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '280px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Categoría
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando categorías...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['CATEGORÍA', 'DESCRIPCIÓN', 'PRODUCTOS', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 24px', textAlign: h === 'PRODUCTOS' || h === 'ESTADO' || h === 'ACCIONES' ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((cat, i) => (
                  <motion.tr key={cat.id_categoria_prod}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Tag style={{ width: '14px', height: '14px', color: '#fff' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{cat.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '13px', color: '#6B7280', maxWidth: '260px' }}>{cat.descripcion || '—'}</td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', background: 'rgba(184,134,11,0.1)', color: '#B8860B', fontSize: '13px', fontWeight: 700 }}>
                        <Package style={{ width: '13px', height: '13px' }} />
                        {cat.total_productos || 0}
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <button onClick={() => toggleEstado(cat)}
                        style={{ position: 'relative', display: 'inline-flex', height: '24px', width: '44px', alignItems: 'center', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: cat.estado ? '#10B981' : '#E5E7EB', transition: 'background 0.3s' }}>
                        <span style={{ display: 'inline-block', height: '18px', width: '18px', transform: cat.estado ? 'translateX(22px)' : 'translateX(4px)', borderRadius: '50%', background: '#fff', transition: 'transform 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </button>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Tooltip text="Ver información">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', cat)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                        </Tooltip>
                        <Tooltip text="Editar categoría">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', cat)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                          </motion.button>
                        </Tooltip>
                        <Tooltip text="Eliminar categoría">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(cat); setShowDeleteModal(true); }}
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
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron categorías</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal} title={modalType === 'add' ? 'Nueva Categoría' : modalType === 'edit' ? 'Editar Categoría' : 'Información de Categoría'}>
          <ModalContent type={modalType} categoria={selected} form={form} onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} itemName={toDelete.nombre} itemType="Categoría" />
      )}
    </motion.div>
  );
}
