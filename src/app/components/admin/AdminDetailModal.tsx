/**
 * AdminDetailModal — Componente reutilizable de modal de detalles
 * Referencia visual: modal "Ver detalles" de Pedidos.tsx
 *
 * Uso:
 *   <AdminDetailModal isOpen={true} onClose={fn} title="Detalles" icon={<User.../>}>
 *     <AdminDetailSection title="SECCIÓN" icon={<User.../>} color="green">
 *       <AdminDetailRow label="Campo" value="Valor" />
 *     </AdminDetailSection>
 *   </AdminDetailModal>
 */

import { motion, AnimatePresence } from 'motion/react';
import { XCircle } from 'lucide-react';

// ── OVERLAY + CONTENEDOR PRINCIPAL ───────────────────────────────────────────

interface AdminDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function AdminDetailModal({ isOpen, onClose, title, children, maxWidth = '600px' }: AdminDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              maxWidth,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 80px rgba(45,75,57,0.4)',
            }}
          >
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#2D4B39', margin: 0 }}>{title}</h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', flexShrink: 0 }}
              >
                <XCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
              </motion.button>
            </div>

            {/* Contenido: secciones apiladas con gap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SECCIÓN CON CABECERA COLOREADA ───────────────────────────────────────────

type SectionColor = 'green' | 'gold' | 'teal' | 'red' | 'blue' | 'purple';

const SECTION_COLORS: Record<SectionColor, { bg: string; iconColor: string }> = {
  green:  { bg: 'rgba(45,75,57,0.05)',   iconColor: '#2D4B39' },
  gold:   { bg: 'rgba(184,134,11,0.05)', iconColor: '#B8860B' },
  teal:   { bg: 'rgba(16,185,129,0.05)', iconColor: '#10B981' },
  red:    { bg: 'rgba(239,68,68,0.05)',  iconColor: '#EF4444' },
  blue:   { bg: 'rgba(59,130,246,0.05)', iconColor: '#3B82F6' },
  purple: { bg: 'rgba(139,92,246,0.05)', iconColor: '#7C3AED' },
};

interface AdminDetailSectionProps {
  title: string;
  icon: React.ReactNode;
  color?: SectionColor;
  children: React.ReactNode;
}

export function AdminDetailSection({ title, icon, color = 'green', children }: AdminDetailSectionProps) {
  const { bg, iconColor } = SECTION_COLORS[color];
  return (
    <div style={{ padding: '20px', background: bg, borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D4B39', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  );
}

// ── FILA DE DATO: label arriba, valor abajo ───────────────────────────────────

interface AdminDetailRowProps {
  label: string;
  value?: string | React.ReactNode;
  /** Muestra el valor como badge de color */
  badge?: { bg: string; color: string; text: string };
  /** Grid de 2 columnas si true */
  half?: boolean;
}

export function AdminDetailRow({ label, value, badge }: AdminDetailRowProps) {
  return (
    <div>
      <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.03em' }}>
        {label}
      </label>
      {badge ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: badge.bg }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: badge.color }}>{badge.text}</span>
        </div>
      ) : (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D4B39' }}>
          {value ?? '—'}
        </div>
      )}
    </div>
  );
}

// ── GRID DE 2 COLUMNAS PARA FILAS ────────────────────────────────────────────

export function AdminDetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {children}
    </div>
  );
}

// ── TABLA DE PRODUCTOS DENTRO DEL MODAL ──────────────────────────────────────

interface ProductTableItem {
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
  imagen_url?: string;
}

interface AdminProductTableProps {
  items: ProductTableItem[];
  showPrice?: boolean;
  emptyText?: string;
}

export function AdminProductTable({ items, showPrice = true, emptyText = 'Sin productos disponibles' }: AdminProductTableProps) {
  const filtered = items.filter(d => d.nombre);
  if (filtered.length === 0) {
    return <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>{emptyText}</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: 'rgba(45,75,57,0.08)' }}>
          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#2D4B39', width: '32px' }}>#</th>
          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, color: '#2D4B39', width: '36px' }}></th>
          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#2D4B39' }}>Producto</th>
          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#2D4B39', width: '70px' }}>Cant.</th>
          {showPrice && (
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#2D4B39', width: '120px' }}>Precio Unit.</th>
          )}
        </tr>
      </thead>
      <tbody>
        {filtered.map((item, i) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(184,134,11,0.08)' }}>
            <td style={{ padding: '8px 10px', color: '#9CA3AF' }}>{i + 1}</td>
            <td style={{ padding: '8px 6px' }}>
              {item.imagen_url
                ? <img src={item.imagen_url} alt={item.nombre} style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(45,75,57,0.06)' }} />
              }
            </td>
            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2D4B39' }}>{item.nombre}</td>
            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6B7280' }}>{item.cantidad}</td>
            {showPrice && (
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#B8860B' }}>
                {item.precio_unitario != null
                  ? `$${Number(item.precio_unitario).toLocaleString('es-CO')} COP`
                  : '—'}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
