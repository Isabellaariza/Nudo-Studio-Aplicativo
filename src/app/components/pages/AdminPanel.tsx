import { useState } from 'react';
import { AdminSidebar } from '../AdminSidebar';
import { Dashboard } from '../admin/Dashboard';
import { Usuarios } from '../admin/Usuarios';
import { Empleados } from '../admin/Empleados';
import { Clientes } from '../admin/Clientes';
import { Stock } from '../admin/Stock';
import { Productos } from '../admin/Productos';
import { Proveedores } from '../admin/Proveedores';
import { Produccion } from '../admin/Produccion';
import { Pedidos } from '../admin/Pedidos';
import { Talleres } from '../admin/Talleres';
import { Estudiantes } from '../admin/Estudiantes';
import { Compras } from '../admin/Compras';
import { Ventas } from '../admin/Ventas';
import { CategoriaProductos } from '../admin/CategoriaProductos';
import { CategoriaInsumos } from '../admin/CategoriaInsumos';
import { MaterialesTalleres } from '../admin/MaterialesTalleres';
import { ProgramacionTalleres } from '../admin/ProgramacionTalleres';
import { Matricula } from '../admin/Matricula';
import { Abonos } from '../admin/Abonos';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { GestionConfiguracion } from '../admin/Configuracion';
import { Smartphone } from 'lucide-react';

export function AdminPanel({ user, activeSection: externalSection, onNavigate: externalNavigate }: { user?: any; activeSection?: string; onNavigate?: (s: string) => void }) {
  const [internalSection, setInternalSection] = useState('dashboard');
  const activeSection = externalSection ?? internalSection;
  const setActiveSection = externalNavigate ?? setInternalSection;
  const { isDesktop, isTablet, isMobile } = useMediaQuery();

  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '32px',
        background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)',
        color: '#ffffff', textAlign: 'center'
      }}>
        <div>
          <Smartphone style={{ width: '64px', height: '64px', margin: '0 auto 24px', opacity: 0.8 }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Panel de Administración</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '400px', lineHeight: '1.6' }}>
            El panel de administración solo está disponible en tablets y computadoras.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':            return <Dashboard onNavigate={setActiveSection} />;
      case 'roles':                return <GestionConfiguracion />;
      case 'usuarios':             return <Usuarios />;
      case 'empleados':            return <Empleados />;
      case 'clientes':             return <Clientes />;
      case 'stock':                return <Stock />;
      case 'productos':            return <Productos />;
      case 'categorias-productos': return <CategoriaProductos />;
      case 'categorias-insumos':   return <CategoriaInsumos />;
      case 'proveedores':          return <Proveedores />;
      case 'produccion':           return <Produccion />;
      case 'pedidos':              return <Pedidos />;
      case 'talleres':             return <Talleres />;
      case 'materiales':           return <MaterialesTalleres />;
      case 'estudiantes':          return <Estudiantes />;
      case 'programacion':         return <ProgramacionTalleres />;
      case 'matricula':            return <Matricula />;
      case 'compras':              return <Compras />;
      case 'ventas':               return <Ventas />;
      case 'abonos':               return <Abonos />;
      default:                     return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <AdminSidebar currentSection={activeSection} onNavigate={setActiveSection} />
      <main
        className="transition-all duration-300"
        style={{
          marginLeft: isDesktop ? '280px' : isTablet ? '80px' : '0',
          paddingTop: isDesktop ? '24px' : '20px',
          paddingBottom: isDesktop ? '40px' : '32px',
          paddingLeft: isDesktop ? '32px' : '16px',
          paddingRight: isDesktop ? '32px' : '16px',
          maxWidth: isDesktop ? '1536px' : '100%',
          minHeight: '100vh',
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
}