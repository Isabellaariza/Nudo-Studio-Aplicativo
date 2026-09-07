const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Token helpers
export const getToken = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeader(), ...(options.headers || {}) } });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    window.location.reload();
    throw new Error('Sesión expirada, por favor inicia sesión nuevamente');
  }
  return res;
}

// Objeto supabase vacío — App.tsx lo importa pero solo usaba auth de Supabase
// El auth real ahora viene del backend propio
export const supabase = { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } };

// Auth — conectado al backend /api/auth
export const auth = {
  signIn: async (correo: string, contrasena: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje || 'Error al iniciar sesión'); }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', data.usuario.rol);
    localStorage.setItem('userEmail', data.usuario.correo);
    localStorage.setItem('userName', data.usuario.nombre || '');
    localStorage.setItem('userPermisos', JSON.stringify(data.usuario.permisos || []));
    return data;
  },

  signUp: async (nombre: string, correo: string, contrasena: string, telefono?: string, direccion?: string, tipo_documento?: string, numero_documento?: string) => {
    const res = await fetch(`${API_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contrasena, telefono, direccion, tipo_documento, numero_documento }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje || 'Error al registrarse'); }
    return res.json();
  },

  signOut: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  },

  getSession: () => {
    const token = getToken();
    return token ? { access_token: token } : null;
  },

  getUser: async () => {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_URL}/auth/perfil`, { headers: authHeader() });
    if (!res.ok) return null;
    return res.json();
  },

  updateProfile: async (data: { nombre?: string; telefono?: string; direccion?: string; tipo_documento?: string; numero_documento?: string }) => {
    const res = await fetch(`${API_URL}/auth/perfil`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje || 'Error al actualizar perfil'); }
    return res.json();
  },

  forgotPassword: async (correo: string) => {
    const res = await fetch(`${API_URL}/auth/recuperar-contrasena`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje || 'Error al enviar el correo'); }
    return res.json();
  },

  resetPassword: async (token: string, contrasenaNueva: string) => {
    const res = await fetch(`${API_URL}/auth/reset-contrasena`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, contrasenaNueva }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje || 'Error al restablecer la contraseña'); }
    return res.json();
  },
};

// Cart — sigue usando localStorage (sin cambios para el frontend)
export const cartAPI = {
  get: () => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  },
  add: (productId: string, quantity: number) => {
    const cart = cartAPI.get();
    const idx = cart.findIndex((i: any) => i.productId === productId);
    if (idx >= 0) cart[idx].quantity += quantity;
    else cart.push({ productId, quantity });
    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },
  remove: (productId: string) => {
    const cart = cartAPI.get().filter((i: any) => i.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },
  clear: () => localStorage.removeItem('cart'),
};

// Dashboard
export const dashboardAPI = {
  getStats: async () => {
    const res = await fetchWithAuth(`${API_URL}/dashboard`);
    if (!res.ok) throw new Error('Error al obtener estadísticas del dashboard');
    return res.json();
  },
};

// Productos
export const productsAPI = {
  getAll: async () => {
    // Público — no requiere token
    const res = await fetch(`${API_URL}/productos`);
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },
  getCategorias: async () => {
    const res = await fetch(`${API_URL}/productos/categorias`);
    if (!res.ok) throw new Error('Error al obtener categorías');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/productos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/productos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Talleres
export const talleresAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/talleres`);
    if (!res.ok) throw new Error('Error al obtener talleres');
    return res.json();
  },
  getInstructores: async () => {
    const res = await fetchWithAuth(`${API_URL}/talleres/instructores`);
    if (!res.ok) throw new Error('Error al obtener instructores');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/talleres`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/talleres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/talleres/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  completar: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/talleres/${id}/completar`, { method: 'PUT', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  inscribirse: async (id_taller: number) => {
    const res = await fetchWithAuth(`${API_URL}/talleres/${id_taller}/inscribirse`, { method: 'POST', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Clientes
export const clientesAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/clientes`);
    if (!res.ok) throw new Error('Error al obtener clientes');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/clientes`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Empleados
export const empleadosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/empleados`);
    if (!res.ok) throw new Error('Error al obtener empleados');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/empleados`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/empleados/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Usuarios
export const usuariosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/usuarios`);
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/usuarios`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: string, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetchWithAuth(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Proveedores
export const proveedoresAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/proveedores`);
    if (!res.ok) throw new Error('Error al obtener proveedores');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/proveedores`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/proveedores/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Compras
export const comprasAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/compras`);
    if (!res.ok) throw new Error('Error al obtener compras');
    return res.json();
  },
  getProductosComprados: async () => {
    const res = await fetchWithAuth(`${API_URL}/compras/productos-comprados`);
    if (!res.ok) throw new Error('Error al obtener productos comprados');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/compras`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/compras/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/compras/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Ventas
export const ventasAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/ventas`);
    if (!res.ok) throw new Error('Error al obtener ventas');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/ventas`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  updateEstado: async (id: number, estado: boolean) => {
    const res = await fetchWithAuth(`${API_URL}/ventas/${id}`, { method: 'PUT', body: JSON.stringify({ estado }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Roles
export const rolesAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/roles`);
    if (!res.ok) throw new Error('Error al obtener roles');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/roles`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/roles/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Categorías Insumos
export const categoriasInsumosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/categorias-insumos`);
    if (!res.ok) throw new Error('Error al obtener categorías de insumos');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-insumos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-insumos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-insumos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Categorías Productos
export const categoriasProductosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/categorias-productos`);
    if (!res.ok) throw new Error('Error al obtener categorías');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-productos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-productos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/categorias-productos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Programación de Talleres
export const programacionAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/programacion`);
    if (!res.ok) throw new Error('Error al obtener programaciones');
    return res.json();
  },
  verificarDisponibilidad: async (id_empleado: number, fecha: string, excluir_id?: number) => {
    const q = new URLSearchParams({ id_empleado: String(id_empleado), fecha });
    if (excluir_id) q.set('excluir_id', String(excluir_id));
    const res = await fetchWithAuth(`${API_URL}/programacion/disponibilidad?${q}`);
    if (!res.ok) throw new Error('Error al verificar disponibilidad');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/programacion`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/programacion/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/programacion/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Producción
export const produccionAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/produccion`);
    if (!res.ok) throw new Error('Error al obtener órdenes de producción');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/produccion`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/produccion/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  completarPedido: async (id_pedidos: number) => {
    const res = await fetchWithAuth(`${API_URL}/produccion/pedidos/${id_pedidos}/completar`, { method: 'PUT', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  agregarProductosPedido: async (id_pedidos: number, productos: { id_producto: number; cantidad: number }[]) => {
    const res = await fetchWithAuth(`${API_URL}/produccion/pedidos/${id_pedidos}/agregar-productos`, { method: 'POST', body: JSON.stringify({ productos }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  cancelarPedidoProduccion: async (id_pedidos: number) => {
    const res = await fetchWithAuth(`${API_URL}/produccion/pedidos/${id_pedidos}/cancelar`, { method: 'PUT', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Insumos
export const insumosAPI = {
  getAll: async (params?: { buscar?: string; id_categoria?: number; bajo_stock?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.buscar) q.set('buscar', params.buscar);
    if (params?.id_categoria) q.set('id_categoria', String(params.id_categoria));
    if (params?.bajo_stock) q.set('bajo_stock', 'true');
    const res = await fetchWithAuth(`${API_URL}/insumos?${q}`);
    if (!res.ok) throw new Error('Error al obtener insumos');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/insumos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/insumos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/insumos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  getMovimientos: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/insumos/${id}/movimientos`);
    if (!res.ok) throw new Error('Error al obtener movimientos');
    return res.json();
  },
  registrarMovimiento: async (id: number, data: { tipo: 'ENTRADA' | 'SALIDA'; cantidad: number; motivo?: string; observacion?: string }) => {
    const res = await fetchWithAuth(`${API_URL}/insumos/${id}/movimientos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Matrículas
export const matriculasAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/matriculas`);
    if (!res.ok) throw new Error('Error al obtener matrículas');
    return res.json();
  },
  inscribirse: async (id_taller: number) => {
    const res = await fetchWithAuth(`${API_URL}/talleres/${id_taller}/inscribirse`, { method: 'POST', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/matriculas`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/matriculas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/matriculas/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Estudiantes
export const estudiantesAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/estudiantes`);
    if (!res.ok) throw new Error('Error al obtener estudiantes');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/estudiantes`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/estudiantes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Materiales
export const materialesAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/materiales`);
    if (!res.ok) throw new Error('Error al obtener materiales');
    return res.json();
  },
  getInsumos: async () => {
    const res = await fetchWithAuth(`${API_URL}/materiales/insumos`);
    if (!res.ok) throw new Error('Error al obtener insumos');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/materiales`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/materiales/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/materiales/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Pedidos
export const pedidosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/pedidos`);
    if (!res.ok) throw new Error('Error al obtener pedidos');
    return res.json();
  },
  getMisPedidos: async () => {
    const res = await fetchWithAuth(`${API_URL}/pedidos/mis-pedidos`);
    if (!res.ok) throw new Error('Error al obtener tus pedidos');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/pedidos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  updateEstado: async (id: number, estado: boolean | null | { estado: string; motivo?: string }) => {
    const body = typeof estado === 'object' && estado !== null ? estado : { estado };
    const res = await fetchWithAuth(`${API_URL}/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  cancelar: async (id: number, motivo?: string) => {
    const res = await fetchWithAuth(`${API_URL}/pedidos/${id}/cancelar`, { method: 'PUT', body: JSON.stringify({ motivo: motivo || null }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  
  resubirComprobante: async (id: number, file: File) => {
    // 1. Subir la imagen directamente a tu Cloudinary
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', 'nudo_studio'); // Preset personalizado para Nudo Studio

    const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', {
      method: 'POST',
      body: cloudinaryForm,
    });

    if (!cloudinaryRes.ok) {
      throw new Error('No se pudo subir la imagen correctamente');
    }

    const cloudinaryData = await cloudinaryRes.json();
    const urlCloudinary = cloudinaryData.secure_url;

    // 2. Enviar esa URL limpia a tu backend de Node.js
    const res = await fetchWithAuth(`${API_URL}/pedidos/${id}/resubir-comprobante`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comprobante_pago: urlCloudinary }),
    });

    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.mensaje || 'Error al actualizar el comprobante en el servidor');
    }

    return res.json();
  },

  // =============================================================
  //  NUEVOS MÉTODOS PARA VERIFICACIÓN Y ENVÍO A PRODUCCIÓN
  // =============================================================

  /**
   * Consulta al backend si hay insumos suficientes en el almacén para confeccionar el pedido
   */
  verificarInsumos: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/pedidos/${id}/verificar-insumos`);
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.mensaje || 'Error al verificar insumos');
    }
    return res.json();
  },

  /**
   * Aprueba un pedido para producción, crea su orden en la tabla de confección y descuenta el stock
   */
  aprobarAProduccion: async (
    id: number, 
    datos: { fecha_entrega?: string; observaciones?: string; id_usuarios?: number }
  ) => {
    const res = await fetchWithAuth(`${API_URL}/pedidos/${id}/aprobar-produccion`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.mensaje || 'Error al procesar la aprobación del pedido');
    }
    return res.json();
  }
};

// Matrículas del cliente
export const misMatriculasAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/matriculas/mis-matriculas`);
    if (!res.ok) throw new Error('Error al obtener tus matrículas');
    return res.json();
  },
};

// Abonos
export const abonosAPI = {
  getAll: async (fecha?: string) => {
    const url = fecha ? `${API_URL}/abonos?fecha=${fecha}` : `${API_URL}/abonos`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Error al obtener abonos');
    return res.json();
  },
  getMisAbonos: async () => {
    const res = await fetchWithAuth(`${API_URL}/abonos/mis-abonos`);
    if (!res.ok) throw new Error('Error al obtener tus abonos');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/abonos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  crearAbonoTaller: async (data: { id_taller: number; monto_abono: number; metodo_pago?: string; comprobante_pago?: string }) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/taller`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  pagarSaldo: async (data: { id_taller: number; comprobante_pago: string; metodo_pago?: string }) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/taller/saldo`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  aprobar: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/${id}/aprobar`, { method: 'PUT', body: JSON.stringify({}) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  rechazar: async (id: number, motivo?: string) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/${id}/rechazar`, { method: 'PUT', body: JSON.stringify({ motivo: motivo || '' }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  resubirComprobante: async (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'nudo_studio');
    const cloudRes = await fetch('https://api.cloudinary.com/v1_1/ddcx9ks5g/image/upload', { method: 'POST', body: fd });
    if (!cloudRes.ok) throw new Error('No se pudo subir el comprobante');
    const { secure_url } = await cloudRes.json();
    const res = await fetchWithAuth(`${API_URL}/abonos/${id}/resubir-comprobante`, { method: 'PUT', body: JSON.stringify({ comprobante_pago: secure_url }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/abonos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// News — el backend no tiene este módulo aún, retorna vacío para no romper el frontend
export const newsAPI = {
  getAll: async () => ({ news: [] }),
};

// Descuentos por producto
export const descuentosAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/descuentos`);
    if (!res.ok) throw new Error('Error al obtener descuentos');
    return res.json();
  },
  getActivos: async () => {
    // Público — no requiere token
    const res = await fetch(`${API_URL}/descuentos/activos`);
    if (!res.ok) throw new Error('Error al obtener descuentos activos');
    return res.json();
  },
  getByProducto: async (id_producto: number) => {
    const res = await fetch(`${API_URL}/descuentos/producto/${id_producto}`);
    if (!res.ok) throw new Error('Error al obtener descuentos del producto');
    return res.json();
  },
  create: async (data: any) => {
    const res = await fetchWithAuth(`${API_URL}/descuentos`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetchWithAuth(`${API_URL}/descuentos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
  delete: async (id: number) => {
    const res = await fetchWithAuth(`${API_URL}/descuentos/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.mensaje); }
    return res.json();
  },
};

// Notificaciones
export const notificacionesAPI = {
  getAll: async () => {
    const res = await fetchWithAuth(`${API_URL}/notificaciones`);
    if (!res.ok) throw new Error('Error al obtener notificaciones');
    return res.json();
  },
};
