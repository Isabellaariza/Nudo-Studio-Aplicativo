import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName, itemType }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        /* El fondo ahora es el encargado de centrar vertical y horizontalmente */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',          // Activa Flexbox
            alignItems: 'center',     // Centra verticalmente
            justifyContent: 'center',  // Centra horizontalmente
            padding: '20px'           // Espacio de seguridad para móviles
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, translateY: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer click dentro
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '450px',
              width: '100%',
              zIndex: 1001,
              boxShadow: '0 25px 80px rgba(45, 75, 57, 0.4)',
              border: '2px solid rgba(239, 68, 68, 0.2)',
              /* Eliminamos top: 50%, left: 50% y transform translate para que Flexbox mande */
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertTriangle style={{ width: '32px', height: '32px', color: '#EF4444' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#2D4B39', marginBottom: '8px' }}>
                ¿Eliminar {itemType}?
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                Estás a punto de eliminar:
              </p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#EF4444' }}>
                "{itemName}"
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                Esta acción no se puede deshacer. {itemType === 'Empleado' || itemType === 'Usuario' || itemType === 'Estudiante' || itemType === 'Cliente' ? 'La persona' : 'El elemento'} será eliminado permanentemente.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(45, 75, 57, 0.2)',
                  background: '#ffffff',
                  color: '#2D4B39',
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
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Sí, Eliminar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}