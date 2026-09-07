import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { descuentosAPI, productsAPI } from '../../lib/api';
import { Tooltip } from './Tooltip';

interface Descuento {
  id_descuento: number;
  id_producto: number;
  producto: string;
  precio_producto: number;
  imagen_producto?: string;
  cantidad_minima: number;
  porcentaje: number;
  activo: boolean;
  created_at: string;
}

const iStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', background: 'white',
};
const lStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' };

const emptyForm = { id_producto: '', cantidad_minima: '', porcentaje: '', activo: true };

export function Descuentos() {
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Descuento | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [dData, pData] = await Promise.all([descuentosAPI.getAll(), productsAPI.getAll()]);
      setDescuentos(dData.descuentos || []);
      setProductos(pData.productos || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar descuentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtered = descuentos.filter(d =>
    (d.producto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const abrirNuevo = () => {
    setEditando(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEditar = (d: Descuento) => {
    setEditando(d);
    setForm({
      id_producto: String(d.id_producto),
      cantidad_minima: String(d.cantidad_minima),
      porcentaje: String(d.porcentaje),
      activo: d.activo,
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!form.id_producto) return toast.error('Selecciona un producto');
    if (!form.cantidad_minima || Number(form.cantidad_minima) < 1) return toast.error('La cantidad mínima debe ser al menos 1');
    if (!form.porcentaje || Number(form.porcentaje) <= 0 || Number(form.porcentaje) > 100) return toast.error('El porcentaje debe estar entre 1 y 100');

    setSaving(true);
    try {
      const payload = {
        id_producto: Number(form.id_producto),
        cantidad_minima: Number(form.cantidad_minima),
        porcentaje: Number(form.porcentaje),
        activo: form.activo,
      };
      if (editando) {
        await descuentosAPI.update(editando.id_descuento, payload);
        toast.success('Descuento actualizado correctamente');
      } else {
        await descuentosAPI.create(payload);
        toast.success('Descuento creado correctamente');
      }
      setShowModal(false);
      cargar();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este descuento? Esta acción no se puede deshacer.')) return;
    try {
      await descuentosAPI.delete(id);
      toast.success('Descuento eliminado');
      cargar();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleToggle = async (d: Descuento) => {
    try {
      await descuentosAPI.update(d.id_descuento, { activo: !d.activo });
      toast.success(d.activo ? 'Descuento desactivado' : 'Descuento activado');
      cargar();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const precioConDescuento = (precio: number, porcentaje: number) =>
    precio - (precio * porcentaje) / 100;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#B8860B,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(184,134,11,0.3)' }}>
              <Tag style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '4px' }}>Descuentos por Producto</h1>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>{descuentos.length} regla{descuentos.length !== 1 ? 's' : ''} configurada{descuentos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar producto..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '280px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={abrirNuevo}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#B8860B,#92400e)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Regla
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* INFO CARD */}
      <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(184,134,11,0.06)', borderRadius: '12px', border: '1px solid rgba(184,134,11,0.15)' }}>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
          <strong>¿Cómo funcionan los descuentos?</strong> Cuando un cliente agrega una cantidad igual o mayor a la <strong>cantidad mínima</strong> de un producto al carrito, el sistema aplica automáticamente el porcentaje de descuento configurado sobre ese producto específico.
        </p>
      </div>

      {/* TABLA */}
      <motion.div
        initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando descuentos...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['PRODUCTO', 'PRECIO NORMAL', 'CANTIDAD MÍNIMA', 'DESCUENTO', 'PRECIO FINAL', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((d, i) => (
                  <motion.tr key={d.id_descuento}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>

                    {/* Producto */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {d.imagen_producto ? (
                          <img src={d.imagen_producto} alt={d.producto} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(45,75,57,0.08)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{d.producto || '—'}</span>
                      </div>
                    </td>

                    {/* Precio normal */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'line-through' }}>
                        ${Number(d.precio_producto || 0).toLocaleString('es-CO')}
                      </span>
                    </td>

                    {/* Cantidad mínima */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>{d.cantidad_minima} und.</span>
                    </td>

                    {/* Porcentaje */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '9999px', background: 'rgba(184,134,11,0.1)', color: '#92400e', fontSize: '14px', fontWeight: 700 }}>
                        {d.porcentaje}% OFF
                      </span>
                    </td>

                    {/* Precio final */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>
                        ${precioConDescuento(Number(d.precio_producto || 0), Number(d.porcentaje)).toLocaleString('es-CO')}
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '14px 20px' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleToggle(d)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          background: d.activo ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                          color: d.activo ? '#10B981' : '#6B7280' }}>
                        {d.activo ? <ToggleRight style={{ width: '14px', height: '14px' }} /> : <ToggleLeft style={{ width: '14px', height: '14px' }} />}
                        {d.activo ? 'Activo' : 'Inactivo'}
                      </motion.button>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Tooltip text="Editar regla de descuento">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => abrirEditar(d)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Edit style={{ width: '15px', height: '15px', color: '#3B82F6' }} />
                          </motion.button>
                        </Tooltip>
                        <Tooltip text="Eliminar descuento">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => handleEliminar(d.id_descuento)}
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
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
                  {descuentos.length === 0 ? 'No hay reglas de descuento configuradas. Crea la primera.' : 'No se encontraron descuentos con esa búsqueda.'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* MODAL CREAR / EDITAR */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 80px rgba(45,75,57,0.25)' }}>

              {/* Header modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#B8860B,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Percent style={{ width: '18px', height: '18px', color: '#fff' }} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>
                    {editando ? 'Editar Descuento' : 'Nueva Regla de Descuento'}
                  </h2>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowModal(false)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                  <X style={{ width: '18px', height: '18px', color: '#EF4444' }} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Producto */}
                <div>
                  <label style={lStyle}>PRODUCTO *</label>
                  <select value={form.id_producto} onChange={e => setForm((p: any) => ({ ...p, id_producto: e.target.value }))} style={iStyle}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map((p: any) => (
                      <option key={p.id_productos} value={p.id_productos}>{p.nombre_producto} — ${Number(p.precio).toLocaleString('es-CO')} COP</option>
                    ))}
                  </select>
                </div>

                {/* Cantidad mínima y Porcentaje */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={lStyle}>CANTIDAD MÍNIMA *</label>
                    <input type="number" min="1" value={form.cantidad_minima}
                      onChange={e => setForm((p: any) => ({ ...p, cantidad_minima: e.target.value }))}
                      placeholder="Ej: 10"
                      style={iStyle} />
                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Unidades mínimas para activar el descuento</p>
                  </div>
                  <div>
                    <label style={lStyle}>DESCUENTO (%) *</label>
                    <input type="number" min="1" max="100" step="0.01" value={form.porcentaje}
                      onChange={e => setForm((p: any) => ({ ...p, porcentaje: e.target.value }))}
                      placeholder="Ej: 30"
                      style={iStyle} />
                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Porcentaje de descuento aplicado</p>
                  </div>
                </div>

                {/* Vista previa */}
                {form.id_producto && form.cantidad_minima && form.porcentaje && (() => {
                  const prod = productos.find((p: any) => String(p.id_productos) === String(form.id_producto));
                  if (!prod) return null;
                  const precioFinal = Number(prod.precio) - (Number(prod.precio) * Number(form.porcentaje)) / 100;
                  return (
                    <div style={{ padding: '14px 18px', background: 'rgba(184,134,11,0.06)', borderRadius: '12px', border: '1px solid rgba(184,134,11,0.2)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#B8860B', marginBottom: '6px' }}>👁 VISTA PREVIA</p>
                      <p style={{ fontSize: '13px', color: '#4B5563', margin: 0 }}>
                        Al comprar <strong>{form.cantidad_minima}+ unidades</strong> de <strong>{prod.nombre_producto}</strong>, 
                        el precio baja de <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>${Number(prod.precio).toLocaleString('es-CO')}</span> a{' '}
                        <strong style={{ color: '#10B981' }}>${precioFinal.toLocaleString('es-CO')} COP</strong> ({form.porcentaje}% OFF)
                      </p>
                    </div>
                  );
                })()}

                {/* Estado activo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" id="activo" checked={form.activo}
                    onChange={e => setForm((p: any) => ({ ...p, activo: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="activo" style={{ fontSize: '14px', color: '#2D4B39', cursor: 'pointer', fontWeight: 500 }}>
                    Descuento activo
                  </label>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleGuardar} disabled={saving}
                    style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#B8860B,#92400e)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Descuento'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
