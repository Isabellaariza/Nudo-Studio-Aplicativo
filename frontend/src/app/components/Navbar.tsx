import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoutModal } from './LogoutModal';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  cartItemCount: number;
  onLogout: () => void;
}

export function Navbar({ currentPage, onNavigate, user, cartItemCount, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'catalog', label: 'Catálogo' },
    { id: 'workshops', label: 'Talleres' },
    { id: 'blog', label: 'Blog' },
  ];

  const isActive = (id: string) =>
    currentPage === id || (id === 'catalog' && currentPage === 'products');

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: '72px',
          background: scrolled ? 'rgba(255,255,255,0.92)' : '#ffffff',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(45,75,57,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(45,75,57,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          {/* Logo */}
          <motion.button
            onClick={() => onNavigate('home')}
            className="flex items-baseline gap-3"
            whileHover={{ opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="font-elegant text-[1.75rem]" style={{ color: '#2D4B39', letterSpacing: '0.12em' }}>
              NUDO
            </span>
            <span className="text-xs uppercase" style={{ color: '#7A5C00', letterSpacing: '0.35em', fontWeight: 500 }}>
              Studio
            </span>
          </motion.button>

          {/* Nav central */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative px-5 py-2 text-sm rounded-full transition-colors"
                style={{
                  color: isActive(item.id) ? '#2D4B39' : 'rgba(45,75,57,0.55)',
                  fontWeight: isActive(item.id) ? 500 : 400,
                  backgroundColor: isActive(item.id) ? 'rgba(45,75,57,0.06)' : 'transparent',
                }}
                whileHover={{ color: '#2D4B39' }}
              >
                {item.label}
                {isActive(item.id) && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-4 rounded-full"
                    style={{ backgroundColor: '#B8860B' }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Derecha */}
          <div className="flex items-center gap-3">
            {(!user || user.role !== 'admin') && (
              <motion.button
                onClick={() => onNavigate('cart')}
                className="relative p-2 rounded-full"
                aria-label="Ver carrito de compras"
                style={{ color: '#2D4B39' }}
                whileHover={{ backgroundColor: 'rgba(45,75,57,0.06)' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                    style={{ backgroundColor: '#B8860B', color: 'white', fontWeight: 700 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </motion.button>
            )}

            {user ? (
              <>
                <motion.button
                  onClick={() => onNavigate('profile')}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ border: '1px solid rgba(45,75,57,0.12)' }}
                  whileHover={{ backgroundColor: 'rgba(45,75,57,0.04)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: '#2D4B39', color: 'white' }}
                  >
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : user.email
                      ? user.email.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                  <span className="text-sm" style={{ color: '#2D4B39', fontWeight: 500 }}>
                    {user.name
                      ? user.name.split(' ')[0]
                      : user.email
                      ? user.email.split('@')[0]
                      : 'Perfil'}
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => setShowLogoutModal(true)}
                  className="hidden md:flex p-2 rounded-full"
                  aria-label="Cerrar sesión"
                  style={{ color: 'rgba(45,75,57,0.5)' }}
                  whileHover={{ color: '#2D4B39', backgroundColor: 'rgba(45,75,57,0.06)' }}
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => onNavigate('login')}
                className="hidden md:block px-5 py-2 text-sm rounded-full text-white"
                style={{ backgroundColor: '#2D4B39' }}
                whileHover={{ backgroundColor: '#B8860B', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}
                transition={{ duration: 0.2 }}
              >
                Iniciar Sesión
              </motion.button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full"
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
              style={{ color: '#2D4B39' }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-6 pb-4 bg-white border-t"
              style={{ borderColor: 'rgba(45,75,57,0.08)' }}
            >
              <div className="pt-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors"
                    style={{
                      color: '#2D4B39',
                      backgroundColor: isActive(item.id) ? 'rgba(45,75,57,0.06)' : 'transparent',
                      fontWeight: isActive(item.id) ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                {user && (
                  <>
                    <button
                      onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm"
                      style={{ color: '#2D4B39' }}
                    >
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                      className="block w-full text-left px-4 py-2.5 rounded-xl text-sm"
                      style={{ color: 'rgba(45,75,57,0.6)' }}
                    >
                      Cerrar Sesión
                    </button>
                  </>
                )}
                {!user && (
                  <button
                    onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ color: '#2D4B39' }}
                  >
                    Iniciar Sesión
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
