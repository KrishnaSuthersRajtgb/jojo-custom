import { Printer, Download, X, ShieldCheck, FileDown } from 'lucide-react';
import { API_BASE_URL } from '../services';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    placedAt?: string;
    paymentId?: string | null;
    username?: string;
    orderDetails: {
      fabricName?: string;
      garment?: string;
      meters?: number;
      pricePerMeter?: number;
      fabricTotal?: number;
      total?: number;
      accessories?: Array<{ label: string; price: number }>;
    };
    address?: {
      fullName?: string;
      street?: string;
      line1?: string;
      line2?: string;
      landmark?: string;
      city?: string;
      state?: string;
      pincode?: string;
      phone?: string;
    };
  };
}

function numberToWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertThreeDigit = (n: number): string => {
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) out += `${units[h] ?? ''} Hundred `;
    if (rem > 0) {
      if (rem < 10) out += units[rem] ?? '';
      else if (rem < 20) out += teens[rem - 10] ?? '';
      else {
        out += tens[Math.floor(rem / 10)] ?? '';
        if (rem % 10 > 0) out += ` ${units[rem % 10] ?? ''}`;
      }
    }
    return out.trim();
  };

  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  let remaining = rounded;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertThreeDigit(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertThreeDigit(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertThreeDigit(thousand)} Thousand`);
  if (remaining > 0) parts.push(convertThreeDigit(remaining));

  return `${parts.join(' ')} Rupees Only`;
}

export default function AmazonInvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  if (!isOpen) return null;

  const details = order.orderDetails;
  const addr = order.address ?? {};
  const grandTotal = (details.total ?? 0) || 844;
  const fabricTotal =
    details.fabricTotal ?? (details.meters ? details.meters * (details.pricePerMeter || 644) : 644);
  const accessories = details.accessories ?? [];
  const invoiceNumber = `INV-JF-${(order.id || '2026').slice(-6).toUpperCase()}`;
  const orderDate = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');
  const invoiceDate = new Date().toLocaleDateString('en-IN');

  const items = [
    {
      title: `${details.garment || 'Bespoke Garment'} · ${details.fabricName || 'Pure Silk Fabric'}`,
      desc: `Haute Couture Tailoring & Textile (${details.meters ?? 1} meter${(details.meters ?? 1) > 1 ? 's' : ''})`,
      qty: 1,
      unitPrice: fabricTotal,
      totalAmount: fabricTotal,
    },
  ];

  accessories.forEach((a) => {
    const p = a.price || 0;
    items.push({
      title: `Atelier Trim: ${a.label}`,
      desc: 'Handcrafted embellishment & border work',
      qty: 1,
      unitPrice: p,
      totalAmount: p,
    });
  });

  const amountWords = numberToWords(grandTotal);

  const fullStreet =
    [addr.street, addr.line1, addr.line2, addr.landmark ? `Near ${addr.landmark}` : null]
      .filter(Boolean)
      .join(', ') || 'Atelier Residence';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = () => {
    // Generate clean offline printable HTML blob and trigger download
    const invoiceContent = document.getElementById('printable-amazon-invoice')?.innerHTML;
    if (!invoiceContent) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice-${invoiceNumber}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 24px; background: #fff; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 7px 10px; font-size: 11px; }
    th { background: #f4f4f4; text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
  </style>
</head>
<body onload="window.print()">
  ${invoiceContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadServerPdf = () => {
    window.open(`${API_BASE_URL}/api/orders/${order.id}/invoice?format=pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-neutral-300">
        {/* Sticky Toolbar inside Modal (Above Navbar, Z-Index 9999) */}
        <div className="sticky top-0 z-20 bg-[#1B1512] text-[#F6F1E7] px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#B8935A]" />
            <span className="font-semibold text-sm tracking-wide">
              Official Invoice — JoJo Flora Couture
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#F6F1E7] px-3.5 py-1.5 rounded transition-colors"
              title="Print directly or save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#B8935A] hover:bg-[#a58148] text-[#1B1512] px-3.5 py-1.5 rounded transition-colors shadow-sm"
              title="Download standalone invoice file"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download Bill
            </button>

            <button
              onClick={handleDownloadServerPdf}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded transition-colors"
              title="Generate server-side PDF"
            >
              <Download className="h-3.5 w-3.5" />
              Puppeteer PDF
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ml-2"
              aria-label="Close invoice"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Clean Amazon India Commercial Bill Canvas (No GST, Only Direct Amounts) */}
        <div
          id="printable-amazon-invoice"
          className="p-8 sm:p-10 font-sans text-[#111] text-[11px] leading-relaxed bg-white"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4">
            <div>
              <div className="text-2xl font-black tracking-wide text-neutral-900">
                JOJO FLORA COUTURE
              </div>
              <div className="text-[10px] text-neutral-600 uppercase tracking-wider mt-0.5">
                Haute Couture Atelier &amp; Fine Handloom Textiles
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                14/2, KNK Road, Nungambakkam, Chennai, Tamil Nadu - 600034
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-900">
                Retail Invoice / Cash Memo
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Original for Recipient</div>
              <div className="mt-2 text-[11px]">
                <span className="font-bold">Invoice No:</span> {invoiceNumber}
              </div>
              <div className="text-[10px] text-neutral-600">
                <span className="font-bold">Date:</span> {invoiceDate}
              </div>
            </div>
          </div>

          {/* Metadata & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 mb-5 border-b border-neutral-200 text-[11px]">
            <div className="bg-[#FAF7F2] p-4 rounded-lg border border-neutral-200">
              <div className="font-bold uppercase tracking-wider text-neutral-900 mb-1.5 text-[10px]">
                Delivery Address:
              </div>
              <p className="font-bold text-neutral-900 text-xs">
                {addr.fullName || order.username || 'Valued Client'}
              </p>
              <p className="mt-0.5 text-neutral-700">{fullStreet}</p>
              <p className="text-neutral-700">
                {addr.city || 'Chennai'}, {addr.state || 'Tamil Nadu'} - {addr.pincode || '600034'}
              </p>
              <p className="mt-1">
                <span className="font-bold">Phone:</span> {addr.phone || '9345816672'}
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-lg border border-neutral-200 space-y-1">
              <div className="font-bold uppercase tracking-wider text-neutral-900 mb-1.5 text-[10px]">
                Order Details:
              </div>
              <p>
                <span className="font-bold">Order ID:</span> {order.id}
              </p>
              <p>
                <span className="font-bold">Order Date:</span> {orderDate}
              </p>
              <p>
                <span className="font-bold">Payment Method:</span>{' '}
                {order.paymentId ? 'Prepaid (Online Payment / Razorpay)' : 'Prepaid Couture Order'}
              </p>
              {order.paymentId && (
                <p>
                  <span className="font-bold">Transaction ID:</span> {order.paymentId}
                </p>
              )}
              <p>
                <span className="font-bold">Delivery Partner:</span> BlueDart Express Couture
              </p>
            </div>
          </div>

          {/* Clean Line Items Table (NO GST, ONLY THE AMOUNT) */}
          <table className="w-full border-collapse border border-neutral-300 mb-5 text-[11px]">
            <thead>
              <tr className="bg-neutral-100 uppercase text-[10px] font-bold text-neutral-800">
                <th className="border border-neutral-300 px-3 py-2 text-center w-10">Sl</th>
                <th className="border border-neutral-300 px-3 py-2 text-left">Description</th>
                <th className="border border-neutral-300 px-3 py-2 text-center w-16">Qty</th>
                <th className="border border-neutral-300 px-3 py-2 text-right w-28">Unit Price</th>
                <th className="border border-neutral-300 px-3 py-2 text-right w-28">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="border border-neutral-300 px-3 py-2.5 text-center">{idx + 1}</td>
                  <td className="border border-neutral-300 px-3 py-2.5">
                    <span className="font-bold text-neutral-900 text-xs">{item.title}</span>
                    <br />
                    <span className="text-neutral-500 text-[10px]">{item.desc}</span>
                  </td>
                  <td className="border border-neutral-300 px-3 py-2.5 text-center font-medium">
                    {item.qty}
                  </td>
                  <td className="border border-neutral-300 px-3 py-2.5 text-right font-mono">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="border border-neutral-300 px-3 py-2.5 text-right font-mono font-bold text-neutral-900">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pb-4 mb-4 border-b border-neutral-200">
            <div className="sm:col-span-3 text-[11px] space-y-1">
              <p className="font-bold text-neutral-800">Amount in Words:</p>
              <p className="italic text-neutral-900 font-semibold">{amountWords}</p>

              <div className="mt-4 pt-3 border-t border-neutral-200 text-[10px] text-neutral-500">
                <p>• Complimentary measurement, tailor-fitting, and doorstep delivery included.</p>
                <p>
                  • For inquiries or adjustments, contact: atelier@jojoflora.com | +91 94440 12345
                </p>
              </div>
            </div>

            <div className="sm:col-span-2 text-[11px]">
              <div className="bg-[#FAF7F2] p-4 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex justify-between py-0.5">
                  <span className="text-neutral-600">Items Subtotal:</span>
                  <span className="font-mono font-semibold">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 text-emerald-700 font-bold">
                  <span>Shipping &amp; Handling:</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between py-2 border-t border-neutral-300 text-sm font-black text-neutral-900 mt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-[#5C1A32]">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="flex justify-between items-end pt-3">
            <div className="text-[9px] text-neutral-400">
              This is a computer generated invoice and requires no physical signature.
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-[#5C1A32] tracking-wider mb-8">
                FOR JOJO FLORA COUTURE LLP
              </div>
              <div className="inline-block border-t border-neutral-800 pt-1 px-8 text-[10px] font-bold text-neutral-800">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
