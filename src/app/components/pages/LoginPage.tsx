import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, ArrowRight, Loader2, Phone, MapPin, FileText, CreditCard, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../../lib/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

function PasswordHints({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 10,          label: 'Mínimo 10 caracteres' },
    { ok: /\d/.test(password),            label: 'Al menos 1 número' },
    { ok: /[A-Z]/.test(password),         label: 'Al menos 1 mayúscula' },
    { ok: /[_\-@$#%&/!?.*+^=]/.test(password), label: 'Al menos 1 signo especial (_ - @ $ # % & / ! ? . * + ^ =)' },
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

function StyledInput({ showToggle, onFocus, onBlur, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { showToggle?: boolean }) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === 'password';
  return (
    <div className="relative">
      <input
        {...props}
        type={isPassword && show ? 'text' : props.type}
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all pr-10"
        style={{ border: '1.5px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
        onFocus={e => { e.target.style.borderColor = '#B8860B'; e.target.style.boxShadow = '0 0 0 3px rgba(184,134,11,0.1)'; onFocus?.(e); }}
        onBlur={e => { e.target.style.borderColor = 'rgba(45,75,57,0.12)'; e.target.style.boxShadow = 'none'; onBlur?.(e); }}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(45,75,57,0.4)' }}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
      style={{ border: '1.5px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
      onFocus={e => { e.target.style.borderColor = '#B8860B'; e.target.style.boxShadow = '0 0 0 3px rgba(184,134,11,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(45,75,57,0.12)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'rgba(45,75,57,0.6)' }}>
        <Icon className="w-3.5 h-3.5" />{label}
      </label>
      {children}
    </div>
  );
}

function SubmitBtn({ isLoading, label }: { isLoading: boolean; label: string }) {
  return (
    <motion.button type="submit" disabled={isLoading}
      className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white mt-1"
      style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)', boxShadow: '0 4px 16px rgba(45,75,57,0.25)' }}
      whileHover={isLoading ? {} : { boxShadow: '0 8px 24px rgba(184,134,11,0.35)', background: 'linear-gradient(135deg, #B8860B 0%, #96690a 100%)' }}
      whileTap={isLoading ? {} : { scale: 0.97 }}>
      {isLoading
        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Procesando...</span></>
        : <><span>{label}</span><ArrowRight className="w-4 h-4" /></>}
    </motion.button>
  );
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '', documentType: 'Cédula de Ciudadanía', documentNumber: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) { setResetToken(t); setMode('reset'); }
  }, []);

  const passwordRules = (pwd: string) => ({
    length:  pwd.length >= 10,
    number:  /\d/.test(pwd),
    upper:   /[A-Z]/.test(pwd),
    special: /[_\-@$#%&/!?.*+^=]/.test(pwd),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      if (mode === 'login') {
        const data = await auth.signIn(formData.email, formData.password);
        toast.success(`¡Bienvenido/a ${data.usuario.nombre}!`);
        onLoginSuccess();
      } else {
        if (!formData.name.trim()) { toast.error('El nombre es obligatorio'); setIsLoading(false); return; }
        if (nameError) { toast.error('El nombre solo puede contener letras'); setIsLoading(false); return; }
        if (!formData.phone.trim()) { toast.error('El telefono es obligatorio'); setIsLoading(false); return; }
        if (!formData.documentNumber.trim()) { toast.error('El numero de documento es obligatorio'); setIsLoading(false); return; }
        if (!formData.address.trim()) { toast.error('La direccion es obligatoria'); setIsLoading(false); return; }
        if (!formData.email.trim()) { toast.error('El correo es obligatorio'); setIsLoading(false); return; }
        if (!formData.password) { toast.error('La contrasena es obligatoria'); setIsLoading(false); return; }
        const rules = passwordRules(formData.password);
        if (!rules.length || !rules.number || !rules.upper || !rules.special) {
          toast.error('La contrasena no cumple los requisitos de seguridad');
          setIsLoading(false); return;
        }
        await auth.signUp(formData.name, formData.email, formData.password, formData.phone, formData.address, formData.documentType, formData.documentNumber);
        toast.success('Cuenta creada. Ahora inicia sesion.');
        setMode('login'); setFormData({ ...formData, password: '' });
      }
    } catch (err: any) {
      if (err.message?.includes('no está registrado')) {
        toast.error(err.message, { action: { label: 'Registrarme', onClick: () => setMode('register') }, duration: 6000 });
      } else if (err.message?.includes('ya tiene una cuenta')) {
        toast.error(err.message, { action: { label: 'Iniciar sesión', onClick: () => setMode('login') }, duration: 7000 });
      } else { toast.error(err.message || 'Error en la autenticación'); }
    } finally { setIsLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const res = await auth.forgotPassword(forgotEmail);
      if (res.token) {
        setResetToken(res.token);
        setMode('reset');
        toast.success('Correo verificado. Crea tu nueva contraseña.');
      } else {
        toast.error('No se encontró una cuenta con ese correo.');
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Las contraseñas no coinciden');
    const rules = passwordRules(newPassword);
    if (!rules.length || !rules.number || !rules.upper || !rules.special)
      return toast.error('La contraseña no cumple los requisitos de seguridad');
    setIsLoading(true);
    try {
      await auth.resetPassword(resetToken, newPassword);
      toast.success('¡Contraseña actualizada! Ya puedes iniciar sesión.');
      setMode('login'); setResetToken(''); setNewPassword(''); setConfirmPassword(''); setForgotEmail('');
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 40px' }}>



      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>

        {/* Card */}
        <motion.div
          style={{ backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(45,75,57,0.12)', border: '1px solid rgba(255,255,255,0.8)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Franja superior */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #2D4B39, #B8860B, #2D4B39)' }} />

          <div style={{ padding: '32px' }}>
            {/* Título dinámico */}
            <AnimatePresence mode="wait">
              <motion.div key={mode} className="mb-6"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ textAlign: 'center' }}>
                <h1 className="font-elegant mb-1" style={{ fontSize: '1.75rem', color: '#2D4B39', lineHeight: 1.1 }}>
                  {mode === 'login' && 'Inicio de sesión'}
                  {mode === 'register' && 'Registrarse'}
                  {mode === 'forgot' && 'Recuperar contraseña'}
                  {mode === 'reset' && 'Nueva contraseña'}
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'rgba(45,75,57,0.45)', textAlign: 'center' }}>
                  {mode === 'login' && 'Ingresa tus datos para continuar'}
                  {mode === 'register' && 'Completa el formulario para registrarte'}
                  {mode === 'forgot' && 'Te enviaremos un enlace a tu correo'}
                  {mode === 'reset' && 'Crea tu nueva contraseña'}
                </p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── FORGOT ── */}
              {mode === 'forgot' && (
                <motion.form key="forgot" onSubmit={handleForgot} className="space-y-4"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <Field icon={Mail} label="Correo electrónico">
                    <StyledInput type="email" placeholder="tu@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  </Field>
                  <SubmitBtn isLoading={isLoading} label="Enviar instrucciones" />
                  <div className="text-center pt-1">
                    <button type="button" onClick={() => setMode('login')} className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(45,75,57,0.45)' }}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── RESET ── */}
              {mode === 'reset' && (
                <motion.form key="reset" onSubmit={handleReset} className="space-y-4"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(45,75,57,0.06)', border: '1px solid rgba(45,75,57,0.12)', fontSize: '12px', color: '#2D4B39', lineHeight: 1.6, textAlign: 'center' }}>
                    Correo verificado ✅ Crea tu nueva contraseña para <strong>{forgotEmail}</strong>
                  </div>
                  <Field icon={Lock} label="Nueva contraseña">
                    <StyledInput type="password" placeholder="Mínimo 10 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    {newPassword.length > 0 && (
                      <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(45,75,57,0.04)', border: '1px solid rgba(45,75,57,0.08)' }}>
                        <PasswordHints password={newPassword} />
                      </div>
                    )}
                  </Field>
                  <Field icon={Lock} label="Confirmar contraseña">
                    <StyledInput type="password" placeholder="Repite tu nueva contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </Field>
                  <SubmitBtn isLoading={isLoading} label="Cambiar contraseña" />
                  <div className="text-center pt-1">
                    <button type="button" onClick={() => setMode('forgot')} className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(45,75,57,0.45)' }}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── LOGIN / REGISTER ── */}
              {(mode === 'login' || mode === 'register') && (
                <motion.form key={mode} onSubmit={handleSubmit} className="space-y-4"
                  initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div className="space-y-4"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <Field icon={User} label="Nombre Completo">
                          <StyledInput
                            type="text"
                            placeholder="Tu nombre completo"
                            value={formData.name}
                            onChange={e => {
                              const val = e.target.value;
                              if (/[0-9]/.test(val)) {
                                setNameError('El nombre solo puede contener letras');
                              } else {
                                setNameError('');
                                setFormData({ ...formData, name: val });
                              }
                            }}
                            required
                          />
                          {nameError && (
                            <p className="mt-1 text-xs flex items-center gap-1" style={{ color: '#DC2626' }}>
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0" />{nameError}
                            </p>
                          )}
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field icon={Phone} label="Teléfono">
                            <StyledInput type="tel" placeholder="300 123 4567" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                          </Field>
                          <Field icon={FileText} label="Tipo de Documento">
                            <StyledSelect value={formData.documentType} onChange={e => setFormData({ ...formData, documentType: e.target.value })}>
                              <option>Cédula de Ciudadanía</option>
                              <option>Tarjeta de Identidad</option>
                              <option>Cédula de Extranjería</option>
                            </StyledSelect>
                          </Field>
                        </div>
                        <Field icon={CreditCard} label="Número de Documento">
                          <StyledInput type="text" placeholder="1234567890" value={formData.documentNumber} onChange={e => setFormData({ ...formData, documentNumber: e.target.value })} required />
                        </Field>
                        <Field icon={MapPin} label="Dirección">
                          <StyledInput type="text" placeholder="Calle 123 #45-67" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Field icon={Mail} label="Correo electrónico">
                    <StyledInput type="email" placeholder="tu@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </Field>
                  <Field icon={Lock} label="Contraseña">
                    <StyledInput
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => mode === 'register' && setShowPasswordHints(true)}
                      onBlur={() => setShowPasswordHints(false)}
                      required
                    />
                    <AnimatePresence>
                      {mode === 'register' && (formData.password.length > 0 || showPasswordHints) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(45,75,57,0.04)', border: '1px solid rgba(45,75,57,0.08)' }}
                        >
                          <PasswordHints password={formData.password} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Field>

                  {mode === 'login' && (
                    <div className="flex justify-center -mt-1">
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot')} 
                        className="text-xs hover:underline" 
                        style={{ color: '#B8860B' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <SubmitBtn isLoading={isLoading} label={mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'} />
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Toggle login/register */}
        {(mode === 'login' || mode === 'register') && (
          <motion.p className="mt-5 text-center text-sm" style={{ color: 'rgba(45,75,57,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold underline underline-offset-2" style={{ color: '#2D4B39' }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </motion.p>
        )}

      </div>
    </div>
  );
}
