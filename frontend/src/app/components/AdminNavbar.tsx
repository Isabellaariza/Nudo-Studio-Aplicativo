import { useState, useEffect } from 'react';
import { LogOut, RefreshCw, Bell, X, ShoppingCart, AlertTriangle, UserPlus, GraduationCap, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificacionesAPI } from '../lib/api';
import { LogoutModal } from './LogoutModal';

interface AdminNavbarProps {
  user: any;
  onLogout: () => void;
  onRefresh?: () => void;
  onNavigate?: (section: string) => void;
}

const TIPO_CONFIG: Record<string, { icon: any; color: string }> = {
  pedido:    { icon: ShoppingCart, color: '#10B981' },
  stock:     { icon: AlertTriangle, color: '#EF4444' },
  cliente:   { icon: UserPlus,     color: '#6366F1' },
  matricula: { icon: GraduationCap, color: '#B8860B' },
  abono:     { icon: Wallet,       color: '#F59E0B' },
};

function timeAgo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function AdminNavbar({ user, onLogout, onRefresh, onNavigate }: AdminNavbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]')); } catch { return new Set(); }
  });

  const cargarNotificaciones = async () => {
    try {
      const { notificaciones } = await notificacionesAPI.getAll();
      setNotifications(notificaciones || []);
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !readIds.has(n.id));
  const unreadCount = unread.length;

  const marcarTodasLeidas = () => {
    const ids = new Set(notifications.map(n => n.id));
    setReadIds(ids);
    localStorage.setItem('notif_read', JSON.stringify([...ids]));
  };

  const handleClick = (notif: any) => {
    // Marcar como leída
    const next = new Set(readIds);
    next.add(notif.id);
    setReadIds(next);
    localStorage.setItem('notif_read', JSON.stringify([...next]));
    // Navegar
    if (notif.navegar && onNavigate) {
      onNavigate(notif.navegar);
      setShowNotifications(false);
    }
  };

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Solo mostrar las no leídas en el panel
  const visibles = notifications.filter(n => !readIds.has(n.id));

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ backgroundColor: '#ffffff', borderColor: '#E0D1C0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center" style={{ height: '80px' }}>

          {/* LOGO */}
          <div className="flex items-center gap-4">
            <div className="font-elegant" style={{ color: '#2D4B39', fontSize: '2.2rem', letterSpacing: '0.15em' }}>NUDO</div>
            <div style={{ width: '1px', height: '40px', backgroundColor: '#B8860B', opacity: 0.4 }} />
            <div style={{ color: '#2D4B39', opacity: 0.8, fontSize: '0.9rem', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>Studio</div>
          </div>

          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-4 relative">

            {/* NOTIFICACIONES */}
            <div className="relative">
              <motion.button
                onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) cargarNotificaciones(); }}
                className="relative p-2 rounded-full transition-all duration-300"
                style={{ color: '#2D4B39' }}
                whileHover={{ backgroundColor: 'rgba(45,75,57,0.05)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center text-xs text-white rounded-full"
                    style={{ backgroundColor: '#EF4444', width: '18px', height: '18px', fontSize: '10px', fontWeight: 600 }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 rounded-2xl shadow-xl border overflow-hidden"
                      style={{ backgroundColor: '#ffffff', borderColor: '#E0D1C0', zIndex: 100, width: '340px' }}
                    >
                      {/* Header */}
                      <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#F3EFEA' }}>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: '#2D4B39' }}>Notificaciones</h3>
                          {unreadCount > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(45,75,57,0.5)' }}>{unreadCount} sin leer</p>
                          )}
                        </div>
                        <button onClick={() => setShowNotifications(false)}>
                          <X className="w-4 h-4 opacity-40 hover:opacity-100" />
                        </button>
                      </div>

                      {/* Lista */}
                      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {visibles.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: '#2D4B39' }} />
                            <p className="text-sm" style={{ color: 'rgba(45,75,57,0.45)' }}>Todo al día, sin notificaciones</p>
                          </div>
                        ) : visibles.map((notif) => {
                          const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.pedido;
                          const Icon = cfg.icon;
                          return (
                            <motion.div
                              key={notif.id}
                              whileHover={{ backgroundColor: 'rgba(45,75,57,0.03)' }}
                              className="p-4 border-b cursor-pointer"
                              style={{ borderColor: '#F3EFEA', backgroundColor: 'rgba(184,134,11,0.03)' }}
                              onClick={() => handleClick(notif)}
                            >
                              <div className="flex gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${cfg.color}15` }}
                                >
                                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-snug" style={{ color: '#2D4B39', fontWeight: 500 }}>{notif.texto}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs" style={{ color: 'rgba(45,75,57,0.4)' }}>{timeAgo(notif.fecha)}</span>
                                    {notif.navegar && (
                                      <span className="text-xs font-medium" style={{ color: cfg.color }}>Ver →</span>
                                    )}
                                  </div>
                                </div>
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      {visibles.length > 0 && (
                        <div className="p-3 text-center" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #F3EFEA' }}>
                          <button
                            className="text-xs font-medium hover:underline"
                            style={{ color: '#B8860B' }}
                            onClick={marcarTodasLeidas}
                          >
                            Marcar todas como leídas
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* BADGE ROL */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(45,75,57,0.05)', border: '1px solid rgba(45,75,57,0.2)' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B8860B' }} />
              <span className="text-sm" style={{ color: '#2D4B39', textTransform: 'capitalize' }}>{user?.role || 'Admin'}</span>
            </div>

            {/* CERRAR SESIÓN */}
            <motion.button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
              style={{ color: '#2D4B39' }}
              whileHover={{ backgroundColor: 'rgba(45,75,57,0.05)' }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Cerrar Sesión</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>

    {showLogoutModal && (
      <LogoutModal
        onConfirm={() => { onLogout(); setShowLogoutModal(false); }}
        onCancel={() => setShowLogoutModal(false)}
      />
    )}
  </>
  );
}
