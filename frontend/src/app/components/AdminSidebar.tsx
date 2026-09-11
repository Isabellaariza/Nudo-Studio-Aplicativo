import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Package, 
  Wrench, 
  Package2, 
  ShoppingCart, 
  RotateCcw, 
  Calendar, 
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  DollarSign,
  BookOpen,
  UserCheck,
  CalendarClock,
  GraduationCap,
  Layers,
  Tag,
  FileText,
  Shield
} from 'lucide-react';
import { pedidosAPI, insumosAPI } from '../lib/api';

interface AdminSidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  subsections?: {
    id: string;
    label: string;
  }[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard 
  },
  { 
    id: 'configuracion-main', 
    label: 'Configuración', 
    icon: Settings,
    subsections: [
      { id: 'roles', label: 'Roles y Permisos' }
    ]
  },
  { 
    id: 'usuarios-main', 
    label: 'Usuarios', 
    icon: Users,
    subsections: [
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'empleados', label: 'Empleados' }
    ]
  },
  { 
    id: 'compras', 
    label: 'Compras', 
    icon: ShoppingBag,
    subsections: [
      { id: 'compras', label: 'Compras' },
      { id: 'categorias-productos', label: 'Categoría de Productos' },
      { id: 'productos', label: 'Productos' },
      { id: 'proveedores', label: 'Proveedores' },
      { id: 'categorias-insumos', label: 'Categorías de Insumos' },
      { id: 'stock', label: 'Insumos' }
    ]
  },
  { 
    id: 'produccion', 
    label: 'Producción', 
    icon: Package2 
  },
  { 
    id: 'talleres-main', 
    label: 'Talleres', 
    icon: Calendar,
    subsections: [
      { id: 'talleres', label: 'Talleres' },
      { id: 'materiales', label: 'Materiales' },
      { id: 'estudiantes', label: 'Estudiantes' },
      { id: 'programacion', label: 'Programación de Talleres' },
      { id: 'matricula', label: 'Matrícula' }
    ]
  },
  { 
    id: 'ventas', 
    label: 'Ventas', 
    icon: DollarSign,
    subsections: [
      { id: 'ventas', label: 'Ventas' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'pedidos', label: 'Pedidos' },
      { id: 'abonos', label: 'Abonos' },
      { id: 'descuentos', label: 'Descuentos' }
    ]
  }
];

export function AdminSidebar({ currentSection, onNavigate }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [stockCritico, setStockCritico] = useState(0);
  const prevPendientes = useRef<number | null>(null);

  useEffect(() => {
    const fetchPendientes = async () => {
      try {
        const data = await pedidosAPI.getAll();
        const count = (data.pedidos || []).filter((p: any) => p.estado === 'PAGO_POR_VERIFICAR').length;
        if (prevPendientes.current !== null && count > prevPendientes.current) {
          // Solo notifica si ya teníamos un valor base (no en la primera carga)
          const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA');
          audio.play().catch(() => {});
        }
        prevPendientes.current = count;
        setPedidosPendientes(count);
      } catch {}
    };
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stock crítico — se actualiza cada 5 minutos
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const data = await insumosAPI.getAll();
        const criticos = (data.insumos || []).filter(
          (i: any) => Number(i.stock) < Number(i.stock_minimo)
        ).length;
        setStockCritico(criticos);
      } catch {}
    };
    fetchStock();
    const interval = setInterval(fetchStock, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Detectar responsive
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-colapsar en tablet
      if (width >= 768 && width < 1024) {
        setIsCollapsed(true);
      } else if (width >= 1024) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevenir scroll cuando mobile menu está abierto
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobile, isMobileOpen]);

  // Auto-expandir sección si se navega a una subsección
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subsections) {
        const hasActiveSubsection = item.subsections.some(sub => sub.id === currentSection);
        if (hasActiveSubsection && !expandedSections.includes(item.id)) {
          setExpandedSections(prev => [...prev, item.id]);
        }
      }
    });
  }, [currentSection]);

  const handleNavigate = (section: string) => {
    onNavigate(section);
    // Cerrar drawer en mobile
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sidebarWidth = isCollapsed || isTablet ? '80px' : '280px';
  const showText = !isCollapsed && !isTablet;

  return (
    <>
      {/* BOTÓN MOBILE */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            position: 'fixed',
            top: '96px',
            left: '16px',
            zIndex: 50,
            width: '40px',
            height: '40px',
            background: '#2D4B39',
            color: '#ffffff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(45, 75, 57, 0.3)'
          }}
        >
          {isMobileOpen ? (
            <X style={{ width: '20px', height: '20px', transition: 'all 0.2s' }} />
          ) : (
            <Menu style={{ width: '20px', height: '20px', transition: 'all 0.2s' }} />
          )}
        </motion.button>
      )}

      {/* OVERLAY MOBILE */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 39,
              top: '80px'
            }}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside
        initial={{ translateX: isMobile ? -280 : 0 }}
        animate={{
          translateX: isMobile ? (isMobileOpen ? 0 : -280) : 0,
          width: isMobile ? '280px' : sidebarWidth
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          left: 0,
          top: '80px',
          height: 'calc(100vh - 80px)',
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid #E0D1C0',
          boxShadow: '2px 0 8px rgba(45, 75, 57, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* HEADER DEL MENÚ */}
        {showText && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              padding: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(224, 209, 192, 0.3)',
              marginBottom: '0px'
            }}
          >
            <h2 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#2D4B39',
              letterSpacing: 'normal'
            }}>
              Menú principal
            </h2>
          </motion.div>
        )}

        {isMobile && (
          <div
            style={{
              padding: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(224, 209, 192, 0.3)',
              marginBottom: '0px'
            }}
          >
            <h2 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#2D4B39',
              letterSpacing: 'normal'
            }}>
              Menú principal
            </h2>
          </div>
        )}

        {/* LISTA DE MENÚ */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasSubsections = item.subsections && item.subsections.length > 0;
            const isExpanded = expandedSections.includes(item.id);
            const isActive = currentSection === item.id || 
              (item.subsections && item.subsections.some(sub => sub.id === currentSection));

            return (
              <div key={item.id}>
                <motion.button
                  initial={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ backgroundColor: isActive ? 'rgba(45, 75, 57, 0.15)' : 'rgba(45, 75, 57, 0.05)', translateX: 5 }}
                  onClick={() => {
                    if (hasSubsections) toggleSection(item.id);
                    else handleNavigate(item.id);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: isActive ? 'rgba(45, 75, 57, 0.1)' : 'transparent',
                    color: isActive ? '#2D4B39' : '#6B7280',
                    fontWeight: isActive ? 500 : 400,
                    borderLeft: isActive ? '4px solid #B8860B' : '4px solid transparent',
                    border: 'none', textAlign: 'left'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  {(showText || isMobile) && (
                    <>
                      <span style={{ fontSize: '14px', fontWeight: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {item.label}
                      </span>
                      {hasSubsections && (
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronRight style={{ width: '14px', height: '14px' }} />
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.button>

                {hasSubsections && (showText || isMobile) && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginLeft: '28px', marginTop: '4px', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {item.subsections?.map((subsection) => {
                            const isSubActive = currentSection === subsection.id;
                            return (
                              <motion.button
                                key={subsection.id}
                                whileHover={{ backgroundColor: 'rgba(45, 75, 57, 0.05)', translateX: 3 }}
                                onClick={() => handleNavigate(subsection.id)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  background: isSubActive ? 'rgba(184, 134, 11, 0.1)' : 'transparent',
                                  color: isSubActive ? '#B8860B' : '#9CA3AF',
                                  fontSize: '13px', fontWeight: isSubActive ? 500 : 400,
                                  border: 'none', textAlign: 'left'
                                }}
                              >
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSubActive ? '#B8860B' : '#9CA3AF', flexShrink: 0 }} />
                                {subsection.label}
                                {subsection.id === 'pedidos' && pedidosPendientes > 0 && (
                                  <span style={{ marginLeft: 'auto', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                                    {pedidosPendientes}
                                  </span>
                                )}
                                {subsection.id === 'stock' && stockCritico > 0 && (
                                  <span style={{ marginLeft: 'auto', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#F59E0B', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                                    {stockCritico}
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        {/* DIVIDER */}
        {(showText || isMobile) && (
          <div style={{
            margin: '8px 16px',
            height: '1px',
            background: '#E0D1C0',
            width: 'calc(100% - 32px)'
          }} />
        )}

        {/* FOOTER SIDEBAR */}
        {(showText || isMobile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              padding: '12px 16px',
              marginTop: 'auto'
            }}
          >
            <div style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(232, 220, 200, 0.3)'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#6B7280',
                marginBottom: '8px',
                fontWeight: 400
              }}>
                NUDO Studio Admin
              </p>
              <p style={{
                fontSize: '12px',
                color: '#9CA3AF',
                fontWeight: 400
              }}>
                Versión 1.0.0
              </p>
            </div>
          </motion.div>
        )}
      </motion.aside>
    </>
  );
}