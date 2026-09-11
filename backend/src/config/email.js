import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: convierte hora HH:MM o HH:MM:SS a formato 12h AM/PM
function formatHora12(hora) {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const base = (contenido) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#2D4B39;padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:4px;">NUDO STUDIO</h1>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Arte textil hecho a mano</p>
    </div>
    <div style="padding:32px;">
      ${contenido}
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Nudo Studio · Medellín, Colombia</p>
    </div>
  </div>
`;

// ── HELPER: tabla HTML de productos (compatible con clientes de correo) ───────

function tablaProductos(detalle) {
  // detalle: array de { nombre, cantidad, precio_unitario }
  // Si no viene o está vacío, retorna cadena vacía
  if (!Array.isArray(detalle) || detalle.length === 0) return '';
  const filas = detalle
    .filter(d => d && d.nombre)
    .map((item, i) => `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px;color:#6b7280;font-size:13px;text-align:center;">${i + 1}</td>
        <td style="padding:10px 12px;color:#1f2937;font-size:13px;font-weight:600;">${item.nombre}</td>
        <td style="padding:10px 12px;color:#4b5563;font-size:13px;text-align:center;">${item.cantidad}</td>
        <td style="padding:10px 12px;color:#92400e;font-size:13px;font-weight:700;text-align:right;">$${Number(item.precio_unitario || 0).toLocaleString('es-CO')} COP</td>
      </tr>`)
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-family:Arial,sans-serif;">
      <thead>
        <tr style="background:#2D4B39;">
          <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:center;width:40px;">#</th>
          <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:left;">Producto</th>
          <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:center;width:70px;">Cant.</th>
          <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:right;width:130px;">Precio Unit.</th>
        </tr>
      </thead>
      <tbody style="background:#ffffff;">${filas}</tbody>
    </table>`;
}

// ── PEDIDOS ─────────────────────────────────────────────────────────────────

export async function enviarCorreoPedidoEnProduccion({ email, nombre, numeroPedido, producto, detalle }) {
  const tablaHTML = tablaProductos(detalle);
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `¡Tu pedido ${numeroPedido} está en producción! 🧵`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Excelentes noticias: tu pago fue verificado y tu pedido ya está siendo elaborado por nuestro equipo artesanal.</p>
      <div style="background:#fef3c7;border-left:4px solid #B8860B;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#92400e;">${numeroPedido}</p>
        ${tablaHTML || (producto ? `<p style="margin:0;font-size:14px;color:#4b5563;">Productos: <strong>${producto}</strong></p>` : '')}
        <p style="margin:12px 0 0;font-size:13px;color:#92400e;font-weight:600;">Estado: ⚙️ En Producción</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Cada pieza es elaborada a mano con mucho cuidado. Te notificaremos cuando tu pedido esté listo para entrega.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Gracias por confiar en Nudo Studio!</p>
    `),
  });
}

export async function enviarCorreoPedidoCompletado({ email, nombre, numeroPedido, producto, detalle }) {
  const tablaHTML = tablaProductos(detalle);
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `¡Tu pedido ${numeroPedido} está listo y en camino! 🎉`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">¡Buenas noticias! Tu pedido ha sido <strong>completado</strong> y está siendo despachado hacia ti.</p>
      <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#065f46;">${numeroPedido}</p>
        ${tablaHTML || (producto ? `<p style="margin:0;font-size:14px;color:#4b5563;">Productos: <strong>${producto}</strong></p>` : '')}
        <p style="margin:12px 0 0;font-size:13px;color:#065f46;font-weight:600;">Estado: 🚚 En camino</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Tu pieza fue elaborada con mucho cuidado y amor. Pronto la tendrás en tus manos.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Gracias por confiar en Nudo Studio!</p>
    `),
  });
}

export async function enviarCorreoPedidoEnProceso({ email, nombre, numeroPedido, producto }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Tu pedido ${numeroPedido} está en proceso 🌿`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Queremos informarte que tu pedido ha sido recibido y está siendo procesado por nuestro equipo.</p>
      <div style="background:#f0fdf4;border-left:4px solid #2D4B39;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#2D4B39;">${numeroPedido}</p>
        ${producto ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">Producto: <strong>${producto}</strong></p>` : ''}
      </div>
      <p style="color:#4b5563;line-height:1.6;">Te notificaremos cuando tu pedido esté listo. Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Gracias por confiar en Nudo Studio!</p>
    `),
  });
}

export async function enviarCorreoPedidoCancelado({ email, nombre, numeroPedido, producto, detalle, motivo }) {
  const tablaHTML = tablaProductos(detalle);
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Actualización importante sobre tu pedido ${numeroPedido}`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">Hola, ${nombre}</h2>
      <p style="color:#4b5563;line-height:1.6;">Queremos informarte que, tras revisar tu comprobante de pago, tu pedido no pudo ser procesado en esta ocasión.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#991b1b;">${numeroPedido}</p>
        ${tablaHTML || (producto ? `<p style="margin:0 0 8px;font-size:14px;color:#4b5563;">Productos: <strong>${producto}</strong></p>` : '')}
        ${motivo ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fecaca;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Motivo del rechazo</p>
          <p style="margin:0;font-size:14px;color:#374151;">${motivo}</p>
        </div>` : ''}
      </div>
      <p style="color:#4b5563;line-height:1.6;">Si necesitas información adicional o tienes alguna duda sobre el proceso, no dudes en comunicarte con nosotros. Estamos aquí para ayudarte.</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#2D4B39;font-weight:600;">¿Tienes alguna pregunta?</p>
        <p style="margin:0;font-size:14px;color:#4b5563;">Puedes contactarnos directamente por WhatsApp o respondiendo a este correo y con gusto te atenderemos.</p>
      </div>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">Nudo Studio</p>
    `),
  });
}

// ── MATRÍCULAS ───────────────────────────────────────────────────────────────

export async function enviarCorreoInscripcionTaller({ email, nombre, taller, fecha, hora, precio, monto_abono, saldo }) {
  const horaFmt = hora ? formatHora12(hora) : null;
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `¡Inscripción recibida: ${taller}! Verificaremos tu pago 🧵`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Recibimos tu solicitud de inscripción al taller. Estamos verificando tu comprobante de pago y te confirmaremos pronto.</p>
      <div style="background:#fef3c7;border-left:4px solid #B8860B;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Taller</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#2D4B39;">${taller}</p>
        ${fecha ? `<p style="margin:4px 0;font-size:14px;color:#4b5563;">📅 Fecha: <strong>${fecha}</strong></p>` : ''}
        ${horaFmt ? `<p style="margin:4px 0;font-size:14px;color:#4b5563;">🕐 Hora: <strong>${horaFmt}</strong></p>` : ''}
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fde68a;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Abono registrado</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#92400e;">$${Number(monto_abono).toLocaleString('es-CO')} COP</p>
          ${saldo > 0 ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Saldo pendiente: <strong>$${Number(saldo).toLocaleString('es-CO')} COP</strong></p>` : '<p style="margin:6px 0 0;font-size:13px;color:#059669;font-weight:600;">✓ Pago completo</p>'}
        </div>
        <p style="margin:12px 0 0;font-size:13px;color:#92400e;font-weight:600;">Estado: ⏳ Pendiente de verificación</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Una vez verifiquemos tu comprobante, recibirás un correo de confirmación. Si tienes dudas, contáctanos por WhatsApp.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Gracias por inscribirte en Nudo Studio!</p>
    `),
  });
}

export async function enviarCorreoMatriculaConfirmada({ email, nombre, taller, fecha, hora, precio }) {
  const horaFmt = hora ? formatHora12(hora) : null;
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Inscripción confirmada: ${taller} 🎉`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Tu comprobante fue verificado y tu inscripción al taller ha sido <strong>confirmada</strong>. ¡Nos alegra tenerte!</p>
      <div style="background:#f0fdf4;border-left:4px solid #2D4B39;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Taller</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#2D4B39;">${taller}</p>
        ${fecha ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">📅 Fecha: <strong>${fecha}</strong></p>` : ''}
        ${horaFmt ? `<p style="margin:4px 0 0;font-size:14px;color:#4b5563;">🕐 Hora: <strong>${horaFmt}</strong></p>` : ''}
        ${precio > 0 ? `<p style="margin:8px 0 0;font-size:14px;color:#065f46;font-weight:700;">Valor: $${Number(precio).toLocaleString('es-CO')} COP</p>` : ''}
      </div>
      <p style="color:#4b5563;line-height:1.6;">Por favor llega 10 minutos antes. Todos los materiales están incluidos en el precio del taller.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Te esperamos!</p>
    `),
  });
}

export async function enviarCorreoMatriculaCancelada({ email, nombre, taller, motivo }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Actualización sobre tu inscripción: ${taller}`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">Hola, ${nombre}</h2>
      <p style="color:#4b5563;line-height:1.6;">Revisamos tu comprobante de pago y lamentamos informarte que tu inscripción al taller no pudo ser confirmada.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Taller</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#991b1b;">${taller}</p>
        ${motivo ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fecaca;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Motivo</p>
          <p style="margin:0;font-size:14px;color:#374151;">${motivo}</p>
        </div>` : ''}
      </div>
      <p style="color:#4b5563;line-height:1.6;">Si crees que hay un error o deseas inscribirte nuevamente con un comprobante válido, contáctanos.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">Nudo Studio</p>
    `),
  });
}

// ── ABONOS ───────────────────────────────────────────────────────────────────

export async function enviarCorreoVencimientoPago({ email, nombre, taller, fechaTaller, saldo, vencimiento }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `⚠️ Tienes hasta mañana para pagar el saldo de "${taller}"`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">Hola, ${nombre} 👋</h2>
      <p style="color:#4b5563;line-height:1.6;">Este es un recordatorio importante: tienes saldo pendiente en el siguiente taller y debes pagarlo <strong>antes de que venza el plazo</strong>.</p>
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Taller</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#2D4B39;">${taller}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
          <div>
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Saldo pendiente</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#DC2626;">$${Number(saldo).toLocaleString('es-CO')} COP</p>
          </div>
          <div>
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Fecha del taller</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#2D4B39;">${fechaTaller}</p>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fde68a;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Límite de pago</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#B45309;">${vencimiento} — 1 día antes del taller</p>
        </div>
      </div>
      <div style="background:#fef2f2;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">⚠️ Política de no devolución</p>
        <p style="margin:8px 0 0;font-size:13px;color:#4b5563;line-height:1.5;">Si no completas el pago antes del plazo, <strong>tu inscripción será cancelada automáticamente</strong> y el abono realizado <strong>no será devuelto</strong>, ya que cubre costos de reserva del cupo.</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Para pagar, ingresa a tu perfil y sube el comprobante del saldo desde la sección <strong>Mis Talleres</strong>.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">Nudo Studio 🪢</p>
    `),
  });
}

export async function enviarCorreoAbonoCancelado({ email, nombre, taller, fechaTaller, monto }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Inscripción cancelada: "${taller}" — Sin devolución del abono`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">Hola, ${nombre}</h2>
      <p style="color:#4b5563;line-height:1.6;">Lamentamos informarte que tu inscripción al siguiente taller ha sido <strong>cancelada automáticamente</strong> porque no se completó el pago del saldo en el plazo establecido (1 día antes del taller).</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Taller cancelado</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#991b1b;">${taller}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Fecha del taller</p>
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#374151;">${fechaTaller}</p>
        <div style="padding-top:12px;border-top:1px solid #fecaca;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Abono realizado (no reembolsable)</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#DC2626;">$${Number(monto).toLocaleString('es-CO')} COP</p>
        </div>
      </div>
      <div style="background:#fef2f2;border-radius:8px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#991b1b;">De acuerdo con nuestra política, los abonos <strong>no son reembolsables</strong> una vez vencido el plazo de pago, ya que cubren los costos de reserva del cupo y materiales del taller.</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Si tienes preguntas o deseas inscribirte en una próxima edición del taller, no dudes en contactarnos.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">Nudo Studio 🪢</p>
    `),
  });
}
