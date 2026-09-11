import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Package, Calendar } from 'lucide-react';
import { pedidosAPI } from '../../app/lib/api';
import { toast } from 'sonner';

interface InsumoAnalisis {
  id_insumos: number;
  insumo: string;
  unidad_medida: string;
  stock_disponible: number;
  cantidad_requerida: number;
  tiene_stock: boolean;
}

interface VerificarProduccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  idPedido: number;
  onAprobado: () => void; // Callback para recargar la tabla de pedidos
}

export function VerificarProduccionModal({ isOpen, onClose, idPedido, onAprobado }: VerificarProduccionModalProps) {
  const [analizando, setAnalizando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [viable, setViable] = useState(false);
  const [insumos, setInsumos] = useState<InsumoAnalisis[]>([]);
  
  // Datos del formulario de producción automática
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (isOpen && idPedido) {
      analizarInsumos();
    }
  }, [isOpen, idPedido]);

  const analizarInsumos = async () => {
    setAnalizando(true);
    try {
      const res = await pedidosAPI.verificarInsumos(idPedido);
      setInsumos(res.insumos_analisis || []);
      setViable(res.viable);
    } catch (err: any) {
      toast.error(err.message || 'Error al analizar la viabilidad del pedido');
      onClose();
    } finally {
      setAnalizando(false);
    }
  };

  const handleAprobar = async () => {
    setProcesando(true);
    try {
      await pedidosAPI.aprobarAProduccion(idPedido, {
        fecha_entrega: fechaEntrega || undefined,
        observaciones: observaciones || `Producción del pedido de cliente #${idPedido}`
      });
      toast.success('¡Pedido aprobado! Insumos descontados y orden creada con éxito.');
      onAprobado();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar a producción');
    } finally {
      setProcesando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ background: '#2D4B39', padding: '20px 24px', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Verificación de Materiales</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>Analizando viabilidad para el Pedido #{idPedido}</p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
          {analizando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '12px' }}>
              <Loader2 className="animate-spin" style={{ width: '32px', height: '32px', color: '#2D4B39' }} />
              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>Analizando stock en almacén...</span>
            </div>
          ) : (
            <>
              {/* Alerta de Viabilidad */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px',
                marginBottom: '20px',
                background: viable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${viable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: viable ? '#065F46' : '#991B1B'
              }}>
                {viable ? <CheckCircle style={{ width: '20px', height: '20px' }} /> : <AlertTriangle style={{ width: '20px', height: '20px' }} />}
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {viable 
                    ? '¡Todo listo! Tienes insumos suficientes para confeccionar este pedido.' 
                    : 'Atención: No tienes materiales suficientes en stock para procesar este pedido.'}
                </div>
              </div>

              {/* Lista de Análisis de Insumos */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#2D4B39' }}>Materiales requeridos:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {insumos.map((ins) => (
                    <div key={ins.id_insumos} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)',
                      background: ins.tiene_stock ? 'transparent' : 'rgba(239, 68, 68, 0.02)'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D4B39' }}>{ins.insumo}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          Requerido: {ins.cantidad_requerida} {ins.unidad_medida} | Disponible: {ins.stock_disponible} {ins.unidad_medida}
                        </div>
                      </div>
                      
                      {/* Estado visual */}
                      <span style={{
                        padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: ins.tiene_stock ? '#D1FAE5' : '#FEE2E2',
                        color: ins.tiene_stock ? '#065F46' : '#991B1B'
                      }}>
                        {ins.tiene_stock ? 'Disponible' : `Faltan ${(ins.cantidad_requerida - ins.stock_disponible).toFixed(1)}`}
                      </span>
                    </div>
                  ))}
                  {insumos.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                      Este producto no tiene una ficha técnica asociada. Se mandará a producción sin descontar insumos automáticos.
                    </div>
                  )}
                </div>
              </div>

              {/* Formulario de envío — visible siempre (viable o no) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>
                    Fecha estimada de entrega
                  </label>
                  <input 
                    type="date" 
                    value={fechaEntrega} 
                    onChange={e => setFechaEntrega(e.target.value)} 
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid rgba(45,75,57,0.15)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2D4B39', marginBottom: '6px' }}>
                    Notas u Observaciones
                  </label>
                  <textarea 
                    placeholder="Instrucciones especiales para el taller de confección..."
                    value={observaciones} 
                    onChange={e => setObservaciones(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid rgba(45,75,57,0.15)', fontSize: '13px', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>
                {!viable && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#991B1B' }}>
                    ⚠️ Stock insuficiente. Se enviará a <strong>producción manual</strong> — el equipo deberá gestionar los insumos faltantes.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{
              flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff', color: '#6B7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
          {!analizando && (
            <button 
              type="button" 
              onClick={handleAprobar}
              disabled={procesando}
              style={{
                flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
                background: viable ? 'linear-gradient(135deg,#2D4B39,#1a2f23)' : 'linear-gradient(135deg,#B8860B,#92400e)',
                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: procesando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              {procesando ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                  Procesando...
                </>
              ) : viable ? 'Enviar a Producción' : 'Enviar a Producción Manual'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}