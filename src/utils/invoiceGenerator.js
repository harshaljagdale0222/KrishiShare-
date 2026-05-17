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

/**
 * Generates a high-quality professional PDF invoice for Krishi Mart orders.
 * @param {Object} item - The order object
 * @param {Object} user - The store owner/user object
 */
export const generateInvoice = (item, user) => {
  if (!item) {
    toast.error('Invalid order data')
    return
  }
  
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 15
    const primaryColor = [16, 185, 129] // Emerald-600
    
    // Merchant Details from User Object
    const businessName = cleanPDFText(user?.businessName || user?.name || 'KRISHI MART')
    const ownerName = cleanPDFText(user?.name || 'Owner')
    const contact = user?.phone || 'N/A'
    const storeLocation = cleanPDFText(user?.village || 'Krishi Share')
    
    // --- 🏷️ HEADER SECTION ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(255, 255, 255)
    doc.text(businessName.toUpperCase(), margin, 25)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('OFFICIAL AGRI-BUSINESS PARTNER', margin, 33)
    
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('TAX INVOICE', pageWidth - margin, 28, { align: 'right' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice No: INV-${item._id.slice(-8).toUpperCase()}`, pageWidth - margin, 35, { align: 'right' })
    doc.text(`Order Date: ${new Date(item.createdAt || Date.now()).toLocaleDateString()}`, pageWidth - margin, 40, { align: 'right' })

    // --- 👤 PARTIES INFO (Clean Layout) ---
    let currentY = 55
    
    // Left side: Customer
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('BILL TO (CUSTOMER):', margin, currentY)
    
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(cleanPDFText(item.farmerName || 'VALUED FARMER'), margin, currentY + 8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`Phone: ${item.farmerPhone || 'N/A'}`, margin, currentY + 14)
    const addr = cleanPDFText(item.address || 'Maharashtra, India')
    const splitAddr = doc.splitTextToSize(addr, (pageWidth / 2) - 30)
    doc.text(splitAddr, margin, currentY + 19)

    // Right side: Merchant (Detailed as requested)
    const rightSideX = (pageWidth / 2) + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('SOLD BY (MERCHANT):', rightSideX, currentY)
    
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(businessName.toUpperCase(), rightSideX, currentY + 8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    doc.text(`Proprietor: ${ownerName}`, rightSideX, currentY + 14)
    doc.text(`Contact: ${contact}`, rightSideX, currentY + 19)
    doc.text(`Loc: ${storeLocation}`, rightSideX, currentY + 24)

    // --- 📊 ITEMS TABLE ---
    const tableData = item.items?.map((it, idx) => [
      idx + 1,
      cleanPDFText(it.name),
      `${it.qty} ${it.unit || 'unit'}`,
      `INR ${it.price.toLocaleString()}`,
      `INR ${(it.qty * it.price).toLocaleString()}`
    ]) || []

    autoTable(doc, {
      startY: currentY + 35,
      head: [['SR.', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL AMOUNT']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 40 }
      },
      styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
      margin: { left: margin, right: margin }
    })

    // --- 💰 FINANCIAL SUMMARY ---
    let summaryY = doc.lastAutoTable.finalY + 15
    const labelX = pageWidth - margin - 65
    const valueX = pageWidth - margin

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    
    // Subtotal
    doc.text('Subtotal (Inc. Taxes):', labelX, summaryY)
    doc.text(`INR ${item.finalAmount?.toLocaleString()}`, valueX, summaryY, { align: 'right' })

    // Dynamic Discount Logic
    const discountPercent = item.discount || 0
    if (discountPercent > 0) {
      summaryY += 8
      doc.setTextColor(220, 38, 38)
      doc.text(`Special Discount (${discountPercent}%):`, labelX, summaryY)
      const discountAmt = (item.finalAmount * discountPercent) / 100
      doc.text(`- INR ${discountAmt.toLocaleString()}`, valueX, summaryY, { align: 'right' })
    }

    // Advance Payment (Important for professional practice)
    summaryY += 8
    doc.setTextColor(100)
    doc.text('Less: Advance Paid:', labelX, summaryY)
    doc.text(`INR ${item.advanceAmount?.toLocaleString() || 0}`, valueX, summaryY, { align: 'right' })

    // Divider
    summaryY += 8
    doc.setDrawColor(220)
    doc.setLineWidth(0.5)
    doc.line(labelX, summaryY - 4, valueX, summaryY - 4)

    // Final Net Balance (Fixed overlapping and layout)
    summaryY += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(0)
    doc.text('NET BALANCE DUE:', labelX, summaryY)
    const discAmt = (item.finalAmount * (item.discount || 0)) / 100
    const netTotal = item.finalAmount - discAmt
    const finalBalance = netTotal - (item.advanceAmount || 0)
    doc.text(`INR ${finalBalance <= 0 ? '0' : finalBalance.toLocaleString()}`, valueX, summaryY, { align: 'right' })

    // --- 🏛️ OFFICIAL SIGNATURE & STAMP ---
    let footerTopY = pageHeight - 65
    doc.setDrawColor(240)
    doc.line(margin, footerTopY, pageWidth - margin, footerTopY)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('For KRISHI SHARE PARTNER STORE', pageWidth - margin, footerTopY + 15, { align: 'right' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('(Digitally Signed & Verified)', pageWidth - margin, footerTopY + 35, { align: 'right' })
    
    // --- 📜 FINAL FOOTER ---
    const finalY = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(180)
    doc.text('This is a computer generated tax invoice. Subject to Maharashtra Jurisdiction.', pageWidth / 2, finalY, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(`THANK YOU FOR CHOOSING ${businessName.toUpperCase()}!`, pageWidth / 2, finalY + 5, { align: 'center' })
    
    // Save the PDF
    doc.save(`Tax_Invoice_${item._id.slice(-8).toUpperCase()}.pdf`)
    toast.success('Professional Tax Invoice Downloaded! ✅')
    
  } catch (err) {
    console.error('PDF Generation Error:', err)
    toast.error('Failed to generate professional invoice.')
  }
}
