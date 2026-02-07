import type { Invoice, Client } from '@/types';

/**
 * Generates and downloads a PDF invoice
 * Uses browser's print functionality for PDF generation
 */
export async function generateInvoicePDF(invoice: Invoice, client: Client) {
  // Create a new window with the invoice content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please check your popup blocker.');
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(num);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Generate HTML content for the invoice
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Manrope', sans-serif;
            color: #2D3436;
            background: white;
            padding: 40px;
            line-height: 1.6;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 24px;
            border-bottom: 2px solid #8B9D83;
          }
          
          .company-info h1 {
            font-family: 'Fraunces', serif;
            font-size: 28px;
            font-weight: 700;
            color: #4A3F35;
            margin-bottom: 8px;
          }
          
          .company-info p {
            font-size: 14px;
            color: #6B7280;
          }
          
          .invoice-details {
            text-align: right;
          }
          
          .invoice-number {
            font-family: 'Fraunces', serif;
            font-size: 24px;
            font-weight: 600;
            color: #4A3F35;
            margin-bottom: 8px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-draft {
            background: #F3F4F6;
            color: #6B7280;
          }
          
          .status-issued {
            background: #FEF3C7;
            color: #92400E;
          }
          
          .status-paid {
            background: #D1FAE5;
            color: #065F46;
          }
          
          .status-past_due {
            background: #FEE2E2;
            color: #991B1B;
          }
          
          .billing-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          
          .billing-section h2 {
            font-family: 'Fraunces', serif;
            font-size: 14px;
            font-weight: 600;
            color: #8B9D83;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          
          .billing-section p {
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .client-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .dates-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .date-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }
          
          .date-label {
            color: #6B7280;
            font-size: 14px;
          }
          
          .date-value {
            font-weight: 500;
            font-size: 14px;
          }
          
          .line-items {
            margin-bottom: 32px;
          }
          
          .line-items table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .line-items thead {
            background: #FAF7F2;
            border-bottom: 2px solid #8B9D83;
          }
          
          .line-items th {
            font-family: 'Fraunces', serif;
            font-size: 12px;
            font-weight: 600;
            color: #4A3F35;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px;
            text-align: left;
          }
          
          .line-items th:last-child,
          .line-items td:last-child {
            text-align: right;
          }
          
          .line-items tbody tr {
            border-bottom: 1px solid #E8E4DF;
          }
          
          .line-items td {
            padding: 16px 12px;
            font-size: 14px;
          }
          
          .item-name {
            font-weight: 600;
            color: #2D3436;
          }
          
          .item-description {
            font-size: 12px;
            color: #6B7280;
            margin-top: 4px;
          }
          
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 32px;
          }
          
          .totals {
            width: 300px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E8E4DF;
          }
          
          .total-row.subtotal {
            font-size: 14px;
          }
          
          .total-row.tax {
            font-size: 14px;
            color: #6B7280;
          }
          
          .total-row.total {
            font-family: 'Fraunces', serif;
            font-size: 20px;
            font-weight: 700;
            color: #4A3F35;
            border-bottom: none;
            border-top: 2px solid #8B9D83;
            padding-top: 16px;
            margin-top: 8px;
          }
          
          .footer {
            margin-top: 60px;
            padding-top: 24px;
            border-top: 1px solid #E8E4DF;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .invoice-container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>Resiliency Counseling Group LLC Management</h1>
              <p>Professional Psychology Services</p>
            </div>
            <div class="invoice-details">
              <div class="invoice-number">Invoice ${invoice.invoiceNumber}</div>
              <span class="status-badge status-${invoice.status}">
                ${invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div class="billing-section">
            <div class="bill-to">
              <h2>Bill To</h2>
              <p class="client-name">${client.first_name} ${client.last_name}</p>
              ${client.company ? `<p>${client.company}</p>` : ''}
              <p>${client.email}</p>
              <p>${client.phone}</p>
              ${client.street ? `<p>${client.street}</p>` : ''}
              ${client.city || client.state || client.postal ? `
                <p>${[client.city, client.state, client.postal].filter(Boolean).join(', ')}</p>
              ` : ''}
            </div>
            <div class="dates-info">
              <div class="date-row">
                <span class="date-label">Issue Date:</span>
                <span class="date-value">${formatDate(invoice.issueDate)}</span>
              </div>
              ${invoice.dueDate ? `
                <div class="date-row">
                  <span class="date-label">Due Date:</span>
                  <span class="date-value">${formatDate(invoice.dueDate)}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="line-items">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.lineItems.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.serviceName}</div>
                      ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.lineTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="totals-section">
            <div class="totals">
              <div class="total-row subtotal">
                <span>Subtotal</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax && parseFloat(invoice.tax) > 0 ? `
                <div class="total-row tax">
                  <span>Tax</span>
                  <span>${formatCurrency(invoice.tax)}</span>
                </div>
              ` : ''}
              <div class="total-row total">
                <span>Total</span>
                <span>${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions about this invoice, please contact us.</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            // Close window after printing (user can cancel)
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
