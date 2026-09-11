import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Mail, Phone, Search, Plus, Eye, Edit, Trash2, Briefcase, Building2, DollarSign, Heart, User, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { AdminDetailSection, AdminDetailRow, AdminDetailGrid } from './AdminDetailModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { empleadosAPI } from '../../lib/api';
import { filterNombre, filterTelefono, filterDocumento, validateNombre, validateTelefono, validateDocumento, validateDireccion } from '../../lib/validators';

const iStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1px solid rgba(45,75,57,0.18)', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box' as const, background: 'white'
};
const lStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' };
const TABS = ['Personal', 'Laboral', 'Médico'] as const;
const TIPOS_DOC = ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Tarjeta de Identidad', 'Pasaporte'];
const CARGOS = [
  'Instructor de macramé',
  'Coordinadora de Producción',
  'Asesor de Ventas',
  'Diseñadora Textil',
  'Administrador/a',
  'Contador/a',
  'Auxiliar de Producción',
  'Community Manager',
];
const CONTRATOS = ['Indefinido', 'Fijo a 1 año', 'Fijo a 2 años', 'Por Obra o Labor', 'Prestación de Servicios'];
const SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

interface FormState {
  nombre_completo: string; cargo: string; departamento: string;
  salario_mensual: string; tipo_contrato: string; fecha_inicio: string;
  tipo_sangre: string; eps: string; contacto_emergencia: string; alergias: string;
  email: string; telefono: string; direccion: string; tipo_documento: string; numero_documento: string;
  id_rol?: string | number;
}
const emptyForm: FormState = {
  nombre_completo: '', cargo: '', departamento: 'Administración',
  salario_mensual: '', tipo_contrato: 'Indefinido', fecha_inicio: '',
  tipo_sangre: 'O+', eps: '', contacto_emergencia: '', alergias: '',
  email: '', telefono: '', direccion: '', tipo_documento: 'Cédula de Ciudadanía', numero_documento: ''
};

function TabBar({ active, onChange }: { active: string; onChange: (t: any) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid rgba(45,75,57,0.1)', marginBottom: '20px' }}>
      {TABS.map(t => (
        <button key={t} onClick={() => onChange(t)}
          style={{ padding: '10px 18px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: active === t ? '#2D4B39' : '#9CA3AF', borderBottom: active === t ? '3px solid #2D4B39' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.2s' }}>
          {t === 'Personal' ? 'Información Personal' : t === 'Laboral' ? 'Información Laboral' : 'Información Médica'}
        </button>
      ))}
    </div>
  );
}

function ModalContent({ type, empleado, form, onChange, onSubmit }: {
  type: 'view' | 'edit' | 'add'; empleado?: any;
  form: FormState; onChange: (f: keyof FormState, v: any) => void; onSubmit: () => void;
  roles?: any[];
}) {
  const [tab, setTab] = useState<'Personal' | 'Laboral' | 'Médico'>('Personal');
  const [nombreErr, setNombreErr] = useState('');
  const [telErr, setTelErr] = useState('');
  const [docErr, setDocErr] = useState('');
  const [dirErr, setDirErr] = useState('');

  const goNext = () => {
    if (tab === 'Personal') {
      const ne = validateNombre(form.nombre_completo); if (ne) { setNombreErr(ne); return toast.error(ne); }
      if (!form.cargo) return toast.error('El cargo es obligatorio');
      const te = validateTelefono(form.telefono); if (te) { setTelErr(te); return toast.error(te); }
      const doce = validateDocumento(form.numero_documento); if (doce) { setDocErr(doce); return toast.error(doce); }
      const de = validateDireccion(form.direccion); if (de) { setDirErr(de); return toast.error(de); }
      setTab('Laboral');
    } else if (tab === 'Laboral') {
      if (!form.departamento || !form.tipo_contrato || !form.fecha_inicio) return toast.error('Departamento, tipo de contrato y fecha de inicio son obligatorios');
      setTab('Médico');
    }
  };

  if (type === 'view' && empleado) {
    return (
      <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminDetailSection title="INFORMACIÓN PERSONAL" icon={<User style={{ width: '20px', height: '20px' }} />} color="green">
          <AdminDetailRow label="Nombre completo"    value={empleado.nombre_completo} />
          <AdminDetailGrid>
            <AdminDetailRow label="Email"            value={empleado.email || ''} />
            <AdminDetailRow label="Teléfono"         value={empleado.telefono || ''} />
          </AdminDetailGrid>
          <AdminDetailRow label="Dirección"          value={empleado.direccion || ''} />
          <AdminDetailGrid>
            <AdminDetailRow label="Tipo de documento"   value={empleado.tipo_documento || ''} />
            <AdminDetailRow label="Número de documento" value={empleado.numero_documento || ''} />
          </AdminDetailGrid>
        </AdminDetailSection>
        <AdminDetailSection title="INFORMACIÓN LABORAL" icon={<Briefcase style={{ width: '20px', height: '20px' }} />} color="gold">
          <AdminDetailRow label="Cargo"            value={empleado.cargo} />
          <AdminDetailGrid>
            <AdminDetailRow label="Departamento"   value={empleado.departamento} />
            <AdminDetailRow label="Tipo contrato"  value={empleado.tipo_contrato} />
          </AdminDetailGrid>
          <AdminDetailGrid>
            <AdminDetailRow label="Salario mensual" value={empleado.salario_mensual ? `$${Number(empleado.salario_mensual).toLocaleString('es-CO')} COP` : '—'} />
            <AdminDetailRow label="Fecha de inicio" value={empleado.fecha_inicio ? new Date(empleado.fecha_inicio).toLocaleDateString('es-CO') : '—'} />
          </AdminDetailGrid>
        </AdminDetailSection>
        <AdminDetailSection title="INFORMACIÓN MÉDICA" icon={<Heart style={{ width: '20px', height: '20px' }} />} color="red">
          <AdminDetailGrid>
            <AdminDetailRow label="Tipo de sangre"  value={empleado.tipo_sangre} />
            <AdminDetailRow label="EPS"             value={empleado.eps} />
          </AdminDetailGrid>
          <AdminDetailRow label="Contacto de emergencia" value={empleado.contacto_emergencia} />
          <AdminDetailRow label="Alergias"                value={empleado.alergias} />
        </AdminDetailSection>
      </div>
    );
  }

  const f = form;
  return (
    <div>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'Personal' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lStyle}>Nombre Completo *</label>
            <input type="text" value={f.nombre_completo}
              onChange={e => { const { value, error } = filterNombre(e.target.value); setNombreErr(error); onChange('nombre_completo', value); }}
              placeholder="Ej: Laura Gómez" style={{ ...iStyle, borderColor: nombreErr ? '#DC2626' : undefined }} />
            {nombreErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {nombreErr}</p>}
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lStyle}>Cargo *</label>
            <select value={f.cargo} onChange={e => onChange('cargo', e.target.value)} style={iStyle}>
              <option value="">Seleccionar cargo...</option>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lStyle}>Tipo de Documento</label>
              <select value={f.tipo_documento} onChange={e => onChange('tipo_documento', e.target.value)} style={iStyle}>
                {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Número de Documento</label>
              <input type="text" value={f.numero_documento}
                onChange={e => { const { value, error } = filterDocumento(e.target.value); setDocErr(error); onChange('numero_documento', value); }}
                placeholder="1234567890" style={{ ...iStyle, borderColor: docErr ? '#DC2626' : undefined }} />
              {docErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {docErr}</p>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lStyle}>Email</label>
              <input type="email" value={f.email} onChange={e => onChange('email', e.target.value)} placeholder="empleado@email.com" style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>Teléfono</label>
              <input type="tel" value={f.telefono}
                onChange={e => { const { value, error } = filterTelefono(e.target.value); setTelErr(error); onChange('telefono', value); }}
                placeholder="3001234567" style={{ ...iStyle, borderColor: telErr ? '#DC2626' : undefined }} />
              {telErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {telErr}</p>}
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lStyle}>Dirección</label>
            <input type="text" value={f.direccion}
              onChange={e => onChange('direccion', e.target.value)}
              onBlur={e => setDirErr(validateDireccion(e.target.value))}
              placeholder="Calle 123 #45-67, Ciudad" style={{ ...iStyle, borderColor: dirErr ? '#DC2626' : undefined }} />
            {dirErr && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px' }}>⚠ {dirErr}</p>}
          </div>
        </div>
      )}
      {tab === 'Laboral' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lStyle}>Departamento</label>
              <select value={f.departamento} onChange={e => onChange('departamento', e.target.value)} style={iStyle}>
                {['Administración', 'Talleres', 'Producción', 'Diseño', 'Ventas'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Tipo de Contrato</label>
              <select value={f.tipo_contrato} onChange={e => onChange('tipo_contrato', e.target.value)} style={iStyle}>
                {CONTRATOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lStyle}>Salario Mensual (COP)</label>
              <input type="number" value={f.salario_mensual} onChange={e => onChange('salario_mensual', e.target.value)} placeholder="2200000" style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>Fecha de Inicio</label>
              <input type="date" value={f.fecha_inicio} onChange={e => onChange('fecha_inicio', e.target.value)} style={iStyle} />
            </div>
          </div>

        </div>
      )}
      {tab === 'Médico' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={lStyle}>Tipo de Sangre</label>
              <select value={f.tipo_sangre} onChange={e => onChange('tipo_sangre', e.target.value)} style={iStyle}>
                {SANGRE.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>EPS</label>
              <input type="text" value={f.eps} onChange={e => onChange('eps', e.target.value)} placeholder="Ej: Sanitas EPS" style={iStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lStyle}>Contacto de Emergencia</label>
            <input type="text" value={f.contacto_emergencia} onChange={e => onChange('contacto_emergencia', e.target.value)} placeholder="Nombre - Teléfono" style={iStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lStyle}>Alergias</label>
            <textarea value={f.alergias} onChange={e => onChange('alergias', e.target.value)} placeholder="Describe alergias o escribe 'Ninguna'" rows={3}
              style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(45,75,57,0.1)', paddingTop: '16px', marginTop: '8px', display: 'flex', gap: '10px' }}>
        {tab !== 'Personal' && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setTab(tab === 'Médico' ? 'Laboral' : 'Personal')}
            style={{ flex: 1, padding: '13px', borderRadius: '10px', border: '1px solid rgba(45,75,57,0.2)', background: 'white', color: '#2D4B39', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Atrás
          </motion.button>
        )}
        {tab !== 'Médico' ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={goNext}
            style={{ flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Siguiente
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSubmit}
            style={{ flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {type === 'add' ? 'Agregar Empleado' : 'Guardar Cambios'}
          </motion.button>
        )}
      </div>
    </div>
  );
}

export function Empleados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const cargar = async () => {
    try {
      const eData = await empleadosAPI.getAll();
      setEmpleados(eData.empleados);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar empleados');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openModal = (type: 'view' | 'edit' | 'add', emp?: any) => {
    setModalType(type);
    setSelected(emp || null);
    if (type === 'edit' && emp) {
      setForm({
        nombre_completo: emp.nombre_completo || '', cargo: emp.cargo || '',
        departamento: emp.departamento || 'Administración', salario_mensual: emp.salario_mensual || '',
        tipo_contrato: emp.tipo_contrato || 'Indefinido',
        fecha_inicio: emp.fecha_inicio ? emp.fecha_inicio.split('T')[0] : '',
        tipo_sangre: emp.tipo_sangre || 'O+', eps: emp.eps || '',
        contacto_emergencia: emp.contacto_emergencia || '', alergias: emp.alergias || '',
        email: emp.email || '', telefono: emp.telefono || '', direccion: emp.direccion || '',
        tipo_documento: emp.tipo_documento || 'Cédula de Ciudadanía', numero_documento: emp.numero_documento || ''
      });
    } else if (type === 'add') {
      setForm(emptyForm);
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); };

  const handleSubmit = async () => {
    if (!form.nombre_completo) return toast.error('El nombre es obligatorio');
    if (!form.cargo) return toast.error('El cargo es obligatorio');
    if (!form.departamento) return toast.error('El departamento es obligatorio');
    if (!form.tipo_contrato) return toast.error('El tipo de contrato es obligatorio');
    if (!form.fecha_inicio) return toast.error('La fecha de inicio es obligatoria');
    if (!form.tipo_sangre) return toast.error('El tipo de sangre es obligatorio');
    if (!form.eps) return toast.error('La EPS es obligatoria');
    if (!form.contacto_emergencia) return toast.error('El contacto de emergencia es obligatorio');
    try {
      if (modalType === 'add') {
        await empleadosAPI.create({ ...form, salario_mensual: form.salario_mensual || null });
        toast.success('Empleado creado correctamente');
      } else if (modalType === 'edit' && selected) {
        await empleadosAPI.update(selected.id_empleado, { ...form, salario_mensual: form.salario_mensual || null });
        toast.success('Empleado actualizado correctamente');
      }
      closeModal();
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await empleadosAPI.delete(toDelete.id_empleado);
      toast.success('Empleado eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setToDelete(null);
  };

  const filtered = empleados.filter(e =>
    (e.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.cargo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.departamento || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={{ marginBottom: '32px' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))', border: '1px solid rgba(45,75,57,0.1)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(45,75,57,0.08)', marginBottom: '32px' }}>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2D4B39,#1F3A2E)', boxShadow: '0 8px 24px rgba(45,75,57,0.3)' }}>
                <UserCheck style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '8px' }}>Gestión de Empleados</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{empleados.length} empleados registrados</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{empleados.length} activos</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} />
                <input type="text" placeholder="Buscar empleados..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  style={{ paddingLeft: '44px', paddingRight: '16px', height: '44px', fontSize: '14px', border: '1px solid rgba(45,75,57,0.15)', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', width: '280px', outline: 'none' }} />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Plus style={{ width: '16px', height: '16px' }} /> Nuevo Empleado
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CARDS */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando empleados...</div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
            <AnimatePresence>
              {current.map((emp, i) => (
                <motion.div key={emp.id_empleado}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 * i }}
                  style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(45,75,57,0.06)', border: '1px solid rgba(224,209,192,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* NOMBRE + CARGO */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#2D4B39,#1a2f23)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(emp.nombre_completo)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2D4B39', margin: 0, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nombre_completo}</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{emp.cargo || '—'}</p>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>Activo</span>
                  </div>

                  {/* INFO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 style={{ width: '14px', height: '14px', color: '#B8860B', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{emp.departamento || '—'}</span>
                    </div>
                    {emp.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#B8860B', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                    </div>}
                    {emp.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone style={{ width: '14px', height: '14px', color: '#B8860B', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{emp.telefono}</span>
                    </div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign style={{ width: '14px', height: '14px', color: '#B8860B', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        {emp.salario_mensual ? `$${Number(emp.salario_mensual).toLocaleString()} COP` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px', color: '#B8860B', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{emp.tipo_contrato || '—'}</span>
                    </div>

                  </div>

                  {/* BOTONES */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    {[
                      { icon: Eye,    color: '#6B7280', bg: 'rgba(107,114,128,0.1)', action: () => openModal('view', emp), tip: 'Ver información' },
                      { icon: Edit,   color: '#B8860B', bg: 'rgba(184,134,11,0.1)', action: () => openModal('edit', emp), tip: 'Editar empleado' },
                      { icon: Trash2, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', action: () => { setToDelete(emp); setShowDeleteModal(true); }, tip: 'Eliminar empleado' },
                    ].map(({ icon: Icon, color, bg, action, tip }, idx) => (
                      <Tooltip key={idx} text={tip}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={action}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon style={{ width: '15px', height: '15px', color }} />
                        </motion.button>
                      </Tooltip>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {current.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron empleados</div>
            )}
          </motion.div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                <ChevronLeft style={{ width: '16px', height: '16px', color: '#2D4B39' }} />
              </motion.button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <motion.button key={n} whileHover={{ scale: 1.05 }} onClick={() => setPage(n)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: page === n ? 'linear-gradient(135deg,#2D4B39,#1a2f23)' : '#fff', color: page === n ? '#fff' : '#2D4B39', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: page === n ? '0 4px 12px rgba(45,75,57,0.3)' : '0 2px 4px rgba(45,75,57,0.08)' }}>
                  {n}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(45,75,57,0.15)', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                <ChevronRight style={{ width: '16px', height: '16px', color: '#2D4B39' }} />
              </motion.button>
            </div>
          )}
        </>
      )}

      {modalType && (
        <Modal isOpen={true} onClose={closeModal} title={modalType === 'add' ? 'Agregar Nuevo Empleado' : modalType === 'edit' ? 'Editar Empleado' : 'Información del Empleado'} maxWidth="680px">
          <ModalContent type={modalType} empleado={selected} form={form} onChange={(f, v) => setForm(p => ({ ...p, [f]: v }))} onSubmit={handleSubmit} />
        </Modal>
      )}

      {showDeleteModal && toDelete && (
        <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} itemName={toDelete.nombre_completo} itemType="Empleado" />
      )}
    </motion.div>
  );
}
