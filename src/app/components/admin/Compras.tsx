import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Info, Edit, Trash2, DollarSign, Calendar, FileText, CheckCircle, XCircle, Image, X, Package } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { comprasAPI, proveedoresAPI } from '../../lib/api';

const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload';
const CLOUDINARY_PRESET = 'nudo_studio';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white',
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface Producto { nombre_producto: string; cantidad: string; precio_unitario: string; }
interface FormState {
  id_proveedor: string; total: string; registro_compra: string;
  factura_url: string; productos: Producto[];
}
const emptyProducto = (): Producto => ({ nombre_producto: '', cantidad: '', precio_unitario: '' });
const emptyForm = (): FormState => ({
  id_proveedor: '', total: '', registro_compra: '',
  factura_url: '', productos: [emptyProducto()],
});

export function Compras() {
  const [searchTerm, setSearchTerm]     = useState('');
  const [compras, setCompras]           = useState<any[]>([]);
  const [proveedores, setProveedores]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modalType, setModalType]       = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected]         = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete]         = useState<any | null>(null);
  const [form, setForm]                 = useState<FormState>(emptyForm());
  const [uploading, setUploading]       = useState(false);
  const [showFactura, setShowFactura]   = useState<string | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);

  const generarRegistro = () => {
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `FAC-${fecha}-${rand}`;
  };

  const cargar = async () => {
    try {
      const [compData, provData] = await Promise.all([
        comprasAPI.getAll(),
        proveedoresAPI.getAll(),
      ]);
      setCompras(compData.compras);
      setProveedores(provData.proveedores || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar compras');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', c?: any) => {
    setModalType(type);
    setSelected(c || null);
    if (type === 'edit' && c) {
      setForm({
        id_proveedor:    String(c.id_proveedor || ''),
        total:           String(c.total || ''),
        registro_compra: c.registro_compra || '',
        factura_url:     c.factura_url || '',
        productos:       c.productos?.length ? c.productos.map((p: any) => ({
          nombre_producto: p.nombre_producto,
          cantidad:        String(p.cantidad),
          precio_unitario: String(p.precio_unitario),
        })) : [emptyProducto()],
      });
    } else if (type === 'add') {
      setForm({ ...emptyForm(), registro_compra: generarRegistro() });
      setPreviewLocal(null);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); setPreviewLocal(null); };

  const setProducto = (i: number, field: keyof Producto, val: string) =>
    setForm(p => { const arr = [...p.productos]; arr[i] = { ...arr[i], [field]: val }; return { ...p, productos: arr }; });

  const addProducto    = () => setForm(p => ({ ...p, productos: [...p.productos, emptyProducto()] }));
  const removeProducto = (i: number) => setForm(p => ({ ...p, productos: p.productos.filter((_, idx) => idx !== i) }));

  const handleUploadFactura = async (file: File) => {
    // Vista previa local inmediata
    const localUrl = URL.createObjectURL(file);
    setPreviewLocal(localUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(p => ({ ...p, factura_url: data.secure_url }));
      setPreviewLocal(null);
      toast.success('Factura subida correctamente');
    } catch { toast.error('No se pudo subir la factura'); setPreviewLocal(null); }
    finally { setUploading(false); }
  };

  // Calcular total automático desde productos
  const totalCalculado = form.productos.reduce((sum, p) => {
    const cant = parseFloat(p.cantidad) || 0;
    const precio = parseFloat(p.precio_unitario) || 0;
    return sum + cant * precio;
  }, 0);

  const handleSubmit = async () => {
    if (!form.id_proveedor) return toast.error('El proveedor es obligatorio');
    const productosValidos = form.productos.filter(p => p.nombre_producto.trim());
    if (!productosValidos.length) return toast.error('Agrega al menos un producto');
    const payload = {
      id_proveedor:    Number(form.id_proveedor),
      total:           totalCalculado || Number(form.total),
      registro_compra: form.registro_compra || null,
      factura_url:     form.factura_url || null,
      productos:       productosValidos.map(p => ({
        nombre_producto: p.nombre_producto,
        cantidad:        parseFloat(p.cantidad) || 1,
        precio_unitario: parseFloat(p.precio_unitario) || 0,
      })),
    };
    try {
      if (modalType === 'add') {
        await comprasAPI.create(payload);
        toast.success('Compra registrada correctamente');
      } else if (modalType === 'edit' && selected) {
        await comprasAPI.update(selected.id_compras, payload);
        toast.success('Compra actualizada correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await comprasAPI.delete(toDelete.id_compras);
      toast.success('Compra anulada');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al anular'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = compras.filter(c =>
    (c.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.registro_compra || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActivas = compras.filter(c => c.estado).length;
  const totalGastado = compras.filter(c => c.estado).reduce((s, c) => s + Number(c.total), 0);

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px' }}>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
                <ShoppingBag style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Compras</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{compras.length} compras registradas</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{totalActivas} activas</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#B8860B', fontWeight: 600 }}>
                    Total: ${totalGastado.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} />
                <input type="text" placeholder="Buscar por proveedor o referencia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', width: '300px', outline: 'none' }} />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Plus style={{ width: '16px', height: '16px' }} /> Nueva Compra
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.3 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando compras...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#2D4B39', color: '#fff' }}>
                <tr>
                  {['#', 'PROVEEDOR', 'FECHA', 'PRODUCTOS', 'TOTAL', 'FACTURA', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.tr key={c.id_compras}
                      initial={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.04 * i }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>

                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#9CA3AF', fontWeight: 600 }}>#{c.id_compras}</td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShoppingBag style={{ width: '14px', height: '14px', color: '#fff' }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#2D4B39', fontSize: '14px' }}>{c.proveedor || '—'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6B7280' }}>
                        {c.fecha_compra ? new Date(c.fecha_compra).toLocaleDateString('es-CO') : '—'}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package style={{ width: '14px', height: '14px', color: '#B8860B' }} />
                          <span style={{ fontSize: '13px', color: '#6B7280' }}>
                            {c.productos?.length || 0} {c.productos?.length === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>
                        ${Number(c.total).toLocaleString('es-CO')} COP
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {c.factura_url ? (
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowFactura(c.factura_url)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(184,134,11,0.3)', background: 'rgba(184,134,11,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Image style={{ width: '13px', height: '13px', color: '#B8860B' }} />
                            <span style={{ fontSize: '12px', color: '#B8860B', fontWeight: 600 }}>Ver</span>
                          </motion.button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Sin factura</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: c.estado ? '#ECFDF5' : '#FEF2F2', color: c.estado ? '#065F46' : '#991B1B' }}>
                          {c.estado ? 'Activa' : 'Anulada'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', c)}
                            title="Ver detalle"
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                          {c.estado && <>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', c)}
                              title="Editar"
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(c); setShowDeleteModal(true); }}
                              title="Anular"
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          </>}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron compras</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* MODAL VER / EDITAR / NUEVO */}
      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Registrar Nueva Compra' : modalType === 'edit' ? 'Editar Compra' : 'Detalle de Compra'}>

          {/* ── VISTA DETALLE ── */}
          {modalType === 'view' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Info general */}
              <div style={{ padding: '16px', background: 'rgba(45,75,57,0.04)', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>PROVEEDOR</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>{selected.proveedor || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>FECHA</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
                    {selected.fecha_compra ? new Date(selected.fecha_compra).toLocaleDateString('es-CO') : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>TOTAL</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>${Number(selected.total).toLocaleString('es-CO')} COP</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>REGISTRO</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{selected.registro_compra || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>ESTADO</div>
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: selected.estado ? '#ECFDF5' : '#FEF2F2', color: selected.estado ? '#065F46' : '#991B1B' }}>
                    {selected.estado ? 'Activa' : 'Anulada'}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2D4B39', marginBottom: '10px', letterSpacing: '0.05em' }}>PRODUCTOS</div>
                {selected.productos?.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(45,75,57,0.06)' }}>
                        {['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.productos.map((p: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(45,75,57,0.06)' }}>
                          <td style={{ padding: '8px 12px', color: '#2D4B39', fontWeight: 500 }}>{p.nombre_producto}</td>
                          <td style={{ padding: '8px 12px', color: '#6B7280' }}>{p.cantidad}</td>
                          <td style={{ padding: '8px 12px', color: '#6B7280' }}>${Number(p.precio_unitario).toLocaleString('es-CO')}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2D4B39' }}>
                            ${(Number(p.cantidad) * Number(p.precio_unitario)).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Sin productos registrados</p>}
              </div>

              {/* Factura — imagen directa en el detalle */}
              {selected.factura_url && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2D4B39', marginBottom: '10px', letterSpacing: '0.05em' }}>FACTURA</div>
                  {selected.factura_url.match(/\.pdf$/i) ? (
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowFactura(selected.factura_url)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(184,134,11,0.3)', background: 'rgba(184,134,11,0.04)', color: '#B8860B', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      <FileText style={{ width: '16px', height: '16px' }} /> Ver PDF de Factura
                    </motion.button>
                  ) : (
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(45,75,57,0.1)', cursor: 'pointer' }}
                      onClick={() => setShowFactura(selected.factura_url)}>
                      <img src={selected.factura_url} alt="Factura" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.3)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                          Ver completa
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FORMULARIO NUEVO / EDITAR ── */}
          {(modalType === 'add' || modalType === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Proveedor */}
              <div>
                <label style={lStyle}>PROVEEDOR *</label>
                <select value={form.id_proveedor} onChange={e => setForm(p => ({ ...p, id_proveedor: e.target.value }))} style={iStyle}>
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores.map((p: any) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>)}
                </select>
              </div>

              {/* Registro — solo lectura, generado automáticamente */}
              <div>
                <label style={lStyle}>REGISTRO / REFERENCIA</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={form.registro_compra} readOnly
                    style={{ ...iStyle, background: 'rgba(45,75,57,0.04)', color: '#6B7280', cursor: 'default', flex: 1 }} />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(p => ({ ...p, registro_compra: generarRegistro() }))}
                    title="Regenerar código"
                    style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', cursor: 'pointer', flexShrink: 0 }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#2D4B39' }} />
                  </motion.button>
                </div>
              </div>

              {/* Productos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...lStyle, margin: 0 }}>PRODUCTOS *</label>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={addProducto}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.2)', background: 'transparent', color: '#2D4B39', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus style={{ width: '13px', height: '13px' }} /> Agregar
                  </motion.button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.productos.map((prod, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <input type="text" placeholder="Nombre del producto" value={prod.nombre_producto}
                        onChange={e => setProducto(idx, 'nombre_producto', e.target.value)}
                        style={{ ...iStyle, padding: '9px 12px' }} />
                      <input type="number" placeholder="Cant." value={prod.cantidad}
                        onChange={e => setProducto(idx, 'cantidad', e.target.value)}
                        style={{ ...iStyle, padding: '9px 12px' }} />
                      <input type="number" placeholder="Precio unit." value={prod.precio_unitario}
                        onChange={e => setProducto(idx, 'precio_unitario', e.target.value)}
                        style={{ ...iStyle, padding: '9px 12px' }} />
                      {form.productos.length > 1 && (
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => removeProducto(idx)}
                          style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer' }}>
                          <X style={{ width: '14px', height: '14px', color: '#EF4444' }} />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculado */}
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>TOTAL REGISTRO</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>${totalCalculado.toLocaleString('es-CO')} COP</span>
              </div>

              {/* Factura */}
              <div>
                <label style={lStyle}>FACTURA</label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '10px', border: `2px dashed ${uploading ? '#9CA3AF' : form.factura_url ? 'rgba(16,185,129,0.4)' : 'rgba(45,75,57,0.2)'}`, background: form.factura_url ? 'rgba(16,185,129,0.04)' : 'rgba(45,75,57,0.02)', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFactura(f); }} />
                  {uploading ? (
                    <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Subiendo factura...</span>
                  ) : form.factura_url ? (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px', color: '#10B981' }} />
                      <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>Factura subida — clic para cambiar</span>
                    </>
                  ) : (
                    <>
                      <Image style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>Clic para subir factura (imagen o PDF)</span>
                    </>
                  )}
                </label>

                {/* Vista previa */}
                {(previewLocal || form.factura_url) && !uploading && (() => {
                  const src = previewLocal || form.factura_url;
                  return src && !src.match(/\.pdf$/i) ? (
                    <div style={{ marginTop: '10px', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(45,75,57,0.1)' }}>
                      <img src={src} alt="Vista previa" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                      {previewLocal && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Subiendo...</span>
                        </div>
                      )}
                      {form.factura_url && !previewLocal && (
                        <motion.button whileHover={{ opacity: 1 }} onClick={() => setShowFactura(form.factura_url)}
                          style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '5px 10px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Ver completa
                        </motion.button>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={uploading}
                style={{ padding: '14px', borderRadius: '10px', border: 'none', background: uploading ? '#9CA3AF' : 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                {modalType === 'add' ? 'Registrar Compra' : 'Guardar Cambios'}
              </motion.button>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL FACTURA */}
      <AnimatePresence>
        {showFactura && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFactura(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Factura de Compra</h3>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowFactura(null)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                  <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                </motion.button>
              </div>
              {showFactura.match(/\.pdf$/i) ? (
                <iframe src={showFactura} style={{ width: '100%', height: '70vh', borderRadius: '12px', border: 'none' }} title="Factura" />
              ) : (
                <img src={showFactura} alt="Factura" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} itemName={`Compra #${toDelete.id_compras}`} itemType="Compra" />
      )}
    </motion.div>
  );
}
