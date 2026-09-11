import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/pages/HomePage";
import { cartAPI, auth } from "./lib/api";
import { toast, Toaster } from "sonner";

// Lazy-loaded: el panel admin y sus dependencias NO se descargan en la landing
const AdminNavbar = lazy(() => import("./components/AdminNavbar").then(m => ({ default: m.AdminNavbar })));
const AdminPanel  = lazy(() => import("./components/pages/AdminPanel").then(m => ({ default: m.AdminPanel })));
const ProductsPage  = lazy(() => import("./components/pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const WorkshopsPage = lazy(() => import("./components/pages/WorkshopsPage").then(m => ({ default: m.WorkshopsPage })));
const BlogPage      = lazy(() => import("./components/pages/BlogPage").then(m => ({ default: m.BlogPage })));
const ProfilePage   = lazy(() => import("./components/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const CartPage      = lazy(() => import("./components/pages/CartPage").then(m => ({ default: m.CartPage })));
const LoginPage     = lazy(() => import("./components/pages/LoginPage").then(m => ({ default: m.LoginPage })));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#2D4B39] border-t-transparent animate-spin" />
    </div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminSection, setAdminSection] = useState('dashboard');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // CAMBIO: Quitamos el 'if (user)' para que cuente el carrito de los invitados
    loadCartCount();
  }, [user, currentPage, refreshTrigger]);

  const checkAuth = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const userRole = localStorage.getItem('userRole');
      const userName = localStorage.getItem('userName');
      if (userEmail && userRole) {
        const base = { email: userEmail, role: userRole, name: userName || userEmail.split('@')[0] };
        try {
          const data = await auth.getUser();
          if (data?.usuario) {
            setUser({ ...base, ...data.usuario });
          } else {
            setUser(base);
          }
        } catch {
          setUser(base);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        setCartItemCount(cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } else {
        setCartItemCount(0);
      }
    } catch { setCartItemCount(0); }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userPermisos');
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
      setUser(null);
      setCartItemCount(0);
      setCurrentPage('home');
      toast.success('Sesión cerrada');
    } catch { toast.error('Error al cerrar sesión'); }
  };


  const handleRefresh = async () => setRefreshTrigger(prev => prev + 1);

  const handleLoginSuccess = async () => {
    localStorage.removeItem('cart');
    await checkAuth();
    await loadCartCount();
    const userRole = localStorage.getItem('userRole') || '';
    if (userRole.toLowerCase() === 'administrador') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('catalog');
    }
  };

  const handleNavigate = (page: string) => {
    if (user?.role?.toLowerCase() === 'administrador' && page !== 'admin') return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E0D1C0] relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#B8860B]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
        <div className="relative z-10 flex items-baseline gap-3">
          <div
            className="font-volkge-heavy text-[2.5rem] md:text-[3.5rem] tracking-[0.25em]"
            style={{ color: "#2D4B39" }}
          >
            NUDO
          </div>
          <div className="relative">
            <div
              className="absolute -left-2 top-0 bottom-0 w-[1px]"
              style={{
                backgroundColor: "#2D4B39",
                opacity: 0.3,
              }}
            />
            <div
              className="font-volkge-light text-[1rem] md:text-[1.5rem] tracking-[0.15em] pl-3"
              style={{ color: "#2D4B39", opacity: 0.75 }}
            >
              Studio
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Si es admin, siempre mostrar solo el panel de admin
    if (user?.role?.toLowerCase() === 'administrador') {
      return <AdminPanel user={user} activeSection={adminSection} onNavigate={setAdminSection} />;
    }

    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "products":
        return (
          <ProductsPage
            user={user}
            onNavigate={handleNavigate}
            onCartUpdate={loadCartCount}
          />
        );
      case "workshops":
        return (
          <WorkshopsPage
            user={user}
            onNavigate={handleNavigate}
          />
        );
      case "blog":
        return <BlogPage onNavigate={handleNavigate} />;
      case "profile":
        return user ? (
          <ProfilePage user={user} onLogout={handleLogout} />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );
      case "cart":
        // CAMBIO: Ya no redirige a Login, deja pasar directo al componente CartPage
        return (
          <CartPage
            user={user}
            onNavigate={handleNavigate}
            onCartUpdate={loadCartCount}
          />
        );
      case "login":
        return (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        );
      case "catalog":
        return (
          <ProductsPage
            user={user}
            onNavigate={handleNavigate}
            onCartUpdate={loadCartCount}
          />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isAdminPage = user?.role?.toLowerCase() === 'administrador';

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<PageLoader />}>
        {isAdminPage ? (
          <AdminNavbar user={user} onLogout={handleLogout} onRefresh={handleRefresh} onNavigate={setAdminSection} />
        ) : (
          <Navbar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            user={user}
            cartItemCount={cartItemCount}
            onLogout={handleLogout}
          />
        )}

        <main className="pt-20">
          <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
        </main>

        {!isAdminPage && <Footer />}
      </Suspense>

      <Toaster
        position="bottom-right"
        richColors // <-- ¡Esto activa los colores temáticos automáticos (Verde éxito, Rojo error)!
        closeButton
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}