import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageSearch, Search, Plus, Info, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight, X, History, ArrowUpCircle, ArrowDownCircle, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { insumosAPI, categoriasInsumosAPI, proveedoresAPI, comprasAPI } from '../../lib/api';

interface Material {
  id_insumos: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
  stock_maximo: number;
  unidad_medida: string;
  proveedor: string;
  id_proveedor: number | null;
  precio: number;
  categoria: string;
  id_categoria_insu: number;
  estado: boolean;
}

interface FormState {
  nombre: string; unidad_medida: string;
  precio: number; stock: number; stock_minimo: number; stock_maximo: number;
  id_categoria_insu: number | ''; id_proveedor: number | '';
}

const emptyForm: FormState = {
  nombre: '', unidad_medida: '', precio: 0,
  stock: 0, stock_minimo: 0, stock_maximo: 0, id_categoria_insu: '', id_proveedor: ''
};

const ITEMS_PER_PAGE = 6;

export function Stock() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [showMovimientosModal, setShowMovimientosModal] = useState(false);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [showNuevoMovModal, setShowNuevoMovModal] = useState(false);
  const [movForm, setMovForm] = useState({ tipo: 'ENTRADA' as 'ENTRADA'|'SALIDA', cantidad: 1, motivo: '', observacion: '' });
  const [productosComprados, setProductosComprados] = useState<any[]>([]);

  const cargar = async () => {
    try {
      const [insData, catData, provData, compData] = await Promise.all([
        insumosAPI.getAll(),
        categoriasInsumosAPI.getAll(),
        proveedoresAPI.getAll(),
        comprasAPI.getProductosComprados(),
      ]);
      setMateriales(insData.insumos.map((i: any) => ({
        ...i,
        stock: Number(i.stock) || 0,
        precio: Number(i.precio) || 0,
      })));
      setCategorias(catData.categorias);
      setProveedores(provData.proveedores);
      setProductosComprados(compData.productos || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar insumos');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filteredMateriales = materiales.filter(m =>
    (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const materialesCriticos = materiales.filter(m => m.stock < m.stock_minimo).length;
  const totalPages = Math.ceil(filteredMateriales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMateriales = filteredMateriales.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isCritico = (m: Material) => m.stock < m.stock_minimo;
  const getStockColor = (m: Material) => isCritico(m) ? '#EF4444' : '#10B981';
  const getStockPercentage = (m: Material) => {
    if (!m.stock_maximo) return 0;
    return Math.min(100, Math.round((m.stock / m.stock_maximo) * 100));
  };

  const handleSaveAdd = async () => {
    if (!addForm.nombre || !addForm.id_categoria_insu) {
      toast.error('Nombre y categoría son obligatorios'); return;
    }
    try {
      await insumosAPI.create(addForm);
      toast.success('Insumo agregado con éxito');
      setShowAddModal(false);
      setAddForm(emptyForm);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al crear'); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid rgba(45, 75, 57, 0.15)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const
  };

  const handleShowInfo = (material: Material) => { setSelectedMaterial(material); setShowInfoModal(true); };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setEditForm({
      nombre: material.nombre || '',
      unidad_medida: material.unidad_medida || '', precio: material.precio || 0,
      stock: material.stock || 0, stock_minimo: material.stock_minimo || 0,
      stock_maximo: material.stock_maximo || 0,
      id_categoria_insu: material.id_categoria_insu || '',
      id_proveedor: material.id_proveedor || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMaterial) return;
    try {
      await insumosAPI.update(selectedMaterial.id_insumos, editForm);
      toast.success('Insumo actualizado correctamente');
      setShowEditModal(false);
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al actualizar'); }
  };

  const handleDelete = (material: Material) => { setSelectedMaterial(material); setShowDeleteModal(true); };

  const handleVerMovimientos = async (material: Material) => {
    setSelectedMaterial(material);
    setShowMovimientosModal(true);
    setLoadingMov(true);
    try {
      const data = await insumosAPI.getMovimientos(material.id_insumos);
      setMovimientos(data.movimientos);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingMov(false); }
  };

  const handleRegistrarMovimiento = async () => {
    if (!selectedMaterial || !movForm.cantidad) return;
    try {
      await insumosAPI.registrarMovimiento(selectedMaterial.id_insumos, movForm);
      toast.success('Movimiento registrado');
      setShowNuevoMovModal(false);
      setMovForm({ tipo: 'ENTRADA', cantidad: 1, motivo: '', observacion: '' });
      const data = await insumosAPI.getMovimientos(selectedMaterial.id_insumos);
      setMovimientos(data.movimientos);
      cargar();
    } catch (err: any) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!selectedMaterial) return;
    try {
      await insumosAPI.delete(selectedMaterial.id_insumos);
      toast.success('Insumo eliminado');
      cargar();
    } catch (err: any) { toast.error(err.message || 'Error al eliminar'); }
    setShowDeleteModal(false);
    setSelectedMaterial(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={{ marginBottom: '32px' }}
    >
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
              <PackageSearch style={{ width: '26px', height: '26px', color: '#ffffff' }} />
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
                Gestión de insumos
              </h1>
              <p style={{ 
                fontSize: '15px', 
                color: '#6B7280',
                margin: 0
              }}>
                {filteredMateriales.length} materiales encontrados
                {materialesCriticos > 0 && (
                  <span style={{ 
                    marginLeft: '12px',
                    padding: '4px 12px',
                    color: '#EF4444',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {materialesCriticos} críticos
                  </span>
                )}
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
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
          
          {/* Botón Nuevo Insumo */}
          <motion.button
          onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
            Nuevo Insumo
          </motion.button>
        </div>
      </motion.div>

      {/* GRID DE MATERIALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#6B7280' }}>Cargando insumos...</div>
        ) : filteredMateriales.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No se encontraron insumos</div>
        ) : null}
        {currentMateriales.map((material, index) => {
          const critico = isCritico(material);
          
          return (
            <motion.div
              key={material.id_insumos}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: critico 
                  ? ['0 4px 20px rgba(239, 68, 68, 0.15)', '0 4px 30px rgba(239, 68, 68, 0.3)', '0 4px 20px rgba(239, 68, 68, 0.15)']
                  : '0 4px 20px rgba(45, 75, 57, 0.08)'
              }}
              transition={{ 
                delay: index * 0.05,
                boxShadow: {
                  duration: 1.5,
                  repeat: critico ? Infinity : 0,
                  ease: 'easeInOut'
                }
              }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                border: critico ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(45, 75, 57, 0.08)',
                position: 'relative'
              }}
            >
              {/* Badge Crítico */}
              {critico && (
                <motion.div
                  animate={{
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: '#EF4444',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  <AlertTriangle style={{ width: '14px', height: '14px' }} />
                  CRÍTICO
                </motion.div>
              )}

              {/* Título */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#2D4B39',
                marginBottom: '4px',
                paddingRight: critico ? '120px' : '0'
              }}>
                {material.nombre}
              </h3>

              {/* Unidad */}
              <p style={{
                fontSize: '14px',
                color: '#B8860B',
                marginBottom: '16px'
              }}>
                {material.unidad_medida || '—'}
              </p>

              {/* Proveedor */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(107, 114, 128, 0.05)',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <span style={{
                  fontSize: '13px',
                  color: '#6B7280'
                }}>
                  Proveedor: <strong>{material.proveedor}</strong>
                </span>
              </div>

              {/* Stock Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {/* Disponible */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: critico ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                  border: `1px solid ${critico ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                  <div style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    marginBottom: '8px',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}>
                    DISPONIBLE
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: critico ? '#EF4444' : '#10B981',
                    lineHeight: 1
                  }}>
                    {material.stock}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginTop: '4px'
                  }}>
                    rollos
                  </div>
                </div>

                {/* Utilizado */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(107, 114, 128, 0.05)',
                  border: '1px solid rgba(107, 114, 128, 0.15)'
                }}>
                  <div style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    marginBottom: '8px',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}>
                    PRECIO
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#6B7280',
                    lineHeight: 1
                  }}>
                    ${Number(material.precio).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginTop: '4px'
                  }}>
                    precio unit.
                  </div>
                </div>
              </div>

              {/* Barra de Uso */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}>
                    USO DEL MATERIAL
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#2D4B39'
                  }}>
                    {getStockPercentage(material)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getStockPercentage(material)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    style={{
                      height: '100%',
                      background: getStockColor(material),
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px'
                }}>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Mínimo: {material.stock_minimo}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Máximo: {material.stock_maximo}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '8px'
              }}>
                <motion.button
                  whileHover={{ background: 'rgba(45, 75, 57, 0.05)', borderColor: '#2D4B39', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleShowInfo(material)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: '#ffffff', color: '#2D4B39', border: '1px solid rgba(45, 75, 57, 0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Info style={{ width: '14px', height: '14px' }} />
                  Ver
                </motion.button>

                <motion.button
                  whileHover={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: '#6366F1', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVerMovimientos(material)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: '#ffffff', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <History style={{ width: '14px', height: '14px' }} />
                  Kardex
                </motion.button>

                <motion.button
                  whileHover={{ background: 'rgba(184, 134, 11, 0.05)', borderColor: '#B8860B', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEdit(material)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: '#ffffff', color: '#B8860B', border: '1px solid rgba(184, 134, 11, 0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Edit style={{ width: '14px', height: '14px' }} />
                  Editar
                </motion.button>

                <motion.button
                  whileHover={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: '#EF4444', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(material)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: '#ffffff', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Eliminar
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Paginación */}
      {filteredMateriales.length > ITEMS_PER_PAGE && (
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

      {/* Modal Ver Info */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '550px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                zIndex: 1001,
                boxShadow: '0 25px 50px -12px rgba(45, 75, 57, 0.4)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Nuevo Insumo</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Selector basado en compra */}
                {productosComprados.length > 0 && (
                  <div style={{ padding: '14px 16px', background: 'rgba(184,134,11,0.06)', borderRadius: '12px', border: '1px solid rgba(184,134,11,0.2)' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#B8860B', marginBottom: '8px', display: 'block' }}>CARGAR DESDE COMPRA</label>
                    <select
                      defaultValue=""
                      onChange={e => {
                        const id = Number(e.target.value);
                        const prod = productosComprados.find((p: any) => p.id_detalle === id);
                        if (prod) {
                          setAddForm(f => ({
                            ...f,
                            nombre: prod.nombre_producto,
                            precio: Number(prod.precio_unitario) || 0,
                            id_proveedor: prod.id_proveedor || '',
                          }));
                        }
                      }}
                      style={{ ...inputStyle, borderColor: 'rgba(184,134,11,0.3)' }}
                    >
                      <option value="">Seleccionar producto comprado...</option>
                      {productosComprados.map((p: any) => (
                        <option key={p.id_detalle} value={p.id_detalle}>
                          {p.nombre_producto} — {p.proveedor} (${Number(p.precio_unitario).toLocaleString('es-CO')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Nombre *</label>
                  <input type="text" value={addForm.nombre} onChange={(e) => setAddForm({...addForm, nombre: e.target.value})} style={inputStyle} placeholder="Ej. Hilo de Algodón" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Categoría *</label>
                  <select value={addForm.id_categoria_insu} onChange={e => setAddForm({...addForm, id_categoria_insu: Number(e.target.value)})} style={inputStyle}>
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map((c: any) => <option key={c.id_categoria_insu} value={c.id_categoria_insu}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Unidad</label>
                    <input type="text" value={addForm.unidad_medida} onChange={(e) => setAddForm({...addForm, unidad_medida: e.target.value})} style={inputStyle} placeholder="Ej. Rollo 100m" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Precio Unitario</label>
                    <input type="number" value={addForm.precio} onChange={(e) => setAddForm({...addForm, precio: Number(e.target.value)})} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Stock</label>
                    <input type="number" value={addForm.stock} onChange={(e) => setAddForm({...addForm, stock: Number(e.target.value)})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Mínimo</label>
                    <input type="number" value={addForm.stock_minimo} onChange={(e) => setAddForm({...addForm, stock_minimo: Number(e.target.value)})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Máximo</label>
                    <input type="number" value={addForm.stock_maximo} onChange={(e) => setAddForm({...addForm, stock_maximo: Number(e.target.value)})} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px', display: 'block' }}>Proveedor</label>
                  <select value={addForm.id_proveedor} onChange={e => setAddForm({...addForm, id_proveedor: Number(e.target.value)})} style={inputStyle}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p: any) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <motion.button 
                  whileHover={{ background: 'rgba(107, 114, 128, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(false)} 
                  style={{ 
                    padding: '12px 24px', 
                    borderRadius: '10px', 
                    background: '#ffffff', 
                    border: '1px solid rgba(107, 114, 128, 0.3)', 
                    color: '#6B7280', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Cancelar
                </motion.button>                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAdd}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)', color: '#ffffff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Crear Insumo
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ver Info */}
      <AnimatePresence>
        {showInfoModal && selectedMaterial && (
          <>
            {/* Overlay de fondo - Este componente ahora se encarga de centrar el contenido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',          // Activa Flexbox
                alignItems: 'center',      // Centra verticalmente
                justifyContent: 'center',  // Centra horizontalmente
                padding: '20px'            // Margen de seguridad para pantallas pequeñas
              }}
            >
              {/* Contenedor del Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '500px',
                  width: '100%',
                  zIndex: 1001,
                  boxShadow: '0 25px 50px -12px rgba(45, 75, 57, 0.4)',
                  position: 'relative' // Cambiado de fixed a relative para fluir con el flex del padre
                }}
              >
                {/* Header del Modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>
                    Detalles del Material
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowInfoModal(false)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  </motion.button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#2D4B39', marginBottom: '4px' }}>
                      {selectedMaterial.nombre}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#B8860B', fontWeight: 500 }}>{selectedMaterial.unidad_medida || '—'}</p>
                  </div>
                  
                  <div style={{ padding: '16px', background: 'rgba(45, 75, 57, 0.05)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Proveedor</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#2D4B39' }}>{selectedMaterial.proveedor}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '16px', background: 'rgba(45, 75, 57, 0.05)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Stock Actual</p>
                      <p style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>{selectedMaterial.stock}</p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(45, 75, 57, 0.05)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Categoría</p>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#6B7280' }}>{selectedMaterial.categoria}</p>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(45, 75, 57, 0.05)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Precio Unitario</p>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#B8860B' }}>
                      ${Number(selectedMaterial.precio).toLocaleString()} COP
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '32px', textAlign: 'right' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInfoModal(false)}
                    style={{
                      padding: '12px 32px',
                      borderRadius: '12px',
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Editar */}
      <AnimatePresence>
        {showEditModal && editForm && (
          <>
            {/* Overlay de fondo - Ahora maneja el centrado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex', // Activa Flexbox
                alignItems: 'center', // Centra verticalmente
                justifyContent: 'center', // Centra horizontalmente
                padding: '20px' // Margen de seguridad para móviles
              }}
            >
              {/* Contenido del Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px', // Un poco más redondeado para mayor elegancia
                  padding: '32px',
                  maxWidth: '500px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  zIndex: 1001,
                  boxShadow: '0 25px 50px -12px rgba(45, 75, 57, 0.4)',
                  position: 'relative' // Cambiado de fixed a relative para fluir con el flex del padre
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>
                    Editar Material
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditModal(false)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  </motion.button>
                </div>

                {/* Formulario */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Nombre</label>
                    <input type="text" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Categoría</label>
                    <select value={editForm.id_categoria_insu} onChange={e => setEditForm({...editForm, id_categoria_insu: Number(e.target.value)})} style={inputStyle}>
                      <option value="">Seleccionar...</option>
                      {categorias.map((c: any) => <option key={c.id_categoria_insu} value={c.id_categoria_insu}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Unidad</label>
                      <input type="text" value={editForm.unidad_medida} onChange={(e) => setEditForm({ ...editForm, unidad_medida: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Precio</label>
                      <input type="number" value={editForm.precio} onChange={(e) => setEditForm({ ...editForm, precio: Number(e.target.value) })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Stock Actual</label>
                    <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Stock Mínimo</label>
                      <input type="number" value={editForm.stock_minimo} onChange={(e) => setEditForm({ ...editForm, stock_minimo: Number(e.target.value) })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Stock Máximo</label>
                      <input type="number" value={editForm.stock_maximo} onChange={(e) => setEditForm({ ...editForm, stock_maximo: Number(e.target.value) })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px', display: 'block' }}>Proveedor</label>
                    <select value={editForm.id_proveedor} onChange={e => setEditForm({...editForm, id_proveedor: Number(e.target.value)})} style={inputStyle}>
                      <option value="">Sin proveedor</option>
                      {proveedores.map((p: any) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>)}
                    </select>
                  </div>
                </div>

                {/* Footer / Botones */}
                <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <motion.button
                    whileHover={{ background: 'rgba(107, 114, 128, 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEditModal(false)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      color: '#6B7280',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveEdit}
                    style={{
                      padding: '12px 28px',
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
                    Guardar Cambios
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR */}
      {showDeleteModal && selectedMaterial && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          itemName={selectedMaterial.nombre}
          itemType="Insumo"
        />
      )}

      {/* MODAL MOVIMIENTOS / KARDEX */}
      <AnimatePresence>
        {showMovimientosModal && selectedMaterial && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowMovimientosModal(false); setShowNuevoMovModal(false); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(45,75,57,0.4)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>Kardex — {selectedMaterial.nombre}</h2>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>Historial de movimientos de stock</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNuevoMovModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <PlusCircle style={{ width: '16px', height: '16px' }} />
                    Nuevo
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowMovimientosModal(false)}
                    style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}
                  >
                    <X style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  </motion.button>
                </div>
              </div>

              {/* Formulario nuevo movimiento inline */}
              <AnimatePresence>
                {showNuevoMovModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: '16px' }}
                  >
                    <div style={{ background: 'rgba(45,75,57,0.04)', border: '1px solid rgba(45,75,57,0.12)', borderRadius: '14px', padding: '20px', marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#2D4B39', marginBottom: '16px' }}>Registrar movimiento</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Tipo</label>
                          <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value as any})} style={inputStyle}>
                            <option value="ENTRADA">ENTRADA</option>
                            <option value="SALIDA">SALIDA</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Cantidad</label>
                          <input type="number" min={1} value={movForm.cantidad} onChange={e => setMovForm({...movForm, cantidad: Number(e.target.value)})} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Motivo</label>
                        <input type="text" value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})} style={inputStyle} placeholder="Ej. Compra, Uso en taller..." />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Observación</label>
                        <input type="text" value={movForm.observacion} onChange={e => setMovForm({...movForm, observacion: e.target.value})} style={inputStyle} placeholder="Opcional" />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowNuevoMovModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(107,114,128,0.3)', background: '#fff', color: '#6B7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRegistrarMovimiento}
                          style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #2D4B39 0%, #1a2f23 100%)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >Guardar</motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabla de movimientos */}
              {loadingMov ? (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '32px' }}>Cargando...</p>
              ) : movimientos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                  <History style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Sin movimientos registrados</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  {movimientos.map((mov: any) => (
                    <div key={mov.id_movimiento} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: mov.tipo === 'ENTRADA' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${mov.tipo === 'ENTRADA' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                      {mov.tipo === 'ENTRADA'
                        ? <ArrowUpCircle style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
                        : <ArrowDownCircle style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: mov.tipo === 'ENTRADA' ? '#10B981' : '#EF4444' }}>{mov.tipo}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>×{mov.cantidad}</span>
                          {mov.motivo && <span style={{ fontSize: '12px', color: '#6B7280' }}>— {mov.motivo}</span>}
                        </div>
                        {mov.observacion && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>{mov.observacion}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{mov.stock_anterior} → <strong style={{ color: '#2D4B39' }}>{mov.stock_nuevo}</strong></div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{new Date(mov.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}