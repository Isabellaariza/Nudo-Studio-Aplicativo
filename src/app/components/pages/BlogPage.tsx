import { motion } from 'motion/react';
import { Calendar, Tag } from 'lucide-react';

interface BlogPageProps {
  onNavigate: (page: string) => void;
}

const blogPosts = [
  {
    id: '1',
    title: 'Nueva Colección: Piezas para el Hogar',
    excerpt: 'Presentamos nuestra colección más reciente de piezas decorativas para el hogar, elaboradas a mano con fibras naturales seleccionadas. Cada pieza es única e irrepetible.',
    date: '10 de Julio, 2025',
    category: 'Colecciones',
  },
  {
    id: '2',
    title: 'Talleres de Julio: Nuevas Fechas Disponibles',
    excerpt: 'Abrimos nuevos cupos para nuestros talleres de macramé este mes. Aprende desde cero o perfecciona tu técnica en un espacio íntimo y creativo.',
    date: '3 de Julio, 2025',
    category: 'Talleres',
  },
  {
    id: '3',
    title: 'Cuidado y Mantenimiento de tus Piezas',
    excerpt: 'Te compartimos los mejores consejos para que tus creaciones en macramé duren en perfectas condiciones por mucho más tiempo.',
    date: '25 de Junio, 2025',
    category: 'Consejos',
  },
];

const categoryColors: Record<string, { bg: string; color: string }> = {
  Colecciones: { bg: 'rgba(45,75,57,0.07)', color: '#2D4B39' },
  Talleres:    { bg: 'rgba(184,134,11,0.08)', color: '#B8860B' },
  Consejos:    { bg: 'rgba(45,75,57,0.07)', color: '#2D4B39' },
};

export function BlogPage({ onNavigate }: BlogPageProps) {
  return (
    <div className="min-h-screen pb-24 px-6" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-16 pb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10" style={{ backgroundColor: '#B8860B' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#B8860B', fontWeight: 500 }}>Noticias</span>
          </div>
          <h1 className="font-elegant mb-3" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', color: '#2D4B39', lineHeight: 1.05 }}>
            Novedades
          </h1>
          <p className="text-base" style={{ color: 'rgba(45,75,57,0.6)', maxWidth: '480px' }}>
            Mantente al día con nuestras últimas creaciones, eventos y noticias
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogPosts.map((post, index) => {
            const cat = categoryColors[post.category] || categoryColors['Consejos'];
            return (
              <motion.article
                key={post.id}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ border: '1px solid rgba(45,75,57,0.07)' }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(45,75,57,0.1)' }}
              >
                {/* Franja de color superior */}
                <div className="h-1 w-full" style={{ backgroundColor: '#B8860B' }} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Categoría + fecha */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
                    >
                      <Tag className="w-3 h-3" />
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5" style={{ color: 'rgba(45,75,57,0.4)' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{post.date}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3
                    className="font-elegant text-lg leading-snug mb-3 transition-colors duration-200 group-hover:text-[#B8860B]"
                    style={{ color: '#2D4B39' }}
                  >
                    {post.title}
                  </h3>

                  {/* Extracto */}
                  <p className="text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: 'rgba(45,75,57,0.6)' }}>
                    {post.excerpt}
                  </p>

                  {/* Leer más */}
                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(45,75,57,0.07)' }}>
                    <span
                      className="text-xs font-medium inline-flex items-center gap-1 transition-all duration-200 group-hover:gap-2"
                      style={{ color: '#B8860B' }}
                    >
                      Leer más →
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </div>
  );
}
