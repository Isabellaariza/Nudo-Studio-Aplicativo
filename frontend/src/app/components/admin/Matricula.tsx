import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Search, Plus, Info, Trash2, Calendar, DollarSign, Users } from 'lucide-react';
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { matriculasAPI, estudiantesAPI, talleresAPI } from '../../lib/api';

const iStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.15)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' };

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'activa':    return { bg: '#D1FAE5', color: '#065F46', label: 'Activa' };
    case 'cancelada': return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada' };
    case 'completada':return { bg: '#DBEAFE', color: '#1E40AF', label: 'Completada' };
    default:          return { bg: '#F3F4F6', color: '#6B7280', label: estado || 'Activa' };
  }
};

function ModalAdd({ estudiantes, talleres, onSubmit, onClose }: {
  estudiantes: any[]; talleres: any[];
  onSubmit: (data: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ id_estudiante: '', id_programacion: '' });

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={lStyle}>Estudiante *</label>
        <select value={form.id_estudiante} onChange={e => setForm(p => ({ ...p, id_estudiante: e.target.value }))} style={iStyle}>
          <option value="">Seleccionar estudiante...</option>
          {estudiantes.map((e: any) => (
            <option key={e.id_estudiante} value={e.id_estudiante}>{e.nombre_completo}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={lStyle}>Taller *</label>
        <select value={form.id_programacion} onChange={e => setForm(p => ({ ...p, id_programacion: e.target.value }))} style={iStyle}>
          <option value="">Seleccionar taller...</option>
          {talleres.filter((t: any) => t.estado).map((t: any) => (
            <option key={t.id_talleres} value={t.id_programacion}>
              {t.nombre_taller}
              {t.fecha ? ` — ${new Date(t.fecha).toLocaleDateString('es-CO')}` : ''}
              {t.hora ? ` ${t.hora.slice(0,5)}` : ''}
              {t.precio ? ` · $${Number(t.precio).toLocaleString()} COP` : ''}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
          style={{ flex: 1, padding: '13px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: 'white', color: '#6B7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (!form.id_estudiante || !form.id_programacion) return toast.error('Selecciona estudiante y taller');
            onSubmit({ id_estudiante: Number(form.id_estudiante), id_programacion: Number(form.id_programacion) });
          }}
          style={{ flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Registrar Matrícula
        </motion.button>
      </div>
    </div>
  );
}

function ModalView({ m }: { m: any }) {
  const b = estadoBadge(m.estado);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminDetailSection title="DATOS DE LA MATRÍCULA" icon={<GraduationCap style={{ width: '20px', height: '20px' }} />} color="green">
        <AdminDetailRow label="Estudiante" value={m.estudiante} />
        <AdminDetailRow label="Taller"     value={m.taller || m.nombre_taller} />
        <AdminDetailRow label="Instructor" value={m.instructor} />
        <AdminDetailGrid>
          <AdminDetailRow label="Fecha del taller"    value={m.fecha_taller ? new Date(m.fecha_taller).toLocaleDateString('es-CO') : '—'} />
          <AdminDetailRow label="Fecha de matrícula"  value={m.fecha_matricula ? new Date(m.fecha_matricula).toLocaleDateString('es-CO') : '—'} />
        </AdminDetailGrid>
        <AdminDetailRow label="Precio del taller" value={`$${Number(m.precio || 0).toLocaleString('es-CO')} COP`} />
      </AdminDetailSection>
      <AdminDetailSection title="ESTADO" icon={<GraduationCap style={{ width: '20px', height: '20px' }} />} color="teal">
        <AdminDetailRow
          label="Estado de la matrícula"
          badge={{ bg: b.bg, color: b.color, text: b.label }}
        />
      </AdminDetailSection>
    </div>
  );
}

export function Matricula() {
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [talleresList, setTalleresList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tallerFiltro, setTallerFiltro] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);

  const cargar = async () => {
    try {
      const [mData, eData, tData] = await Promise.all([
        matriculasAPI.getAll(),
        estudiantesAPI.getAll(),
        talleresAPI.getAll(),
      ]);
      setMatriculas(mData.matriculas);
      setEstudiantes(eData.estudiantes);
      setTalleresList(tData.talleres || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await matriculasAPI.create(data);
      toast.success('Matrícula registrada correctamente');
      setShowAdd(false);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al registrar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await matriculasAPI.delete(toDelete.id_matricula);
      toast.success('Matrícula eliminada');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = matriculas.filter(m => {
    const matchSearch =
      (m.estudiante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.taller || m.nombre_taller || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTaller = !tallerFiltro || String(m.id_programacion) === tallerFiltro || (m.taller || m.nombre_taller || '') === tallerFiltro;
    return matchSearch && matchTaller;
  });

  const activas = matriculas.filter(m => m.estado === 'activa').length;

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px', padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
              <GraduationCap style={{ width: '28px', height: '28px', color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>Gestión de Matrículas</h1>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{matriculas.length} matrículas registradas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{activas} activas</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar por estudiante o taller..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: '#fff', width: '280px', outline: 'none' }} />
            </div>
            <select value={tallerFiltro} onChange={e => setTallerFiltro(e.target.value)}
              style={{ height: '44px', padding: '0 12px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: tallerFiltro ? 'rgba(184,134,11,0.06)' : '#fff', outline: 'none', color: '#2D4B39', fontWeight: tallerFiltro ? 600 : 400, minWidth: '200px' }}>
              <option value="">Todos los talleres</option>
              {talleresList.map((t: any) => (
                <option key={t.id_talleres} value={t.nombre_taller}>{t.nombre_taller}</option>
              ))}
            </select>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Nueva Matrícula
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TABLA */}
      <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 0.2 }}
        style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(45,75,57,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando matrículas...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#2D4B39', color: '#fff' }}>
              <tr>
                {['#', 'ESTUDIANTE', 'TALLER', 'FECHA TALLER', 'INSTRUCTOR', 'PRECIO', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '16px 18px', textAlign: ['PRECIO', 'ESTADO', 'ACCIONES'].includes(h) ? 'center' : 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((m, i) => {
                  const b = estadoBadge(m.estado);
                  return (
                    <motion.tr key={m.id_matricula}
                      initial={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(45,75,57,0.07)' }}>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#9CA3AF', fontWeight: 600 }}>#{m.id_matricula}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                              {(m.estudiante || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{m.estudiante}</div>
                            {m.email && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>{m.taller || m.nombre_taller || '—'}</td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>
                        {m.fecha_taller ? new Date(m.fecha_taller).toLocaleDateString('es-CO') : '—'}
                        {m.hora && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.hora.slice(0,5)}</div>}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#6B7280' }}>{m.instructor || '—'}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#B8860B' }}>
                        ${Number(m.precio || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Tooltip text="Ver detalles de la matrícula">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setSelected(m); setShowView(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Info style={{ width: '15px', height: '15px', color: '#6B7280' }} />
                            </motion.button>
                          </Tooltip>
                          <Tooltip text="Eliminar matrícula">
                            <motion.button whileHover={{ scale: 1.15 }} onClick={() => { setToDelete(m); setShowDeleteModal(true); }}
                              style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '15px', height: '15px', color: '#EF4444' }} />
                            </motion.button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron matrículas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* MODAL AGREGAR */}
      {showAdd && (
        <Modal isOpen={true} onClose={() => setShowAdd(false)} title="Nueva Matrícula">
          <ModalAdd estudiantes={estudiantes} talleres={talleresList}
            onSubmit={handleCreate} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {/* MODAL VER */}
      {showView && selected && (
        <Modal isOpen={true} onClose={() => setShowView(false)} title="Detalle de Matrícula">
          <ModalView m={selected} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete} itemName={`Matrícula #${toDelete.id_matricula} - ${toDelete.estudiante}`} itemType="Matrícula" />
      )}
    </motion.div>
  );
}
