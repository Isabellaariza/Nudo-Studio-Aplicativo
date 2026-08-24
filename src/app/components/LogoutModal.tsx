import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(45,75,57,0.07)' }}
        >
          <LogOut className="w-5 h-5" style={{ color: '#2D4B39' }} />
        </div>
        <h2 className="font-elegant text-2xl text-center mb-2" style={{ color: '#2D4B39' }}>
          Cerrar sesión
        </h2>
        <p className="text-sm text-center mb-7" style={{ color: 'rgba(45,75,57,0.55)' }}>
          ¿Estás seguro de que quieres cerrar sesión?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors"
            style={{ borderColor: 'rgba(45,75,57,0.15)', color: '#2D4B39' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#2D4B39' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#B8860B')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2D4B39')}
          >
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
}
