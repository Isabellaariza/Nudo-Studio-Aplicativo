import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Search, Plus, Eye, Edit, Trash2, Package, 
  DollarSign, X, Clock, Upload, AlertTriangle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { productsAPI } from '../../lib/api';

interface Producto {
  id: number;
  nombre: string;
  sku?: string;
  categoria: string;
  precio: number;
  stock: number;
  descripcion: string;
  vendidos?: number;
  imageUrl?: string;
  id_categoria_prod?: number;
}

const CLOUDINARY_CLOUD = 'ddcx9ks5g';
const CLOUDINARY_PRESET = 'nudo_studio';
const ITEMS_PER_PAGE = 6;

async function subirImagen(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al subir imagen a Cloudinary');
  const data = await res.json();
  return data.secure_url;
}

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [editForm, setEditForm] = useState<Producto | null>(null);
  const [newForm, setNewForm] = useState<any>({
    nombre: '',
    categoria: 'Accesorios',
    precio: 0,
    stock: 0,
    descripcion: '',
    sku: '',
    imageUrl: ''
  });

  const cargarProductos = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getCategorias()
      ]);
      const mapped = prodData.productos.map((p: any) => ({
        id: p.id_productos,
        nombre: p.nombre_producto,
        categoria: p.categoria || 'Sin categoría',
        precio: Number(p.precio),
        stock: Number(p.stock),
        descripcion: p.descripcion || '',
        id_categoria_prod: p.id_categoria_prod,
        imageUrl: p.imagen_url || '',
      }));
      setProductos(mapped);
      setCategoriasList(catData.categorias);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarProductos(); }, []);

  // Filtrado
  const filteredProductos = productos.filter(producto => {
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (producto.sku && producto.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProductos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProductos = filteredProductos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStockColor = (stock: number) => {
    if (stock === 0) return '#EF4444';
    if (stock <= 5) return '#F59E0B';
    return '#10B981';
  };

  const getStockBgColor = (stock: number) => {
    if (stock === 0) return 'rgba(239, 68, 68, 0.1)';
    if (stock <= 5) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  const getSKU = (producto: Producto) => {
    return producto.sku || `PROD-${String(producto.id).padStart(3, '0')}`;
  };

const handleShowDetails = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalVerOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setEditForm({ ...producto, id_categoria_prod: producto.id_categoria_prod ?? undefined });
    setModalEditarOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    try {
      await productsAPI.update(editForm.id, {
        nombre_producto: editForm.nombre,
        precio: editForm.precio,
        stock: editForm.stock,
        descripcion: editForm.descripcion,
        id_categoria_prod: editForm.id_categoria_prod,
        imagen_url: editForm.imageUrl,
      });
      await cargarProductos();
      setModalEditarOpen(false);
      setEditForm(null);
      toast.success('Producto actualizado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const handleDelete = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalEliminarOpen(true);
  };

  const confirmDelete = async () => {
    if (!productoSeleccionado) return;
    try {
      await productsAPI.delete(productoSeleccionado.id);
      await cargarProductos();
      setModalEliminarOpen(false);
      setProductoSeleccionado(null);
      toast.success('Producto eliminado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={{ marginBottom: '32px' }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          Cargando productos...
        </div>
      )}
      {/* HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(45, 75, 57, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(45, 75, 57, 0.08)',
          marginBottom: '32px',
          padding: '32px 40px'
        }}
      >
        {/* Todo en una sola línea */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Ícono + Título + Contador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2D4B39 0%, #1F3A2E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(45, 75, 57, 0.25)',
                flexShrink: 0
              }}
            >
              <ShoppingBag style={{ width: '26px', height: '26px', color: '#ffffff' }} />
            </motion.div>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#2D4B39',
                margin: 0,
                lineHeight: 1.2
              }}>
                Gestión de productos
              </h1>
              <p style={{ 
                fontSize: '15px', 
                color: '#6B7280',
                margin: 0
              }}>
                {filteredProductos.length} productos encontrados
              </p>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div style={{ position: 'relative', width: '400px' }}>
            <Search style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#9CA3AF'
            }} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '48px',
                paddingRight: '20px',
                paddingTop: '14px',
                paddingBottom: '14px',
                fontSize: '15px',
                border: '1px solid rgba(45, 75, 57, 0.15)',
                borderRadius: '12px',
                background: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
              }}
            />
          </div>
          
          {/* Botón Nuevo Producto */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalAgregarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(45, 75, 57, 0.25)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus style={{ width: '20px', height: '20px' }} />
            Nuevo Producto
          </motion.button>
        </div>
      </motion.div>

      {/* GRID DE PRODUCTOS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px'
      }}>
        {currentProductos.map((producto, index) => (
          <motion.div
            key={producto.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(45, 75, 57, 0.08)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(45, 75, 57, 0.08)'
            }}
          >
            {/* Imagen del producto */}
            <div style={{
              width: '100%',
              height: '280px',
              background: producto.imageUrl ? `url(${producto.imageUrl})` : '#F5F5F5',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: '16px',
              position: 'relative'
            }}>
              {!producto.imageUrl && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <Package style={{ width: '64px', height: '64px', color: '#D1D5DB' }} />
                </div>
              )}
              
              {/* Badge de stock */}
              <div style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: getStockBgColor(producto.stock),
                color: getStockColor(producto.stock),
                fontSize: '13px',
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${getStockColor(producto.stock)}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                {producto.stock} en stock
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '24px' }}>
              {/* Categoría */}
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'rgba(184, 134, 11, 0.1)',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#B8860B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {producto.categoria}
                </span>
              </div>

              {/* Nombre */}
              <h3 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#2D4B39',
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                {producto.nombre}
              </h3>

              {/* Descripción */}
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: '1.6',
                marginBottom: '20px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {producto.descripcion}
              </p>

              {/* Precio */}
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#B8860B',
                marginBottom: '24px'
              }}>
                ${producto.precio.toLocaleString()} COP
              </div>

              {/* Botones de acción */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px'
              }}>
                <motion.button
                  whileHover={{ 
                    background: 'rgba(45, 75, 57, 0.05)', 
                    borderColor: '#2D4B39',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleShowDetails(producto)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    color: '#2D4B39',
                    border: '1px solid rgba(45, 75, 57, 0.15)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Info style={{ width: '16px', height: '16px' }} />
                  Ver
                </motion.button>

                <motion.button
                  whileHover={{ 
                    background: 'rgba(184, 134, 11, 0.05)', 
                    borderColor: '#B8860B',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEdit(producto)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    color: '#B8860B',
                    border: '1px solid rgba(184, 134, 11, 0.15)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Edit style={{ width: '16px', height: '16px' }} />
                  Editar
                </motion.button>

                <motion.button
                  whileHover={{ 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    borderColor: '#EF4444',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(producto)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Eliminar
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Paginación */}
      {filteredProductos.length > ITEMS_PER_PAGE && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(45, 75, 57, 0.08)',
            border: '1px solid rgba(45, 75, 57, 0.08)'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(45, 75, 57, 0.15)',
              background: currentPage === 1 ? 'rgba(224, 209, 192, 0.1)' : '#ffffff',
              color: currentPage === 1 ? '#9CA3AF' : '#2D4B39',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Anterior
          </motion.button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <motion.button
              key={page}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(page)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: currentPage === page 
                  ? 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)' 
                  : 'rgba(224, 209, 192, 0.1)',
                color: currentPage === page ? '#ffffff' : '#2D4B39',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                minWidth: '44px',
                boxShadow: currentPage === page ? '0 4px 12px rgba(45, 75, 57, 0.3)' : 'none'
              }}
            >
              {page}
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(45, 75, 57, 0.15)',
              background: currentPage === totalPages ? 'rgba(224, 209, 192, 0.1)' : '#ffffff',
              color: currentPage === totalPages ? '#9CA3AF' : '#2D4B39',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Siguiente
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </motion.button>
        </motion.div>
      )}

      {/* MODAL VER DETALLES */}
      <AnimatePresence>
        {modalVerOpen && productoSeleccionado && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalVerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed',
                top: '5%',
                left: '20%',
                transform: 'translate(-50%, -50%)',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '900px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                zIndex: 1001,
                boxShadow: '0 20px 60px rgba(45, 75, 57, 0.3)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#2D4B39' }}>
                  Detalles del Producto
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalVerOpen(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                </motion.button>
              </div>

              {/* Contenido en 2 columnas */}
              <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '32px' }}>
                {/* Columna Izquierda - Imagen */}
                <div>
                  <div style={{
                    width: '100%',
                    height: '400px',
                    background: productoSeleccionado.imageUrl ? `url(${productoSeleccionado.imageUrl})` : '#F5F5F5',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(45, 75, 57, 0.15)'
                  }}>
                    {!productoSeleccionado.imageUrl && (
                      <Package style={{ width: '120px', height: '120px', color: '#999' }} />
                    )}
                  </div>
                </div>

                {/* Columna Derecha - Información */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Sección 1: Información Básica */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '9999px',
                      background: 'rgba(184, 134, 11, 0.1)',
                      color: '#B8860B',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: '16px'
                    }}>
                      {productoSeleccionado.categoria}
                    </span>
                    
                    <h3 style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#2D4B39',
                      marginBottom: '8px'
                    }}>
                      {productoSeleccionado.nombre}
                    </h3>
                    
                    <p style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      fontFamily: 'monospace',
                      marginBottom: '16px'
                    }}>
                      SKU: {getSKU(productoSeleccionado)}
                    </p>
                  </div>

                  {/* Sección 2: Descripción */}
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#2D4B39',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px'
                    }}>
                      Descripción
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      lineHeight: '1.6'
                    }}>
                      {productoSeleccionado.descripcion}
                    </p>
                  </div>

                  {/* Sección 3: Grid de Información */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    {/* Precio de Venta */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Precio de Venta
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#B8860B'
                      }}>
                        ${productoSeleccionado.precio.toLocaleString()} COP
                      </div>
                    </div>

                    {/* Stock Disponible */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Stock Disponible
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: productoSeleccionado.stock > 5 ? '#10B981' : 
                               productoSeleccionado.stock > 0 ? '#F59E0B' : '#EF4444'
                      }}>
                        {productoSeleccionado.stock} unidades
                      </div>
                    </div>

                    {/* Stock Vendido */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Vendidos
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#2D4B39'
                      }}>
                        {productoSeleccionado.vendidos || 0} unidades
                      </div>
                    </div>

                    {/* Precio de Costo */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Precio de Costo
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#6B7280'
                      }}>
                        ${(productoSeleccionado.precio * 0.6).toLocaleString()} COP
                      </div>
                    </div>

                    {/* Tiempo de Producción */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Tiempo de Producción
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Clock style={{ width: '16px', height: '16px' }} />
                        4-6 horas
                      </div>
                    </div>

                    {/* Estado */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(45, 75, 57, 0.03)',
                      border: '1px solid rgba(45, 75, 57, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#6B7280',
                        marginBottom: '8px'
                      }}>
                        Estado
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10B981'
                        }} />
                        Activo
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Materiales Utilizados - se quita al estar hardcodeado */}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '32px', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setModalVerOpen(false)}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(45, 75, 57, 0.3)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL EDITAR */}
      <AnimatePresence>
        {modalEditarOpen && editForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center', // Centrado vertical
            justifyContent: 'center', // Centrado horizontal
            zIndex: 1000,
            padding: '20px'
          }}>
            {/* OVERLAY / BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalEditarOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: -1
              }}
            />

            {/* CONTENIDO DEL MODAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: '#ffffff',
                borderRadius: '24px', // Bordes más suaves
                padding: '32px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 80px rgba(45, 75, 57, 0.4)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#2D4B39' }}>
                  Editar Producto
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalEditarOpen(false)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '22px', height: '22px', color: '#EF4444' }} />
                </motion.button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '32px' }}>
                {/* Columna Izquierda - Imagen */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                    Imagen del Producto
                  </label>
                  <input
                    id="edit-image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const url = await subirImagen(file);
                        setEditForm({ ...editForm!, imageUrl: url });
                        toast.success('Imagen subida correctamente');
                      } catch {
                        toast.error('Error al subir la imagen');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                  <motion.div
                    whileHover={{ borderColor: '#2D4B39' }}
                    onClick={() => !uploadingImage && document.getElementById('edit-image-input')?.click()}
                    style={{
                      width: '100%',
                      height: '400px',
                      border: '2px dashed rgba(45, 75, 57, 0.3)',
                      borderRadius: '20px',
                      background: editForm.imageUrl ? `url(${editForm.imageUrl}) center/cover no-repeat` : 'rgba(45, 75, 57, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: uploadingImage ? 'wait' : 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: editForm.imageUrl ? 'rgba(0,0,0,0.25)' : 'transparent',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: editForm.imageUrl ? '#fff' : '#6B7280'
                    }}>
                      <Upload style={{ width: '40px', height: '40px', marginBottom: '12px' }} />
                      <p style={{ fontSize: '14px', textAlign: 'center', padding: '0 20px', fontWeight: 500 }}>
                        {uploadingImage ? 'Subiendo...' : editForm.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Columna Derecha - Formulario */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(45, 75, 57, 0.15)',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                        SKU (Referencia)
                      </label>
                      <input
                        type="text"
                        value={editForm.sku || `PROD-${editForm.id}`}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(45, 75, 57, 0.1)',
                          fontSize: '14px',
                          background: '#F9FAFB',
                          color: '#6B7280',
                          fontFamily: 'monospace',
                          cursor: 'not-allowed',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                        Categoría
                      </label>
                      <select
                        value={editForm.id_categoria_prod || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const cat = categoriasList.find((c: any) => c.id_categoria_prod === val);
                          setEditForm({ ...editForm, id_categoria_prod: val || undefined, categoria: cat?.nombre || '' });
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(45, 75, 57, 0.15)',
                          fontSize: '15px',
                          background: '#fff',
                          cursor: 'pointer',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        {categoriasList.map((c: any) => (
                          <option key={c.id_categoria_prod} value={c.id_categoria_prod}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                        Precio Venta (COP)
                      </label>
                      <input
                        type="number"
                        value={editForm.precio}
                        onChange={(e) => setEditForm({ ...editForm, precio: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(45, 75, 57, 0.15)',
                          fontSize: '15px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                        Stock Disponible
                      </label>
                      <input
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(45, 75, 57, 0.15)',
                          fontSize: '15px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>
                      Descripción Detallada
                    </label>
                    <textarea
                      value={editForm.descripcion}
                      onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(45, 75, 57, 0.15)',
                        fontSize: '15px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER ACCIONES */}
              <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ background: 'rgba(107, 114, 128, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModalEditarOpen(false)}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: '1.5px solid rgba(107, 114, 128, 0.3)',
                    color: '#6B7280',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Descartar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  style={{
                    padding: '14px 40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    boxShadow: '0 10px 20px rgba(45, 75, 57, 0.2)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Actualizar Producto
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AGREGAR */}
      <AnimatePresence>
        {modalAgregarOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}>
            {/* OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalAgregarOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: -1
              }}
            />

            {/* CONTENIDO DEL MODAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 80px rgba(45, 75, 57, 0.4)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#2D4B39' }}>
                  Agregar Producto
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalAgregarOpen(false)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '22px', height: '22px', color: '#EF4444' }} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                <div>
                  <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                    Imagen del Producto
                  </label>
                  <input
                    id="add-image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const url = await subirImagen(file);
                        setNewForm({ ...newForm, imageUrl: url });
                        toast.success('Imagen subida correctamente');
                      } catch {
                        toast.error('Error al subir la imagen');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                  <div
                    onClick={() => !uploadingImage && document.getElementById('add-image-input')?.click()}
                    style={{
                      width: '100%',
                      height: '140px',
                      border: '2px dashed rgba(45, 75, 57, 0.2)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: newForm.imageUrl ? `url(${newForm.imageUrl}) center/cover no-repeat` : 'rgba(45, 75, 57, 0.02)',
                      cursor: uploadingImage ? 'wait' : 'pointer',
                      gap: '8px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {!newForm.imageUrl && !uploadingImage && (
                      <>
                        <Upload style={{ color: '#2D4B39', width: '28px', height: '28px' }} />
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>Haz clic para subir una imagen</span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>PNG o JPG (Máx. 2MB)</span>
                      </>
                    )}
                    {uploadingImage && (
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>Subiendo imagen...</span>
                    )}
                    {newForm.imageUrl && !uploadingImage && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Cambiar imagen</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={newForm.nombre}
                    onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })}
                    placeholder="Ej: Macramé Colgante Luna"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '1.5px solid rgba(45, 75, 57, 0.2)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                      Categoría *
                    </label>
                    <select
                      value={newForm.id_categoria_prod || ''}
                      onChange={(e) => {
                        const cat = categoriasList.find((c: any) => c.id_categoria_prod === Number(e.target.value));
                        setNewForm({ ...newForm, id_categoria_prod: Number(e.target.value), categoria: cat?.nombre || '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '1.5px solid rgba(45, 75, 57, 0.2)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        background: '#ffffff',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Seleccionar categoría...</option>
                      {categoriasList.map((c: any) => (
                        <option key={c.id_categoria_prod} value={c.id_categoria_prod}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                      Precio (COP) *
                    </label>
                    <input
                      type="number"
                      value={newForm.precio || ''}
                      onChange={(e) => setNewForm({ ...newForm, precio: Number(e.target.value) })}
                      placeholder="45000"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '1.5px solid rgba(45, 75, 57, 0.2)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                      Stock Disponible *
                    </label>
                    <input
                      type="number"
                      value={newForm.stock || ''}
                      onChange={(e) => setNewForm({ ...newForm, stock: Number(e.target.value) })}
                      placeholder="15"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '1.5px solid rgba(45, 75, 57, 0.2)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                      SKU / Referencia
                    </label>
                    <input
                      type="text"
                      value={newForm.sku || ''}
                      onChange={(e) => setNewForm({ ...newForm, sku: e.target.value })}
                      placeholder="Ej: MAC-001"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '1.5px solid rgba(45, 75, 57, 0.2)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', display: 'block', fontWeight: 600 }}>
                    Descripción
                  </label>
                  <textarea
                    value={newForm.descripcion}
                    onChange={(e) => setNewForm({ ...newForm, descripcion: e.target.value })}
                    placeholder="Descripción detallada del producto..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '1.5px solid rgba(45, 75, 57, 0.2)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
                  <motion.button
                    whileHover={{ background: 'rgba(107, 114, 128, 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModalAgregarOpen(false)}
                    style={{
                      flex: 1,
                      padding: '14px 28px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1.5px solid rgba(107, 114, 128, 0.3)',
                      color: '#6B7280',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      productsAPI.create({
                        nombre_producto: newForm.nombre,
                        precio: newForm.precio,
                        stock: newForm.stock,
                        descripcion: newForm.descripcion,
                        id_categoria_prod: newForm.id_categoria_prod,
                        imagen_url: newForm.imageUrl,
                      }).then(() => {
                        cargarProductos();
                        setNewForm({ nombre: '', categoria: 'Accesorios', id_categoria_prod: undefined, precio: 0, stock: 0, descripcion: '', sku: '', imageUrl: '' });
                        setModalAgregarOpen(false);
                        toast.success('Producto agregado correctamente');
                      }).catch((err: any) => toast.error(err.message || 'Error al agregar'));
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 32px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 600,
                      boxShadow: '0 4px 16px rgba(45, 75, 57, 0.3)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Agregar Producto
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR */}
      {modalEliminarOpen && productoSeleccionado && (
        <DeleteConfirmModal
          isOpen={modalEliminarOpen}
          onClose={() => setModalEliminarOpen(false)}
          onConfirm={confirmDelete}
          itemName={productoSeleccionado.nombre}
          itemType="Producto"
        />
      )}
    </motion.div>
  );
}