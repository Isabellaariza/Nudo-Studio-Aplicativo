import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, FileText, CreditCard, Edit3, LogOut, ShoppingBag, Calendar, Package, AlertTriangle, UploadCloud, Loader2, Clock, Lock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { auth, pedidosAPI, misMatriculasAPI, abonosAPI } from '../../lib/api';
import { LogoutModal } from '../LogoutModal';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

function capitalize(str: string) {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function formatFecha(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Nueva función para formatear los productos de "2x Producto" a "(2) Producto"
function formatProductos(productoStr: string) {
  if (!productoStr) return '';
  return productoStr.replace(/(\d+)x\s*/g, '($1) ');
}

// Función auxiliar robusta para identificar si un pedido está rechazado
function isPedidoRechazado(estado: any): boolean {
  if (estado === false || estado === 0 || estado === '0') return true;
  if (typeof estado === 'string') {
    const normalize = estado.trim().toLowerCase();
    return normalize === 'rechazado' || normalize === 'cancelado' || normalize === 'rejected';
  }
  return false;
}

export function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'workshops'>('orders');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [misAbonos, setMisAbonos] = useState<any[]>([]);
  const [formData, setFormData] = useState({ nombre: '', telefono: '', direccion: '', tipo_documento: 'Cédula de Ciudadanía', numero_documento: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<any | null>(null);
  const [uploadingPedId, setUploadingPedId] = useState<number | null>(null);
  const [uploadingAbonoId, setUploadingAbonoId] = useState<number | null>(null);
  const [pagandoSaldoId, setPagandoSaldoId] = useState<number | null>(null); // id_taller del saldo que se está pagando

  useEffect(() => {
    cargarPerfil();
    cargarPedidos();
    cargarMatriculas();
  }, []);

  const cargarPedidos = async () => { try { const d = await pedidosAPI.getMisPedidos(); setPedidos(d.pedidos || []); } catch {} };
  const cargarMatriculas = async () => {
    const [mRes, aRes] = await Promise.allSettled([
      misMatriculasAPI.getAll(),
      abonosAPI.getMisAbonos(),
    ]);
    if (mRes.status === 'fulfilled') setMatriculas(mRes.value.matriculas || []);
    if (aRes.status === 'fulfilled') setMisAbonos(aRes.value.abonos || []);
  };

  const cargarPerfil = async () => {
    try {
      const data = await auth.getUser();
      if (data?.usuario) {
        setProfileData(data.usuario);
        setFormData({ nombre: data.usuario.nombre || '', telefono: data.usuario.telefono || '', direccion: data.usuario.direccion || '', tipo_documento: data.usuario.tipo_documento || 'Cédula de Ciudadanía', numero_documento: data.usuario.numero_documento || '' });
      }
    } catch { toast.error('Error al cargar el perfil'); }
    finally { setLoading(false); }
  };

  const passwordRules = (pwd: string) => ({
    length:  pwd.length >= 10,
    number:  /\d/.test(pwd),
    upper:   /[A-Z]/.test(pwd),
    special: /[_\-@$#%&/!?.*+^=]/.test(pwd),
  });

  const handleSave = async () => {
    if (newPassword) {
      const rules = passwordRules(newPassword);
      if (!rules.length || !rules.number || !rules.upper || !rules.special) {
        toast.error('La contrasena no cumple los requisitos de seguridad'); return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Las contrasenas no coinciden'); return;
      }
    }
    if (nameError) { toast.error('El nombre solo puede contener letras'); return; }
    try {
      const payload: any = { ...formData };
      if (newPassword) payload.password = newPassword;
      const data = await auth.updateProfile(payload);
      setProfileData(data.usuario);
      setIsEditing(false);
      setNewPassword(''); setConfirmPassword('');
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) { toast.error(err.message || 'Error al guardar'); }
  };

  // Función para manejar la subida del nuevo comprobante de pago
  const handleResubmitComprobante = async (e: React.ChangeEvent<HTMLInputElement>, id_pedidos: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPedId(id_pedidos); //
    const toastId = toast.loading('Subiendo nuevo comprobante...'); //

    try {
      // Enviamos el archivo directamente
      await pedidosAPI.resubirComprobante(id_pedidos, file);

      toast.success('Comprobante enviado con éxito. Revisaremos tu pago pronto.', { id: toastId }); //
      
      // Recargamos tus pedidos para actualizar el estado visualmente
      await cargarPedidos(); //
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el comprobante. Inténtalo de nuevo.', { id: toastId }); //
    } finally {
      setUploadingPedId(null); //
    }
  };

  const handlePagarSaldo = async (e: React.ChangeEvent<HTMLInputElement>, id_taller: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPagandoSaldoId(id_taller);
    const toastId = toast.loading('Subiendo comprobante del saldo...');
    try {
      // Subir a Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'nudo_studio');
      const cloudRes = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: fd });
      if (!cloudRes.ok) throw new Error('No se pudo subir el comprobante');
      const { secure_url } = await cloudRes.json();
      await abonosAPI.pagarSaldo({ id_taller, comprobante_pago: secure_url });
      toast.success('Comprobante del saldo enviado. Lo verificaremos pronto.', { id: toastId });
      await cargarMatriculas();
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el comprobante', { id: toastId });
    } finally { setPagandoSaldoId(null); }
  };



  const handleResubmitAbonoComprobante = async (e: React.ChangeEvent<HTMLInputElement>, id_abono: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAbonoId(id_abono);
    const toastId = toast.loading('Subiendo comprobante...');
    try {
      await abonosAPI.resubirComprobante(id_abono, file);
      toast.success('Comprobante enviado. Verificaremos tu pago pronto.', { id: toastId });
      await cargarMatriculas();
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el comprobante', { id: toastId });
    } finally { setUploadingAbonoId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <p className="text-sm" style={{ color: 'rgba(45,75,57,0.5)' }}>Cargando perfil...</p>
      </div>
    );
  }

  const nombreMostrado = capitalize(profileData?.nombre || user?.name || '');
  const initials = nombreMostrado.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const infoItems = [
    { icon: Mail, label: 'Correo electrónico', value: profileData?.email },
    { icon: Phone, label: 'Teléfono', value: profileData?.telefono },
    { icon: MapPin, label: 'Dirección', value: profileData?.direccion },
    { icon: FileText, label: 'Tipo de documento', value: profileData?.tipo_documento },
    { icon: CreditCard, label: 'Número de documento', value: profileData?.numero_documento },
    { icon: Calendar, label: 'Miembro desde', value: formatFecha(profileData?.fecha_creacion) },
  ];

  // Clasificación de los pedidos
  const pedidosRechazados = pedidos.filter(p => isPedidoRechazado(p.estado));
  const pedidosNormales = pedidos.filter(p => !isPedidoRechazado(p.estado));

  return (
    <div className="min-h-screen py-10 px-6 pb-20" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 mb-6"
          style={{ border: '1px solid rgba(45,75,57,0.07)' }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #4a7a5e 100%)' }}
            >
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-elegant mb-1" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#2D4B39', lineHeight: 1.1 }}>
                {nombreMostrado || 'Mi Perfil'}
              </h1>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#B8860B' }} />
                <span className="text-sm" style={{ color: 'rgba(45,75,57,0.6)' }}>Cliente</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(45,75,57,0.4)' }}>
                Miembro desde {formatFecha(profileData?.fecha_creacion)}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 flex-shrink-0">
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: '#2D4B39' }}
                whileHover={{ backgroundColor: '#B8860B' }}
                whileTap={{ scale: 0.97 }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </motion.button>
              <motion.button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                style={{ border: '1px solid rgba(45,75,57,0.15)', color: 'rgba(45,75,57,0.6)' }}
                whileHover={{ borderColor: '#B8860B', color: '#B8860B' }}
                whileTap={{ scale: 0.97 }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Datos / Edición */}
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
            >
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl p-4 flex items-start gap-3"
                  style={{ border: '1px solid rgba(45,75,57,0.07)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(184,134,11,0.08)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#B8860B' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(45,75,57,0.45)' }}>{label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: '#2D4B39' }}>{value || '—'}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white rounded-2xl p-7 mb-6"
              style={{ border: '1px solid rgba(45,75,57,0.07)' }}
            >
              <h2 className="font-medium mb-6" style={{ color: '#2D4B39' }}>Editar Información</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User, label: 'Nombre Completo', key: 'nombre', type: 'text' },
                  { icon: Phone, label: 'Telefono', key: 'telefono', type: 'tel' },
                  { icon: MapPin, label: 'Direccion', key: 'direccion', type: 'text' },
                  { icon: CreditCard, label: 'Numero de Documento', key: 'numero_documento', type: 'text' },
                ].map(({ icon: Icon, label, key, type }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(45,75,57,0.6)' }}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </label>
                    <input
                      type={type}
                      value={(formData as any)[key]}
                      onChange={e => {
                        if (key === 'nombre') {
                          const val = e.target.value;
                          if (/[0-9]/.test(val)) { setNameError('El nombre solo puede contener letras'); return; }
                          setNameError('');
                        }
                        setFormData({ ...formData, [key]: e.target.value });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ border: `1px solid ${key === 'nombre' && nameError ? '#DC2626' : 'rgba(45,75,57,0.12)'}`, color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                      onFocus={e => e.target.style.borderColor = key === 'nombre' && nameError ? '#DC2626' : '#B8860B'}
                      onBlur={e => e.target.style.borderColor = key === 'nombre' && nameError ? '#DC2626' : 'rgba(45,75,57,0.12)'}
                    />
                    {key === 'nombre' && nameError && (
                      <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#DC2626' }}>
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />{nameError}
                      </p>
                    )}
                  </div>
                ))}

                {/* Email (readonly) */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(45,75,57,0.6)' }}>
                    <Mail className="w-3.5 h-3.5" />Email
                  </label>
                  <input
                    type="email"
                    value={profileData?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ border: '1px solid rgba(45,75,57,0.08)', color: 'rgba(45,75,57,0.4)', backgroundColor: 'rgba(45,75,57,0.03)', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Tipo documento */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(45,75,57,0.6)' }}>
                    <FileText className="w-3.5 h-3.5" />Tipo de Documento
                  </label>
                  <select
                    value={formData.tipo_documento}
                    onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                    onFocus={e => e.target.style.borderColor = '#B8860B'}
                    onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                  >
                    <option>Cédula de Ciudadanía</option>
                    <option>Tarjeta de Identidad</option>
                    <option>Cédula de Extranjería</option>
                  </select>
                </div>
              </div>

              {/* Cambio de contraseña */}
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(45,75,57,0.08)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(45,75,57,0.5)' }}>CAMBIAR CONTRASEÑA <span className="font-normal">(opcional)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(45,75,57,0.6)' }}>
                      <Lock className="w-3.5 h-3.5" />Nueva contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="Dejar en blanco para no cambiar"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                      onFocus={e => e.target.style.borderColor = '#B8860B'}
                      onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                    />
                    <AnimatePresence>
                      {newPassword.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(45,75,57,0.04)', border: '1px solid rgba(45,75,57,0.08)' }}
                        >
                          <ProfilePasswordHints password={newPassword} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(45,75,57,0.6)' }}>
                      <Lock className="w-3.5 h-3.5" />Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                      onFocus={e => e.target.style.borderColor = '#B8860B'}
                      onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                    />
                    {confirmPassword.length > 0 && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: newPassword === confirmPassword ? '#059669' : '#DC2626' }}>
                        {newPassword === confirmPassword
                          ? <><CheckCircle2 className="w-3.5 h-3.5" />Las contraseñas coinciden</>
                          : <><XCircle className="w-3.5 h-3.5" />No coinciden</>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleSave}
                className="mt-6 px-8 py-3 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: '#2D4B39' }}
                whileHover={{ backgroundColor: '#B8860B' }}
                whileTap={{ scale: 0.97 }}
              >
                Guardar Cambios
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-full w-fit" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }}>
          {(['orders', 'workshops'] as const).map(tab => {
            // Contador de acciones pendientes por tab
            const count = tab === 'orders'
              ? pedidosRechazados.length
              : misAbonos.filter((a: any) => a.estado === 'por_verificar' || (a.estado === 'aprobado' && Number(a.saldo_pendiente) > 0) || a.estado === 'rechazado').length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: activeTab === tab ? '#2D4B39' : 'transparent',
                  color: activeTab === tab ? 'white' : 'rgba(45,75,57,0.55)',
                }}
              >
                {tab === 'orders' ? 'Mis Pedidos' : 'Mis Talleres'}
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                    style={{ fontSize: '9px', fontWeight: 700, background: '#EF4444', lineHeight: 1 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div key="orders" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-8">
              {pedidos.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No tienes pedidos aún" subtitle="Cuando realices un pedido aparecerá aquí" />
              ) : (
                <>
                  {/* SECCIÓN 1: PEDIDOS RECHAZADOS (Sólo aparece si hay alguno) */}
                  {pedidosRechazados.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-red-700">Requerido: Corregir Comprobante de Pago</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold ml-auto">
                          {pedidosRechazados.length}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {pedidosRechazados.map((p: any) => (
                          <div 
                            key={p.id_pedidos} 
                            className="bg-white rounded-xl p-5 flex flex-col gap-4 transition-all" 
                            style={{ 
                              border: '1.5px dashed #EF4444',
                              backgroundColor: 'rgba(239,68,68,0.01)'
                            }}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <p className="font-medium text-sm mb-0.5" style={{ color: '#2D4B39' }}>
                                  PED-{String(p.id_pedidos).padStart(4, '0')}
                                </p>
                                <p className="text-xs" style={{ color: 'rgba(45,75,57,0.5)' }}>{formatFecha(p.fecha)}</p>
                              </div>
                              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                <p className="font-elegant text-base" style={{ color: '#B8860B' }}>
                                  ${Number(p.total).toLocaleString('es-CO')}
                                </p>
                                <StatusBadge estado={p.estado} type="pedido" />
                                <button
                                  onClick={() => setPedidoDetalle(p)}
                                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                                  style={{ borderColor: 'rgba(45,75,57,0.15)', color: '#2D4B39' }}
                                >
                                  <Eye className="w-3 h-3" /> Ver detalle
                                </button>
                              </div>
                            </div>

                            {/* Detalle de Rechazo y Acción */}
                            <div 
                              className="rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                              style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-red-800 mb-1 uppercase tracking-wide">Motivo del rechazo:</p>
                                <p className="text-xs text-red-700 italic">
                                  "{p.motivo_rechazo || 'La imagen enviada no corresponde al comprobante o el valor no coincide.'}"
                                </p>
                              </div>

                              <div className="flex-shrink-0">
                                <label className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all bg-red-600 hover:bg-red-700 shadow-sm active:scale-95">
                                  {uploadingPedId === p.id_pedidos ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud className="w-3.5 h-3.5" />
                                      Subir nuevo comprobante
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleResubmitComprobante(e, p.id_pedidos)}
                                    disabled={uploadingPedId !== null}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 2: HISTORIAL GENERAL DE PEDIDOS (Pendientes y Completados) */}
                  <div className="space-y-3">
                    {pedidosRechazados.length > 0 && (
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 pb-1 border-b">
                        Historial de Pedidos
                      </h3>
                    )}
                    
                    {pedidosNormales.length === 0 && pedidosRechazados.length === 0 ? (
                      <EmptyState icon={ShoppingBag} title="No tienes pedidos aún" subtitle="Cuando realices un pedido aparecerá aquí" />
                    ) : pedidosNormales.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: 'rgba(45,75,57,0.4)' }}>
                        No tienes más pedidos en tu historial.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {pedidosNormales.map((p: any) => (
                          <div 
                            key={p.id_pedidos} 
                            className="bg-white rounded-xl p-5 flex flex-col gap-3 transition-all" 
                            style={{ border: '1px solid rgba(45,75,57,0.07)' }}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <p className="font-medium text-sm mb-0.5" style={{ color: '#2D4B39' }}>
                                  PED-{String(p.id_pedidos).padStart(4, '0')}
                                </p>
                                <p className="text-xs" style={{ color: 'rgba(45,75,57,0.5)' }}>{formatFecha(p.fecha)}</p>
                                {p.direccion_entrega && (
                                  <p className="text-xs mt-1 truncate" style={{ color: 'rgba(45,75,57,0.4)' }}>
                                    Entrega: {p.direccion_entrega}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                <p className="font-elegant text-base" style={{ color: '#B8860B' }}>
                                  ${Number(p.total).toLocaleString('es-CO')}
                                </p>
                                <StatusBadge estado={p.estado} type="pedido" />
                                <button
                                  onClick={() => setPedidoDetalle(p)}
                                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                                  style={{ borderColor: 'rgba(45,75,57,0.15)', color: '#2D4B39' }}
                                >
                                  <Eye className="w-3 h-3" /> Ver detalle
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="workshops" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
              {misAbonos.length === 0 ? (
                <EmptyState icon={Package} title="No estás inscrito en talleres" subtitle="Cuando te inscribas a un taller aparecerá aquí" />
              ) : (
                <div className="space-y-4">
                  {misAbonos.map((a: any) => {
                    const esRechazado    = a.estado === 'rechazado';
                    const esPorVerificar = a.estado === 'por_verificar';
                    const esAprobado     = a.estado === 'aprobado';
                    const esCompleto     = a.estado === 'completo';
                    const esCancelado    = a.estado === 'cancelado';
                    const tieneSaldo     = Number(a.saldo_pendiente) > 0;

                    // Estilo del borde según estado
                    const borderStyle = esRechazado
                      ? '1.5px dashed #EF4444'
                      : esAprobado && tieneSaldo
                      ? '1.5px solid rgba(239,68,68,0.35)'
                      : esPorVerificar
                      ? '1px solid rgba(245,158,11,0.3)'
                      : '1px solid rgba(45,75,57,0.08)';

                    return (
                      <div key={a.id_abono} className="bg-white rounded-xl p-5 flex flex-col gap-4"
                        style={{ border: borderStyle }}>

                        {/* Cabecera: nombre taller + badge estado */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-sm mb-0.5" style={{ color: '#2D4B39' }}>
                              {a.taller || '—'}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(45,75,57,0.5)' }}>
                              Abono: <strong>${Number(a.monto_abono).toLocaleString('es-CO')} COP</strong>
                              {tieneSaldo && !esCompleto && (
                                <> · Saldo: <strong style={{ color: '#DC2626' }}>${Number(a.saldo_pendiente).toLocaleString('es-CO')} COP</strong></>
                              )}
                              {' · '}{a.fecha_abono ? a.fecha_abono.split('T')[0] : '—'}
                            </p>
                            {/* Fecha del taller y límite de pago */}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                              {a.fecha_taller && (
                                <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(45,75,57,0.5)' }}>
                                  <Calendar className="w-3 h-3 flex-shrink-0" />
                                  Taller: <strong>{new Date(a.fecha_taller).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                  {a.hora_taller && <> · {String(a.hora_taller).slice(0, 5)}</>}
                                </p>
                              )}
                              {a.vencimiento_pago && tieneSaldo && !esCompleto && !esCancelado && (
                                <p className="text-xs flex items-center gap-1" style={{ color: new Date(a.vencimiento_pago) < new Date() ? '#DC2626' : '#B45309' }}>
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  Límite pago: <strong>{new Date(a.vencimiento_pago).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</strong>
                                </p>
                              )}
                            </div>
                          </div>
                          <AbonoEstadoBadge estado={a.estado} tieneSaldo={tieneSaldo} />
                        </div>

                        {/* RECHAZADO: motivo + botón resubir */}
                        {esRechazado && (
                          <div className="rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-red-800 mb-1 uppercase tracking-wide">Motivo del rechazo:</p>
                              <p className="text-xs text-red-700 italic">
                                "{a.motivo_rechazo || 'El comprobante adjunto no es válido o no cumple los requisitos.'}"
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer bg-red-600 hover:bg-red-700 shadow-sm active:scale-95">
                                {uploadingAbonoId === a.id_abono
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo...</>
                                  : <><UploadCloud className="w-3.5 h-3.5" />Subir nuevo comprobante</>}
                                <input type="file" accept="image/*,application/pdf"
                                  onChange={e => handleResubmitAbonoComprobante(e, a.id_abono)}
                                  disabled={uploadingAbonoId !== null}
                                  className="hidden" />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* POR VERIFICAR: mensaje de espera */}
                        {esPorVerificar && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: 'rgba(245,158,11,0.07)', color: '#92400E', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            Estamos revisando tu comprobante de pago. Te notificaremos pronto.
                          </div>
                        )}

                        {/* COMPLETO o APROBADO sin saldo: confirmación de inscripción */}
                        {(esCompleto || (esAprobado && !tieneSaldo)) && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: 'rgba(16,185,129,0.07)', color: '#065F46', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            Inscripción confirmada — ¡nos vemos en el taller!
                          </div>
                        )}

                        {/* CANCELADO: aviso sin devolución */}
                        {esCancelado && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs"
                            style={{ backgroundColor: 'rgba(107,114,128,0.05)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.12)' }}>
                            Tu inscripción fue cancelada por no completar el pago a tiempo. El abono no es reembolsable.
                          </div>
                        )}
                        {esAprobado && tieneSaldo && (
                          <>
                            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                              <p className="text-xs font-semibold text-red-800 mb-1">⚠️ Importante — Lee antes de continuar:</p>
                              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                                <li>Debes pagar el saldo <strong>antes de la fecha del taller</strong> para poder asistir.</li>
                                <li>Si no completas el pago a tiempo, <strong>perderás tu cupo sin derecho a devolución</strong> del abono realizado.</li>
                              </ul>
                            </div>
                            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer bg-red-600 hover:bg-red-700 shadow-sm active:scale-95">
                              {pagandoSaldoId === a.id_taller
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo...</>
                                : <><UploadCloud className="w-3.5 h-3.5" />Pagar saldo restante (${Number(a.saldo_pendiente).toLocaleString('es-CO')} COP)</>}
                              <input type="file" accept="image/*,application/pdf"
                                onChange={e => handlePagarSaldo(e, a.id_taller)}
                                disabled={pagandoSaldoId !== null}
                                className="hidden" />
                            </label>
                          </>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {pedidoDetalle && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPedidoDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(45,75,57,0.08)' }}>
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: '#B8860B' }}>PEDIDO</p>
                <h3 className="font-elegant text-xl" style={{ color: '#2D4B39' }}>
                  PED-{String(pedidoDetalle.id_pedidos).padStart(4, '0')}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge estado={pedidoDetalle.estado} type="pedido" />
                <button
                  onClick={() => setPedidoDetalle(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(45,75,57,0.06)', color: '#2D4B39' }}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="p-6">
              <div style={{ padding: '20px', background: 'rgba(184,134,11,0.05)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <ShoppingBag style={{ width: '20px', height: '20px', color: '#B8860B' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>PRODUCTOS DEL PEDIDO</span>
                </div>
                {Array.isArray(pedidoDetalle.detalle) && pedidoDetalle.detalle.filter((d: any) => d.nombre).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(45,75,57,0.08)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>#</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>Img</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>Producto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#2D4B39' }}>Cant.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2D4B39' }}>Precio Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoDetalle.detalle.filter((d: any) => d.nombre).map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(184,134,11,0.08)' }}>
                          <td style={{ padding: '8px 12px', color: '#9CA3AF' }}>{i + 1}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {item.imagen_url
                              ? <img src={item.imagen_url} alt={item.nombre} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(45,75,57,0.08)' }} />
                              : <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(45,75,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package style={{ width: '14px', height: '14px', color: 'rgba(45,75,57,0.25)' }} /></div>
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
                  <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>El detalle de este pedido no está disponible.</p>
                )}
                {pedidoDetalle.direccion_entrega && (
                  <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>📍 {pedidoDetalle.direccion_entrega}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { onLogout(); setShowLogoutModal(false); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

function ProfilePasswordHints({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 10,                    label: 'Mínimo 10 caracteres' },
    { ok: /\d/.test(password),                      label: 'Al menos 1 número' },
    { ok: /[A-Z]/.test(password),                   label: 'Al menos 1 mayúscula' },
    { ok: /[_\-@$#%&/!?.*+^=]/.test(password),     label: 'Al menos 1 signo especial (_ - @ $ # % & / ! ? . * + ^ =)' },
  ];
  return (
    <ul className="space-y-1">
      {rules.map(r => (
        <li key={r.label} className="flex items-center gap-1.5 text-xs">
          {r.ok
            ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#059669' }} />
            : <XCircle     className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(45,75,57,0.25)' }} />}
          <span style={{ color: r.ok ? '#059669' : 'rgba(45,75,57,0.5)' }}>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

function AbonoEstadoBadge({ estado, tieneSaldo }: { estado: string; tieneSaldo: boolean }) {
  if (estado === 'rechazado')     return <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626' }}>Rechazado</span>;
  if (estado === 'cancelado')     return <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(107,114,128,0.08)', color: '#6B7280' }}>Cancelado</span>;
  if (estado === 'completo')      return <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(5,150,105,0.08)', color: '#059669' }}>Confirmado</span>;
  if (estado === 'aprobado' && tieneSaldo) return <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626' }}>Saldo pendiente</span>;
  if (estado === 'aprobado')      return <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#2563EB' }}>Aprobado</span>;
  return                                 <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#B45309' }}>En revisión</span>;
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }}>
        <Icon className="w-6 h-6" style={{ color: 'rgba(45,75,57,0.3)' }} />
      </div>
      <p className="font-medium text-sm mb-1" style={{ color: '#2D4B39' }}>{title}</p>
      <p className="text-xs" style={{ color: 'rgba(45,75,57,0.45)' }}>{subtitle}</p>
    </div>
  );
}

function StatusBadge({ estado, type }: { estado: any; type: 'pedido' | 'matricula' }) {
  let label = '', bg = '', color = '';
  if (type === 'pedido') {
    if (estado === 'COMPLETADO' || estado === true) { label = 'Completado'; bg = 'rgba(5,150,105,0.08)'; color = '#059669'; }
    else if (estado === 'EN_PRODUCCION') { label = 'En Producción'; bg = 'rgba(217,119,6,0.08)'; color = '#D97706'; }
    else if (isPedidoRechazado(estado)) { label = 'Rechazado'; bg = 'rgba(239,68,68,0.08)'; color = '#DC2626'; }
    else { label = 'Pendiente'; bg = 'rgba(184,134,11,0.08)'; color = '#B8860B'; }
  } else {
    if (estado === 'activo' || estado === 'activa') { label = 'Activo'; bg = 'rgba(5,150,105,0.08)'; color = '#059669'; }
    else if (estado === 'pendiente_pago') { label = 'Pago pendiente'; bg = 'rgba(239,68,68,0.08)'; color = '#DC2626'; }
    else { label = estado || 'Inactiva'; bg = 'rgba(239,68,68,0.08)'; color = '#DC2626'; }
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: bg, color }}>
      {label}
    </span>
  );
}