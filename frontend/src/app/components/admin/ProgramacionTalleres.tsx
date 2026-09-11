import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Plus, Info, Edit, Trash2, Users, Package, Layers, X } from 'lucide-react';
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { programacionAPI, talleresAPI, materialesAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

interface FormState {
  nombre_taller: string; nombre_instructor: string;
  precio: number; descripcion: string; id_empleado: number | '';
}
const emptyForm: FormState = { nombre_taller: '', nombre_instructor: '', precio: 0, descripcion: '', id_empleado: '' };

interface MaterialRow {
  id_materiales?: number;
  id_insumo: number;
  nombre_material: string;
  unidad_medida: string;
  cantidad: number;
  costo_total: number;
  _eliminar?: boolean;
}

// ─── Selector de insumos en modo local (para modal add) ──────────────────────
function SelectorMaterialesLocal({ filas, setFilas, insumos }: {
  filas: MaterialRow[];
  setFilas: React.Dispatch<React.SetStateAction<MaterialRow[]>>;
  insumos: any[];
}) {
  const insumosSeleccionados = new Set(filas.map(f => f.id_insumo));

  const toggleInsumo = (ins: any) => {
    if (insumosSeleccionados.has(ins.id_insumos)) {
      setFilas(prev => prev.filter(f => f.id_insumo !== ins.id_insumos));
    } else {
      setFilas(prev => [...prev, {
        id_insumo: ins.id_insumos,
        nombre_material: ins.nombre,
        unidad_medida: ins.unidad_medida || '',
        cantidad: 1,
        costo_total: 0,
      }]);
    }
  };

  const updateFila = (id_insumo: number, campo: 'cantidad' | 'costo_total', valor: number) => {
    setFilas(prev => prev.map(f => f.id_insumo === id_insumo ? { ...f, [campo]: valor } : f));
  };

  const costoTotal = filas.reduce((s, f) => s + f.costo_total, 0);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={lStyle}>Materiales del taller</label>
      <div style={{ border: '1px solid rgba(45,75,57,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#2D4B39', color: '#fff', padding: '8px 14px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>SELECCIONAR INSUMOS</div>
        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {insumos.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No hay insumos disponibles</div>
          ) : insumos.map((ins: any) => {
            const sel = insumosSeleccionados.has(ins.id_insumos);
            const fila = filas.find(f => f.id_insumo === ins.id_insumos);
            return (
              <div key={ins.id_insumos} style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                <div onClick={() => toggleInsumo(ins)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 14px', cursor: 'pointer', background: sel ? 'rgba(45,75,57,0.05)' : 'white' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${sel ? '#2D4B39' : '#D1D5DB'}`, background: sel ? '#2D4B39' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sel && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{ins.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Medida: {ins.unidad_medida || '—'} · Stock: {ins.stock}</div>
                  </div>
                </div>
                {sel && fila && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '6px 14px 10px 42px', background: 'rgba(45,75,57,0.03)' }}>
                    <div>
                      <label style={{ ...lStyle, fontSize: '11px', marginBottom: '3px' }}>Cantidad *</label>
                      <input type="number" min={1} value={fila.cantidad}
                        onChange={e => updateFila(ins.id_insumos, 'cantidad', Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                        style={{ ...iStyle, padding: '7px 10px', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ ...lStyle, fontSize: '11px', marginBottom: '3px' }}>Costo interno (COP)</label>
                      <input type="number" min={0} value={fila.costo_total}
                        onChange={e => updateFila(ins.id_insumos, 'costo_total', Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                        style={{ ...iStyle, padding: '7px 10px', fontSize: '13px' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {filas.length > 0 && (
        <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.15)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#B8860B' }}>
          <span>{filas.length} insumo(s) seleccionado(s)</span>
          <span>Costo total: ${costoTotal.toLocaleString('es-CO')} COP</span>
        </div>
      )}
    </div>
  );
}

// ─── Modal de selección/edición de materiales ───────────────────────────────
function MaterialesModal({ idProgramacion, onClose }: { idProgramacion: number; onClose: () => void }) {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [filas, setFilas] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [iData, mData] = await Promise.all([
          materialesAPI.getInsumos(),
          materialesAPI.getByProgramacion(idProgramacion),
        ]);
        setInsumos(iData.insumos);
        const existentes: MaterialRow[] = (mData.materiales || []).map((m: any) => ({
          id_materiales: m.id_materiales,
          id_insumo: m.id_insumo,
          nombre_material: m.insumo_nombre || m.nombre_material,
          unidad_medida: m.insumo_unidad || m.unidad_medida || '',
          cantidad: Number(m.cantidad),
          costo_total: Number(m.costo_total),
        }));
        setFilas(existentes);
      } catch (err: any) {
        toast.error(err.message || 'Error al cargar');
      } finally { setLoading(false); }
    };
    cargar();
  }, [idProgramacion]);

  const insumosSeleccionados = new Set(filas.filter(f => !f._eliminar).map(f => f.id_insumo));

  const toggleInsumo = (ins: any) => {
    const yaEsta = filas.find(f => f.id_insumo === ins.id_insumos && !f._eliminar);
    if (yaEsta) {
      // Si tiene id_materiales (ya guardado) marcamos para eliminar; si es nuevo lo quitamos
      if (yaEsta.id_materiales) {
        setFilas(prev => prev.map(f => f.id_insumo === ins.id_insumos ? { ...f, _eliminar: true } : f));
      } else {
        setFilas(prev => prev.filter(f => f.id_insumo !== ins.id_insumos));
      }
    } else {
      // Puede existir marcado para eliminar — lo restauramos
      const marcado = filas.find(f => f.id_insumo === ins.id_insumos && f._eliminar);
      if (marcado) {
        setFilas(prev => prev.map(f => f.id_insumo === ins.id_insumos ? { ...f, _eliminar: false } : f));
      } else {
        setFilas(prev => [...prev, {
          id_insumo: ins.id_insumos,
          nombre_material: ins.nombre,
          unidad_medida: ins.unidad_medida || '',
          cantidad: 1,
          costo_total: 0,
        }]);
      }
    }
  };

  const updateFila = (id_insumo: number, campo: 'cantidad' | 'costo_total', valor: number) => {
    setFilas(prev => prev.map(f => f.id_insumo === id_insumo ? { ...f, [campo]: valor } : f));
  };

  const handleGuardar = async () => {
    const activas = filas.filter(f => !f._eliminar);
    for (const f of activas) {
      if (f.cantidad <= 0) return toast.error(`Cantidad inválida para "${f.nombre_material}"`);
      if (f.costo_total < 0) return toast.error(`Costo negativo para "${f.nombre_material}"`);
    }
    setSaving(true);
    try {
      // Eliminar los marcados
      for (const f of filas.filter(f => f._eliminar && f.id_materiales)) {
        await materialesAPI.delete(f.id_materiales!);
      }
      // Crear o actualizar activos
      for (const f of activas) {
        const payload = {
          nombre_material: f.nombre_material,
          cantidad: f.cantidad,
          costo_total: f.costo_total,
          unidad_medida: f.unidad_medida,
          id_insumo: f.id_insumo,
          id_programacion_taller: idProgramacion,
        };
        if (f.id_materiales) {
          await materialesAPI.update(f.id_materiales, payload);
        } else {
          await materialesAPI.create(payload);
        }
      }
      toast.success('Materiales guardados correctamente');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar materiales');
    } finally { setSaving(false); }
  };

  const filasActivas = filas.filter(f => !f._eliminar);
  const costoTotal = filasActivas.reduce((s, f) => s + f.costo_total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Cargando insumos...</div>
      ) : (
        <>
          {/* Lista de insumos con checkbox */}
          <div style={{ border: '1px solid rgba(45,75,57,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#2D4B39', color: '#fff', padding: '10px 16px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
              SELECCIONAR INSUMOS
            </div>
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {insumos.map((ins: any) => {
                const seleccionado = insumosSeleccionados.has(ins.id_insumos);
                const fila = filas.find(f => f.id_insumo === ins.id_insumos && !f._eliminar);
                return (
                  <div key={ins.id_insumos} style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    {/* Fila de selección */}
                    <div
                      onClick={() => toggleInsumo(ins)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer',
                        background: seleccionado ? 'rgba(45,75,57,0.05)' : 'white' }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${seleccionado ? '#2D4B39' : '#D1D5DB'}`,
                        background: seleccionado ? '#2D4B39' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {seleccionado && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{ins.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Medida: {ins.unidad_medida || '—'} · Stock: {ins.stock}</div>
                      </div>
                    </div>
                    {/* Campos cantidad y costo si está seleccionado */}
                    {seleccionado && fila && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '8px 16px 12px 46px', background: 'rgba(45,75,57,0.03)' }}>
                        <div>
                          <label style={{ ...lStyle, fontSize: '11px', marginBottom: '4px' }}>Cantidad a usar *</label>
                          <input type="number" min={1} value={fila.cantidad}
                            onChange={e => updateFila(ins.id_insumos, 'cantidad', Number(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            style={{ ...iStyle, padding: '8px 12px', fontSize: '13px' }} />
                        </div>
                        <div>
                          <label style={{ ...lStyle, fontSize: '11px', marginBottom: '4px' }}>Costo interno (COP)</label>
                          <input type="number" min={0} value={fila.costo_total}
                            onChange={e => updateFila(ins.id_insumos, 'costo_total', Number(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            style={{ ...iStyle, padding: '8px 12px', fontSize: '13px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {insumos.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No hay insumos disponibles</div>
              )}
            </div>
          </div>

          {/* Resumen seleccionados */}
          {filasActivas.length > 0 && (
            <div style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#B8860B', marginBottom: '6px' }}>RESUMEN — {filasActivas.length} insumo(s) seleccionado(s)</div>
              {filasActivas.map(f => (
                <div key={f.id_insumo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', padding: '2px 0' }}>
                  <span>{f.nombre_material} × {f.cantidad}</span>
                  <span style={{ fontWeight: 600, color: '#B8860B' }}>${f.costo_total.toLocaleString('es-CO')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(184,134,11,0.2)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#B8860B' }}>
                <span>Costo total interno</span>
                <span>${costoTotal.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: 'white', color: '#2D4B39', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGuardar} disabled={saving}
              style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar materiales'}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sección de materiales dentro del modal view/edit ───────────────────────
function SeccionMateriales({ idProgramacion }: { idProgramacion: number }) {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const cargar = async () => {
    try {
      const data = await materialesAPI.getByProgramacion(idProgramacion);
      setMateriales(data.materiales || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [idProgramacion]);

  const costoTotal = materiales.reduce((s, m) => s + Number(m.costo_total), 0);

  return (
    <div style={{ marginTop: '4px' }}>
      <AdminDetailSection title="MATERIALES DEL TALLER" icon={<Layers style={{ width: '20px', height: '20px' }} />} color="gold">
        {loading ? (
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Cargando...</div>
        ) : materiales.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px' }}>Sin materiales asignados.</div>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(45,75,57,0.06)' }}>
                  {['Material', 'Medida', 'Cantidad', 'Costo interno'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Cantidad' || h === 'Costo interno' ? 'center' : 'left', fontWeight: 700, color: '#2D4B39', fontSize: '11px', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiales.map((m: any) => (
                  <tr key={m.id_materiales} style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2D4B39' }}>{m.insumo_nombre || m.nombre_material}</td>
                    <td style={{ padding: '8px 10px', color: '#6B7280' }}>{m.insumo_unidad || m.unidad_medida || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#2D4B39', fontWeight: 600 }}>{Number(m.cantidad)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#B8860B' }}>${Number(m.costo_total).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: '#B8860B', borderTop: '1px solid rgba(184,134,11,0.2)', marginTop: '4px' }}>
              Costo total interno: ${costoTotal.toLocaleString('es-CO')} COP
            </div>
          </div>
        )}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '1px dashed rgba(45,75,57,0.35)', background: 'rgba(45,75,57,0.04)', color: '#2D4B39', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus style={{ width: '14px', height: '14px' }} />
          {materiales.length === 0 ? '+ Agregar materiales al taller' : 'Editar materiales'}
        </motion.button>
      </AdminDetailSection>

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); cargar(); }} title="Materiales del taller">
          <MaterialesModal idProgramacion={idProgramacion} onClose={() => { setShowModal(false); cargar(); }} />
        </Modal>
      )}
    </div>
  );
}

function ModalContent({ type, prog, form, onChange, onSubmit, instructores, insumos, filasLocales, setFilasLocales }: {
  type: 'view' | 'edit' | 'add'; prog?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void;
  onSubmit: () => void; instructores: any[];
  insumos: any[]; filasLocales: MaterialRow[]; setFilasLocales: React.Dispatch<React.SetStateAction<MaterialRow[]>>;
}) {
  if (type === 'view' && prog) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminDetailSection title="INFORMACIÓN DEL TALLER" icon={<BookOpen style={{ width: '20px', height: '20px' }} />} color="green">
          <AdminDetailRow label="Nombre del Taller" value={prog.nombre_taller} />
          <AdminDetailRow label="Instructor"         value={prog.instructor_nombre || prog.nombre_instructor} />
          <AdminDetailGrid>
            <AdminDetailRow label="Precio" value={`${Number(prog.precio).toLocaleString('es-CO')} COP`} />
          </AdminDetailGrid>
          {prog.descripcion && <AdminDetailRow label="Descripción" value={prog.descripcion} />}
        </AdminDetailSection>
        <AdminDetailSection title="ESTADO" icon={<Package style={{ width: '20px', height: '20px' }} />} color="teal">
          <AdminDetailRow
            label="Estado"
            badge={{ bg: prog.estado ? '#D1FAE5' : '#FEE2E2', color: prog.estado ? '#065F46' : '#991B1B', text: prog.estado ? 'Activo' : 'Inactivo' }}
          />
        </AdminDetailSection>
        <SeccionMateriales idProgramacion={prog.id_programacion_taller} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Nombre del Taller *</label>
        <input type="text" value={form.nombre_taller} onChange={e => onChange('nombre_taller', e.target.value)} placeholder="Ej: Macramé Básico" style={iStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Instructor *</label>
        <select value={form.id_empleado} onChange={e => {
          const id = e.target.value ? Number(e.target.value) : '';
          onChange('id_empleado', id);
          if (id) {
            const inst = instructores.find((i: any) => i.id_empleado === Number(id));
            if (inst) onChange('nombre_instructor', inst.nombre_completo);
          }
        }} style={iStyle}>
          <option value="">Seleccionar instructor...</option>
          {instructores.map((i: any) => (
            <option key={i.id_empleado} value={i.id_empleado}>{i.nombre_completo}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Precio (COP) *</label>
        <input type="number" min={0} value={form.precio} onChange={e => onChange('precio', Number(e.target.value))} style={iStyle} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Descripción</label>
        <textarea value={form.descripcion} onChange={e => onChange('descripcion', e.target.value)}
          placeholder="Describe el taller, qué aprenderán los estudiantes..."
          rows={3} style={{ ...iStyle, resize: 'vertical' }} />
      </div>
      {type === 'edit' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={lStyle}>Estado</label>
          <select style={iStyle} onChange={e => onChange('estado' as any, e.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      )}
      {type === 'add' && (
        <SelectorMaterialesLocal filas={filasLocales} setFilas={setFilasLocales} insumos={insumos} />
      )}
      {type === 'edit' && prog && (
        <SeccionMateriales idProgramacion={prog.id_programacion_taller} />
      )}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '16px' }}>
        {type === 'add' ? 'Crear Programación de Taller' : 'Guardar Cambios'}
      </motion.button>
    </div>
  );
}

export function ProgramacionTalleres() {
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filasLocales, setFilasLocales] = useState<MaterialRow[]>([]);

  const cargar = async () => {
    try {
      const [pData, iData, insData] = await Promise.all([
        programacionAPI.getAll(),
        talleresAPI.getInstructores(),
        materialesAPI.getInsumos(),
      ]);
      setProgramaciones(pData.programaciones);
      setInstructores(iData.instructores);
      setInsumos(insData.insumos);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', p?: any) => {
    setModalType(type);
    setSelected(p || null);
    setFilasLocales([]);
    if (type === 'edit' && p) {
      setForm({
        nombre_taller: p.nombre_taller || '',
        nombre_instructor: p.nombre_instructor || '',
        precio: Number(p.precio) || 0,
        descripcion: p.descripcion || '',
        id_empleado: p.id_empleado || '',
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); setFilasLocales([]); };

  const handleSubmit = async () => {
    if (!form.nombre_taller) return toast.error('El nombre es obligatorio');
    if (!form.id_empleado) return toast.error('El instructor es obligatorio');
    if (!form.precio) return toast.error('El precio es obligatorio');
    // Validar materiales locales
    for (const f of filasLocales) {
      if (f.cantidad <= 0) return toast.error(`Cantidad inválida para "${f.nombre_material}"`);
      if (f.costo_total < 0) return toast.error(`Costo negativo para "${f.nombre_material}"`);
    }
    try {
      if (modalType === 'add') {
        const data = await programacionAPI.create(form);
        const idNuevo = data.programacion.id_programacion_taller;
        // Guardar materiales locales con el ID recién creado
        for (const f of filasLocales) {
          await materialesAPI.create({
            nombre_material: f.nombre_material,
            cantidad: f.cantidad,
            costo_total: f.costo_total,
            unidad_medida: f.unidad_medida,
            id_insumo: f.id_insumo,
            id_programacion_taller: idNuevo,
          });
        }
        toast.success('Programación y materiales creados correctamente');
      } else if (modalType === 'edit' && selected) {
        await programacionAPI.update(selected.id_programacion_taller, form);
        toast.success('Archivo actualizado');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await programacionAPI.delete(toDelete.id_programacion_taller);
      toast.success('Archivo eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = programaciones.filter(p =>
    (p.nombre_taller || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.instructor_nombre || p.nombre_instructor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activos = programaciones.filter(p => p.estado).length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <BookOpen style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Talleres</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{programaciones.length} talleres registrados</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{activos} activos</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar talleres..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '300px', outline: 'none' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Programación
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['TALLER', 'INSTRUCTOR', 'PRECIO', 'MATERIALES', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: ['PRECIO', 'MATERIALES', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id_programacion_taller}
                    initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen style={{ width: '14px', height: '14px', color: '#fff' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{p.nombre_taller}</div>
                          {p.descripcion && <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users style={{ width: '13px', height: '13px', color: '#B8860B' }} />
                        {p.instructor_nombre || p.nombre_instructor || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#B8860B' }}>${Number(p.precio).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                      {p.total_materiales || 0} material(es)
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: p.estado ? '#D1FAE5' : '#FEE2E2', color: p.estado ? '#065F46' : '#991B1B' }}>
                        {p.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <Tooltip text="Ver detalles">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('view', p)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                          </motion.button>
                        </Tooltip>
                        <Tooltip text="Editar programación">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => openModal('edit', p)}
                            style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Edit style={{ width: '15px', height: '15px', color: '#B8860B' }} />
                          </motion.button>
                        </Tooltip>
                        <Tooltip text="Eliminar programación">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(p); setShowDeleteModal(true); }}
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
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron talleres</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {modalType && (
        <Modal isOpen={true} onClose={closeModal}
          title={modalType === 'add' ? 'Nueva Programación de Taller' : modalType === 'edit' ? 'Editar Programación' : 'Detalle del Taller'}>
          <ModalContent type={modalType} prog={selected} form={form} instructores={instructores}
            insumos={insumos} filasLocales={filasLocales} setFilasLocales={setFilasLocales}
            onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={toDelete.nombre_taller} itemType="Archivo de Taller" />
      )}
    </motion.div>
  );
}
