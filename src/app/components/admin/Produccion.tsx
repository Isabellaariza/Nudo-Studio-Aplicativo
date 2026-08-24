import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package2, Search, Plus, Info, Edit, Trash2, Calendar, FileText, Hash, Layers, ShoppingBag, CheckCircle, X, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import { produccionAPI, productsAPI, insumosAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface SelectedInsumo {
  id_insumo: number;
  cantidad: number;
  nombre: string;
  stock_disponible: number;
}

interface FormState {
  id_productos: number | '';
  cantidad: number;
  fecha_produccion: string;
  motivo_uso: string;
  estado: string;
  insumos: SelectedInsumo[];
}

const emptyForm: FormState = {
  id_productos: '', cantidad: 1,
  fecha_produccion: new Date().toISOString().split('T')[0],
  motivo_uso: '', estado: 'en_proceso',
  insumos: []
};

const badge = (estado: string) => {
  switch (estado) {
    case 'completado':  return { bg: '#D1FAE5', color: '#065F46', label: 'Completado' };
    case 'cancelado':   return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' };
    default:            return { bg: '#FEF3C7', color: '#92400E', label: 'En Proceso' };
  }
};

function ModalContent({ type, orden, form, onChange, onSubmit, productos, insumosDisponibles }: {
  type: 'view' | 'edit' | 'add'; orden?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; productos: any[];
  insumosDisponibles: any[];
}) {
  const [selectedInsumoId, setSelectedInsumoId] = useState<number | ''>('');
  const [cantidadInsumo, setCantidadInsumo] = useState<number>(1);

  if (type === 'view' && orden) {
    const b = badge(orden.estado);
    
    const Row = ({ icon: Icon, label, value, isCustomElement }: { icon: any; label: string; value?: string; isCustomElement?: React.ReactNode }) => (
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderRadius: '12px', background: 'rgba(45,75,57,0.03)', marginBottom: '10px' }}>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '9px', 
          background: orden.tipo_origen === 'Pedido' ? 'linear-gradient(135deg,#B8860B,#996515)' : 'linear-gradient(135deg,#2D4B39,#1a2f23)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginRight: '14px', 
          flexShrink: 0 
        }}>
          <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
          {isCustomElement ? isCustomElement : <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{value || '—'}</div>}
        </div>
      </div>
    );

    return (
      <div>
        {orden.tipo_origen === 'Pedido' ? (
          <>
            <Row 
              icon={Package2}  
              label="Productos Solicitados" 
              isCustomElement={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {orden.producto.split(', ').map((prod: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', border: '1px solid rgba(184,134,11,0.15)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#996515' }}>
                      <span>{prod.split('x ')[1] || prod}</span>
                      <span style={{ background: '#996515', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '11px' }}>
                        x{prod.split('x ')[0] || '1'}
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
            <Row icon={FileText} label="Información del Cliente" value={orden.observaciones} />
          </>
        ) : (
          <>
            <Row icon={Package2}  label="Producto"            value={orden.producto} />
            <Row icon={Hash}      label="Cantidad"             value={String(orden.cantidad || 1)} />
            {orden.observaciones && <Row icon={FileText} label="Observaciones" value={orden.observaciones} />}
          </>
        )}

        <Row icon={Calendar}  label="Fecha de registro"  value={orden.fecha_produccion ? new Date(orden.fecha_produccion).toLocaleDateString('es-CO') : '—'} />
        
        {orden.tipo_origen !== 'Pedido' && (
          <Row icon={Calendar}  label="Fecha de entrega" value={orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-CO') : '—'} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderRadius: '12px', background: 'rgba(45,75,57,0.03)' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '9px', 
            background: orden.tipo_origen === 'Pedido' ? 'linear-gradient(135deg,#B8860B,#996515)' : 'linear-gradient(135deg,#2D4B39,#1a2f23)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: '14px', 
            flexShrink: 0 
          }}>
            <FileText style={{ width: '16px', height: '16px', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '4px' }}>ESTADO EN PRODUCCIÓN</div>
            <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: b.bg, color: b.color }}>{b.label}</span>
          </div>
        </div>
      </div>
    );
  }

  // AGREGAR INSUMO SELECCIONADO A LA LISTA
  const handleAgregarInsumo = () => {
    if (!selectedInsumoId) return toast.error('Selecciona un insumo primero');
    if (cantidadInsumo <= 0) return toast.error('La cantidad debe ser mayor a 0');

    const insumoEncontrado = insumosDisponibles.find(i => i.id_insumos === selectedInsumoId);
    if (!insumoEncontrado) return;

    // Validación del stock actual del almacén en caliente
    const stockActualNum = Number(insumoEncontrado.stock);
    if (cantidadInsumo > stockActualNum) {
      return toast.error(`Stock insuficiente. Solo cuentas con ${stockActualNum} unidades disponibles.`);
    }

    // Comprobar si ya agregaste ese insumo a la lista
    if (form.insumos.some(i => i.id_insumo === selectedInsumoId)) {
      return toast.error('Este insumo ya se encuentra en tu lista de consumo');
    }

    const nuevoInsumo: SelectedInsumo = {
      id_insumo: insumoEncontrado.id_insumos,
      cantidad: cantidadInsumo,
      nombre: insumoEncontrado.nombre,
      stock_disponible: stockActualNum
    };

    onChange('insumos', [...form.insumos, nuevoInsumo]);
    setSelectedInsumoId('');
    setCantidadInsumo(1);
  };

  // QUITAR INSUMO DE LA LISTA
  const handleQuitarInsumo = (id: number) => {
    onChange('insumos', form.insumos.filter(i => i.id_insumo !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Producto *</label>
        <select value={form.id_productos} onChange={e => onChange('id_productos', Number(e.target.value))} style={iStyle}>
          <option value="">Seleccionar producto...</option>
          {productos.map((p: any) => <option key={p.id_productos} value={p.id_productos}>{p.nombre_producto}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Cantidad a producir *</label>
        <input type="number" min={1} value={form.cantidad} onChange={e => onChange('cantidad', Number(e.target.value))} style={iStyle} />
      </div>
      <div style={{ marginBottom: '18px' }}>
        <label style={lStyle}>Fecha de Producción *</label>
        <input type="date" value={form.fecha_produccion} onChange={e => onChange('fecha_produccion', e.target.value)} style={iStyle} />
      </div>
      {type === 'edit' && (
        <div style={{ marginBottom: '18px' }}>
          <label style={lStyle}>Estado</label>
          <select value={form.estado} onChange={e => onChange('estado', e.target.value)} style={iStyle}>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      )}
      
      {/* MOTIVO DE USO DE INSUMOS */}
      {type === 'add' && (
        <div style={{ marginBottom: '18px' }}>
          <label style={lStyle}>¿Para qué se usarán los insumos? *</label>
          <input
            type="text"
            value={form.motivo_uso}
            onChange={e => onChange('motivo_uso', e.target.value)}
            placeholder="Ej: Fabricación de mochila wayuu para pedido PED-0012"
            style={iStyle}
          />
        </div>
      )}

      {/* SECCIÓN DE INSUMOS MANUALES (Solo disponible al crear nuevas órdenes para stock) */}
      {type === 'add' && (
        <div style={{ background: 'rgba(45,75,57,0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(45,75,57,0.15)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers style={{ width: '16px', height: '16px', color: '#2D4B39' }} />
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Descontar Insumos Usados</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '8px', marginBottom: '12px' }}>
            <select value={selectedInsumoId} onChange={e => setSelectedInsumoId(e.target.value ? Number(e.target.value) : '')} style={iStyle}>
              <option value="">Insumo a utilizar...</option>
              {insumosDisponibles.map((i: any) => (
                <option key={i.id_insumos} value={i.id_insumos}>
                  {i.nombre} ({i.unidad_medida}) — Stock: {i.stock}
                </option>
              ))}
            </select>

            <input type="number" min={1} step="0.1" value={cantidadInsumo} onChange={e => setCantidadInsumo(Number(e.target.value))} placeholder="Cant." style={iStyle} />

            <button type="button" onClick={handleAgregarInsumo} style={{ background: '#2D4B39', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
              Agregar
            </button>
          </div>

          {/* Listado visual de Insumos agregados a la orden */}
          {form.insumos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              {form.insumos.map((ins: SelectedInsumo) => (
                <div key={ins.id_insumo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid rgba(45,75,57,0.12)', padding: '6px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2D4B39' }}>
                    {ins.nombre} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>(Stock: {ins.stock_disponible})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: 'rgba(45,75,57,0.1)', color: '#2D4B39', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                      Cant: {ins.cantidad}
                    </span>
                    <button type="button" onClick={() => handleQuitarInsumo(ins.id_insumo)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 style={{ width: '13px', height: '13px', color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {type === 'add' ? 'Crear Orden y Descontar Insumos' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

// Modal para agregar productos terminados a un pedido en producción
function AgregarProductosPedidoModal({ pedido, productos, insumosDisponibles, onClose, onDone }: {
  pedido: any; productos: any[]; insumosDisponibles: any[]; onClose: () => void; onDone: () => void;
}) {
  // Parsear solo los productos del pedido
  const parsearProductosPedido = () => {
    if (!pedido.producto) return [];
    return pedido.producto.split(', ').map((item: string) => {
      // Formato: "Nombre (cantidad)" o "cantidad x Nombre"
      const matchParen = item.trim().match(/^(.+)\s*\((\d+)\)$/);
      const matchX = item.trim().match(/^(\d+)x?\s+(.+)$/);
      let nombre = '';
      let cantidadPedido = 1;
      if (matchParen) { nombre = matchParen[1].trim(); cantidadPedido = parseInt(matchParen[2]); }
      else if (matchX) { cantidadPedido = parseInt(matchX[1]); nombre = matchX[2].trim(); }
      else { nombre = item.trim(); }
      const prod = productos.find(p => p.nombre_producto.toLowerCase() === nombre.toLowerCase());
      if (!prod) return null;
      return { id_producto: prod.id_productos, cantidad: cantidadPedido, cantidadPedido, nombre: prod.nombre_producto, stockDisponible: Number(prod.stock || 0) };
    }).filter(Boolean);
  };

  const [items, setItems] = useState<{ id_producto: number; cantidad: number; cantidadPedido: number; nombre: string; stockDisponible: number }[]>(() => parsearProductosPedido());
  const [loading, setLoading] = useState(false);

  // Producción manual de un producto del pedido
  const [prodManualIdx, setProdManualIdx] = useState<number | null>(null);
  const [insumosSel, setInsumosSel] = useState<{ id_insumo: number; cantidad: number; nombre: string; stock_disponible: number }[]>([]);
  const [selectedInsumoId, setSelectedInsumoId] = useState<number | ''>('');
  const [cantidadInsumo, setCantidadInsumo] = useState(1);
  const [motivoManual, setMotivoManual] = useState('');
  const [loadingManual, setLoadingManual] = useState(false);

  const cambiarCantidad = (idx: number, val: number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (val > it.cantidadPedido) {
        toast.error(`La cantidad no puede superar la del pedido (${it.cantidadPedido})`);
        return it;
      }
      return { ...it, cantidad: val };
    }));
  };

  const handleAgregarInsumo = () => {
    if (!selectedInsumoId) return toast.error('Selecciona un insumo');
    if (cantidadInsumo <= 0) return toast.error('La cantidad debe ser mayor a 0');
    const ins = insumosDisponibles.find(i => i.id_insumos === selectedInsumoId);
    if (!ins) return;
    if (cantidadInsumo > Number(ins.stock)) return toast.error(`Stock insuficiente. Disponible: ${ins.stock}`);
    if (insumosSel.some(i => i.id_insumo === selectedInsumoId)) return toast.error('Ese insumo ya está en la lista');
    setInsumosSel(prev => [...prev, { id_insumo: ins.id_insumos, cantidad: cantidadInsumo, nombre: ins.nombre, stock_disponible: Number(ins.stock) }]);
    setSelectedInsumoId('');
    setCantidadInsumo(1);
  };

  const handleProduccionManual = async () => {
    if (prodManualIdx === null) return;
    const item = items[prodManualIdx];
    if (!motivoManual.trim()) return toast.error('Indica el motivo de la producción manual');
    setLoadingManual(true);
    try {
      await produccionAPI.create({
        id_productos: item.id_producto,
        cantidad: item.cantidad,
        fecha_produccion: new Date().toISOString().split('T')[0],
        motivo: motivoManual,
        insumos: insumosSel.map(i => ({ id_insumo: i.id_insumo, cantidad: i.cantidad }))
      });
      toast.success(`Orden manual creada para ${item.nombre}`);
      setProdManualIdx(null);
      setInsumosSel([]);
      setMotivoManual('');
      onDone();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear orden manual');
    } finally { setLoadingManual(false); }
  };

  const handleCompletar = async () => {
    if (!items.length) return toast.error('No hay productos para completar');
    setLoading(true);
    try {
      await produccionAPI.agregarProductosPedido(pedido.id_pedidos, items.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })));
      toast.success('Pedido completado y stock actualizado');
      onDone();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al completar');
    } finally { setLoading(false); }
  };

  // Vista de producción manual
  if (prodManualIdx !== null) {
    const item = items[prodManualIdx];
    return (
      <div>
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(45,75,57,0.06)', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>Producción manual — {item.nombre}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Cantidad a producir: {item.cantidad}</p>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={lStyle}>Motivo *</label>
          <input type="text" value={motivoManual} onChange={e => setMotivoManual(e.target.value)}
            placeholder={`Ej: Producción manual para PED-${String(pedido.id_pedidos).padStart(4,'0')}`} style={iStyle} />
        </div>
        <div style={{ background: 'rgba(45,75,57,0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(45,75,57,0.15)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers style={{ width: '16px', height: '16px', color: '#2D4B39' }} />
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Descontar Insumos del Stock</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '8px', marginBottom: '10px' }}>
            <select value={selectedInsumoId} onChange={e => setSelectedInsumoId(e.target.value ? Number(e.target.value) : '')} style={iStyle}>
              <option value="">Insumo a utilizar...</option>
              {insumosDisponibles.map((i: any) => (
                <option key={i.id_insumos} value={i.id_insumos}>{i.nombre} ({i.unidad_medida}) — Stock: {i.stock}</option>
              ))}
            </select>
            <input type="number" min={1} step="0.1" value={cantidadInsumo} onChange={e => setCantidadInsumo(Number(e.target.value))} style={iStyle} />
            <button type="button" onClick={handleAgregarInsumo}
              style={{ background: '#2D4B39', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Agregar</button>
          </div>
          {insumosSel.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {insumosSel.map(ins => (
                <div key={ins.id_insumo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid rgba(45,75,57,0.12)', padding: '6px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#2D4B39' }}>{ins.nombre} <span style={{ color: '#9CA3AF' }}>(Stock: {ins.stock_disponible})</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(45,75,57,0.1)', color: '#2D4B39', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>Cant: {ins.cantidad}</span>
                    <button type="button" onClick={() => setInsumosSel(prev => prev.filter(i => i.id_insumo !== ins.id_insumo))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 style={{ width: '13px', height: '13px', color: '#EF4444' }} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => { setProdManualIdx(null); setInsumosSel([]); setMotivoManual(''); }}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Volver</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleProduccionManual} disabled={loadingManual}
            style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loadingManual ? 'not-allowed' : 'pointer', opacity: loadingManual ? 0.7 : 1 }}>
            {loadingManual ? 'Creando...' : 'Crear Orden Manual y Descontar Insumos'}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(184,134,11,0.06)', borderRadius: '10px', border: '1px solid rgba(184,134,11,0.15)' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
          Pedido PED-{String(pedido.id_pedidos).padStart(4, '0')} — {pedido.cliente}
        </p>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '16px 0' }}>No se encontraron productos del pedido en el catálogo.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {items.map((item, idx) => {
            const excede = item.cantidad > item.cantidadPedido;
            const sinStock = item.stockDisponible < item.cantidad;
            return (
              <div key={item.id_producto} style={{ background: '#f9fafb', border: `1px solid ${excede ? '#FCA5A5' : 'rgba(45,75,57,0.1)'}`, padding: '10px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>{item.nombre}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Pedido: {item.cantidadPedido} | Stock: {item.stockDisponible}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="number" min={1} max={item.cantidadPedido} value={item.cantidad}
                    onChange={e => cambiarCantidad(idx, Number(e.target.value))}
                    style={{ ...iStyle, width: '80px', padding: '6px 10px' }} />
                  {sinStock && (
                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600 }}>⚠ Stock insuficiente</span>
                  )}
                  <motion.button whileHover={{ scale: 1.03 }} type="button"
                    onClick={() => { setProdManualIdx(idx); setMotivoManual(`Producción manual para PED-${String(pedido.id_pedidos).padStart(4,'0')}`); }}
                    style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(184,134,11,0.3)', background: 'rgba(184,134,11,0.08)', color: '#92400E', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    Producción Manual
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCompletar} disabled={loading}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Completando...' : 'Completar Pedido'}
      </motion.button>
    </div>
  );
}

// Modal para completar una orden manual — si viene de pedido solo confirma, si es libre selecciona productos
function CompletarOrdenManualModal({ orden, productos, onClose, onDone }: {
  orden: any; productos: any[]; onClose: () => void; onDone: () => void;
}) {
  const vieneDePedido = orden.id_productos != null;
  const [items, setItems] = useState<{ id_producto: number; cantidad: number; nombre: string }[]>(() => {
    if (vieneDePedido) {
      const prod = productos.find(p => p.id_productos === orden.id_productos);
      return prod ? [{ id_producto: orden.id_productos, cantidad: orden.cantidad || 1, nombre: prod.nombre_producto }] : [];
    }
    return [];
  });
  const [selectedProd, setSelectedProd] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const agregar = () => {
    if (!selectedProd) return toast.error('Selecciona un producto');
    if (cantidad <= 0) return toast.error('La cantidad debe ser mayor a 0');
    if (items.some(i => i.id_producto === selectedProd)) return toast.error('Ese producto ya está en la lista');
    const prod = productos.find(p => p.id_productos === selectedProd);
    if (!prod) return;
    setItems(prev => [...prev, { id_producto: selectedProd as number, cantidad, nombre: prod.nombre_producto }]);
    setSelectedProd('');
    setCantidad(1);
  };

  const quitar = (id: number) => setItems(prev => prev.filter(i => i.id_producto !== id));

  const handleCompletar = async () => {
    if (!items.length) return toast.error('Agrega al menos un producto');
    setLoading(true);
    try {
      const idReal = String(orden.id_produccion).replace('manual_', '');
      await produccionAPI.update(Number(idReal), { estado: 'completado', productos: items });
      toast.success('Orden completada y stock actualizado');
      onDone();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al completar');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(45,75,57,0.06)', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.15)' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>
          ORD-{String(orden.id_produccion).replace('manual_','').padStart(4,'0')} — {orden.producto}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Cantidad planificada: {orden.cantidad}</p>
        {orden.observaciones && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>{orden.observaciones}</p>}
      </div>

      {vieneDePedido ? (
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          Los insumos ya fueron descontados al crear esta orden. Solo confirma para sumar el producto terminado al stock.
        </p>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
            Selecciona los productos terminados que se sumarán al stock al completar esta orden.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', gap: '8px', marginBottom: '12px' }}>
            <select value={selectedProd} onChange={e => setSelectedProd(e.target.value ? Number(e.target.value) : '')} style={iStyle}>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.id_productos} value={p.id_productos}>{p.nombre_producto}</option>)}
            </select>
            <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} style={iStyle} />
            <button type="button" onClick={agregar}
              style={{ background: '#2D4B39', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              Agregar
            </button>
          </div>
        </>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {items.map(item => (
            <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid rgba(45,75,57,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{item.nombre}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(45,75,57,0.1)', color: '#2D4B39', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>x{item.cantidad}</span>
                {!vieneDePedido && (
                  <button type="button" onClick={() => quitar(item.id_producto)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X style={{ width: '13px', height: '13px', color: '#EF4444' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCompletar} disabled={loading}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Completando...' : vieneDePedido ? 'Confirmar y Sumar Stock' : 'Completar Orden y Sumar Stock'}
      </motion.button>
    </div>
  );
}

export function Produccion() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'manuales'>('pedidos');
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [pedidosEnProd, setPedidosEnProd] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pedidoParaProductos, setPedidoParaProductos] = useState<any | null>(null);
  const [ordenParaCompletar, setOrdenParaCompletar] = useState<any | null>(null);

  const cargar = async () => {
    try {
      const [prodData, pData, insuData] = await Promise.allSettled([
        produccionAPI.getAll(),
        productsAPI.getAll(),
        insumosAPI.getAll()
      ]);
      if (prodData.status === 'fulfilled') {
        setOrdenes((prodData.value.ordenes || []).map((o: any) => ({ ...o, id_produccion: o.id_global })));
        setPedidosEnProd(prodData.value.pedidos || []);
      } else toast.error('Error al cargar producción');
      if (pData.status === 'fulfilled') setProductos(pData.value.productos || []);
      else toast.error('Error al cargar productos');
      if (insuData.status === 'fulfilled') setInsumosDisponibles(insuData.value.insumos || []);
      else toast.error('Error al cargar insumos');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', o?: any) => {
    setModalType(type);
    setSelected(o || null);
    if (type === 'edit' && o) {
      setForm({
        id_productos: o.id_productos || '',
        cantidad: o.cantidad || 1,
        fecha_produccion: o.fecha_produccion ? o.fecha_produccion.split('T')[0] : '',
        motivo_uso: '',
        estado: o.estado || 'en_proceso',
        insumos: []
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.id_productos) return toast.error('El producto es obligatorio');
    if (!form.fecha_produccion) return toast.error('La fecha de producción es obligatoria');
    if (modalType === 'add' && !form.motivo_uso.trim()) return toast.error('Debes indicar para qué se usarán los insumos');
    try {
      if (modalType === 'add') {
        await produccionAPI.create({
          id_productos: form.id_productos,
          cantidad: form.cantidad,
          fecha_produccion: form.fecha_produccion,
          motivo: form.motivo_uso,
          insumos: form.insumos.map(ins => ({ id_insumo: ins.id_insumo, cantidad: ins.cantidad }))
        });
        toast.success('Orden creada e insumos descontados correctamente');
      } else if (modalType === 'edit' && selected) {
        await produccionAPI.update(selected.id_produccion, form);
        toast.success('Orden actualizada correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await produccionAPI.update(toDelete.id_produccion, { estado: 'cancelado' });
      toast.success('Orden cancelada');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al cancelar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = ordenes.filter(o =>
    String(o.id_produccion).includes(searchTerm) ||
    (o.producto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPedidos = pedidosEnProd.filter(p =>
    (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    `PED-${String(p.id_pedidos).padStart(4,'0')}`.includes(searchTerm)
  );

  const enProceso = pedidosEnProd.filter(p => p.estado === 'en_proceso').length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <Package2 style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Producción</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{pedidosEnProd.length} pedidos · {ordenes.length} órdenes manuales</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>{enProceso} en proceso</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar pedido u orden..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '280px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Orden
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#fff', padding: '6px', borderRadius: '16px', border: '1px solid rgba(45,75,57,0.08)', boxShadow: '0 2px 8px rgba(45,75,57,0.04)', width: 'fit-content' }}>
        {[
          { key: 'pedidos',   label: 'Pedidos en Producción',      icon: ShoppingBag, count: pedidosEnProd.length,  color: '#B8860B' },
          { key: 'manuales',  label: 'Órdenes Manuales',           icon: Package2,    count: ordenes.length,         color: '#2D4B39' },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab(tab.key as any); setSearchTerm(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                background: active ? (tab.key === 'pedidos' ? 'linear-gradient(135deg,#B8860B,#996515)' : 'linear-gradient(135deg,#2D4B39,#1a2f23)') : 'transparent',
                color: active ? '#fff' : '#6B7280',
                boxShadow: active ? '0 4px 12px rgba(45,75,57,0.2)' : 'none',
              }}>
              <Icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
              <span style={{
                padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                background: active ? 'rgba(255,255,255,0.25)' : 'rgba(45,75,57,0.08)',
                color: active ? '#fff' : '#6B7280',
              }}>{tab.count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* SECCIÓN 1 — PEDIDOS EN PRODUCCIÓN */}
      <AnimatePresence mode="wait">
      {activeTab === 'pedidos' && <motion.div key="pedidos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.1 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden', marginBottom: '32px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'linear-gradient(135deg,#B8860B,#996515)', color: '#fff' }}>
              <tr>
                {['PEDIDO', 'CLIENTE', 'PRODUCTOS', 'FECHA INGRESO', 'FECHA ENTREGA', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: ['ESTADO','ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPedidos.map((p, i) => {
                  const b = badge(p.estado);
                  return (
                    <motion.tr key={p.id_pedidos}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#92400E', fontSize: '13px' }}>
                        PED-{String(p.id_pedidos).padStart(4,'0')}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{p.cliente || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{p.cliente_email || ''}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#2D4B39', maxWidth: '220px' }}>
                        {p.producto || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>
                        {p.fecha_produccion ? new Date(p.fecha_produccion).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>
                        {p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString('es-CO') : <span style={{ color: '#D97706', fontStyle: 'italic', fontSize: '12px' }}>Pendiente</span>}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <motion.button whileHover={{ scale: 1.15 }} title="Ver detalle"
                            onClick={() => openModal('view', { ...p, tipo_origen: 'Pedido' })}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                          {p.estado === 'en_proceso' && (
                            <>
                              <motion.button whileHover={{ scale: 1.15 }} title="Agregar productos y completar"
                                onClick={() => setPedidoParaProductos(p)}
                                style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'rgba(5,150,105,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#065F46' }}>
                                <CheckCircle style={{ width: '14px', height: '14px' }} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} title="Cancelar producción"
                                onClick={async () => {
                                  try {
                                    await produccionAPI.cancelarPedidoProduccion(p.id_pedidos);
                                    toast.success('Pedido cancelado de producción');
                                    cargar();
                                  } catch (err: any) { toast.error(err.message); }
                                }}
                                style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>
                                <XCircle style={{ width: '14px', height: '14px' }} />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredPedidos.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No hay pedidos en producción aún. Se agregan automáticamente al aprobar un pago.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      </motion.div>}

      {/* SECCIÓN 2 — ÓRDENES MANUALES */}
      {activeTab === 'manuales' && <motion.div key="manuales" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['# ORDEN', 'PRODUCTO', 'CANTIDAD', 'FECHA PROD.', 'FECHA ENTREGA', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: ['CANTIDAD','ESTADO','ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((o, i) => {
                  const b = badge(o.estado);
                  const idNum = String(o.id_produccion).split('_')[1] || o.id_produccion;
                  return (
                    <motion.tr key={o.id_produccion}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package2 style={{ width: '13px', height: '13px', color: '#fff' }} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#2D4B39', fontSize: '13px' }}>ORD-{String(idNum).padStart(4,'0')}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{o.producto || '—'}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>{o.cantidad || 1}</td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>
                        {o.fecha_produccion ? new Date(o.fecha_produccion).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>
                        {o.fecha_entrega ? new Date(o.fecha_entrega).toLocaleDateString('es-CO') : <span style={{ color: '#D97706', fontStyle: 'italic', fontSize: '12px' }}>Al completar</span>}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', o)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                          {o.estado === 'en_proceso' && (
                            <>
                              <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', o)}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} title="Completar orden"
                                onClick={() => setOrdenParaCompletar(o)}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(5,150,105,0.1)', cursor: 'pointer' }}>
                                <CheckCircle style={{ width: '15px', height: '15px', color: '#065F46' }} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(o); setShowDeleteModal(true); }}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer' }}>
                                <XCircle style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>No hay órdenes manuales. Usa el botón "Nueva Orden" para crear una.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      </motion.div>}
      </AnimatePresence>

      {/* MODALES */}
      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nueva Orden de Producción' : modalType === 'edit' ? 'Editar Orden' : 'Detalle de Orden'}>
          <ModalContent type={modalType} orden={selected} form={form} productos={productos} insumosDisponibles={insumosDisponibles}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {pedidoParaProductos && (
        <Modal isOpen={true} onClose={() => setPedidoParaProductos(null)} title="Completar Pedido — Agregar Productos">
          <AgregarProductosPedidoModal
            pedido={pedidoParaProductos}
            productos={productos}
            insumosDisponibles={insumosDisponibles}
            onClose={() => setPedidoParaProductos(null)}
            onDone={cargar}
          />
        </Modal>
      )}

      {ordenParaCompletar && (
        <Modal isOpen={true} onClose={() => setOrdenParaCompletar(null)} title="Completar Orden Manual">
          <CompletarOrdenManualModal
            orden={ordenParaCompletar}
            productos={productos}
            onClose={() => setOrdenParaCompletar(null)}
            onDone={cargar}
          />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={`Orden ORD-${String(toDelete.id_produccion).split('_')[1] || toDelete.id_produccion}`} itemType="Orden de Producción" />
      )}
    </motion.div>
  );
}