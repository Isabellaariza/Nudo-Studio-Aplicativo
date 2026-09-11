import { Instagram, Facebook, Mail, MapPin, Heart, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer 
        className="py-16 px-4"
        style={{ backgroundColor: '#2D4B39' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Main Grid - 4 columnas iguales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* COLUMNA 1 - LOGO Y UBICACIÓN (25%) */}
            <div className="text-left">
              <div className="flex items-baseline gap-3 justify-start mb-4">
                <span 
                  className="font-elegant text-2xl"
                  style={{ 
                    color: '#FFFFFF',
                    letterSpacing: '0.15em',
                    fontWeight: 'normal'
                  }}
                >
                  NUDO
                </span>
                <div className="relative">
                  <div 
                    className="absolute -left-2 top-0 bottom-0 w-[1px]"
                    style={{ 
                      backgroundColor: '#B8860B',
                      opacity: 0.4
                    }}
                  />
                  <span 
                    className="text-xs uppercase pl-3"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      letterSpacing: '0.3em'
                    }}
                  >
                    Studio
                  </span>
                </div>
              </div>
              
              <p 
                className="text-base leading-relaxed mb-4"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Creamos piezas únicas de macramé y tejido textil que transforman espacios 
                y abrazan la tradición artesanal con un toque contemporáneo.
              </p>
              
              <div className="flex items-start gap-2">
                <MapPin 
                  className="w-5 h-5 flex-shrink-0 mt-1" 
                  style={{ color: '#B8860B' }} 
                />
                <p 
                  className="text-base leading-relaxed"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  Carrera 95 #70 GA-16, Medellín, Colombia
                </p>
              </div>
            </div>

            {/* COLUMNA 2 - CATEGORÍAS (25%) */}
            <div className="text-left">
              <h2 
                className="font-elegant text-xl mb-6"
                style={{ color: '#E8B84B' }}
              >
                Categorías
              </h2>
              
              <div className="space-y-3">
                <a 
                  href="#"
                  className="block hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Bolsos
                </a>
                <a 
                  href="#"
                  className="block hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Accesorios
                </a>
                <a 
                  href="#"
                  className="block hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Decoración
                </a>
              </div>
            </div>

            {/* COLUMNA 3 - CONTACTO (25%) */}
            <div className="text-left">
              <h2 
                className="font-elegant text-xl mb-6"
                style={{ color: '#E8B84B' }}
              >
                Contacto
              </h2>
              
              {/* MENSAJE PERSONALIZADO WHATSAPP */}
              <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)' }}>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  ¿Quieres algo personalizado? Comunícate con nosotros por WhatsApp.
                </p>
                <a
                  href="https://wa.me/573126058401?text=Hola%2C%20me%20gustar%C3%ADa%20un%20producto%20personalizado"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#25D366', color: '#fff', textDecoration: 'none' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Personalizar ahora
                </a>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 justify-start">
                  <Mail 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: '#B8860B' }} 
                  />
                  <a 
                    href="mailto:anudadospatty@gmail.com"
                    className="hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    anudadospatty@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* COLUMNA 4 - REDES SOCIALES (25%) */}
            <div className="text-left">
              <h2 
                className="font-elegant text-xl mb-6"
                style={{ color: '#E8B84B' }}
              >
                Síguenos
              </h2>
              
              <div className="space-y-3">
                <a 
                  href="https://www.instagram.com/anudados_patty?igsh=MXJ1bHE5MGd5d2VnYw=="
                  className="flex items-center gap-2 justify-start hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
                
                <a 
                  href="https://www.facebook.com/share/18rzk2XDR4/"
                  className="flex items-center gap-2 justify-start hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>

          {/* SEPARADOR */}
          <div 
            className="h-[1px] my-12"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          />

          {/* COPYRIGHT */}
          <div className="space-y-4">
            <p 
              className="text-center flex items-center justify-center gap-2 flex-wrap"
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              © 2026 Nudo Studio. Hecho con 
              <Heart 
                className="w-4 h-4" 
                style={{ color: '#B8860B' }} 
                fill="#B8860B"
              /> 
              en Medellín, Colombia
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm">
              <a 
                href="#"
                className="hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              >
                Política de Privacidad
              </a>
              <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>|</span>
              <a 
                href="#"
                className="hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              >
                Términos de Servicio
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* BOTÓN SCROLL TO TOP */}
      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center z-50"
          style={{ backgroundColor: '#B8860B' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowUp className="w-6 h-6" style={{ color: '#FFFFFF' }} />
        </motion.button>
      )}
    </>
  );
}