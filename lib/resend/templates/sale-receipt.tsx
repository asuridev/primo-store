import {
  Html, Head, Body, Container, Section, Text, Row, Column, Hr, Preview
} from '@react-email/components'

interface SaleReceiptEmailProps {
  consecutive: number
  customerName: string
  storeName: string
  date: string
  items: { description: string; color: string | null; sizeValue: string | null; quantity: number; unitPrice: number; subtotal: number }[]
  subtotal: number
  discountAmount: number
  total: number
  footerText?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function pad(n: number) { return String(n).padStart(6, '0') }

export function SaleReceiptEmail({
  consecutive, customerName, storeName, date, items,
  subtotal, discountAmount, total, footerText,
}: SaleReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Comprobante de compra #{pad(consecutive)} — {storeName}</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '520px', margin: '32px auto', backgroundColor: '#ffffff',
          borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#111827', padding: '28px 32px', textAlign: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{storeName}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0' }}>
              Comprobante N° #{pad(consecutive)}
            </Text>
          </Section>

          {/* Main */}
          <Section style={{ padding: '24px 32px' }}>
            <Text style={{ fontSize: '15px', color: '#111827', marginTop: 0 }}>
              Hola, <strong>{customerName}</strong>
            </Text>
            <Text style={{ fontSize: '13px', color: '#6B7280', marginTop: -8 }}>
              Gracias por tu compra el {date}. Aquí está el detalle de tu pedido.
            </Text>

            {/* Items */}
            <Section style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '0' }}>
              <Row style={{ backgroundColor: '#F3F4F6', borderRadius: '8px 8px 0 0', padding: '10px 16px' }}>
                <Column style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', flex: 1 }}>Producto</Column>
                <Column style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', width: '40px', textAlign: 'center' }}>Cant.</Column>
                <Column style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', width: '80px', textAlign: 'right' }}>Total</Column>
              </Row>
              {items.map((item, i) => {
                const desc = [item.description, item.color, item.sizeValue ? `T.${item.sizeValue}` : null].filter(Boolean).join(' · ')
                return (
                  <Row key={i} style={{ padding: '10px 16px', borderTop: '1px solid #E5E7EB' }}>
                    <Column style={{ fontSize: '13px', color: '#111827', flex: 1 }}>{desc}</Column>
                    <Column style={{ fontSize: '13px', color: '#6B7280', width: '40px', textAlign: 'center' }}>{item.quantity}</Column>
                    <Column style={{ fontSize: '13px', color: '#111827', width: '80px', textAlign: 'right' }}>{fmt(item.subtotal)}</Column>
                  </Row>
                )
              })}
            </Section>

            {/* Totals */}
            <Section style={{ marginTop: '16px' }}>
              <Row><Column style={{ color: '#6B7280', fontSize: '13px' }}>Subtotal</Column><Column style={{ textAlign: 'right', fontSize: '13px' }}>{fmt(subtotal)}</Column></Row>
              {discountAmount > 0 && (
                <Row><Column style={{ color: '#6B7280', fontSize: '13px' }}>Descuento</Column><Column style={{ textAlign: 'right', fontSize: '13px', color: '#059669' }}>- {fmt(discountAmount)}</Column></Row>
              )}
            </Section>
            <Hr style={{ border: 'none', borderTop: '2px solid #111827', margin: '12px 0' }} />
            <Row>
              <Column style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>TOTAL</Column>
              <Column style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{fmt(total)}</Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: '#F9FAFB', padding: '20px 32px', textAlign: 'center',
            borderTop: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              {footerText ?? '¡Gracias por su compra!'}
            </Text>
            <Text style={{ fontSize: '11px', color: '#D1D5DB', marginTop: 4 }}>
              Garantía válida por 30 días presentando este comprobante.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
