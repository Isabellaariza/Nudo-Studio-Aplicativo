import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Users, MapPin, X, Upload, User, Package, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { abonosAPI, talleresAPI } from '../../lib/api';

interface WorkshopsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
}

export function WorkshopsPage({ onNavigate, user }: WorkshopsPageProps) {
  const [talleres, setTalleres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inscritosIds, setInscritosIds] = useState<number[]>(() => {
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem('talleres_inscritos') || '[]'); } catch { return []; }
  });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const data = await talleresAPI.getAll();
      setTalleres(data.talleres || []);
    } catch {
      toast.error('Error al cargar talleres');
    } finally {
      setLoading(false);
    }
  };

  const estaLleno = (t: any) => {
    const cupos = Number(t.cupos);
    const ocupados = Number(t.cupos_ocupados) || 0;
    return cupos > 0 && ocupados >= cupos;
  };

  const formatHora = (hora: string) => {
    if (!hora) return null;
    const [h, m] = hora.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const formatFecha = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleInscribirse = (taller: any) => {
    if (!user) {
      toast.error('Debes iniciar sesión para inscribirte', {
        action: { label: 'Iniciar sesión', onClick: () => onNavigate('login') },
        duration: 5000,
      });
      return;
    }
    if (estaLleno(taller)) { toast.error('Este taller no tiene cupos disponibles'); return; }
    setSelected(taller);
    setDepositAmount('');
    setUploadedFile(null);
  };

  const handleConfirmar = async () => {
    if (!selected) return;
    const precio = Number(selected.precio);
    const minimo = precio * 0.5;
    const monto = Number(String(depositAmount).replace(/[^0-9]/g, ''));

    if (!depositAmount || isNaN(monto) || monto < minimo) {
      toast.error(`El abono mínimo es $${minimo.toLocaleString('es-CO')} COP (50%)`);
      return;
    }
    if (monto > precio) {
      toast.error(`El abono no puede superar el valor total del taller ($${precio.toLocaleString('es-CO')} COP)`);
      return;
    }
    if (!uploadedFile) { toast.error('Por favor sube el comprobante de pago'); return; }

    setSubmitting(true);
    try {
      // Subir comprobante a Cloudinary
      const cloudForm = new FormData();
      cloudForm.append('file', uploadedFile);
      cloudForm.append('upload_preset', 'nudo_studio');
      const cloudRes = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: cloudForm });
      if (!cloudRes.ok) throw new Error('No se pudo subir el comprobante');
      const cloudData = await cloudRes.json();

      await abonosAPI.crearAbonoTaller({
        id_taller: selected.id_talleres,
        monto_abono: monto,
        metodo_pago: 'Transferencia',
        comprobante_pago: cloudData.secure_url,
      });

      toast.success('¡Inscripción enviada! Verificaremos tu pago y te confirmaremos.');
      const nuevosInscritos = [...inscritosIds, selected.id_talleres];
      setInscritosIds(nuevosInscritos);
      localStorage.setItem('talleres_inscritos', JSON.stringify(nuevosInscritos));
      setSelected(null);
      cargar();
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la inscripción');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 px-6" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="pt-16 pb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Aprende con nosotros</span>
          </div>
          <h1 className="font-elegant mb-4" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', color: '#2D4B39', lineHeight: 1.05 }}>
            Talleres
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'rgba(45,75,57,0.6)' }}>
            Aprende el arte del macramé y tejido textil con nuestros expertos. Talleres prácticos para todos los niveles.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-7 bg-white animate-pulse" style={{ border: '1px solid rgba(45,75,57,0.07)' }}>
                <div className="h-5 rounded-full w-2/3 mb-4" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }} />
                <div className="space-y-3 mb-6">
                  {[1, 2, 3].map(j => <div key={j} className="h-3 rounded-full" style={{ backgroundColor: 'rgba(45,75,57,0.04)', width: `${60 + j * 10}%` }} />)}
                </div>
                <div className="h-11 rounded-full" style={{ backgroundColor: 'rgba(45,75,57,0.05)' }} />
              </div>
            ))}
          </div>
        ) : talleres.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-medium mb-1" style={{ color: '#2D4B39' }}>No hay talleres disponibles por el momento</p>
            <p className="text-sm" style={{ color: 'rgba(45,75,57,0.5)' }}>Vuelve pronto para ver nuevas fechas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {talleres.map((taller, index) => {
              const lleno = estaLleno(taller);
              const inscritos = Number(taller.cupos_ocupados) || 0;
              const expanded = expandedId === taller.id_talleres;
              const materiales = taller.materiales ? String(taller.materiales).split(', ').filter(Boolean) : [];

              return (
                <motion.div
                  key={taller.id_talleres}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(45,75,57,0.07)', boxShadow: '0 2px 12px rgba(45,75,57,0.06)' }}
                >
                  <div className="p-7">
                    {/* Cabecera */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-3">
                        <h3 className="font-elegant text-xl mb-1" style={{ color: '#2D4B39' }}>
                          {taller.nombre_taller}
                        </h3>
                        {/* Instructor */}
                        {(taller.nombre_instructor || taller.instructor_nombre) && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <User className="w-3.5 h-3.5" style={{ color: '#B8860B' }} />
                            <span className="text-sm" style={{ color: '#B8860B', fontWeight: 500 }}>
                              {taller.instructor_nombre || taller.nombre_instructor}
                            </span>
                          </div>
                        )}
                        {/* Descripción */}
                        {taller.descripcion && (
                          <p className="text-sm" style={{ color: 'rgba(45,75,57,0.6)', lineHeight: 1.5 }}>
                            {taller.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className="ml-2 flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: lleno ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                          color: lleno ? '#DC2626' : '#059669',
                        }}
                      >
                        {lleno ? 'Lleno' : 'Disponible'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <InfoRow icon={Calendar} text={formatFecha(taller.fecha)} />
                      {taller.hora && <InfoRow icon={Clock} text={formatHora(taller.hora) ?? taller.hora} />}
                      {taller.lugar && <InfoRow icon={MapPin} text={taller.lugar} />}
                      <InfoRow
                        icon={Users}
                        text={`${inscritos} inscrito${inscritos !== 1 ? 's' : ''}`}
                        muted={lleno}
                      />
                    </div>

                    {/* Materiales — expandible */}
                    {materiales.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedId(expanded ? null : taller.id_talleres)}
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: '#2D4B39', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Package className="w-3.5 h-3.5" />
                          Materiales incluidos ({materiales.length})
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {materiales.map((mat: string, i: number) => (
                                  <span key={i} className="px-2.5 py-1 rounded-full text-xs"
                                    style={{ backgroundColor: 'rgba(45,75,57,0.06)', color: 'rgba(45,75,57,0.75)' }}>
                                    {mat}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Precio + botón */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(45,75,57,0.07)' }}>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'rgba(45,75,57,0.45)' }}>Precio · materiales incluidos</p>
                        <p className="font-elegant text-xl" style={{ color: '#B8860B' }}>
                          ${Number(taller.precio).toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      {(() => {
                        const yaInscrito = inscritosIds.includes(taller.id_talleres);
                        if (yaInscrito) {
                          return (
                            <div className="flex flex-col items-end gap-1.5">
                              <span
                                className="px-4 py-2 rounded-full text-xs font-medium"
                                style={{ backgroundColor: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}
                              >
                                ✓ Ya inscrito
                              </span>
                              <button
                                onClick={() => onNavigate('login')}
                                className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                                style={{ color: '#B8860B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                <UserPlus className="w-3 h-3" />
                                Inscribir otra persona
                              </button>
                            </div>
                          );
                        }
                        return (
                          <motion.button
                            onClick={() => handleInscribirse(taller)}
                            disabled={lleno}
                            className="px-6 py-2.5 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: lleno ? 'rgba(45,75,57,0.06)' : '#2D4B39',
                              color: lleno ? 'rgba(45,75,57,0.35)' : 'white',
                              cursor: lleno ? 'not-allowed' : 'pointer',
                            }}
                            whileHover={lleno ? {} : { backgroundColor: '#B8860B', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}
                            whileTap={lleno ? {} : { scale: 0.97 }}
                          >
                            {lleno ? 'Sin cupos' : 'Inscribirse'}
                          </motion.button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal inscripción */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '0 32px 64px rgba(45,75,57,0.2)' }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-elegant text-2xl mb-1" style={{ color: '#2D4B39' }}>Inscripción</h2>
                  <p className="text-sm" style={{ color: 'rgba(45,75,57,0.55)' }}>{selected.nombre_taller}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(45,75,57,0.06)', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4" style={{ color: '#2D4B39' }} />
                </button>
              </div>

              {/* Resumen taller */}
              <div className="rounded-xl p-5 mb-5 space-y-2.5" style={{ backgroundColor: 'rgba(45,75,57,0.03)', border: '1px solid rgba(45,75,57,0.07)' }}>
                {(selected.instructor_nombre || selected.nombre_instructor) && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 flex-shrink-0" style={{ color: '#B8860B' }} />
                    <span className="text-sm font-medium" style={{ color: '#2D4B39' }}>
                      {selected.instructor_nombre || selected.nombre_instructor}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#B8860B' }} />
                  <span className="text-sm" style={{ color: '#2D4B39' }}>{formatFecha(selected.fecha)}</span>
                </div>
                {selected.hora && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#B8860B' }} />
                    <span className="text-sm" style={{ color: '#2D4B39' }}>{formatHora(selected.hora) ?? selected.hora}</span>
                  </div>
                )}
                {selected.lugar && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#B8860B' }} />
                    <span className="text-sm" style={{ color: '#2D4B39' }}>{selected.lugar}</span>
                  </div>
                )}
                <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(45,75,57,0.07)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(45,75,57,0.45)' }}>Valor total · materiales incluidos</p>
                  <p className="font-elegant text-xl" style={{ color: '#B8860B' }}>
                    ${Number(selected.precio).toLocaleString('es-CO')} COP
                  </p>
                </div>
              </div>

              {/* Nota materiales */}
              <div className="rounded-xl p-4 mb-5 text-sm" style={{ backgroundColor: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.15)', color: '#92400e' }}>
                ✅ Todos los materiales están incluidos. Solo debes traerte a ti mismo/a.
              </div>

              {/* Datos bancarios */}
              <div className="rounded-2xl p-5 mb-5" style={{ border: '1px solid rgba(184,134,11,0.25)', backgroundColor: 'rgba(184,134,11,0.02)' }}>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#2D4B39' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#B8860B' }} />
                  Información de Pago (Transferencia)
                </h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(45,75,57,0.7)' }}>
                  Realiza la transferencia del monto a nuestra cuenta y adjunta el comprobante abajo.
                </p>
                <div className="rounded-xl p-3.5 text-xs space-y-1.5" style={{ backgroundColor: '#FAF7F2', border: '1px solid rgba(45,75,57,0.05)' }}>
                  <p style={{ color: '#2D4B39' }}><strong>Banco:</strong> Bancolombia (Cuenta de Ahorros)</p>
                  <p style={{ color: '#2D4B39' }}><strong>Número de Cuenta:</strong> 123-456789-01</p>
                  <p style={{ color: '#2D4B39' }}><strong>Titular:</strong> Nudo Studio S.A.S.</p>
                </div>
              </div>

              {/* Monto */}
              {(() => {
                const precio = Number(selected.precio);
                const minimo = precio * 0.5;
                const monto = Number(depositAmount);
                const montoValido = depositAmount !== '' && !isNaN(monto) && monto >= minimo && monto <= precio;
                const montoInsuficiente = depositAmount !== '' && !isNaN(monto) && monto < minimo;
                const montoExcedido = depositAmount !== '' && !isNaN(monto) && monto > precio;
                return (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#2D4B39' }}>Monto de Abono *</label>
                    <p className="text-xs mb-2" style={{ color: 'rgba(45,75,57,0.5)' }}>
                      Mínimo 50% — <strong style={{ color: '#B8860B' }}>${minimo.toLocaleString('es-CO')}</strong>
                      &nbsp;·&nbsp;Máximo <strong style={{ color: '#2D4B39' }}>${precio.toLocaleString('es-CO')} COP</strong>
                    </p>
                    <input
                      type="number"
                      value={depositAmount}
                      min={minimo}
                      max={precio}
                      onChange={e => {
                        const val = e.target.value;
                        // Bloquea en tiempo real si supera el precio total
                        if (val !== '' && Number(val) > precio) {
                          setDepositAmount(String(precio));
                        } else {
                          setDepositAmount(val);
                        }
                      }}
                      placeholder={`Entre ${minimo.toLocaleString('es-CO')} y ${precio.toLocaleString('es-CO')}`}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        border: `1px solid ${
                          montoExcedido ? '#ef4444'
                          : montoInsuficiente ? '#ef4444'
                          : montoValido ? '#10b981'
                          : 'rgba(45,75,57,0.15)'
                        }`,
                        color: '#2D4B39',
                        backgroundColor: '#FAFAFA',
                      }}
                    />
                    {montoInsuficiente && (
                      <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                        ⚠️ El abono mínimo es ${minimo.toLocaleString('es-CO')} COP (50%)
                      </p>
                    )}
                    {montoExcedido && (
                      <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                        ⚠️ El abono no puede superar el valor total del taller (${precio.toLocaleString('es-CO')} COP)
                      </p>
                    )}
                    {montoValido && (
                      <p className="text-xs mt-1.5" style={{ color: '#10b981' }}>
                        ✓ Saldo restante: ${Math.max(0, precio - monto).toLocaleString('es-CO')} COP
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Comprobante */}
              <div className="mb-7">
                <label className="block text-sm font-medium mb-2" style={{ color: '#2D4B39' }}>Comprobante de Pago *</label>
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer"
                  style={{ borderColor: uploadedFile ? '#059669' : 'rgba(45,75,57,0.15)', backgroundColor: uploadedFile ? 'rgba(5,150,105,0.04)' : 'transparent' }}
                  onClick={() => document.getElementById('file-upload-ws')?.click()}
                >
                  <input id="file-upload-ws" type="file" className="hidden" accept="image/*,.pdf"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadedFile(f); toast.success('Comprobante cargado'); } }} />
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: uploadedFile ? '#059669' : 'rgba(45,75,57,0.35)' }} />
                  <p className="text-sm font-medium" style={{ color: uploadedFile ? '#059669' : '#2D4B39' }}>
                    {uploadedFile ? uploadedFile.name : 'Subir comprobante'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(45,75,57,0.4)' }}>PNG, JPG o PDF (máx. 5MB)</p>
                </div>
              </div>

              {/* Acciones */}
              {(() => {
                const montoNum = Number(depositAmount);
                const precio = Number(selected.precio);
                const puedeConfirmar = depositAmount !== '' && !isNaN(montoNum) && montoNum >= precio * 0.5 && montoNum <= precio && !!uploadedFile;
                return (
                  <div className="flex gap-3">
                    <button onClick={() => setSelected(null)}
                      className="flex-1 py-3 rounded-full text-sm font-medium"
                      style={{ backgroundColor: 'rgba(45,75,57,0.06)', color: 'rgba(45,75,57,0.6)', border: 'none', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <motion.button
                      onClick={handleConfirmar}
                      disabled={submitting || !puedeConfirmar}
                      className="flex-1 py-3 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: submitting || !puedeConfirmar ? '#9CA3AF' : '#2D4B39', border: 'none', cursor: submitting || !puedeConfirmar ? 'not-allowed' : 'pointer' }}
                      whileHover={submitting || !puedeConfirmar ? {} : { backgroundColor: '#B8860B', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}
                      whileTap={submitting || !puedeConfirmar ? {} : { scale: 0.97 }}
                    >
                      {submitting ? 'Enviando...' : 'Confirmar Inscripción'}
                    </motion.button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ icon: Icon, text, muted }: { icon: any; text: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: muted ? 'rgba(45,75,57,0.3)' : '#B8860B' }} />
      <span className="text-sm" style={{ color: muted ? 'rgba(45,75,57,0.4)' : 'rgba(45,75,57,0.75)' }}>{text}</span>
    </div>
  );
}
