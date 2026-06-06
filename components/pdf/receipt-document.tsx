import {
  Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 32, color: '#111827' },
  header: { alignItems: 'center', marginBottom: 16 },
  storeName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  storeInfo: { fontSize: 8, color: '#6B7280', marginTop: 1 },
  divider: { borderBottom: '1px solid #E5E7EB', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: '#6B7280' },
  value: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB', paddingVertical: 5, paddingHorizontal: 4 },
  tableHeaderText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #F3F4F6',
    paddingVertical: 5, paddingHorizontal: 4 },
  col_desc: { flex: 1 },
  col_qty:  { width: 30, textAlign: 'center' },
  col_price:{ width: 60, textAlign: 'right' },
  col_sub:  { width: 65, textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel:{ color: '#6B7280' },
  totalValue:{ fontFamily: 'Helvetica-Bold' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between',
    borderTop: '1.5px solid #111827', paddingTop: 6, marginTop: 4 },
  grandLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 8, color: '#9CA3AF', marginTop: 2 },
})

interface ReceiptItem {
  description: string
  color: string | null
  sizeValue: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

interface ReceiptData {
  consecutive: number
  date: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  storeName: string
  storeAddress?: string | null
  storePhone?: string | null
  storeEmail?: string | null
  items: ReceiptItem[]
  subtotal: number
  discountAmount: number
  total: number
  notes?: string | null
  footerText?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function pad(n: number) { return String(n).padStart(6, '0') }

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Store header */}
        <View style={styles.header}>
          <Text style={styles.storeName}>{data.storeName}</Text>
          {data.storeAddress && <Text style={styles.storeInfo}>{data.storeAddress}</Text>}
          {data.storePhone   && <Text style={styles.storeInfo}>Tel: {data.storePhone}</Text>}
          {data.storeEmail   && <Text style={styles.storeInfo}>{data.storeEmail}</Text>}
        </View>

        <View style={styles.divider} />

        {/* Comprobante info */}
        <View style={{ marginBottom: 10 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Comprobante N°</Text>
            <Text style={styles.value}>#{pad(data.consecutive)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha</Text>
            <Text>{data.date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}><Text style={styles.label}>Nombre</Text><Text>{data.customerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Correo</Text><Text>{data.customerEmail}</Text></View>
          {data.customerPhone && (
            <View style={styles.row}><Text style={styles.label}>Teléfono</Text><Text>{data.customerPhone}</Text></View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col_desc]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.col_qty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.col_price]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.col_sub]}>Subtotal</Text>
          </View>
          {data.items.map((item, i) => {
            const desc = [item.description, item.color, item.sizeValue ? `T.${item.sizeValue}` : null]
              .filter(Boolean).join(' | ')
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col_desc}>{desc}</Text>
                <Text style={styles.col_qty}>{item.quantity}</Text>
                <Text style={styles.col_price}>{fmt(item.unitPrice)}</Text>
                <Text style={styles.col_sub}>{fmt(item.subtotal)}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.divider} />

        {/* Totals */}
        <View style={{ marginBottom: 10 }}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Descuento</Text>
              <Text>- {fmt(data.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>{fmt(data.total)}</Text>
          </View>
        </View>

        {data.notes && (
          <>
            <View style={styles.divider} />
            <Text style={{ fontSize: 8, color: '#6B7280' }}>Nota: {data.notes}</Text>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{data.footerText ?? '¡Gracias por su compra!'}</Text>
          <Text style={styles.footerText}>Garantía válida por 30 días con este comprobante</Text>
        </View>
      </Page>
    </Document>
  )
}
