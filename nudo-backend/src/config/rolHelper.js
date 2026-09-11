/**
 * rolHelper.js
 * Funciones para cambiar el rol de un usuario (y su espejo en clientes) 
 * cuando se matricula o termina un taller.
 */

/**
 * Cambia el rol del usuario vinculado a un estudiante a 'estudiante'.
 * Solo actúa si el estudiante tiene id_usuarios.
 * @param {object} client - cliente pg (puede ser pool o client de transacción)
 * @param {number} id_estudiante
 */
export async function promoverAEstudiante(client, id_estudiante) {
  const rolRes = await client.query(
    `SELECT id_rol FROM roles WHERE LOWER(nombre) = 'estudiante' LIMIT 1`
  );
  if (!rolRes.rows.length) return; // rol no configurado
  const id_rol_estudiante = rolRes.rows[0].id_rol;

  // Cambiar en usuarios
  await client.query(`
    UPDATE usuarios u
    SET id_rol = $1
    FROM estudiantes e
    WHERE e.id_estudiante = $2
      AND e.id_usuarios IS NOT NULL
      AND u.id_usuarios = e.id_usuarios
  `, [id_rol_estudiante, id_estudiante]);

  // Sincronizar en clientes
  await client.query(`
    UPDATE clientes c
    SET id_rol = $1
    FROM estudiantes e
    WHERE e.id_estudiante = $2
      AND e.id_usuarios IS NOT NULL
      AND c.id_usuarios = e.id_usuarios
  `, [id_rol_estudiante, id_estudiante]);
}

/**
 * Revierte el rol del usuario vinculado a un estudiante a 'cliente',
 * SOLO si no tiene otras matrículas activas o pendientes.
 * @param {object} client - cliente pg
 * @param {number} id_estudiante
 */
export async function revertirACliente(client, id_estudiante) {
  // Verificar que no tenga otras matrículas activas o pendientes
  const activas = await client.query(`
    SELECT COUNT(*) AS total
    FROM matricula
    WHERE id_estudiante = $1
      AND estado IN ('activa', 'pendiente_pago')
  `, [id_estudiante]);

  if (Number(activas.rows[0].total) > 0) return; // aún tiene talleres activos

  const rolRes = await client.query(
    `SELECT id_rol FROM roles WHERE LOWER(nombre) = 'cliente' LIMIT 1`
  );
  if (!rolRes.rows.length) return;
  const id_rol_cliente = rolRes.rows[0].id_rol;

  // Revertir en usuarios
  await client.query(`
    UPDATE usuarios u
    SET id_rol = $1
    FROM estudiantes e
    WHERE e.id_estudiante = $2
      AND e.id_usuarios IS NOT NULL
      AND u.id_usuarios = e.id_usuarios
  `, [id_rol_cliente, id_estudiante]);

  // Sincronizar en clientes
  await client.query(`
    UPDATE clientes c
    SET id_rol = $1
    FROM estudiantes e
    WHERE e.id_estudiante = $2
      AND e.id_usuarios IS NOT NULL
      AND c.id_usuarios = e.id_usuarios
  `, [id_rol_cliente, id_estudiante]);
}
