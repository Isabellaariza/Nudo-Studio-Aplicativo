import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { productsAPI, newsAPI } from '../../lib/api';
import { ArrowRight, Star, ChevronDown } from 'lucide-react';
import '../../../styles/hero-dots.css';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => { loadHomeData(); }, []);

  const loadHomeData = async () => {
    try {
      const [productsData] = await Promise.all([
        productsAPI.getAll().catch(() => ({ productos: [] })),
        newsAPI.getAll().catch(() => ({ news: [] })),
      ]);
      const all = productsData.productos || [];
      setFeaturedProducts(all.slice(0, 3));
    } catch {
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { title: 'Artesanía Única', description: 'Cada pieza es creada a mano con dedicación y atención al detalle', image: '/images/ArtesaniaUnica.webp' },
    { title: 'Diseño Personalizado', description: 'Creamos piezas únicas adaptadas a tu estilo y necesidades', image: '/images/DisenoPersonalizado.webp' },
    { title: 'Talleres & Aprendizaje', description: 'Aprende el arte del macramé y tejido con nuestros expertos', image: '/images/TalleresAprendizaje.webp' },
  ];

  const faqs = [
    { question: '¿Cuánto tiempo toma hacer un pedido personalizado?', answer: 'Los pedidos personalizados toman entre 2-3 semanas dependiendo de la complejidad. Te mantendremos informado del progreso durante todo el proceso.' },
    { question: '¿Qué materiales utilizan en sus productos?', answer: 'Utilizamos hilos 100% algodón, cuentas de madera certificada y materiales eco-friendly. Todos nuestros productos son libres de químicos dañinos.' },
    { question: '¿Hacen envíos a toda Colombia?', answer: 'Sí, realizamos envíos a todo el territorio nacional. Los envíos dentro de Medellín están desde $7.000 hasta $25.000 y para otras ciudades manejamos tarifas preferenciales que están dentro de los $70.000.' },
    { question: '¿Puedo aprender macramé en sus talleres sin experiencia?', answer: '¡Por supuesto! Nuestros talleres están diseñados para todos los niveles. Comenzamos desde lo básico y te acompañamos paso a paso.' },
    { question: '¿Ofrecen garantía en sus productos?', answer: 'Por la naturaleza de nuestros productos textiles y el cuidado con el que los empaquetamos, no ofrecemos políticas de devolución/garantía. Sin embargo, si necesitas comunicarnos alguna novedad sobre tu pedido o consultar por una devolución, por favor contáctanos vía WhatsApp para revisar tu caso de forma personalizada.' },
  ];

  const displayProducts = featuredProducts.length > 0
    ? featuredProducts
    : [{ id_productos: 1, nombre_producto: 'Macramé Luna', descripcion: '', precio: 0 }, { id_productos: 2, nombre_producto: 'Colgante de Pared', descripcion: '', precio: 0 }, { id_productos: 3, nombre_producto: 'Bolso Tejido', descripcion: '', precio: 0 }];

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', marginTop: '-32px', overflow: 'hidden', backgroundColor: '#FAF7F2' }}>

        {/* Puntitos flotantes — animados con CSS puro (sin JS, sin TBT) */}
        <div aria-hidden="true" className="hero-dots">
          {[
            { s:10, l:'8%',  t:'22%', d:0,   dr:4  },
            { s:5,  l:'15%', t:'65%', d:0.3, dr:3  },
            { s:8,  l:'23%', t:'40%', d:1.1, dr:5  },
            { s:4,  l:'31%', t:'78%', d:0.7, dr:3.5},
            { s:12, l:'38%', t:'18%', d:1.8, dr:4.5},
            { s:6,  l:'44%', t:'55%', d:0.4, dr:3.2},
            { s:9,  l:'52%', t:'82%', d:2.1, dr:4.8},
            { s:4,  l:'58%', t:'30%', d:0.9, dr:3.7},
            { s:11, l:'65%', t:'70%', d:1.5, dr:5.2},
            { s:5,  l:'71%', t:'12%', d:0.2, dr:3.3},
            { s:7,  l:'77%', t:'48%', d:1.3, dr:4.1},
            { s:13, l:'83%', t:'85%', d:0.6, dr:5.5},
            { s:4,  l:'88%', t:'35%', d:2.4, dr:3.8},
            { s:8,  l:'93%', t:'60%', d:1.0, dr:4.3},
            { s:6,  l:'5%',  t:'88%', d:1.7, dr:3.6},
            { s:10, l:'48%', t:'8%',  d:0.5, dr:4.7},
            { s:5,  l:'20%', t:'10%', d:2.0, dr:3.1},
            { s:7,  l:'75%', t:'25%', d:1.4, dr:4.9},
          ].map((dot, i) => (
            <span
              key={i}
              className="hero-dot"
              style={{
                width: dot.s, height: dot.s,
                left: dot.l, top: dot.t,
                background: i % 2 === 0 ? '#B8860B' : '#2D4B39',
                animationDuration: `${dot.dr}s`,
                animationDelay: `${dot.d}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full pt-28 pb-12 lg:pt-0 lg:pb-0" style={{ position: 'relative', zIndex: 2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Texto — animación CSS pura, sin opacity:0 inicial en JS */}
            <div className="hero-text-enter">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
                style={{ backgroundColor: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)' }}
              >
                <Star className="w-3.5 h-3.5" style={{ color: '#B8860B' }} fill="#B8860B" />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#7A5C00', fontWeight: 600 }}>
                  100% Artesanal · Hecho a mano
                </span>
              </div>

              <h1 className="font-elegant mb-6" style={{ fontSize: 'clamp(3.5rem, 7vw, 5.5rem)', lineHeight: 1.05, color: '#2D4B39' }}>
                Creaciones<br />
                <span style={{ color: '#B8860B' }}>Únicas</span>
              </h1>

              <p className="text-lg leading-relaxed mb-10" style={{ color: '#3D5C47', maxWidth: '440px' }}>
                Descubre el arte del macramé y tejido textil. Cada pieza cuenta una historia,
                cada nudo abraza la tradición con un toque contemporáneo.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('catalog')}
                  className="px-8 py-3.5 rounded-full text-white text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-[#B8860B]"
                  style={{ backgroundColor: '#2D4B39' }}
                >
                  Explorar Catálogo
                </button>
                <button
                  onClick={() => onNavigate('workshops')}
                  className="px-8 py-3.5 rounded-full text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-[rgba(45,75,57,0.04)] hover:border-[#2D4B39]"
                  style={{ color: '#2D4B39', border: '1.5px solid rgba(45,75,57,0.25)' }}
                >
                  Ver Talleres
                </button>
              </div>
            </div>

            {/* Imagen LCP — div estático, sin opacity:0 inicial, el navegador la descubre de inmediato */}
            <div className="flex justify-center lg:justify-end hero-img-enter">
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-[2.5rem]"
                  style={{ background: 'linear-gradient(135deg, rgba(45,75,57,0.08), rgba(184,134,11,0.08))' }}
                />
                <div
                  className="relative w-full max-w-[380px] rounded-[2rem] overflow-hidden"
                  style={{ aspectRatio: '380/460', boxShadow: '0 32px 64px rgba(45,75,57,0.15)' }}
                >
                  <picture>
                    <source media="(max-width: 767px)" srcSet="/images/Principal-mobile.webp" type="image/webp" />
                    <source srcSet="/images/Principal.webp" type="image/webp" />
                    <img
                      src="/images/Principal.webp"
                      alt="Artesanía textil Nudo Studio - pieza principal"
                      width={501}
                      height={551}
                      fetchPriority="high"
                      decoding="sync"
                      className="w-full h-full object-cover"
                    />
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILOSOFÍA ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Nuestra historia</span>
              </div>
              <h2 className="font-elegant mb-6" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#2D4B39', lineHeight: 1.15 }}>
                Nuestra Filosofía
              </h2>
              <p className="leading-relaxed mb-5" style={{ color: 'rgba(45,75,57,0.65)', fontSize: '1.05rem' }}>
                En Nudo Studio, creemos que cada nudo cuenta una historia. Nuestro trabajo celebra
                el arte ancestral del anudado, combinándolo con diseños contemporáneos para crear
                piezas únicas que transforman espacios y adornan vidas.
              </p>
              <p className="leading-relaxed" style={{ color: 'rgba(45,75,57,0.65)', fontSize: '1.05rem' }}>
                Cada creación es el resultado de horas de trabajo meticuloso, pasión por el detalle
                y un profundo respeto por la artesanía tradicional.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[['Materiales naturales', 'Hilos 100% algodón y madera certificada'], ['Hecho a mano', 'Cada pieza es única e irrepetible'], ['Diseño propio', 'Patrones exclusivos de Nudo Studio'], ['Envío seguro', 'Empaque artesanal con cuidado especial']].map(([title, desc]) => (
                <div key={title} className="p-5 rounded-2xl" style={{ backgroundColor: 'rgba(45,75,57,0.03)', border: '1px solid rgba(45,75,57,0.07)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mb-3" style={{ backgroundColor: '#B8860B' }} />
                  <p className="text-sm font-medium mb-1" style={{ color: '#2D4B39' }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(45,75,57,0.5)' }}>{desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Lo que nos define</span>
              <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            </div>
            <h2 className="font-elegant" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D4B39' }}>
              Por qué elegirnos
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-5">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    width={400}
                    height={300}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(to top, rgba(45,75,57,0.5) 0%, transparent 60%)' }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-6 transition-all duration-300 group-hover:w-10" style={{ backgroundColor: '#B8860B' }} />
                  <h3 className="font-medium" style={{ color: '#2D4B39', fontSize: '1.05rem' }}>{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: 'rgba(45,75,57,0.6)' }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Colección</span>
              </div>
              <h2 className="font-elegant" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D4B39' }}>
                Productos Destacados
              </h2>
            </div>
            <motion.button
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: '#2D4B39' }}
              whileHover={{ gap: '12px', color: '#B8860B' }}
              transition={{ duration: 0.2 }}
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id_productos}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => onNavigate('products')}
              >
                <div
                  className="relative aspect-square overflow-hidden rounded-2xl mb-4"
                  style={{ backgroundColor: 'rgba(224,209,192,0.2)' }}
                >
                  {(product.imagen_url || product.imageUrl) ? (
                    <img
                      src={product.imagen_url || product.imageUrl}
                      alt={product.nombre_producto}
                      width={400}
                      height={400}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full" style={{ backgroundColor: 'rgba(45,75,57,0.08)' }} />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5"
                    style={{ background: 'linear-gradient(to top, rgba(45,75,57,0.6) 0%, transparent 60%)' }}
                  >
                    <span className="text-white text-sm font-medium">Ver producto →</span>
                  </div>
                </div>
                <h3 className="font-medium mb-1" style={{ color: '#2D4B39' }}>{product.nombre_producto}</h3>
                {product.descripcion && (
                  <p className="text-sm mb-2 line-clamp-1" style={{ color: 'rgba(45,75,57,0.55)' }}>{product.descripcion}</p>
                )}
                {product.precio > 0 && (
                  <p className="font-elegant text-lg" style={{ color: '#B8860B' }}>
                    ${Number(product.precio).toLocaleString('es-CO')} COP
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>FAQ</span>
              <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            </div>
            <h2 className="font-elegant mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D4B39' }}>
              Preguntas Frecuentes
            </h2>
            <p style={{ color: 'rgba(45,75,57,0.6)' }}>Resolvemos las dudas más comunes sobre nuestros productos y servicios</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="rounded-2xl overflow-hidden bg-white"
                style={{ border: '1px solid rgba(45,75,57,0.08)' }}
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                  style={{ backgroundColor: expandedFAQ === index ? 'rgba(45,75,57,0.02)' : 'transparent' }}
                >
                  <span className="pr-4 font-medium" style={{ color: '#2D4B39', fontSize: '0.95rem' }}>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: expandedFAQ === index ? '#B8860B' : 'rgba(45,75,57,0.08)' }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: expandedFAQ === index ? '#fff' : '#2D4B39' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(45,75,57,0.65)' }}>
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PEDIDOS PERSONALIZADOS ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Hecho para ti</span>
              </div>
              <h2 className="font-elegant mb-6" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#2D4B39', lineHeight: 1.15 }}>
                Pedidos Personalizados
              </h2>
              <p className="leading-relaxed mb-5" style={{ color: 'rgba(45,75,57,0.65)', fontSize: '1.05rem' }}>
                ¿Tienes en mente una pieza especial? Creamos diseños únicos adaptados exactamente
                a tus colores, medidas y estilo. Cada pedido personalizado es una colaboración
                entre tu visión y nuestra artesanía.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: 'rgba(45,75,57,0.65)', fontSize: '1.05rem' }}>
                Cuéntanos tu idea por WhatsApp y te acompañamos en todo el proceso, desde el
                diseño hasta la entrega.
              </p>
              <a
                href="https://wa.me/573126058401"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-white text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar pedido personalizado
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ['Colores a tu gusto', 'Elige la paleta que mejor combine con tu espacio o estilo personal'],
                ['Medidas exactas', 'Fabricamos en el tamaño que necesites, sin restricciones'],
                ['Materiales premium', 'Hilos 100% algodón y materiales naturales de alta calidad'],
                ['Entrega en 2-3 semanas', 'Te mantenemos informado del progreso en todo momento'],
              ].map(([title, desc]) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: 'rgba(45,75,57,0.03)', border: '1px solid rgba(45,75,57,0.07)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full mb-3" style={{ backgroundColor: '#B8860B' }} />
                  <p className="text-sm font-medium mb-1" style={{ color: '#2D4B39' }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(45,75,57,0.5)' }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
