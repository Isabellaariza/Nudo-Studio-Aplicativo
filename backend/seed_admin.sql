-- ============================================================
--  NUDO STUDIO — Datos iniciales
--  Ejecutar en Supabase SQL Editor DESPUÉS del schema principal
-- ============================================================

-- ⚠️  IMPORTANTE: Cambia la contraseña del admin antes de producción.
--     Este hash corresponde a: NudoAdmin2025
--     Genera uno nuevo en: https://bcrypt-generator.com (rounds: 10)

INSERT INTO usuarios (nombre, email, contrasena_hash, id_rol, estado)
VALUES (
  'Patricia Izarra',
  'patricia@nudostudio.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: NudoAdmin2025
  (SELECT id_rol FROM roles WHERE nombre = 'administrador' LIMIT 1),
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Verificar que se creó
SELECT u.id_usuarios, u.nombre, u.email, r.nombre AS nombre_rol, u.estado
FROM usuarios u
JOIN roles r ON u.id_rol = r.id_rol;
