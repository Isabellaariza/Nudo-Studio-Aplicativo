import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// ── PEDIDOS ─────────────────────────────────────────────────────────────────

export async function enviarCorreoPedidoEnProduccion({ email, nombre, numeroPedido, producto }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `¡Tu pedido ${numeroPedido} está en producción! 🧵`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">Excelentes noticias: tu pago fue verificado y tu pedido ya está siendo elaborado por nuestro equipo artesanal.</p>
      <div style="background:#fef3c7;border-left:4px solid #B8860B;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">${numeroPedido}</p>
        ${producto ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">Producto: <strong>${producto}</strong></p>` : ''}
        <p style="margin:12px 0 0;font-size:13px;color:#92400e;font-weight:600;">Estado: ⚙️ En Producción</p>
      </div>
      <p style="color:#4b5563;line-height:1.6;">Cada pieza es elaborada a mano con mucho cuidado. Te notificaremos cuando tu pedido esté listo para entrega.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">¡Gracias por confiar en Nudo Studio!</p>
    `),
  });
}

export async function enviarCorreoPedidoCompletado({ email, nombre, numeroPedido, producto }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `¡Tu pedido ${numeroPedido} está listo y en camino! 🎉`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">¡Hola, ${nombre}!</h2>
      <p style="color:#4b5563;line-height:1.6;">¡Buenas noticias! Tu pedido ha sido <strong>completado</strong> y está siendo despachado hacia ti.</p>
      <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#065f46;">${numeroPedido}</p>
        ${producto ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">Producto: <strong>${producto}</strong></p>` : ''}
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

export async function enviarCorreoPedidoCancelado({ email, nombre, numeroPedido, producto, motivo }) {
  await transporter.sendMail({
    from: `"Nudo Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Actualización sobre tu pedido ${numeroPedido}`,
    html: base(`
      <h2 style="color:#2D4B39;margin:0 0 16px;">Hola, ${nombre}</h2>
      <p style="color:#4b5563;line-height:1.6;">Lamentamos informarte que tu pedido ha sido cancelado.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Número de pedido</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#991b1b;">${numeroPedido}</p>
        ${producto ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">Producto: <strong>${producto}</strong></p>` : ''}
        ${motivo ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fecaca;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Motivo de cancelación</p>
          <p style="margin:0;font-size:14px;color:#374151;">${motivo}</p>
        </div>` : ''}
      </div>
      <p style="color:#4b5563;line-height:1.6;">Si crees que esto es un error o deseas hacer un nuevo pedido, puedes contactarnos o visitar nuestra tienda.</p>
      <p style="color:#B8860B;font-weight:600;margin-top:24px;">Nudo Studio</p>
    `),
  });
}

// ── MATRÍCULAS ───────────────────────────────────────────────────────────────

export async function enviarCorreoMatriculaConfirmada({ email, nombre, taller, fecha, hora, precio }) {
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
        ${hora ? `<p style="margin:4px 0 0;font-size:14px;color:#4b5563;">🕐 Hora: <strong>${hora}</strong></p>` : ''}
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
