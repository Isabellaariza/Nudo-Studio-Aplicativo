import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Search, Plus, Info, Edit, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { materialesAPI, proveedoresAPI, programacionAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_material: string; cantidad: number; costo_total: number;
  unidad_medida: string; id_proveedor: number | '';
  id_programacion_taller: number | ''; id_insumo: number | '';
}
const emptyForm: FormState = {
  nombre_material: '', cantidad: 0, costo_total: 0,
  unidad_medida: '', id_proveedor: '', id_programacion_taller: '', id_insumo: ''
};

function ModalContent({ type, material, form, onChange, onSubmit, proveedores, programaciones, insumos }: {
  type: 'view' | 'edit' | 'add'; material?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; proveedores: any[]; programaciones: any[]; insumos: any[];
}) {
  if (type === 'view' && material) {
    const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(45,75,57,0.03)', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: accent ? '#B8860B' : '#2D4B39' }}>{value || '—'}</div>
      </div>
    );
    return (
      <div>
        <Row label="Material (Insumo)" value={material.insumo_nombre || material.nombre_material} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <Row label="Cantidad a usar"  value={`${Number(material.cantidad)} ${material.unidad_medida || ''}`} />
          <Row label="Costo Total"      value={`$${Number(material.costo_total).toLocaleString()} COP`} accent />
        </div>
        <Row label="Unidad de Medida" value={material.unidad_medida} />
        <Row label="Proveedor"        value={material.proveedor} />
        <Row label="Taller asignado"  value={material.nombre_taller} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: material.estado ? '#D1FAE5' : '#FEE2E2', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: material.estado ? '#065F46' : '#991B1B' }}>
            {material.estado ? 'Disponible' : 'Inactivo'}
          </span>
        </div>
      </div>
    );
  }

  const handleInsumoChange = (id: number | '') => {
    onChange('id_insumo', id);
    if (id === '') {
      onChange('nombre_material', '');
      onChange('unidad_medida', '');
      onChange('costo_total', 0);
      return;
    }
    const insumo = insumos.find((i: any) => i.id_insumos === Number(id));
    if (insumo) {
      onChange('nombre_material', insumo.nombre);
      onChange('unidad_medida', insumo.unidad_medida || '');
      onChange('costo_total', Number(insumo.precio) || 0);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Insumo *</label>
        <select value={form.id_insumo} onChange={e => handleInsumoChange(e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Seleccionar insumo...</option>
          {insumos.map((i: any) => (
            <option key={i.id_insumos} value={i.id_insumos}>
              {i.nombre} — Stock: {i.stock} {i.unidad_medida || ''}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={lStyle}>Unidad de Medida</label>
          <input type="text" value={form.unidad_medida} readOnly
            style={{ ...iStyle, background: 'rgba(45,75,57,0.04)', color: '#6B7280' }} />
        </div>
        <div>
          <label style={lStyle}>Cantidad a usar *</label>
          <input type="number" min={0} value={form.cantidad} onChange={e => onChange('cantidad', Number(e.target.value))} style={iStyle} />
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Costo Total (COP)</label>
        <input type="number" min={0} value={form.costo_total} onChange={e => onChange('costo_total', Number(e.target.value))}
          style={iStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Proveedor</label>
        <select value={form.id_proveedor} onChange={e => onChange('id_proveedor', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Sin proveedor</option>
          {proveedores.map((p: any) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Programación de Taller</label>
        <select value={form.id_programacion_taller} onChange={e => onChange('id_programacion_taller', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Sin asignar</option>
          {programaciones.map((p: any) => (
            <option key={p.id_programacion_taller} value={p.id_programacion_taller}>
              {p.nombre_taller} — {p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '—'}
            </option>
          ))}
        </select>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Registrar Material' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function MaterialesTalleres() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const cargar = async () => {
    try {
      const [mData, pData, prData, iData] = await Promise.all([
        materialesAPI.getAll(),
        programacionAPI.getAll(),
        proveedoresAPI.getAll(),
        materialesAPI.getInsumos(),
      ]);
      setMateriales(mData.materiales);
      setProgramaciones(pData.programaciones);
      setProveedores(prData.proveedores);
      setInsumos(iData.insumos);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar materiales');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', m?: any) => {
    setModalType(type);
    setSelected(m || null);
    if (type === 'edit' && m) {
      setForm({
        nombre_material: m.nombre_material || '',
        cantidad: Number(m.cantidad) || 0,
        costo_total: Number(m.costo_total) || 0,
        unidad_medida: m.unidad_medida || '',
        id_proveedor: m.id_proveedor || '',
        id_programacion_taller: m.id_programacion_taller || '',
        id_insumo: m.id_insumo || '',
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_material) return toast.error('El nombre es obligatorio');
    try {
      if (modalType === 'add') {
        await materialesAPI.create(form);
        toast.success('Material registrado correctamente');
      } else if (modalType === 'edit' && selected) {
        await materialesAPI.update(selected.id_materiales, form);
        toast.success('Material actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await materialesAPI.delete(toDelete.id_materiales);
      toast.success('Material desactivado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = materiales.filter(m =>
    (m.nombre_material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.nombre_taller || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const agotados = materiales.filter(m => !m.estado).length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <Package style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Materiales de Talleres</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{materiales.length} materiales registrados</span>
                {agotados > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>{agotados} inactivos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar materiales..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Material
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando materiales...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['MATERIAL', 'TALLER ASIGNADO', 'CANTIDAD', 'PROVEEDOR', 'COSTO TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['CANTIDAD', 'COSTO TOTAL', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((m, i) => (
                  <motion.tr key={m.id_materiales}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package style={{ width: '14px', height: '14px', color: '#fff' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{m.nombre_material}</div>
                          {m.descripcion && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.descripcion}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>{m.nombre_taller || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
                      {Number(m.cantidad)} <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 400 }}>{m.unidad_medida || ''}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>{m.proveedor || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#B8860B' }}>
                      ${Number(m.costo_total).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: m.estado ? '#D1FAE5' : '#FEE2E2', color: m.estado ? '#065F46' : '#991B1B' }}>
                        {m.estado ? 'Disponible' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', m)}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', m)}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(m); setShowDeleteModal(true); }}
                          style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                          <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron materiales</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nuevo Material' : modalType === 'edit' ? 'Editar Material' : 'Detalle del Material'}>
          <ModalContent type={modalType} material={selected} form={form} proveedores={proveedores}
            programaciones={programaciones} insumos={insumos} onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_material} itemType="Material" />
      )}
    </motion.div>
  );
}
