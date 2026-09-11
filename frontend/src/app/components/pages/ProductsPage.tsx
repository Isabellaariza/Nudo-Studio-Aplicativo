import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, Package, ChevronDown, Plus, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { productsAPI } from '../../lib/api';

interface ProductsPageProps {
  user: any;
  onNavigate: (page: string) => void;
  onCartUpdate?: () => void;
}

export function ProductsPage({ user, onNavigate, onCartUpdate }: ProductsPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para el filtro de precio (Opciones fijas)
  const [selectedPriceLabel, setSelectedPriceLabel] = useState('Cualquier precio');
  const [currentMaxFilter, setCurrentMaxFilter] = useState<number>(Infinity);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Estado para controlar cuántos productos mostrar (Paginación)
  const [visibleCount, setVisibleCount] = useState(8);
  
  const priceOptions = [
    { label: 'Cualquier precio', value: Infinity },
    { label: 'Hasta $50.000', value: 50000 },
    { label: 'Hasta $100.000', value: 100000 },
    { label: 'Hasta $200.000', value: 200000 },
    { label: 'Hasta $300.000', value: 300000 },
    { label: 'Hasta $500.000', value: 500000 },
  ];

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    cargar(); 
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPriceFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cada vez que cambie la categoría, la búsqueda o el filtro de precio, reiniciamos el contador a 8
  useEffect(() => {
    setVisibleCount(8);
  }, [selectedCategory, searchQuery, currentMaxFilter]);

  const cargar = async () => {
    try {
      const [pData, cData] = await Promise.all([productsAPI.getAll(), productsAPI.getCategorias()]);
      const EXCLUIR = ['joyería', 'joyeria', 'macramé', 'macrame', 'tapices'];
      
      setProducts(pData.productos || []);
      setCategories((cData.categorias || []).filter(
        (c: any) => !EXCLUIR.includes((c.nombre || '').toLowerCase().trim())
      ));
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // 1. Array con todos los productos filtrados
  const filtered = products
    .filter(p => selectedCategory === 'all' || String(p.id_categoria_prod) === selectedCategory)
    .filter(p => (p.nombre_producto || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => Number(p.precio) <= currentMaxFilter);

  // 2. Cortamos el array para mostrar solo los que corresponden según `visibleCount`
  const displayedProducts = filtered.slice(0, visibleCount);

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito', {
        action: { label: 'Iniciar sesión', onClick: () => onNavigate('login') },
        duration: 5000,
      });
      return;
    }
    if (product.stock === 0) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i.id === String(product.id_productos));
    if (idx >= 0) cart[idx].quantity += 1;
    else cart.push({ id: String(product.id_productos), name: product.nombre_producto, price: Number(product.precio), quantity: 1, imageUrl: product.imagen_url || '' });
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`${product.nombre_producto} agregado al carrito`);
    onCartUpdate?.();
  };

  return (
    <div className="min-h-screen pt-8 pb-20 px-6" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-8 pb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Colección</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-elegant" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', color: '#2D4B39', lineHeight: 1.05 }}>
              Nuestros Productos
            </h1>
            
            {/* Buscador + Filtro de precio al lado */}
            <div className="flex items-center gap-2 relative z-20">

              {/* Barra de Búsqueda */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(45,75,57,0.4)' }} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none transition-all bg-white"
                  style={{ border: '1px solid rgba(45,75,57,0.12)', color: '#2D4B39' }}
                  onFocus={e => e.target.style.borderColor = '#B8860B'}
                  onBlur={e => e.target.style.borderColor = 'rgba(45,75,57,0.12)'}
                />
              </div>

              {/* Botón filtro — ícono pegado a la barra de búsqueda */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setShowPriceFilter(!showPriceFilter)}
                  className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white transition-all border"
                  style={{
                    borderColor: showPriceFilter || selectedPriceLabel !== 'Cualquier precio' ? '#B8860B' : 'rgba(45,75,57,0.12)',
                    color: selectedPriceLabel !== 'Cualquier precio' ? '#B8860B' : '#2D4B39',
                  }}
                  title={selectedPriceLabel}
                  aria-label="Filtrar por precio"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {selectedPriceLabel !== 'Cualquier precio' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#B8860B' }} />
                  )}
                </button>

                <AnimatePresence>
                  {showPriceFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 py-2 w-52 bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col"
                      style={{ borderColor: 'rgba(45,75,57,0.08)' }}
                    >
                      <p className="px-5 pt-1 pb-2 text-xs font-medium" style={{ color: 'rgba(45,75,57,0.4)' }}>Filtrar por precio</p>
                      {priceOptions.map((option) => {
                        const isSelected = selectedPriceLabel === option.label;
                        return (
                          <button
                            key={option.label}
                            onClick={() => { setCurrentMaxFilter(option.value); setSelectedPriceLabel(option.label); setShowPriceFilter(false); }}
                            className="w-full text-left px-5 py-2.5 text-sm transition-colors"
                            style={{
                              backgroundColor: isSelected ? 'rgba(45,75,57,0.05)' : 'transparent',
                              color: isSelected ? '#B8860B' : '#2D4B39',
                              fontWeight: isSelected ? 500 : 400,
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(45,75,57,0.02)'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Filtros de Categorías */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-12"
        >
          {[{ id: 'all', nombre: 'Todos' }, ...categories].map(cat => {
            const active = selectedCategory === (cat.id === 'all' ? 'all' : String(cat.id_categoria_prod));
            return (
              <motion.button
                key={cat.id || cat.id_categoria_prod}
                onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : String(cat.id_categoria_prod))}
                className="px-5 py-2 rounded-full text-sm transition-all"
                style={{
                  backgroundColor: active ? '#2D4B39' : 'white',
                  color: active ? 'white' : 'rgba(45,75,57,0.7)',
                  border: active ? '1px solid #2D4B39' : '1px solid rgba(45,75,57,0.12)',
                  fontWeight: active ? 500 : 400,
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {cat.nombre}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(45,75,57,0.06)' }}>
                <div className="h-48 sm:h-64 animate-pulse" style={{ backgroundColor: 'rgba(45,75,57,0.05)' }} />
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="h-4 rounded-full animate-pulse w-3/4" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }} />
                  <div className="h-3 rounded-full animate-pulse w-1/2" style={{ backgroundColor: 'rgba(45,75,57,0.04)' }} />
                  <div className="h-9 rounded-full animate-pulse mt-4" style={{ backgroundColor: 'rgba(45,75,57,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory + searchQuery + currentMaxFilter + visibleCount}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {displayedProducts.map((product, index) => {
                  const agotado = Number(product.stock) === 0;
                  return (
                    <motion.div
                      key={product.id_productos}
                      className="bg-white rounded-2xl overflow-hidden group"
                      style={{
                        border: '1px solid rgba(45,75,57,0.07)',
                        opacity: agotado ? 0.6 : 1,
                      }}
                      initial={{ opacity: agotado ? 0.4 : 0, y: 20 }}
                      animate={{ opacity: agotado ? 0.6 : 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={agotado ? {} : { y: -6, boxShadow: '0 16px 40px rgba(45,75,57,0.1)' }}
                    >
                      {/* Imagen */}
                      <div className="relative h-60 overflow-hidden" style={{ backgroundColor: 'rgba(224,209,192,0.15)' }}>
                        {product.imagen_url ? (
                          <img
                            src={product.imagen_url}
                            alt={product.nombre_producto}
                            className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                            style={{ filter: agotado ? 'grayscale(60%)' : 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12" style={{ color: 'rgba(45,75,57,0.15)' }} />
                          </div>
                        )}

                        {agotado && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                            <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                              AGOTADO
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="p-5">
                        {product.categoria && (
                          <span className="text-[10px] tracking-widest uppercase font-medium mb-2 inline-block" style={{ color: '#B8860B' }}>
                            {product.categoria}
                          </span>
                        )}
                        <h3 className="font-medium mb-1 leading-snug" style={{ color: agotado ? '#9CA3AF' : '#2D4B39', fontSize: '0.95rem' }}>
                          {product.nombre_producto}
                        </h3>
                        <p className="text-xs mb-4 line-clamp-2 leading-relaxed" style={{ color: agotado ? '#9CA3AF' : 'rgba(45,75,57,0.55)' }}>
                          {product.descripcion || '—'}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <span className="font-elegant text-lg" style={{ color: agotado ? '#9CA3AF' : '#B8860B' }}>
                            ${Number(product.precio).toLocaleString('es-CO')}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(45,75,57,0.4)' }}>COP</span>
                        </div>

                        <motion.button
                          onClick={() => handleAddToCart(product)}
                          disabled={agotado}
                          className="w-full py-2.5 text-sm font-medium rounded-full flex items-center justify-center gap-2 transition-colors"
                          style={{
                            backgroundColor: agotado ? 'rgba(45,75,57,0.06)' : '#2D4B39',
                            color: agotado ? '#9CA3AF' : 'white',
                            cursor: agotado ? 'not-allowed' : 'pointer',
                          }}
                          whileHover={agotado ? {} : { backgroundColor: '#B8860B', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}
                          whileTap={agotado ? {} : { scale: 0.97 }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {agotado ? 'Agotado' : 'Agregar al carrito'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Botón Ver Más Elegante (En tono Dorado) */}
            {filtered.length > visibleCount && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-12"
              >
                <motion.button
                  onClick={() => setVisibleCount(prev => prev + 8)}
                  className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium tracking-wide bg-white transition-all shadow-sm border text-white"
                  style={{ 
                    backgroundColor: '#B8860B',
                    borderColor: '#B8860B',
                    boxShadow: '0 4px 14px rgba(184,134,11,0.2)'
                  }}
                  whileHover={{ 
                    backgroundColor: '#996F05', 
                    borderColor: '#996F05',
                    scale: 1.02,
                    boxShadow: '0 6px 20px rgba(184,134,11,0.3)' 
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Ver más productos
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: 'rgba(45,75,57,0.06)' }}>
              <Package className="w-7 h-7" style={{ color: 'rgba(45,75,57,0.3)' }} />
            </div>
            <p className="font-medium mb-1" style={{ color: '#2D4B39' }}>No se encontraron productos</p>
            <p className="text-sm" style={{ color: 'rgba(45,75,57,0.5)' }}>Intenta con otra búsqueda, categoría o cambiando el rango de precio</p>
          </motion.div>
        )}

        {/* PREGUNTAS FRECUENTES */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Preguntas frecuentes</span>
            </div>
            <h2 className="font-elegant mb-10" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D4B39', lineHeight: 1.1 }}>
              ¿Tienes dudas?
            </h2>
            <div className="space-y-4 max-w-3xl">
              {[
                {
                  q: '¿Nudo Studio realiza productos personalizados?',
                  a: '¡Sí! En Nudo Studio realizamos productos personalizados según tus preferencias de color, tamaño y diseño. Si deseas solicitar un producto personalizado o tienes alguna idea en mente, puedes comunicarte directamente con Anudados Patty por WhatsApp y con gusto te asesoramos.',
                  highlight: true,
                },
                {
                  q: '¿Cuánto tiempo tarda la elaboración de un producto?',
                  a: 'El tiempo de elaboración varía según el tipo de pieza. Las piezas pequeñas pueden estar listas en 3-5 días hábiles, mientras que las piezas grandes o personalizadas pueden tomar entre 1 y 3 semanas.',
                },
                {
                  q: '¿Cómo realizo mi pedido?',
                  a: 'Puedes agregar los productos al carrito, completar tu información de envío y adjuntar el comprobante de pago. Una vez verificado el pago, tu pedido entra en producción.',
                },
                {
                  q: '¿Hacen envíos a todo Colombia?',
                  a: 'Sí, realizamos envíos a todo el territorio nacional. El costo y tiempo de envío dependen de tu ciudad.',
                },
              ].map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} highlight={item.highlight} />
              ))}
            </div>
          </motion.div>
        )}

        {/* BANNER PERSONALIZADO WHATSAPP */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 mb-4 rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)', padding: '48px 40px' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#B8860B', fontWeight: 500 }}>Productos personalizados</p>
                <h3 className="font-elegant mb-3" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#fff', lineHeight: 1.1 }}>
                  ¿Quieres algo único?
                </h3>
                <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  Comunicate con <strong style={{ color: '#E8B84B' }}>Anudados Patty</strong> por WhatsApp y cuéntanos tu idea. Creamos piezas a tu medida con los colores, tamaños y diseños que imagines.
                </p>
              </div>
              <a
                href="https://wa.me/573126058401?text=Hola%2C%20me%20gustar%C3%ADa%20un%20producto%20personalizado"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium text-base transition-all hover:opacity-90"
                style={{ background: '#25D366', color: '#fff', textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Personalizar ahora
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FaqItem({ question, answer, highlight }: { question: string; answer: string; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: highlight ? '1px solid rgba(184,134,11,0.3)' : '1px solid rgba(45,75,57,0.1)',
        backgroundColor: highlight ? 'rgba(184,134,11,0.03)' : 'white',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between p-5 gap-4">
        <span className="font-medium text-sm" style={{ color: highlight ? '#92400E' : '#2D4B39' }}>
          {highlight && <span className="mr-2" style={{ color: '#B8860B' }}>✨</span>}
          {question}
        </span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{ color: '#B8860B', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(45,75,57,0.7)' }}>{answer}</p>
          {highlight && (
            <a
              href="https://wa.me/573126058401?text=Hola%2C%20me%20gustar%C3%ADa%20un%20producto%20personalizado"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: '#25D366', color: '#fff', textDecoration: 'none' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Solicitar por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}