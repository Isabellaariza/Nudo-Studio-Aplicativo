import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Minus, Trash2, Upload, CheckCircle, RefreshCw, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosAPI } from '../../lib/api';

const CLOUDINARY_CLOUD = 'ddcx9ks5g';
const CLOUDINARY_PRESET = 'nudo_studio';

interface CartPageProps {
  user: any;
  onNavigate: (page: string) => void;
  onCartUpdate?: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

const DEPARTAMENTOS_COLOMBIA = [
  'amazonas', 'antioquia', 'arauca', 'atlantico', 'atlántico', 'bolivar', 'bolívar', 
  'boyaca', 'boyacá', 'caldas', 'caqueta', 'caquetá', 'casanare', 'cauca', 'cesar', 
  'choco', 'chocó', 'cordoba', 'còrdoba', 'cundinamarca', 'guainia', 'guainía', 
  'guaviare', 'huila', 'la guajira', 'magdalena', 'meta', 'nariño', 'norte de santander', 
  'putumayo', 'quindio', 'quindío', 'risaralda', 'san andres', 'san andrés', 'santander', 
  'sucre', 'tolima', 'valle del cauca', 'vaupes', 'vaupés', 'vichada', 'bogota', 'bogotá'
];

async function subirComprobante(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('No se pudo subir el comprobante de pago a la nube.');
  }

  const data = await res.json();
  return data.secure_url;
}

export function CartPage({ user, onNavigate, onCartUpdate }: CartPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAlternativeAddress, setIsAlternativeAddress] = useState(false);
  
  // Estado base del formulario
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    department: ''
  });

  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [wholesaleModal, setWholesaleModal] = useState(false);
  
  // ESTADO DE CARGA (¡Correctamente ubicado dentro del componente!)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Detectar si la dirección del perfil parece ser de Colombia
  const isColombianAddress = (addr: string) => {
    if (!addr) return false;
    const lower = addr.toLowerCase();
    return DEPARTAMENTOS_COLOMBIA.some(d => lower.includes(d)) ||
      /calle|carrera|cra|cl|av\.|avenida|diagonal|transversal|manzana|barrio/i.test(addr);
  };

  // Autorrellena Nombre, Teléfono y Dirección del perfil
  useEffect(() => {
    if (user && !isAlternativeAddress) {
      const profileAddress = user.direccion || user.address || '';
      setShippingAddress(prev => ({
        ...prev,
        fullName: user.nombre || user.fullName || user.name || '',
        phone: (user.telefono || user.phone || '').replace(/\D/g, '').slice(0, 10),
        address: isColombianAddress(profileAddress) ? profileAddress : '',
      }));
      if (profileAddress && !isColombianAddress(profileAddress)) {
        toast.warning('Tu dirección de perfil no parece ser de Colombia. Por favor ingrésala manualmente.');
      }
    }
  }, [user, isAlternativeAddress]);

  // Cargar carrito de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  // Sincronizar carrito
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    onCartUpdate?.();
  }, [cartItems]);

  // --- VALIDACIONES DE COLOMBIA ---
  const isDepartmentInvalid = shippingAddress.department.trim().length > 2 && 
    !DEPARTAMENTOS_COLOMBIA.includes(shippingAddress.department.toLowerCase().trim());

  const ciudadesBloqueadas = ['miami', 'madrid', 'mexico', 'méxico', 'lima', 'buenos aires', 'santiago', 'caracas', 'quito', 'orlando', 'new york', 'usa', 'españa'];
  const isCityInvalid = shippingAddress.city.trim().length > 1 && 
    ciudadesBloqueadas.some(blocked => shippingAddress.city.toLowerCase().trim().includes(blocked));

  const updateQuantity = (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (item && item.quantity + delta > 5) { setWholesaleModal(true); return; }
    setCartItems(items => items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast.success('Producto eliminado del carrito');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Solo se permiten imágenes o PDFs.');
      setPaymentProof(null);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo supera los 5MB permitidos.');
      setPaymentProof(null);
      e.target.value = '';
      return;
    }

    setPaymentProof(file);
    toast.success('Comprobante cargado exitosamente');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 15000;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    // NUEVO CAMBIO: Si no ha iniciado sesión, lo invitamos a hacerlo
    if (!user) {
      toast.error('Debes iniciar sesión para procesar y realizar tu pedido.', {
        duration: 4000
      });
      setTimeout(() => onNavigate('login'), 1000);
      return;
    }
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.department) {
      toast.error('Por favor completa todos los campos de dirección');
      return;
    }
    if (isDepartmentInvalid || isCityInvalid) {
      toast.error('La ubicación ingresada no es válida para envíos en Colombia.');
      return;
    }
    if (!paymentProof) {
      toast.error('Por favor carga el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Subiendo comprobante y procesando tu pedido...');

    try {
      // 2. Subir el archivo real a Cloudinary y obtener la URL de la imagen
      const urlComprobante = await subirComprobante(paymentProof);

      // 3. Mapear los productos del carrito
      const productosMapeados = cartItems.map(item => ({
        id_producto: Number(item.id),
        cantidad: item.quantity,
        precio_unitario: item.price,
      }));

      // 4. Construir el payload del pedido con la URL en lugar del Base64
      const datosPedido = {
        productos: productosMapeados,
        total: total,
        direccion_entrega: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.department} (Colombia)`,
        descripcion: `Tel: ${shippingAddress.phone} | Nombre: ${shippingAddress.fullName}`,
        comprobante_pago: urlComprobante
      };

      // 5. Enviar el pedido al backend
      await pedidosAPI.create(datosPedido);

      // 6. Éxito y limpieza de estados
      toast.success('¡Pedido realizado exitosamente!', { id: toastId });
      setCartItems([]);
      localStorage.removeItem('cart');
      setShippingAddress({ fullName: '', phone: '', address: '', city: '', department: '' });
      setPaymentProof(null);
      setIsAlternativeAddress(false);

      // Mostrar modal de confirmación con countdown
      setCountdown(10);
      setShowSuccessModal(true);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowSuccessModal(false);
            onNavigate('profile');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pedido', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAlternativeAddress = () => {
    if (!isAlternativeAddress) {
      setIsAlternativeAddress(true);
      setShippingAddress({ fullName: '', phone: '', address: '', city: '', department: '' });
      toast.info('Modo dirección alternativa activado.');
    } else {
      setIsAlternativeAddress(false);
      setShippingAddress({
        fullName: user?.nombre || user?.fullName || user?.name || '',
        phone: (user?.telefono || user?.phone || '').replace(/\D/g, '').slice(0, 10),
        address: isColombianAddress(user?.direccion || user?.address || '') ? (user?.direccion || user?.address || '') : '',
        city: '',
        department: ''
      });
      toast.info('Restaurando tus datos de perfil.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        {/* MODAL PEDIDO EXITOSO — fuera del guard para que siempre se renderice */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 24 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full relative text-center"
                style={{ border: '1px solid rgba(45,75,57,0.1)', boxShadow: '0 24px 60px rgba(45,75,57,0.18)' }}
              >
                <button
                  onClick={() => { setShowSuccessModal(false); onNavigate('profile'); }}
                  className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
                  style={{ color: 'rgba(45,75,57,0.35)', backgroundColor: 'rgba(45,75,57,0.05)' }}
                >
                  <X className="w-4 h-4" />
                </button>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg, #2D4B39, #1a2f23)', boxShadow: '0 8px 24px rgba(45,75,57,0.25)' }}
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="font-elegant mb-2" style={{ fontSize: '1.75rem', color: '#2D4B39' }}>¡Pedido Recibido!</h2>
                <p className="text-sm mb-5" style={{ color: 'rgba(45,75,57,0.6)', lineHeight: 1.6 }}>
                  Tu pedido fue registrado exitosamente. Un asesor de <strong style={{ color: '#2D4B39' }}>Nudo Studio</strong> se pondrá en contacto contigo para confirmar los detalles.
                </p>
                <div className="flex gap-3 justify-center mb-6">
                  <a
                    href="https://wa.me/573126058401"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium"
                    style={{ background: 'rgba(37,211,102,0.1)', color: '#128C7E', border: '1px solid rgba(37,211,102,0.25)', textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: '#25D366' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>
                <div className="mb-3">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(45,75,57,0.08)' }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: '#2D4B39' }}
                      initial={{ width: '100%' }} animate={{ width: `${(countdown / 10) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'rgba(45,75,57,0.4)' }}>Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ backgroundColor: '#FAF7F2' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }}>
              <ShoppingBag className="w-9 h-9" style={{ color: 'rgba(45,75,57,0.3)' }} />
            </div>
            <h2 className="font-elegant mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#2D4B39' }}>Tu carrito está vacío</h2>
            <p className="mb-8 text-sm" style={{ color: 'rgba(45,75,57,0.55)' }}>Agrega productos para comenzar tu compra</p>
            <motion.button
              onClick={() => onNavigate('catalog')}
              className="px-8 py-3 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: '#2D4B39' }}
              whileHover={{ backgroundColor: '#B8860B', boxShadow: '0 8px 24px rgba(184,134,11,0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              Explorar Productos
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      {wholesaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-7 max-w-sm w-full relative" style={{ border: '1px solid rgba(45,75,57,0.1)' }}>
            <button onClick={() => setWholesaleModal(false)} className="absolute top-4 right-4" style={{ color: 'rgba(45,75,57,0.4)' }}><X className="w-5 h-5" /></button>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.1)' }}>
              <ShoppingBag className="w-6 h-6" style={{ color: '#B8860B' }} />
            </div>
            <h3 className="font-elegant text-xl mb-2" style={{ color: '#2D4B39' }}>¿Pedido al por mayor?</h3>
            <p className="text-sm mb-5" style={{ color: 'rgba(45,75,57,0.65)' }}>Para cantidades mayores a 5 unidades por producto manejamos pedidos al por mayor con condiciones especiales. Contáctanos por WhatsApp para coordinar tu pedido.</p>
            <a href="https://wa.me/573126058401?text=Hola%2C%20quiero%20hacer%20un%20pedido%20al%20por%20mayor" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-white text-sm font-medium" style={{ backgroundColor: '#25D366' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Contactar por WhatsApp
            </a>
          </motion.div>
        </div>
      )}
      <div className="min-h-screen py-10 px-6 pb-20" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Resumen</span>
          </div>
          <h1 className="font-elegant" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#2D4B39' }}>Mi Carrito</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Productos */}
          <div className="lg:col-span-3 space-y-3">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="bg-white rounded-2xl p-5 flex gap-4"
                  style={{ border: '1px solid rgba(45,75,57,0.07)' }}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(224,209,192,0.2)' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" style={{ color: 'rgba(45,75,57,0.2)' }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-0.5 truncate" style={{ color: '#2D4B39', fontSize: '0.95rem' }}>{item.name}</h3>
                    <p className="font-elegant text-lg mb-3" style={{ color: '#B8860B' }}>
                      ${item.price.toLocaleString('es-CO')} COP
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: 'rgba(45,75,57,0.05)' }}>
                        <motion.button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#2D4B39', color: 'white' }}
                          whileHover={{ backgroundColor: '#B8860B' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-3 h-3" />
                        </motion.button>
                        <span className="w-8 text-center text-sm font-medium" style={{ color: '#2D4B39' }}>{item.quantity}</span>
                        <motion.button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: item.quantity >= 5 ? '#9CA3AF' : '#2D4B39', color: 'white' }}
                          whileHover={{ backgroundColor: item.quantity >= 5 ? '#9CA3AF' : '#B8860B' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      </div>
                      <motion.button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-full"
                        style={{ color: 'rgba(45,75,57,0.35)' }}
                        whileHover={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs mb-1" style={{ color: 'rgba(45,75,57,0.4)' }}>Subtotal</p>
                    <p className="font-medium" style={{ color: '#2D4B39' }}>${(item.price * item.quantity).toLocaleString('es-CO')}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-5">

              {/* Dirección */}
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(45,75,57,0.07)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm" style={{ color: '#2D4B39' }}>Dirección de Envío</h3>
                  
                  <button
                    type="button"
                    onClick={toggleAlternativeAddress}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: isAlternativeAddress ? '#B8860B' : '#2D4B39' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isAlternativeAddress ? 'rotate-180' : ''} transition-transform`} />
                    {isAlternativeAddress ? 'Usar mis datos predeterminados' : 'Enviar a otra dirección'}
                  </button>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.15)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B8860B' }} />
                  <p className="text-[11px] leading-snug" style={{ color: '#2D4B39' }}>
                    <strong>Sólo Envíos en Colombia:</strong> El sistema validará que la ciudad y el departamento correspondan al territorio nacional.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo del destinatario"
                    value={shippingAddress.fullName}
                    onChange={e => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                    onFocus={e => e.target.style.borderColor = '#B8860B'}
                    onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (máx. 10 dígitos)"
                    value={shippingAddress.phone}
                    onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                    onFocus={e => e.target.style.borderColor = '#B8860B'}
                    onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                  />
                  <input
                    type="text"
                    placeholder="Dirección (Ej: Calle 10 #20-30)"
                    value={shippingAddress.address}
                    onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39', backgroundColor: '#FAFAFA' }}
                    onFocus={e => e.target.style.borderColor = '#B8860B'}
                    onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Input Ciudad */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Ciudad (Colombia)"
                        value={shippingAddress.city}
                        onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={{ 
                          border: isCityInvalid ? '1.5px solid #EF4444' : '1px solid rgba(45,75,57,0.12)', 
                          color: '#2D4B39', 
                          backgroundColor: isCityInvalid ? 'rgba(239,68,68,0.02)' : '#FAFAFA' 
                        }}
                        onFocus={e => { if(!isCityInvalid) e.target.style.borderColor = '#B8860B' }}
                        onBlur={e => { if(!isCityInvalid) e.target.style.borderColor = 'rgba(45,75,57,0.12)' }}
                      />
                      {isCityInvalid && <span className="text-[10px] text-red-500 px-1">Solo Colombia</span>}
                    </div>

                    {/* Input Departamento */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Departamento"
                        value={shippingAddress.department}
                        onChange={e => setShippingAddress({ ...shippingAddress, department: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={{ 
                          border: isDepartmentInvalid ? '1.5px solid #EF4444' : '1px solid rgba(45,75,57,0.12)', 
                          color: '#2D4B39', 
                          backgroundColor: isDepartmentInvalid ? 'rgba(239,68,68,0.02)' : '#FAFAFA' 
                        }}
                        onFocus={e => { if(!isDepartmentInvalid) e.target.style.borderColor = '#B8860B' }}
                        onBlur={e => { if(!isDepartmentInvalid) e.target.style.borderColor = 'rgba(45,75,57,0.12)' }}
                      />
                      {isDepartmentInvalid && <span className="text-[10px] text-red-500 px-1">No encontrado</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* NUEVO: Cuenta Bancaria - Solo visible si el usuario ya inició sesión */}
              {user && (
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(184,134,11,0.25)', backgroundColor: 'rgba(184,134,11,0.02)' }}>
                  <h3 className="font-medium mb-2 text-sm flex items-center gap-2" style={{ color: '#2D4B39' }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B8860B' }}></span>
                    Información de Pago (Transferencia)
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(45,75,57,0.7)' }}>
                    Para procesar tu pedido, realiza la transferencia del total a nuestra cuenta oficial y adjunta el comprobante abajo:
                  </p>
                  <div className="p-3.5 rounded-xl text-xs space-y-1.5" style={{ backgroundColor: '#FAF7F2', border: '1px solid rgba(45,75,57,0.05)' }}>
                    <p style={{ color: '#2D4B39' }}><strong>Banco:</strong> Bancolombia (Cuenta de Ahorros)</p>
                    <p style={{ color: '#2D4B39' }}><strong>Número de Cuenta:</strong> 123-456789-01</p>
                    <p style={{ color: '#2D4B39' }}><strong>Titular:</strong> Nudo Studio S.A.S.</p>
                  </div>
                </div>
              )}

              {/* Comprobante */}
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(45,75,57,0.07)' }}>
                <h3 className="font-medium mb-4 text-sm" style={{ color: '#2D4B39' }}>Comprobante de Pago</h3>
                <label
                  className="block p-5 rounded-xl text-center cursor-pointer transition-all"
                  style={{
                    border: paymentProof ? '1.5px solid #059669' : '1.5px dashed rgba(45,75,57,0.15)',
                    backgroundColor: paymentProof ? 'rgba(5,150,105,0.04)' : 'transparent',
                  }}
                >
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileUpload} className="hidden" />
                  {paymentProof ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-2" style={{ color: '#059669' }}>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium truncate max-w-[180px]">{paymentProof.name}</span>
                      </div>
                      <p className="text-[11px] underline mt-1" style={{ color: 'rgba(45,75,57,0.4)' }}>Haz clic para cambiar el archivo</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(45,75,57,0.3)' }} />
                      <p className="text-sm" style={{ color: '#2D4B39' }}>Haz clic para subir comprobante</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(45,75,57,0.4)' }}>JPG, PNG, WEBP o PDF (máx. 5MB)</p>
                    </>
                  )}
                </label>
              </div>

              {/* Totales */}
              <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(45,75,57,0.07)' }}>
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(45,75,57,0.55)' }}>Subtotal</span>
                    <span style={{ color: '#2D4B39', fontWeight: 500 }}>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(45,75,57,0.55)' }}>Envío</span>
                    <span style={{ color: '#2D4B39', fontWeight: 500 }}>${shipping.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(45,75,57,0.08)' }}>
                    <span className="font-medium" style={{ color: '#2D4B39' }}>Total</span>
                    <span className="font-elegant text-xl" style={{ color: '#B8860B' }}>${total.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckout}
                  disabled={isDepartmentInvalid || isCityInvalid || isSubmitting}
                  className="w-full py-3.5 rounded-full text-white text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: (isDepartmentInvalid || isCityInvalid || isSubmitting) ? '#9CA3AF' : '#2D4B39',
                    cursor: (isDepartmentInvalid || isCityInvalid || isSubmitting) ? 'not-allowed' : 'pointer'
                  }}
                  whileHover={(isDepartmentInvalid || isCityInvalid || isSubmitting) ? {} : { backgroundColor: '#B8860B', boxShadow: '0 8px 24px rgba(184,134,11,0.3)' }}
                  whileTap={(isDepartmentInvalid || isCityInvalid || isSubmitting) ? {} : { scale: 0.97 }}
                >
                  {isSubmitting ? 'Procesando...' : 'Realizar Pedido'}
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}