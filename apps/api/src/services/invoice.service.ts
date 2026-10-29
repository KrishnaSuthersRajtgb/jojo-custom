import puppeteer from 'puppeteer';

interface InvoiceData {
  orderId: string;
  invoiceNumber: string;
  orderDate: string;
  invoiceDate: string;
  customerName: string;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  billingAddress?:
    | {
        fullName: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
      }
    | undefined;
  items: {
    title: string;
    description: string;
    hsn: string;
    qty: number;
    unitPrice: number;
    netAmount: number;
    taxRate: number; // e.g., 5%
    taxAmount: number;
    totalAmount: number;
  }[];
  fabricTotal?: number | undefined;
  tailoringTotal?: number | undefined;
  accessoriesTotal?: number | undefined;
  grandTotal: number;
  paymentMode: string;
  paymentTransactionId?: string | undefined;
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

export function generateAmazonInvoiceHtml(data: InvoiceData): string {
  const billing = data.billingAddress ?? data.shippingAddress;
  const amountInWords = numberToWords(data.grandTotal);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      line-height: 1.4;
      padding: 24px;
    }
    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 20px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-badge {
      font-size: 13px;
      font-weight: bold;
      text-align: right;
      color: #111;
      text-transform: uppercase;
    }
    .sub-badge {
      font-size: 9px;
      color: #555;
      text-align: right;
    }
    .meta-grid {
      display: table;
      width: 100%;
      margin-bottom: 14px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 12px;
    }
    .meta-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      font-size: 10.5px;
    }
    .meta-col-right {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      text-align: right;
      font-size: 10.5px;
    }
    .meta-col p, .meta-col-right p {
      margin-bottom: 3px;
    }
    .strong { font-weight: bold; }
    
    .address-section {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 12px;
    }
    .addr-box {
      display: table-cell;
      width: 33.33%;
      vertical-align: top;
      padding-right: 12px;
      font-size: 10px;
    }
    .addr-title {
      font-weight: bold;
      font-size: 10.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
      color: #000;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .items-table th {
      background: #f3f3f3;
      border: 1px solid #ccc;
      padding: 6px 8px;
      font-size: 9.5px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
    }
    .items-table td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      font-size: 10px;
      vertical-align: top;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .summary-section {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 14px;
    }
    .amount-words {
      display: table-cell;
      width: 60%;
      vertical-align: top;
      font-size: 10px;
    }
    .totals-box {
      display: table-cell;
      width: 40%;
      vertical-align: top;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 3px 6px;
      font-size: 10.5px;
    }
    .grand-total-row td {
      border-top: 1.5px solid #111;
      border-bottom: 1.5px solid #111;
      font-weight: bold;
      font-size: 12px;
      padding: 6px;
    }
    .signatory-box {
      display: table;
      width: 100%;
      margin-top: 20px;
    }
    .signatory-left {
      display: table-cell;
      width: 65%;
      font-size: 9.5px;
      color: #666;
      vertical-align: bottom;
    }
    .signatory-right {
      display: table-cell;
      width: 35%;
      text-align: right;
      vertical-align: bottom;
    }
    .signature-line {
      border-top: 1px solid #444;
      display: inline-block;
      width: 160px;
      margin-top: 40px;
      padding-top: 4px;
      font-size: 10px;
      text-align: center;
      font-weight: bold;
    }
    .stamp-text {
      color: #5C1A32;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
      font-size: 8.5px;
      color: #777;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: transparent; }
      .invoice-wrapper { border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div style="text-align: right; margin-bottom: 10px;" class="no-print">
      <button onclick="window.print()" style="background: #111; color: #fff; border: none; padding: 7px 16px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px;">Print / Save as PDF</button>
    </div>

    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle;">
          <div class="brand-title">JOJO FLORA COUTURE</div>
          <div class="brand-subtitle">Haute Couture Atelier &amp; Fine Textiles</div>
        </td>
        <td style="vertical-align: middle; text-align: right;">
          <div class="invoice-badge">Tax Invoice / Bill of Supply / Cash Memo</div>
          <div class="sub-badge">(Original for Recipient)</div>
        </td>
      </tr>
    </table>

    <!-- Meta Grid -->
    <div class="meta-grid">
      <div class="meta-col">
        <p><span class="strong">Sold By:</span> JoJo Flora Couture</p>
        <p>14/2, KNK Road, Nungambakkam, Chennai, Tamil Nadu 600034</p>
        <p><span class="strong">Customer Service:</span> concierge@jojoflora.com | +91 94440 12345</p>
      </div>
      <div class="meta-col-right">
        <p><span class="strong">Invoice Number:</span> ${data.invoiceNumber}</p>
        <p><span class="strong">Invoice Date:</span> ${data.invoiceDate}</p>
        <p><span class="strong">Order ID:</span> ${data.orderId}</p>
        <p><span class="strong">Order Date:</span> ${data.orderDate}</p>
      </div>
    </div>

    <!-- Address Section -->
    <div class="address-section">
      <div class="addr-box">
        <div class="addr-title">Billing Address:</div>
        <p class="strong">${billing.fullName}</p>
        <p>${billing.street}</p>
        <p>${billing.city}, ${billing.state} - ${billing.pincode}</p>
        <p><span class="strong">Phone:</span> ${billing.phone}</p>
      </div>
      <div class="addr-box">
        <div class="addr-title">Shipping Address:</div>
        <p class="strong">${data.shippingAddress.fullName}</p>
        <p>${data.shippingAddress.street}</p>
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}</p>
        <p><span class="strong">Phone:</span> ${data.shippingAddress.phone}</p>
      </div>
      <div class="addr-box">
        <div class="addr-title">Payment &amp; Logistics:</div>
        <p><span class="strong">Payment Mode:</span> ${data.paymentMode}</p>
        ${data.paymentTransactionId ? `<p><span class="strong">Transaction ID:</span> ${data.paymentTransactionId}</p>` : ''}
        <p><span class="strong">Delivery:</span> Standard Express Delivery</p>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 6%;" class="text-center">Sl</th>
          <th style="width: 58%;">Description</th>
          <th style="width: 8%;" class="text-center">Qty</th>
          <th style="width: 14%;" class="text-right">Unit Price (₹)</th>
          <th style="width: 14%;" class="text-right">Total Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item, idx) => `
          <tr>
            <td class="text-center">${(idx + 1).toString()}</td>
            <td>
              <span class="strong">${item.title}</span><br/>
              <span style="color: #555; font-size: 9px;">${item.description}</span>
            </td>
            <td class="text-center">${item.qty.toString()}</td>
            <td class="text-right">₹${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="text-right strong">₹${item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <!-- Totals and Words -->
    <div class="summary-section">
      <div class="amount-words">
        <p class="strong" style="margin-bottom: 4px;">Amount in Words:</p>
        <p style="font-style: italic; color: #222; font-size: 11px;">${amountInWords}</p>
      </div>
      <div class="totals-box">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Shipping &amp; Handling:</td>
            <td class="text-right" style="color: #1e7e34; font-weight: bold;">FREE</td>
          </tr>
          <tr class="grand-total-row">
            <td>Grand Total:</td>
            <td class="text-right">₹${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Signatory -->
    <div class="signatory-box">
      <div class="signatory-left">
        <p class="strong">Declaration:</p>
        <p>We declare that this bill shows the actual price of the goods described and that all particulars are true and correct.</p>
        <p>Customer Service: concierge@jojoflora.com | +91 94440 12345</p>
      </div>
      <div class="signatory-right">
        <div class="stamp-text">FOR JOJO FLORA COUTURE</div>
        <div class="signature-line">Authorized Signatory</div>
      </div>
    </div>

    <div class="footer-note">
      This is a computer generated invoice and does not require a physical signature.
    </div>
  </div>
</body>
</html>`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const html = generateAmazonInvoiceHtml(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
