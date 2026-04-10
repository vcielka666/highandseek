import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ShippingAddress {
  name?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

interface SendOrderConfirmationParams {
  to: string
  orderId: string
  items: OrderItem[]
  totalAmount: number
  currency?: string
  shippingAddress?: ShippingAddress
  paidWithCredits?: boolean
}

export async function sendOrderConfirmation({
  to,
  orderId,
  items,
  totalAmount,
  currency = 'czk',
  shippingAddress,
  paidWithCredits = false,
}: SendOrderConfirmationParams): Promise<void> {
  const orderRef = orderId.slice(-6).toUpperCase()

  const itemRows = items.map((i) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;font-family:monospace;font-size:13px;color:#e8f0ef;">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;text-align:center;font-family:monospace;font-size:13px;color:#4a6066;">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a2e;text-align:right;font-family:monospace;font-size:13px;color:#00d4c8;">${(i.price * i.quantity).toLocaleString('cs-CZ')} Kč</td>
    </tr>`
  ).join('')

  const shippingHtml = shippingAddress?.city
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(0,212,200,0.08);">
        <div style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;margin-bottom:8px;">Ships to</div>
        <div style="font-size:13px;color:rgba(232,240,239,0.7);line-height:1.8;font-family:monospace;">
          ${shippingAddress.name ?? ''}<br/>
          ${shippingAddress.address ?? ''}<br/>
          ${shippingAddress.postalCode ?? ''} ${shippingAddress.city}<br/>
          ${shippingAddress.country ?? ''}
        </div>
      </div>`
    : ''

  const paymentNote = paidWithCredits
    ? `<div style="margin-top:12px;padding:8px 12px;background:rgba(204,0,170,0.08);border:0.5px solid rgba(204,0,170,0.2);border-radius:4px;font-family:monospace;font-size:11px;color:#cc00aa;">
        Paid with H&amp;S Credits
      </div>`
    : ''

  const { error } = await resend.emails.send({
    from: 'High & Seek <orders@highandseeek.com>',
    to,
    subject: `Order confirmed — #${orderRef}`,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#050508;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:22px;letter-spacing:4px;color:#00d4c8;font-family:monospace;font-weight:bold;">
        HIGH &amp; SEEK
      </div>
      <div style="font-size:10px;letter-spacing:3px;color:#4a6066;margin-top:4px;text-transform:uppercase;">
        Order Confirmation
      </div>
    </div>

    <div style="background:#0d0d10;border:0.5px solid rgba(0,212,200,0.2);border-radius:8px;padding:28px;">
      <div style="font-size:12px;color:#4a6066;font-family:monospace;letter-spacing:1px;margin-bottom:4px;">ORDER</div>
      <div style="font-size:20px;color:#e8f0ef;font-family:monospace;font-weight:bold;margin-bottom:20px;">#${orderRef}</div>

      <p style="font-size:14px;color:rgba(232,240,239,0.7);line-height:1.6;margin:0 0 24px;">
        Your order has been received and is being prepared. We'll notify you when it ships.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="text-align:left;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Item</th>
            <th style="text-align:center;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Qty</th>
            <th style="text-align:right;font-family:monospace;font-size:9px;letter-spacing:2px;color:#4a6066;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(0,212,200,0.1);">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;padding-top:12px;">
        <span style="font-family:monospace;font-size:11px;letter-spacing:1px;color:#4a6066;text-transform:uppercase;">Total</span>
        <span style="font-family:monospace;font-size:18px;font-weight:bold;color:#00d4c8;">${totalAmount.toLocaleString('cs-CZ')} Kč</span>
      </div>

      ${paymentNote}
      ${shippingHtml}
    </div>

    <div style="text-align:center;margin-top:28px;font-family:monospace;font-size:10px;color:#2a3a3e;line-height:1.8;">
      High &amp; Seek · CBD products only<br/>
      Questions? Reply to this email.
    </div>
  </div>
</body>
</html>`,
  })

  if (error) {
    console.error('[order-confirmation email] Resend error:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }
}
