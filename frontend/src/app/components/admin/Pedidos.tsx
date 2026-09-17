import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Search, Plus, Info, CheckCircle, Clock, XCircle, Ban, Download, Trash2, AlertTriangle, X, UploadCloud, History } from 'lucide-react';
import { Modal } from './Modal';
import { toast } from 'sonner';
import { pedidosAPI, clientesAPI, productsAPI } from '../../lib/api';
import { VerificarProduccionModal } from '../VerificarProduccionModal';
import { Tooltip } from './Tooltip';

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'nudo_studio');
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Error al subir la imagen');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    alert('No se pudo subir el comprobante de pago. Intenta de nuevo.');
    return '';
  }
};

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

type EstadoPedido = 'PAGO_POR_VERIFICAR' | 'EN_PRODUCCION' | 'RECHAZADO' | 'COMPLETADO' | 'EXCESO_PAGO' | 'DEVOLUCION_ENVIADA' | 'DEVOLUCION_CONFIRMADA';

const mapEstado = (raw: string | null): EstadoPedido => {
  if (!raw) return 'PAGO_POR_VERIFICAR';
  return raw as EstadoPedido;
};

const estadoStyle = (e: EstadoPedido) => {
  switch (e) {
    case 'EN_PRODUCCION':         return { bg: '#DBEAFE', color: '#1E40AF', icon: Clock,        texto: 'En Producción' };
    case 'COMPLETADO':            return { bg: '#D1FAE5', color: '#065F46', icon: CheckCircle,   texto: 'Completado' };
    case 'RECHAZADO':             return { bg: '#FEE2E2', color: '#991B1B', icon: XCircle,       texto: 'Pago Rechazado' };
    case 'EXCESO_PAGO':           return { bg: '#FEF3C7', color: '#92400E', icon: AlertTriangle, texto: 'Exceso de Pago' };
    case 'DEVOLUCION_ENVIADA':    return { bg: '#EDE9FE', color: '#5B21B6', icon: Download,      texto: 'Devolución Enviada' };
    case 'DEVOLUCION_CONFIRMADA': return { bg: '#D1FAE5', color: '#065F46', icon: CheckCircle,   texto: 'Devolución Confirmada' };
    default:                      return { bg: '#FEF3C7', color: '#92400E', icon: Clock,         texto: 'Pago por Verificar' };
  }
};

const MOTIVOS_RECHAZO = [
  'Monto de transferencia incorrecto',
  'Comprobante de pago falso o ya utilizado',
  'Imagen del comprobante borrosa o ilegible',
  'No se visualiza la transferencia en la cuenta bancaria',
  'Otro motivo (especificar abajo)'
];

interface ItemSeleccionado { id_catalogo: string; cantidad: number; }
interface FormState {
  id_cliente: number | ''; items: ItemSeleccionado[]; total: number;
  direccion_entrega: string; telefono: string; ciudad: string; departamento: string; comprobante_pago: string;
}
const emptyForm: FormState = { id_cliente: '', items: [], total: 0, direccion_entrega: '', telefono: '', ciudad: '', departamento: '', comprobante_pago: '' };

const formatearProductosVisual = (productosRaw: string | null): string => {
  if (!productosRaw) return '—';
  return productosRaw.split(',').map(item => {
    const trimmed = item.trim();
    const match = trimmed.match(/^(\d+)\s*x?\s*(.+)$/i);
    if (match) { const [, cantidad, nombre] = match; return `(${cantidad}) ${nombre}`; }
    return trimmed;
  }).join(', ');
};

function ViewModal({ p, onClose, onViewComprobante }: { p: any; onClose: () => void; onViewComprobante: (url: string) => void }) {
  const estado = mapEstado(p.estado);
  const s = estadoStyle(estado);
  const Icon = s.icon;
  const detalle: { nombre: string; cantidad: number; precio_unitario: number; imagen_url?: string }[] =
    Array.isArray(p.detalle) ? p.detalle.filter((d: any) => d.nombre) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D4B39' }}>Detalles del Pedido</h2>
        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose}
          style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
          <XCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* CLIENTE */}
        <div style={{ padding: '20px', background: 'rgba(45,75,57,0.05)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShoppingCart style={{ width: '24px', height: '24px', color: '#B8860B' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>INFORMACIÓN DEL CLIENTE</span>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div><label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Cliente</label><div style={{ fontSize: '15px', fontWeight: 600 }}>{p.cliente || '—'}</div></div>
            <div><label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Email</label><div style={{ fontSize: '15px', fontWeight: 600 }}>{p.cliente_email || '—'}</div></div>
            <div><label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Número de Pedido</label><div style={{ fontSize: '15px', fontWeight: 600 }}>PED-{String(p.id_pedidos).padStart(4,'0')}</div></div>
          </div>
        </div>

        {/* PRODUCTOS */}
        <div style={{ padding: '20px', background: 'rgba(184,134,11,0.05)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShoppingCart style={{ width: '24px', height: '24px', color: '#B8860B' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>PRODUCTOS DEL PEDIDO</span>
          </div>
          {detalle.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(45,75,57,0.08)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>#</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>Producto</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#2D4B39' }}>Cant.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2D4B39' }}>Precio Unit.</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(184,134,11,0.08)' }}>
                    <td style={{ padding: '8px 12px', color: '#9CA3AF' }}>{i + 1}</td>
                    <td style={{ padding: '8px 4px' }}>
                      {item.imagen_url
                        ? <img src={item.imagen_url} alt={item.nombre} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(45,75,57,0.06)' }} />
                      }
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#2D4B39' }}>{item.nombre}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#6B7280' }}>{item.cantidad}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#B8860B' }}>
                      ${Number(item.precio_unitario).toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: '13px', color: '#6B7280' }}>{formatearProductosVisual(p.producto)}</div>
          )}
          {p.direccion_entrega && (() => {
            const raw = p.direccion_entrega;
            const sinTel = raw.split('|')[0].trim();
            const sinCol = sinTel.replace(/\s*\(Colombia\)\s*$/, '');
            const partes = sinCol.split(',').map((s: string) => s.trim());
            const depto  = partes.length >= 2 ? partes[partes.length - 1] : '';
            const ciudad = partes.length >= 3 ? partes[partes.length - 2] : '';
            const dir    = partes.slice(0, partes.length >= 3 ? partes.length - 2 : partes.length - 1).join(', ');
            const telMatch = raw.match(/Tel:\s*([^|]+)/);
            const nomMatch = raw.match(/Nombre:\s*([^|]+)/);
            const telStr = telMatch ? telMatch[1].trim() : (p.cliente_telefono || '');
            return (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2D4B39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📦 Dirección de Envío</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {dir && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px', gridColumn: '1 / -1' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DIRECCIÓN</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{dir}</div></div>}
                  {ciudad && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>CIUDAD</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{ciudad}</div></div>}
                  {depto && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DEPARTAMENTO</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{depto}</div></div>}
                  {telStr && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>TELÉFONO ENVÍO</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{telStr}</div></div>}
                  {nomMatch && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DESTINATARIO</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{nomMatch[1].trim()}</div></div>}
                  {p.detalles_adicionales && <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px', gridColumn: '1 / -1' }}><div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DETALLES ADICIONALES</div><div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{p.detalles_adicionales}</div></div>}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ESTADO Y PAGO */}
        <div style={{ padding: '20px', background: 'rgba(16,185,129,0.05)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShoppingCart style={{ width: '24px', height: '24px', color: '#10B981' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>ESTADO Y PAGO</span>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Estado del Pedido</label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: s.bg }}>
                <Icon style={{ width: '13px', height: '13px', color: s.color }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.texto}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Fecha</label>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Total General</label>
              <div style={{ fontSize: '18px', color: '#2D4B39', fontWeight: 700 }}>${Number(p.total).toLocaleString('es-CO')} COP</div>
            </div>
          </div>
        </div>

        {/* HISTORIAL DE COMPROBANTES */}
        {Array.isArray(p.comprobantes) && p.comprobantes.length > 0 && (
          <div style={{ padding: '20px', background: 'rgba(45,75,57,0.03)', borderRadius: '16px', border: '1px solid rgba(45,75,57,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <History style={{ width: '18px', height: '18px', color: '#B8860B' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>HISTORIAL DE COMPROBANTES ({p.comprobantes.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {p.comprobantes.map((c: any, idx: number) => {
                const esRechazado = c.estado === 'RECHAZADO';
                const esAprobado  = c.estado === 'APROBADO';
                return (
                  <div key={c.id_comprobante} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '10px',
                    background: esRechazado ? 'rgba(239,68,68,0.04)' : esAprobado ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)',
                    border: `1px solid ${esRechazado ? 'rgba(239,68,68,0.15)' : esAprobado ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', minWidth: '22px', paddingTop: '2px' }}>#{idx + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                          background: esRechazado ? 'rgba(239,68,68,0.1)' : esAprobado ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: esRechazado ? '#DC2626' : esAprobado ? '#059669' : '#B45309' }}>
                          {c.estado === 'PAGO_POR_VERIFICAR' ? 'POR VERIFICAR' : c.estado}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {new Date(c.fecha_subida).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {esRechazado && c.motivo_rechazo && (
                        <p style={{ fontSize: '12px', color: '#DC2626', margin: '3px 0 0', fontStyle: 'italic' }}>Motivo: {c.motivo_rechazo}</p>
                      )}
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => onViewComprobante(c.url)}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#2D4B39', cursor: 'pointer', flexShrink: 0 }}>
                      Ver
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEVOLUCIÓN */}
        {p.devolucion && (
          <div style={{ padding: '20px', background: 'rgba(91,33,182,0.04)', borderRadius: '16px', border: '1px solid rgba(91,33,182,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Download style={{ width: '18px', height: '18px', color: '#5B21B6' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>DEVOLUCIÓN DE EXCEDENTE</span>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {p.devolucion.monto_exceso && (
                <div>
                  <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Monto devuelto</label>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#5B21B6' }}>${Number(p.devolucion.monto_exceso).toLocaleString('es-CO')} COP</div>
                </div>
              )}
              <div>
                <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '3px' }}>Fecha de registro</label>
                <div style={{ fontSize: '13px', color: '#374151' }}>{new Date(p.devolucion.creado_en).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              {p.devolucion.confirmado_en && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                    ✓ Cliente confirmó la recepción el {new Date(p.devolucion.confirmado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => onViewComprobante(p.devolucion.comprobante_devolucion)}
                style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(91,33,182,0.2)', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#5B21B6', cursor: 'pointer' }}>
                Ver comprobante de devolución
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormModal({ form, onChange, onSubmit, clientes, type }: {
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; clientes: any[]; type: 'add' | 'edit';
}) {
  const [selectedProd, setSelectedProd] = useState('');
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);

  useEffect(() => {
    productsAPI.getAll().then(data => setCatalogoProductos(data.productos || [])).catch(() => {});
  }, []);

  const agregarProducto = () => {
    if (!selectedProd) return;
    const existe = form.items.find(item => item.id_catalogo === selectedProd);
    let nuevosItems;
    if (existe) {
      nuevosItems = form.items.map(item => item.id_catalogo === selectedProd ? { ...item, cantidad: item.cantidad + 1 } : item);
    } else {
      nuevosItems = [...form.items, { id_catalogo: selectedProd, cantidad: 1 }];
    }
    actualizarItemsYTotal(nuevosItems);
    setSelectedProd('');
  };

  const eliminarProducto = (id_catalogo: string) => actualizarItemsYTotal(form.items.filter(item => item.id_catalogo !== id_catalogo));

  const cambiarCantidad = (id_catalogo: string, c: number) => {
    if (c <= 0) return eliminarProducto(id_catalogo);
    actualizarItemsYTotal(form.items.map(item => item.id_catalogo === id_catalogo ? { ...item, cantidad: c } : item));
  };

  const actualizarItemsYTotal = (items: ItemSeleccionado[]) => {
    const totalCalculado = items.reduce((acc, item) => {
      const prod = catalogoProductos.find(p => String(p.id_productos) === item.id_catalogo);
      return acc + (prod ? Number(prod.precio) * item.cantidad : 0);
    }, 0);
    onChange('items', items);
    onChange('total', totalCalculado);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={lStyle}>Cliente *</label>
        <select value={form.id_cliente} onChange={e => onChange('id_cliente', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c: any) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_completo}</option>)}
        </select>
      </div>
      <div>
        <label style={lStyle}>Teléfono *</label>
        <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="300 123 4567" style={iStyle} />
      </div>
      <div>
        <label style={lStyle}>Dirección *</label>
        <input type="text" value={form.direccion_entrega} onChange={e => onChange('direccion_entrega', e.target.value)} placeholder="Calle 45 #12-30" style={iStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lStyle}>Ciudad *</label>
          <input type="text" value={form.ciudad} onChange={e => onChange('ciudad', e.target.value)} placeholder="Bogotá" style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Departamento *</label>
          <input type="text" value={form.departamento} onChange={e => onChange('departamento', e.target.value)} placeholder="Cundinamarca" style={iStyle} />
        </div>
      </div>
      <div style={{ background: 'rgba(45,75,57,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(45,75,57,0.08)' }}>
        <label style={lStyle}>Seleccionar Productos *</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select value={selectedProd} onChange={e => setSelectedProd(e.target.value)} style={{ ...iStyle, flex: 1 }}>
            <option value="">Buscar producto en catálogo...</option>
            {catalogoProductos.map(prod => (
              <option key={prod.id_productos} value={String(prod.id_productos)}>
                {prod.nombre_producto} - ${Number(prod.precio).toLocaleString()} COP
              </option>
            ))}
          </select>
          <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={agregarProducto}
            style={{ padding: '0 16px', borderRadius: '10px', background: '#2D4B39', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Añadir
          </motion.button>
        </div>
        {form.items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.items.map(item => {
              const prod = catalogoProductos.find(p => String(p.id_productos) === item.id_catalogo);
              if (!prod) return null;
              return (
                <div key={item.id_catalogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.1)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{prod.nombre_producto}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad - 1)} style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad + 1)} style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>${(Number(prod.precio) * item.cantidad).toLocaleString()}</span>
                    <button type="button" onClick={() => eliminarProducto(item.id_catalogo)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '12px' }}>Ningún producto seleccionado</div>
        )}
      </div>
      <div>
        <label style={lStyle}>Total Calculado</label>
        <div style={{ ...iStyle, background: 'rgba(0,0,0,0.03)', fontWeight: 700, color: '#2D4B39', display: 'flex', alignItems: 'center' }}>
          ${form.total.toLocaleString()} COP
        </div>
      </div>
      <div>
        <label style={lStyle}>Comprobante de Pago</label>
        <input type="file" accept="image/*,application/pdf" style={{ ...iStyle, padding: '8px' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) { const url = await uploadToCloudinary(file); if (url) onChange('comprobante_pago', url); }
          }}
        />
        {form.comprobante_pago && (
          <img src={form.comprobante_pago} alt="Vista previa" style={{ marginTop: '8px', maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', border: '2px solid #2D4B39', objectFit: 'cover' }} />
        )}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        Crear Pedido
      </motion.button>
    </div>
  );
}

function FormModal({ form, onChange, onSubmit, clientes, type }: {
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; clientes: any[]; type: 'add' | 'edit';
}) {
  const [selectedProd, setSelectedProd] = useState('');
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);

  useEffect(() => {
    productsAPI.getAll().then(data => setCatalogoProductos(data.productos || [])).catch(() => {});
  }, []);

  const agregarProducto = () => {
    if (!selectedProd) return;
    const existe = form.items.find(item => item.id_catalogo === selectedProd);
    const nuevosItems = existe
      ? form.items.map(item => item.id_catalogo === selectedProd ? { ...item, cantidad: item.cantidad + 1 } : item)
      : [...form.items, { id_catalogo: selectedProd, cantidad: 1 }];
    actualizarItemsYTotal(nuevosItems);
    setSelectedProd('');
  };

  const eliminarProducto = (id_catalogo: string) => actualizarItemsYTotal(form.items.filter(item => item.id_catalogo !== id_catalogo));

  const cambiarCantidad = (id_catalogo: string, c: number) => {
    if (c <= 0) return eliminarProducto(id_catalogo);
    actualizarItemsYTotal(form.items.map(item => item.id_catalogo === id_catalogo ? { ...item, cantidad: c } : item));
  };

  const actualizarItemsYTotal = (items: ItemSeleccionado[]) => {
    const totalCalculado = items.reduce((acc, item) => {
      const prod = catalogoProductos.find(p => String(p.id_productos) === item.id_catalogo);
      return acc + (prod ? Number(prod.precio) * item.cantidad : 0);
    }, 0);
    onChange('items', items);
    onChange('total', totalCalculado);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={lStyle}>Cliente *</label>
        <select value={form.id_cliente} onChange={e => onChange('id_cliente', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c: any) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_completo}</option>)}
        </select>
      </div>
      <div>
        <label style={lStyle}>Teléfono *</label>
        <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="300 123 4567" style={iStyle} />
      </div>
      <div>
        <label style={lStyle}>Dirección *</label>
        <input type="text" value={form.direccion_entrega} onChange={e => onChange('direccion_entrega', e.target.value)} placeholder="Calle 45 #12-30" style={iStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div><label style={lStyle}>Ciudad *</label><input type="text" value={form.ciudad} onChange={e => onChange('ciudad', e.target.value)} placeholder="Bogotá" style={iStyle} /></div>
        <div><label style={lStyle}>Departamento *</label><input type="text" value={form.departamento} onChange={e => onChange('departamento', e.target.value)} placeholder="Cundinamarca" style={iStyle} /></div>
      </div>
      <div style={{ background: 'rgba(45,75,57,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(45,75,57,0.08)' }}>
        <label style={lStyle}>Seleccionar Productos *</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select value={selectedProd} onChange={e => setSelectedProd(e.target.value)} style={{ ...iStyle, flex: 1 }}>
            <option value="">Buscar producto en catálogo...</option>
            {catalogoProductos.map(prod => (
              <option key={prod.id_productos} value={String(prod.id_productos)}>{prod.nombre_producto} - ${Number(prod.precio).toLocaleString()} COP</option>
            ))}
          </select>
          <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={agregarProducto}
            style={{ padding: '0 16px', borderRadius: '10px', background: '#2D4B39', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Añadir
          </motion.button>
        </div>
        {form.items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.items.map(item => {
              const prod = catalogoProductos.find(p => String(p.id_productos) === item.id_catalogo);
              if (!prod) return null;
              return (
                <div key={item.id_catalogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.1)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{prod.nombre_producto}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad - 1)} style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad + 1)} style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>${(Number(prod.precio) * item.cantidad).toLocaleString()}</span>
                    <button type="button" onClick={() => eliminarProducto(item.id_catalogo)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '12px' }}>Ningún producto seleccionado</div>
        )}
      </div>
      <div>
        <label style={lStyle}>Total Calculado</label>
        <div style={{ ...iStyle, background: 'rgba(0,0,0,0.03)', fontWeight: 700, color: '#2D4B39', display: 'flex', alignItems: 'center' }}>${form.total.toLocaleString()} COP</div>
      </div>
      <div>
        <label style={lStyle}>Comprobante de Pago</label>
        <input type="file" accept="image/*,application/pdf" style={{ ...iStyle, padding: '8px' }}
          onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const url = await uploadToCloudinary(file); if (url) onChange('comprobante_pago', url); } }} />
        {form.comprobante_pago && <img src={form.comprobante_pago} alt="Vista previa" style={{ marginTop: '8px', maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', border: '2px solid #2D4B39', objectFit: 'cover' }} />}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        Crear Pedido
      </motion.button>
    </div>
  );
}

export function Pedidos() {
  const [verificarId, setVerificarId] = useState<number | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toCancel, setToCancel] = useState<any | null>(null);
  const [modalAccion, setModalAccion] = useState<'rechazar' | 'exceso'>('rechazar');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('Monto de transferencia incorrecto');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [montoExceso, setMontoExceso] = useState('');
  const [notaExceso, setNotaExceso] = useState('');
  const [compDevolucion, setCompDevolucion] = useState<string | null>(null);
  const [uploadingComp, setUploadingComp] = useState(false);
  const [showComprobante, setShowComprobante] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm, items: [] });

  // Modal registrar devolución (para EXCESO_PAGO)
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPedido, setDevPedido] = useState<any | null>(null);
  const [devMonto, setDevMonto] = useState('');
  const [devNota, setDevNota] = useState('');
  const [devComp, setDevComp] = useState<string | null>(null);
  const [uploadingDev, setUploadingDev] = useState(false);

  const abrirModalAccion = (p: any) => {
    setToCancel(p);
    setModalAccion('rechazar');
    setMotivoSeleccionado('Monto de transferencia incorrecto');
    setMotivoCancelacion('');
    setMontoExceso('');
    setNotaExceso('');
    setCompDevolucion(null);
    setShowDeleteModal(true);
  };

  const handleUploadCompDevolucion = async (file: File) => {
    setUploadingComp(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'nudo_studio');
      const res = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompDevolucion(data.secure_url);
      toast.success('Comprobante subido');
    } catch { toast.error('No se pudo subir el comprobante'); }
    finally { setUploadingComp(false); }
  };

  const handleUploadDevComp = async (file: File) => {
    setUploadingDev(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'nudo_studio');
      const res = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDevComp(data.secure_url);
      toast.success('Comprobante subido');
    } catch { toast.error('No se pudo subir el comprobante'); }
    finally { setUploadingDev(false); }
  };

  const cargar = async () => {
    try {
      const [pData, cData] = await Promise.all([pedidosAPI.getAll(), clientesAPI.getAll()]);
      setPedidos(pData.pedidos);
      setClientes(cData.clientes.filter((c: any) => c.id_cliente));
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar pedidos');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (type: 'view' | 'add', p?: any) => {
    setModalType(type);
    setSelected(p || null);
    if (type === 'add') setForm({ ...emptyForm, items: [] });
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (form.items.length === 0) return toast.error('Debes seleccionar al menos un producto');
    if (!form.id_cliente) return toast.error('El cliente es obligatorio');
    if (!form.direccion_entrega) return toast.error('La dirección de entrega es obligatoria');
    if (!form.ciudad) return toast.error('La ciudad es obligatoria');
    if (!form.departamento) return toast.error('El departamento es obligatorio');
    const productosMapeados = form.items.map(item => ({ id_producto: Number(item.id_catalogo), cantidad: item.cantidad, precio_unitario: 0 }));
    const direccionCompleta = `${form.direccion_entrega}, ${form.ciudad}, ${form.departamento} (Colombia)${form.telefono ? ` | Tel: ${form.telefono}` : ''}`;
    try {
      await pedidosAPI.create({ id_cliente: form.id_cliente, productos: productosMapeados, total: form.total, direccion_entrega: direccionCompleta, comprobante_pago: form.comprobante_pago || null });
      toast.success('Pedido creado correctamente');
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const handleConfirmar = async (p: any) => {
    try {
      await pedidosAPI.updateEstado(p.id_pedidos, { estado: 'EN_PRODUCCION' });
      toast.success('Pedido aprobado — en producción');
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCancelar = async () => {
    if (!toCancel) return;
    if (modalAccion === 'rechazar') {
      let motivoFinal = motivoSeleccionado;
      if (motivoSeleccionado.startsWith('Otro motivo')) motivoFinal = motivoCancelacion.trim() || 'El comprobante de pago adjunto no es válido.';
      try {
        await pedidosAPI.cancelar(toCancel.id_pedidos, motivoFinal);
        toast.success('Pago rechazado y notificado al cliente');
        cargar();
      } catch (err: any) { toast.error(err.message || 'Error al procesar el rechazo'); return; }
    } else {
      try {
        await pedidosAPI.marcarExceso(toCancel.id_pedidos, { monto_exceso: montoExceso ? Number(montoExceso) : undefined, nota: notaExceso || undefined });
        toast.success('Marcado como exceso de pago, cliente notificado');
        cargar();
      } catch (err: any) { toast.error(err.message || 'Error al marcar exceso'); return; }
    }
    setShowDeleteModal(false);
    setToCancel(null);
  };

  const handleRegistrarDevolucion = async () => {
    if (!devPedido || !devComp) return toast.error('El comprobante de devolución es obligatorio');
    try {
      await pedidosAPI.registrarDevolucionPedido(devPedido.id_pedidos, { comprobante_devolucion: devComp, monto_exceso: devMonto ? Number(devMonto) : undefined, nota: devNota || undefined });
      toast.success('Devolución registrada. Esperando confirmación del cliente.');
      setShowDevModal(false);
      setDevPedido(null); setDevMonto(''); setDevNota(''); setDevComp(null);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al registrar devolución'); }
  };

  const handleAprobarDevolucion = async (p: any) => {
    try {
      await pedidosAPI.aprobarTrasDevolucionPedido(p.id_pedidos);
      toast.success('Pedido aprobado y enviado a producción');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al aprobar'); }
  };

  const filtered = pedidos.filter(p =>
    (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    `PED-${String(p.id_pedidos).padStart(4, '0')}`.includes(searchTerm)
  );

  const pendientes = pedidos.filter(p => p.estado === 'PAGO_POR_VERIFICAR' || p.estado === null).length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <ShoppingCart style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Gestión de Pedidos</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{pedidos.length} pedidos registrados</span>
                {pendientes > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>{pendientes} pendientes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar pedidos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Pedido
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando pedidos...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['PEDIDO', 'FECHA', 'PRODUCTOS', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 24px', textAlign: ['PRODUCTOS','TOTAL','ESTADO','ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((p, i) => {
                  const estado = mapEstado(p.estado);
                  const s = estadoStyle(estado);
                  const Icon = s.icon;
                  const isPorVerificar = estado === 'PAGO_POR_VERIFICAR';
                  const isExceso = estado === 'EXCESO_PAGO';
                  const isDevEnviada = estado === 'DEVOLUCION_ENVIADA';
                  const isDevConfirmada = estado === 'DEVOLUCION_CONFIRMADA';

                  return (
                    <motion.tr key={p.id_pedidos}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(45,75,57,0.02)' }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.08)' }}>
                      <td style={{ padding: '20px 24px', color: '#2D4B39', fontWeight: 600 }}>PED-{String(p.id_pedidos).padStart(4,'0')}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: '13px', color: '#2D4B39', fontWeight: 600 }}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '—'}</div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
                          {Array.isArray(p.detalle) && p.detalle.length > 0
                            ? `${p.detalle.reduce((s: number, d: any) => s + (d.cantidad || 0), 0)} producto${p.detalle.reduce((s: number, d: any) => s + (d.cantidad || 0), 0) !== 1 ? 's' : ''}`
                            : p.cantidad ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#B8860B' }}>${Number(p.total).toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 600 }}>
                          <Icon style={{ width: '14px', height: '14px' }} />{s.texto}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Tooltip text="Ver detalles">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('view', p)}
                              style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                              <Info style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                            </motion.button>
                          </Tooltip>

                          {estado === 'EN_PRODUCCION' && (
                            <Tooltip text="Marcar como completado">
                              <motion.button whileHover={{ scale: 1.15 }}
                                onClick={async () => { try { await pedidosAPI.updateEstado(p.id_pedidos, { estado: 'COMPLETADO' }); toast.success('Pedido marcado como completado'); cargar(); } catch (err: any) { toast.error(err.message); } }}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <CheckCircle style={{ width: '15px', height: '15px', color: '#2D4B39' }} />
                              </motion.button>
                            </Tooltip>
                          )}

                          {p.comprobante_pago && (
                            <Tooltip text="Ver comprobante">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setShowComprobante(p.comprobante_pago)}
                                style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <Download style={{ width: '16px', height: '16px', color: '#B8860B' }} />
                              </motion.button>
                            </Tooltip>
                          )}

                          {isPorVerificar && (
                            <>
                              <Tooltip text="Aprobar pago — iniciar producción">
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleConfirmar(p)}
                                  style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                  <CheckCircle style={{ width: '16px', height: '16px', color: '#10B981' }} />
                                </motion.button>
                              </Tooltip>
                              <Tooltip text="Rechazar pago / Exceso">
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => abrirModalAccion(p)}
                                  style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                  <Ban style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                                </motion.button>
                              </Tooltip>
                            </>
                          )}

                          {isExceso && (
                            <Tooltip text="Registrar devolución">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setDevPedido(p); setDevMonto(''); setDevNota(''); setDevComp(null); setShowDevModal(true); }}
                                style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <UploadCloud style={{ width: '16px', height: '16px', color: '#5B21B6' }} />
                              </motion.button>
                            </Tooltip>
                          )}

                          {isDevEnviada && (
                            <Tooltip text="Esperando confirmación del cliente">
                              <span style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#5B21B6', background: 'rgba(91,33,182,0.08)' }}>Esperando</span>
                            </Tooltip>
                          )}

                          {isDevConfirmada && (
                            <Tooltip text="Aprobar y enviar a producción">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleAprobarDevolucion(p)}
                                style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <CheckCircle style={{ width: '16px', height: '16px', color: '#10B981' }} />
                              </motion.button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
                  {pedidos.length === 0 ? 'No hay pedidos registrados aún' : 'No se encontraron pedidos'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* MODAL VER */}
      {modalType === 'view' && selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(45,75,57,0.4)' }}>
            <ViewModal p={selected} onClose={closeModal} onViewComprobante={setShowComprobante} />
          </motion.div>
        </motion.div>
      )}

      {/* MODAL AGREGAR */}
      {modalType === 'add' && (
        <Modal isOpen={true} onClose={closeModal} title="Nuevo Pedido">
          <FormModal form={form} onChange={(f, v) => setForm(prev => ({ ...prev, [f]: v }))} onSubmit={handleSubmit} clientes={clientes} type="add" />
        </Modal>
      )}

      {/* MODAL RECHAZAR / EXCESO */}
      <AnimatePresence>
        {showDeleteModal && toCancel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#991B1B', margin: 0 }}>Revisar Comprobante</h2>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>PED-{String(toCancel.id_pedidos).padStart(4,'0')} · Se notificará al cliente por correo</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowDeleteModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', flexShrink: 0 }}>
                  <X style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                </motion.button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalAccion('rechazar')}
                  style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${modalAccion === 'rechazar' ? '#EF4444' : 'rgba(239,68,68,0.15)'}`, background: modalAccion === 'rechazar' ? 'rgba(239,68,68,0.06)' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                  <XCircle style={{ width: '18px', height: '18px', color: '#EF4444', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>Rechazar</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Comprobante inválido</div>
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalAccion('exceso')}
                  style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${modalAccion === 'exceso' ? '#B45309' : 'rgba(245,158,11,0.2)'}`, background: modalAccion === 'exceso' ? 'rgba(245,158,11,0.06)' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                  <Download style={{ width: '18px', height: '18px', color: '#B45309', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#B45309' }}>Exceso de pago</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Pagó más de lo debido</div>
                </motion.button>
              </div>
              <AnimatePresence mode="wait">
                {modalAccion === 'rechazar' ? (
                  <motion.div key="rechazar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selecciona el motivo *</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {MOTIVOS_RECHAZO.map(motivo => (
                        <motion.button key={motivo} whileTap={{ scale: 0.98 }} onClick={() => setMotivoSeleccionado(motivo)}
                          style={{ padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#EF4444' : 'rgba(239,68,68,0.15)'}`, background: motivoSeleccionado === motivo ? 'rgba(239,68,68,0.06)' : '#fff', color: motivoSeleccionado === motivo ? '#991B1B' : '#4B5563', fontSize: '13px', fontWeight: motivoSeleccionado === motivo ? 600 : 400, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${motivoSeleccionado === motivo ? '#EF4444' : '#D1D5DB'}`, background: motivoSeleccionado === motivo ? '#EF4444' : 'transparent', display: 'inline-block' }} />
                          {motivo}
                        </motion.button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {motivoSeleccionado === 'Otro motivo (especificar abajo)' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '16px' }}>
                          <textarea value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} placeholder="Describe el motivo..." rows={3}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,0.3)', fontSize: '13px', outline: 'none', resize: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#374151' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div key="exceso" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                        El cliente pagó <strong>más de lo que debía</strong>. Se marcará el pedido como exceso. Luego podrás registrar la devolución desde la tabla.
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>MONTO EXCEDENTE (opcional)</label>
                        <input type="number" placeholder="Ej: 5000" value={montoExceso} onChange={e => setMontoExceso(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid rgba(245,158,11,0.3)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>NOTA INTERNA (opcional)</label>
                        <input type="text" placeholder="Observación..." value={notaExceso} onChange={e => setNotaExceso(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid rgba(245,158,11,0.3)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowDeleteModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(107,114,128,0.25)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCancelar}
                  disabled={modalAccion === 'rechazar' && !motivoSeleccionado.trim()}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: modalAccion === 'rechazar' ? (motivoSeleccionado.trim() ? '#EF4444' : '#9CA3AF') : '#B45309', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: (modalAccion === 'rechazar' && !motivoSeleccionado.trim()) ? 'not-allowed' : 'pointer' }}>
                  {modalAccion === 'rechazar' ? 'Confirmar Rechazo' : 'Confirmar Exceso'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL REGISTRAR DEVOLUCIÓN */}
      <AnimatePresence>
        {showDevModal && devPedido && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowDevModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#5B21B6', margin: 0 }}>Registrar Devolución</h2>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>PED-{String(devPedido.id_pedidos).padStart(4,'0')}</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowDevModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(91,33,182,0.08)', cursor: 'pointer' }}>
                  <X style={{ width: '16px', height: '16px', color: '#5B21B6' }} />
                </motion.button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>MONTO DEVUELTO (opcional)</label>
                  <input type="number" placeholder="Ej: 20000" value={devMonto} onChange={e => setDevMonto(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(91,33,182,0.2)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>NOTA (opcional)</label>
                  <input type="text" placeholder="Observación..." value={devNota} onChange={e => setDevNota(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(91,33,182,0.2)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>COMPROBANTE DE DEVOLUCIÓN *</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: `1.5px dashed ${devComp ? '#10B981' : 'rgba(91,33,182,0.3)'}`, background: devComp ? 'rgba(16,185,129,0.04)' : '#fff', cursor: 'pointer', fontSize: '13px', color: devComp ? '#059669' : '#6B7280' }}>
                    <UploadCloud style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    {uploadingDev ? 'Subiendo...' : devComp ? '✓ Comprobante subido' : 'Subir comprobante de devolución'}
                    <input type="file" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDevComp(f); }} disabled={uploadingDev} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowDevModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(107,114,128,0.25)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRegistrarDevolucion}
                  disabled={!devComp || uploadingDev}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: devComp ? '#5B21B6' : '#9CA3AF', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: devComp ? 'pointer' : 'not-allowed' }}>
                  Enviar Devolución
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL COMPROBANTE */}
      {showComprobante && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowComprobante(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Comprobante</h3>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowComprobante(null)}
                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                <XCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
              </motion.button>
            </div>
            {showComprobante.toLowerCase().endsWith('.pdf') || showComprobante.toLowerCase().startsWith('data:application/pdf') ? (
              <iframe src={showComprobante} style={{ width: '100%', height: '70vh', borderRadius: '12px', border: 'none' }} title="Comprobante PDF" />
            ) : (
              <img src={showComprobante} alt="Comprobante" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />
            )}
          </motion.div>
        </motion.div>
      )}

      <VerificarProduccionModal isOpen={verificarId !== null} onClose={() => setVerificarId(null)} idPedido={verificarId || 0} onAprobado={cargar} />

    </motion.div>
  );
}
