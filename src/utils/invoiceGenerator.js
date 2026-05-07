import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

// 🎨 Helper to clean non-ASCII characters for jsPDF compatibility
const cleanPDFText = (text) => {
  if (!text) return ''
  // Try to extract text inside parentheses if it exists (often where English names are)
  const match = text.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  
  // Keep only standard alphanumeric and symbols, removing Marathi/Unicode
  const cleaned = text.replace(/[^\x20-\x7E]/g, "").trim();
  return cleaned || "Agricultural Product";
};

export const generateInvoice = (item, user) => {
  if (!item) return
  
  try {
    const doc = new jsPDF()
    
    // 🎨 Theme & Layout
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 15
    const primaryColor = [16, 185, 129] // Emerald-600
    const businessName = cleanPDFText(user?.businessName || user?.name || 'Krishi Mart')
    
    // --- 🏷️ LUXURY HEADER ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    // Logo Text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.text('KS', margin, 25)
    doc.setFontSize(14)
    doc.text('KRISHI SHARE', margin + 18, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Modernizing Rural Commerce', margin + 18, 25)
    
    // Invoice Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('TAX INVOICE', pageWidth - margin, 28, { align: 'right' })

    // --- 📄 MAIN DETAILS ---
    doc.setFillColor(255, 255, 255)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`INVOICE NO: #${item._id.slice(-8).toUpperCase()}`, margin, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`DATE: ${new Date(item.createdAt || Date.now()).toLocaleDateString()}`, margin, 66)
    
    // --- 👤 PARTIES INFO ---
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, 85, (pageWidth/2) - 20, 35, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('BILL TO (CUSTOMER):', margin + 5, 95)
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(cleanPDFText(item.farmerName || 'VALUED CUSTOMER'), margin + 5, 102)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70)
    const addr = cleanPDFText(item.address || 'Maharashtra, India')
    const splitAddr = doc.splitTextToSize(addr, (pageWidth/2) - 30)
    doc.text(splitAddr, margin + 5, 108)

    doc.rect((pageWidth/2) + 5, 85, (pageWidth/2) - 20, 35, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('SOLD BY (MERCHANT):', (pageWidth/2) + 10, 95)
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(businessName, (pageWidth/2) + 10, 102)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70)
    doc.text([
      `Phone: ${user?.phone || 'N/A'}`,
      `Email: ${user?.email || 'N/A'}`,
      `Store: ${cleanPDFText(user?.village || 'Krishi Share')}`
    ], (pageWidth/2) + 10, 108)

    // --- 📊 PROFESSIONAL TABLE ---
    const tableData = item.items?.map((it, index) => [
      index + 1,
      cleanPDFText(it.name),
      `${it.qty || 0}`,
      `RS. ${(it.price || 0).toLocaleString()}`,
      `RS. ${( (it.price || 0) * (it.qty || 0) ).toLocaleString()}`
    ]) || []

    autoTable(doc, {
      startY: 135,
      head: [['SR.', 'PRODUCT / SERVICE DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor,
        textColor: 255, 
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 }
      },
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      margin: { left: margin, right: margin }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setDrawColor(230)
    doc.line(pageWidth - 90, finalY, pageWidth - margin, finalY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text('Subtotal:', pageWidth - 80, finalY + 8)
    doc.setTextColor(0)
    doc.text(`RS. ${(item.finalAmount || 0).toLocaleString()}`, pageWidth - margin, finalY + 8, { align: 'right' })
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(pageWidth - 90, finalY + 15, 90-margin, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255)
    doc.text('GRAND TOTAL:', pageWidth - 80, finalY + 23)
    doc.text(`RS. ${(item.finalAmount || 0).toLocaleString()}`, pageWidth - margin, finalY + 23, { align: 'right' })

    const footerY = pageHeight - 40
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('Authorized Signatory', pageWidth - margin - 25, footerY + 25, { align: 'center' })
    doc.text('Terms: Subject to Maharashtra Jurisdiction.', margin, footerY + 25)
    
    doc.save(`Invoice_${item._id.slice(-6).toUpperCase()}.pdf`)
    toast.success('Invoice downloaded! ✅')
  } catch (err) {
    console.error('PDF Generation Failed:', err)
    toast.error('Bill logic error!')
  }
}
