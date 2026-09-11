import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Search, Plus, Info, CheckCircle, Clock, XCircle, Ban, Download, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { toast } from 'sonner';
import { pedidosAPI, clientesAPI, productsAPI } from '../../lib/api';
import { VerificarProduccionModal } from '../VerificarProduccionModal';
import { Tooltip } from './Tooltip';

const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = "ddcx9ks5g"; 
  const uploadPreset = "nudo_studio"; 

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Error al subir la imagen");
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error Cloudinary:", error);
    alert("No se pudo subir el comprobante de pago. Intenta de nuevo.");
    return "";
  }
};

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

type EstadoPedido = 'PAGO_POR_VERIFICAR' | 'EN_PRODUCCION' | 'RECHAZADO' | 'COMPLETADO';

const mapEstado = (raw: string | null): EstadoPedido => {
  if (!raw) return 'PAGO_POR_VERIFICAR';
  return raw as EstadoPedido;
};

const estadoStyle = (e: EstadoPedido) => {
  switch (e) {
    case 'EN_PRODUCCION': 
      return { bg: '#DBEAFE', color: '#1E40AF', icon: Clock, texto: 'En Producción' };
    case 'COMPLETADO':  
      return { bg: '#D1FAE5', color: '#065F46', icon: CheckCircle, texto: 'Completado' };
    case 'RECHAZADO':  
      return { bg: '#FEE2E2', color: '#991B1B', icon: XCircle, texto: 'Pago Rechazado' };
    default: 
      return { bg: '#FEF3C7', color: '#92400E', icon: Clock, texto: 'Pago por Verificar' };
  }
};

// MOTIVOS PREDEFINIDOS DE RECHAZO
const MOTIVOS_RECHAZO = [
  'Monto de transferencia incorrecto',
  'Comprobante de pago falso o ya utilizado',
  'Imagen del comprobante borrosa o ilegible',
  'No se visualiza la transferencia en la cuenta bancaria',
  'Otro motivo (especificar abajo)'
];

interface ItemSeleccionado {
  id_catalogo: string;
  cantidad: number;
}

interface FormState {
  id_cliente: number | '';
  items: ItemSeleccionado[];
  total: number;
  direccion_entrega: string;
  telefono: string;
  ciudad: string;
  departamento: string;
  comprobante_pago: string; 
}

const emptyForm: FormState = { 
  id_cliente: '', 
  items: [], 
  total: 0, 
  direccion_entrega: '',
  telefono: '',
  ciudad: '',
  departamento: '',
  comprobante_pago: ''
};

const formatearProductosVisual = (productosRaw: string | null): string => {
  if (!productosRaw) return '—';
  return productosRaw.split(',').map(item => {
    const trimmed = item.trim();
    const match = trimmed.match(/^(\d+)\s*x?\s*(.+)$/i); 
    if (match) {
      const [, cantidad, nombre] = match;
      return `(${cantidad}) ${nombre}`;
    }
    return trimmed;
  }).join(', ');
};

function ViewModal({ p, onClose }: { p: any; onClose: () => void }) {
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
        {/* BLOQUE CLIENTE */}
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

        {/* TABLA DE PRODUCTOS */}
        <div style={{ padding: '20px', background: 'rgba(184,134,11,0.05)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ShoppingCart style={{ width: '24px', height: '24px', color: '#B8860B' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39' }}>PRODUCTOS DEL PEDIDO</span>
          </div>
          {detalle.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(45,75,57,0.08)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39', borderRadius: '6px 0 0 6px' }}>#</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>Producto</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#2D4B39' }}>Cant.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2D4B39', borderRadius: '0 6px 6px 0' }}>Precio Unit.</th>
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
            // El formato es: "Dirección, Ciudad, Departamento (Colombia) | Tel: xxx | Nombre: yyy"
            // o desde el carrito: "Dirección, Ciudad, Departamento (Colombia)"
            const raw = p.direccion_entrega;
            const sinTel  = raw.split('|')[0].trim();               // "Calle 45 #12-30, Bogotá, Cundinamarca (Colombia)"
            const sinCol  = sinTel.replace(/\s*\(Colombia\)\s*$/, ''); // "Calle 45 #12-30, Bogotá, Cundinamarca"
            const partes  = sinCol.split(',').map((s: string) => s.trim());
            const depto   = partes.length >= 2 ? partes[partes.length - 1] : '';
            const ciudad  = partes.length >= 3 ? partes[partes.length - 2] : '';
            const dir     = partes.slice(0, partes.length >= 3 ? partes.length - 2 : partes.length - 1).join(', ');
            // Telefono y nombre del campo descripcion o desde el | de direccion
            const telMatch = raw.match(/Tel:\s*([^|]+)/);
            const nomMatch = raw.match(/Nombre:\s*([^|]+)/);
            const telStr  = telMatch ? telMatch[1].trim() : (p.cliente_telefono || '');
            return (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2D4B39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📦 Dirección de Envío
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {dir && (
                    <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DIRECCIÓN</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{dir}</div>
                    </div>
                  )}
                  {ciudad && (
                    <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>CIUDAD</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{ciudad}</div>
                    </div>
                  )}
                  {depto && (
                    <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DEPARTAMENTO</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{depto}</div>
                    </div>
                  )}
                  {telStr && (
                    <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>TELÉFONO ENVÍO</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{telStr}</div>
                    </div>
                  )}
                  {nomMatch && (
                    <div style={{ padding: '10px 14px', background: 'rgba(45,75,57,0.04)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: '3px' }}>DESTINATARIO</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{nomMatch[1].trim()}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* BLOQUE ESTADO Y PAGO */}
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
            {p.comprobante_pago && (
              <div>
                <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>Comprobante de Pago</label>
                {p.comprobante_pago.toLowerCase().endsWith('.pdf') ? (
                  <a href={p.comprobante_pago} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.25)', color: '#B8860B', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                    <Download style={{ width: '15px', height: '15px' }} /> Ver PDF
                  </a>
                ) : (
                  <img src={p.comprobante_pago} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.1)' }} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormModal({ form, onChange, onSubmit, clientes, type }: {
  form: FormState; 
  onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void;
  clientes: any[];
  type: 'add' | 'edit';
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
      nuevosItems = form.items.map(item => 
        item.id_catalogo === selectedProd ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    } else {
      nuevosItems = [...form.items, { id_catalogo: selectedProd, cantidad: 1 }];
    }
    actualizarItemsYTotal(nuevosItems);
    setSelectedProd('');
  };

  const eliminarProducto = (id_catalogo: string) => {
    actualizarItemsYTotal(form.items.filter(item => item.id_catalogo !== id_catalogo));
  };

  const cambiarCantidad = (id_catalogo: string, c: number) => {
    if (c <= 0) return eliminarProducto(id_catalogo);
    actualizarItemsYTotal(form.items.map(item => 
      item.id_catalogo === id_catalogo ? { ...item, cantidad: c } : item
    ));
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
      {/* CLIENTE */}
      <div>
        <label style={lStyle}>Cliente *</label>
        <select value={form.id_cliente} onChange={e => onChange('id_cliente', e.target.value ? Number(e.target.value) : '')} style={iStyle}>
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c: any) => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_completo}</option>)}
        </select>
      </div>

      {/* TELÉFONO */}
      <div>
        <label style={lStyle}>Teléfono *</label>
        <input type="tel" value={form.telefono} onChange={e => onChange('telefono', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="300 123 4567" style={iStyle} />
      </div>

      {/* DIRECCIÓN, CIUDAD, DEPARTAMENTO */}
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

      {/* PRODUCTOS */}
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
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad - 1)}
                        style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button type="button" onClick={() => cambiarCantidad(item.id_catalogo, item.cantidad + 1)}
                        style={{ border: '1px solid #ccc', background: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>${(Number(prod.precio) * item.cantidad).toLocaleString()}</span>
                    <button type="button" onClick={() => eliminarProducto(item.id_catalogo)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
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

      {/* TOTAL */}
      <div>
        <label style={lStyle}>Total Calculado</label>
        <div style={{ ...iStyle, background: 'rgba(0,0,0,0.03)', fontWeight: 700, color: '#2D4B39', display: 'flex', alignItems: 'center' }}>
          ${form.total.toLocaleString()} COP
        </div>
      </div>

      {/* COMPROBANTE */}
      <div>
        <label style={lStyle}>Comprobante de Pago</label>
        <input type="file" accept="image/*,application/pdf" style={{ ...iStyle, padding: '8px' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = await uploadToCloudinary(file);
              if (url) onChange('comprobante_pago', url);
            }
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

export function Pedidos() {
  const [verificarId, setVerificarId] = useState<number | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toCancel, setToCancel] = useState<any | null>(null);
  
  // ESTADOS NUEVOS PARA GESTIONAR EL MOTIVO DINÁMICAMENTE
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('Monto de transferencia incorrecto');
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const [showComprobante, setShowComprobante] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm, items: [] });

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

  const openModal = (type: 'view' | 'add' | 'edit', p?: any) => {
    setModalType(type);
    setSelected(p || null);
    if (type === 'edit' && p) {
      setForm({
        id_cliente: p.id_cliente || '',
        items: [],
        total: Number(p.total) || 0,
        direccion_entrega: p.direccion_entrega || '',
        telefono: p.telefono || '',
        ciudad: p.ciudad || '',
        departamento: p.departamento || '',
        comprobante_pago: p.comprobante_pago || '' 
      });
    } else if (type === 'add') {
      setForm({
        id_cliente: '',
        items: [],
        total: 0,
        direccion_entrega: '',
        telefono: '',
        ciudad: '',
        departamento: '',
        comprobante_pago: '' 
      });
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

const handleSubmit = async () => {
  if (form.items.length === 0) return toast.error('Debes seleccionar al menos un producto');
  if (!form.id_cliente) return toast.error('El cliente es obligatorio');
  if (!form.direccion_entrega) return toast.error('La dirección de entrega es obligatoria');
  if (!form.ciudad) return toast.error('La ciudad es obligatoria');
  if (!form.departamento) return toast.error('El departamento es obligatorio');

  const productosMapeados = form.items.map(item => ({
    id_producto: Number(item.id_catalogo),
    cantidad: item.cantidad,
    precio_unitario: 0,
  }));

  const direccionCompleta = `${form.direccion_entrega}, ${form.ciudad}, ${form.departamento} (Colombia)${
    form.telefono ? ` | Tel: ${form.telefono}` : ''
  }`;

  try {
    await pedidosAPI.create({
      id_cliente: form.id_cliente,
      productos: productosMapeados,
      total: form.total,
      direccion_entrega: direccionCompleta,
      comprobante_pago: form.comprobante_pago || null,
    });
    toast.success('Pedido creado correctamente');
    closeModal();
    cargar();
  } catch (err: any) { 
    toast.error(err.message || 'Error al guardar');
  }
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

    // Evaluamos el motivo final que viaja al Backend
    let motivoFinal = motivoSeleccionado;
    if (motivoSeleccionado.startsWith('Otro motivo')) {
      motivoFinal = motivoCancelacion.trim() || 'El comprobante de pago adjunto no es válido.';
    }

    try {
      // Llamamos a la API enviando el motivo estructurado
      await pedidosAPI.cancelar(toCancel.id_pedidos, motivoFinal);
      toast.success('Pago rechazado y notificado al cliente');
      cargar();
    } catch (err: any) { 
      toast.error(err.message || 'Error al procesar el rechazo'); 
    }

    // Limpiamos los estados de rechazo
    setShowDeleteModal(false);
    setToCancel(null);
    setMotivoSeleccionado('Monto de transferencia incorrecto');
    setMotivoCancelacion('');
  };

  const filtered = pedidos.filter(p =>
    (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    `PED-${String(p.id_pedidos).padStart(4, '0')}`.includes(searchTerm)
  );

  const pendientes = pedidos.filter(p => p.estado === 'PAGO_POR_VERIFICAR' || p.estado === null).length;
  const totalCompletados = pedidos.filter(p => p.estado === 'PAGADO').reduce((s, p) => s + Number(p.total), 0);

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

                  return (
                    <motion.tr key={p.id_pedidos}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(45,75,57,0.02)' }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.08)' }}>
                      
                      <td style={{ padding: '20px 24px', color: '#2D4B39', fontWeight: 600 }}>
                        PED-{String(p.id_pedidos).padStart(4,'0')}
                      </td>
                      
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: '13px', color: '#2D4B39', fontWeight: 600 }}>
                          {p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '—'}
                        </div>
                      </td>
                      
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
                          {Array.isArray(p.detalle) && p.detalle.length > 0
                            ? `${p.detalle.reduce((s: number, d: any) => s + (d.cantidad || 0), 0)} producto${p.detalle.reduce((s: number, d: any) => s + (d.cantidad || 0), 0) !== 1 ? 's' : ''}`
                            : p.cantidad ?? '—'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#B8860B' }}>
                          ${Number(p.total).toLocaleString()}
                        </span>
                      </td>

                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 600 }}>
                          <Icon style={{ width: '14px', height: '14px' }} />
                          {s.texto}
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

                          {mapEstado(p.estado) === 'EN_PRODUCCION' && (
                            <Tooltip text="Marcar como completado">
                              <motion.button whileHover={{ scale: 1.15 }}
                                onClick={async () => {
                                  try {
                                    await pedidosAPI.updateEstado(p.id_pedidos, { estado: 'COMPLETADO' });
                                    toast.success('Pedido marcado como completado');
                                    cargar();
                                  } catch (err: any) { toast.error(err.message); }
                                }}
                                style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              >
                                <CheckCircle style={{ width: '15px', height: '15px', color: '#2D4B39' }} />
                              </motion.button>
                            </Tooltip>
                          )}

                          {p.comprobante_pago && (
                            <Tooltip text="Ver comprobante">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setShowComprobante(p.comprobante_pago)}
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

                              <Tooltip text="Rechazar pago">
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => { setToCancel(p); setShowDeleteModal(true); }}
                                  style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                  <Ban style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                                </motion.button>
                              </Tooltip>
                            </>
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
            <ViewModal p={selected} onClose={closeModal} />
          </motion.div>
        </motion.div>
      )}

      {/* MODAL AGREGAR */}
      {modalType === 'add' && (
        <Modal isOpen={true} onClose={closeModal} title="Nuevo Pedido">
          <FormModal 
            form={form} 
            onChange={(f, v) => setForm(prev => ({ ...prev, [f]: v }))}
            onSubmit={handleSubmit} 
            clientes={clientes} 
            type="add" 
          />
        </Modal>
      )}

      {/* MODAL CANCELAR/RECHAZAR PAGO (CON SELECT DE MOTIVOS) */}
      {showDeleteModal && toCancel && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '460px', width: '90%', boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>
            
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Rechazar Pago / Cancelar pedido</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
              ¿Seguro que deseas rechazar el comprobante del pedido <strong>PED-{String(toCancel.id_pedidos).padStart(4,'0')}</strong>? Se guardará el motivo en su perfil y se le enviará un correo automáticamente.
            </p>

            {/* SELECT DE MOTIVOS PREDEFINIDOS (¡SIEMPRE VISIBLE!) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={lStyle}>Selecciona la razón del rechazo *</label>
              <select 
                value={motivoSeleccionado} 
                onChange={e => setMotivoSeleccionado(e.target.value)} 
                style={iStyle}
              >
                {MOTIVOS_RECHAZO.map((motivo, index) => (
                  <option key={index} value={motivo}>{motivo}</option>
                ))}
              </select>
            </div>

            {/* TEXTAREA CONDICIONAL (Solo si se elige "Otro motivo (especificar abajo)") */}
            {motivoSeleccionado.includes('Otro motivo') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                style={{ marginBottom: '16px', overflow: 'hidden' }}
              >
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39', display: 'block', marginBottom: '8px' }}>Escribe la razón detallada *</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={e => setMotivoCancelacion(e.target.value)}
                  placeholder="Detalla la razón por la cual rechazas el pago..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </motion.div>
            )}

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                onClick={() => { 
                  setShowDeleteModal(false); 
                  setToCancel(null); 
                  setMotivoSeleccionado('Monto de transferencia incorrecto');
                  setMotivoCancelacion(''); 
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: '#fff', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Volver
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                onClick={handleCancelar}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirmar Rechazo
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* MODAL COMPROBANTE */}
      {showComprobante && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowComprobante(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Comprobante de Pago</h3>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowComprobante(null)}
                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                <XCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
              </motion.button>
            </div>
            {showComprobante.toLowerCase().startsWith('data:image') || 
            showComprobante.toLowerCase().includes('cloudinary') || 
            showComprobante.toLowerCase().endsWith('.jpg') || 
            showComprobante.toLowerCase().endsWith('.jpeg') || 
            showComprobante.toLowerCase().endsWith('.png') || 
            showComprobante.toLowerCase().endsWith('.webp') ||
            (showComprobante.startsWith('http') && !showComprobante.toLowerCase().endsWith('.pdf')) ? (
              
              <img src={showComprobante} alt="Comprobante" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} />

            ) : showComprobante.toLowerCase().startsWith('data:application/pdf') || showComprobante.toLowerCase().endsWith('.pdf') ? (
              
              <iframe src={showComprobante} style={{ width: '100%', height: '70vh', borderRadius: '12px', border: 'none' }} title="Comprobante PDF" />

            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <p style={{ marginBottom: '12px' }}>No se puede previsualizar este archivo directamente.</p>
                <a href={showComprobante} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#2D4B39', color: '#fff', borderRadius: '30px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  Abrir en nueva pestaña
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NUEVO MODAL DE VERIFICACIÓN DE STOCK (Pégalo aquí)            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <VerificarProduccionModal 
        isOpen={verificarId !== null} 
        onClose={() => setVerificarId(null)} 
        idPedido={verificarId || 0} 
        onAprobado={cargar} 
      />

    </motion.div>
  );
}