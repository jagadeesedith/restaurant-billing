const menu = [
  { name: 'Poratta', price: 40, cost: 15 },
  { name: 'Dosa', price: 50, cost: 18 },
  { name: 'Chicken Rice', price: 80, cost: 35 },
  { name: 'Half Boil', price: 30, cost: 12 },
  { name: 'Omelette', price: 45, cost: 18 },
  { name: 'Chappathi', price: 35, cost: 12 }
];

const STORAGE_KEY = 'restaurant_billing_sales';
const qtyMap = {};
menu.forEach(m => { qtyMap[m.name] = 0; });

function getSales() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSale(amount, items, paymentMethod, taxAmount, discountAmount) {
  const sales = getSales();
  const now = new Date();
  sales.push({
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    amount,
    items: items || [],
    paymentMethod: paymentMethod || 'Cash',
    tax: taxAmount || 0,
    discount: discountAmount || 0
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

const amountReceivedInput = document.getElementById("amountReceived");
const paymentDue = document.getElementById("paymentDue");
const changeRow = document.getElementById("changeRow");
const changeAmount = document.getElementById("changeAmount");

function updateChange() {
  const due = Number(paymentDue.innerText.replace("₹", ""));
  const received = Number(amountReceivedInput.value);

  if (received >= due) {
    changeRow.style.display = "flex";
    changeAmount.innerText = "₹ " + (received - due);
  } else {
    changeRow.style.display = "none";
  }
}

document.querySelectorAll(".cash-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    amountReceivedInput.value = btn.dataset.value;
    updateChange();
  });
});

amountReceivedInput.addEventListener("input", updateChange);

function getTodayEarnings() {
  const today = new Date().toISOString().slice(0, 10);
  return getSales()
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

function getMonthlyEarnings() {
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  return getSales()
    .filter(s => s.date && s.date.slice(0, 7) === thisMonth)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

function updateEarningsDisplay() {
  document.getElementById('todayEarnings').textContent = '₹ ' + getTodayEarnings();
  document.getElementById('monthlyEarnings').textContent = '₹ ' + getMonthlyEarnings();
}

function getCurrentBillItems() {
  const items = [];
  for (const [name, qty] of Object.entries(qtyMap)) {
    if (qty <= 0) continue;
    const item = menu.find(m => m.name === name);
    items.push({ name, qty, price: item.price, total: item.price * qty });
  }
  return items;
}

function getCurrentTotal() {
  return getCurrentBillItems().reduce((sum, i) => sum + i.total, 0);
}

function getSubtotal() {
  return getCurrentTotal();
}

function getTaxPercent() {
  return parseFloat(document.getElementById('taxPercent').value) || 0;
}

function getDiscountPercent() {
  return parseFloat(document.getElementById('discountPercent').value) || 0;
}

function getTaxAmount() {
  return Math.round(getSubtotal() * getTaxPercent() / 100);
}

function getDiscountAmount() {
  return Math.round(getSubtotal() * getDiscountPercent() / 100);
}

function getGrandTotal() {
  return getSubtotal() + getTaxAmount() - getDiscountAmount();
}

function getCurrentFoodCost() {
  let cost = 0;
  for (const [name, qty] of Object.entries(qtyMap)) {
    if (qty <= 0) continue;
    const item = menu.find(m => m.name === name);
    if (item && item.cost != null) cost += item.cost * qty;
  }
  return cost;
}

function updateTaxDiscountDisplay() {
  const subtotal = getSubtotal();
  const summary = document.getElementById('taxDiscountSummary');
  const subtotalRow = document.getElementById('subtotalRow');
  const subtotalAmount = document.getElementById('subtotalAmount');
  if (subtotal <= 0) {
    summary.style.display = 'none';
    if (document.getElementById('subtotalRow')) subtotalRow.style.display = 'none';
    return;
  }
  subtotalRow.style.display = 'flex';
  subtotalAmount.textContent = '₹ ' + subtotal;
  const tax = getTaxAmount();
  const discount = getDiscountAmount();
  document.getElementById('taxAmount').textContent = '₹ ' + tax;
  document.getElementById('discountAmount').textContent = '₹ ' + discount;
  document.getElementById('grandTotalAmount').textContent = '₹ ' + getGrandTotal();
  summary.style.display = 'block';
}

function updatePaymentDisplay() {
  const total = getGrandTotal();
  document.getElementById('paymentDue').textContent = '₹ ' + total;
  const received = parseFloat(document.getElementById('amountReceived').value) || 0;
  const changeRow = document.getElementById('changeRow');
  const changeAmount = document.getElementById('changeAmount');
  if (received > 0 && total > 0) {
    const change = Math.max(0, received - total);
    changeRow.style.display = 'flex';
    changeAmount.textContent = '₹ ' + change;
  } else {
    changeRow.style.display = 'none';
  }
}

function renderRecords() {
  const list = document.getElementById('recordsList');
  const sales = getSales();
  if (sales.length === 0) {
    list.innerHTML = '<div class="empty-records">No records yet. Complete a payment to see records here.</div>';
    return;
  }
  const recent = sales.slice(-30).reverse();
  list.innerHTML = recent.map(s => `
    <div class="record-item">
      <span class="record-date">${s.date} ${s.time || ''} · ${s.paymentMethod || 'Cash'}</span>
      <span class="record-amount">₹ ${s.amount}</span>
    </div>
  `).join('');
}

function exportRecords() {
  const sales = getSales();
  if (sales.length === 0) {
    alert('No records to export.');
    return;
  }
  const headers = 'Date,Time,Amount,Payment Method\n';
  const rows = sales.map(s => `${s.date},${s.time || ''},${s.amount},${s.paymentMethod || 'Cash'}`).join('\n');
  const csv = headers + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'restaurant_records_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadInvoice() {
  const items = getCurrentBillItems();
  const grandTotal = getGrandTotal();
  if (items.length === 0 || getSubtotal() <= 0) {
    alert('Add items to the bill before downloading invoice.');
    return;
  }
  const customerName = document.getElementById('customerName').value.trim() || 'Customer';
  const tableNo = document.getElementById('tableNo').value.trim() || '—';
  const date = new Date();
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const subtotal = getSubtotal();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();

  const rows = items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹ ${i.price}</td><td>₹ ${i.total}</td></tr>`).join('');
  const extraRows = (tax > 0 || discount > 0) ? `
    <tr><td colspan="3">Subtotal</td><td>₹ ${subtotal}</td></tr>
    ${tax > 0 ? `<tr><td colspan="3">Tax</td><td>₹ ${tax}</td></tr>` : ''}
    ${discount > 0 ? `<tr><td colspan="3">Discount</td><td>- ₹ ${discount}</td></tr>` : ''}
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Invoice</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; }
  h1 { font-size: 1.25rem; margin-bottom: 8px; }
  .meta { color: #555; font-size: 0.9rem; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 6px; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #f4a261; color: #1a1a2e; }
  .total { font-weight: 700; font-size: 1.1rem; margin-top: 12px; }
</style>
</head>
<body>
  <h1>Restaurant Invoice</h1>
  <div class="meta">Date: ${dateStr} ${timeStr}<br>Customer: ${customerName}<br>Table: ${tableNo}</div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
    <tbody>${rows}${extraRows}</tbody>
  </table>
  <div class="total">Grand Total: ₹ ${grandTotal}</div>
</body>
</html>`;

  saveSale(grandTotal, items, document.getElementById('paymentMethod').value, tax, discount);
  updateEarningsDisplay();
  renderRecords();

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${tableNo !== '—' ? 'Table' + tableNo + '_' : ''}${dateStr.replace(/\s/g, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function updateBill() {
  const billRows = document.getElementById('billRows');
  const subtotalRow = document.getElementById('subtotalRow');
  const subtotalAmount = document.getElementById('subtotalAmount');
  const foodCostRow = document.getElementById('foodCostRow');
  const foodCostAmount = document.getElementById('foodCostAmount');

  const rows = [];
  let total = 0;
  for (const [name, qty] of Object.entries(qtyMap)) {
    if (qty <= 0) continue;
    const item = menu.find(m => m.name === name);
    const amt = item.price * qty;
    total += amt;
    rows.push(`<div class="bill-row"><span>${name} × ${qty}</span><span>₹ ${amt}</span></div>`);
  }

  const foodCost = getCurrentFoodCost();
  if (rows.length === 0) {
    billRows.innerHTML = '<div class="empty-bill">Add items using + button</div>';
    if (subtotalRow) subtotalRow.style.display = 'none';
    foodCostRow.style.display = 'none';
  } else {
    billRows.innerHTML = rows.join('');
    if (subtotalRow) {
      subtotalRow.style.display = 'flex';
      subtotalAmount.textContent = '₹ ' + total;
    }
    foodCostRow.style.display = 'flex';
    foodCostAmount.textContent = '₹ ' + foodCost;
  }
  updateTaxDiscountDisplay();
  updatePaymentDisplay();
}

document.querySelectorAll('.item-card').forEach(card => {
  const name = card.dataset.item;
  const qtyEl = card.querySelector('[data-qty]');
  const minusBtn = card.querySelector('[data-action="minus"]');
  const plusBtn = card.querySelector('[data-action="plus"]');

  plusBtn.addEventListener('click', () => {
    qtyMap[name]++;
    qtyEl.textContent = qtyMap[name];
    minusBtn.disabled = false;
    updateBill();
  });

  minusBtn.addEventListener('click', () => {
    if (qtyMap[name] <= 0) return;
    qtyMap[name]--;
    qtyEl.textContent = qtyMap[name];
    if (qtyMap[name] === 0) minusBtn.disabled = true;
    updateBill();
  });

  minusBtn.disabled = true;
});

updateEarningsDisplay();
renderRecords();
updateTaxDiscountDisplay();
updatePaymentDisplay();

document.getElementById('amountReceived').addEventListener('input', updatePaymentDisplay);
document.getElementById('amountReceived').addEventListener('change', updatePaymentDisplay);
document.getElementById('taxPercent').addEventListener('input', () => { updateTaxDiscountDisplay(); updatePaymentDisplay(); });
document.getElementById('taxPercent').addEventListener('change', () => { updateTaxDiscountDisplay(); updatePaymentDisplay(); });
document.getElementById('discountPercent').addEventListener('input', () => { updateTaxDiscountDisplay(); updatePaymentDisplay(); });
document.getElementById('discountPercent').addEventListener('change', () => { updateTaxDiscountDisplay(); updatePaymentDisplay(); });

document.getElementById('btnDownload').addEventListener('click', downloadInvoice);
document.getElementById('btnPrint').addEventListener('click', () => window.print());

function doSaveRecord() {
  const grandTotal = getGrandTotal();
  const received = parseFloat(document.getElementById('amountReceived').value) || 0;
  if (getSubtotal() <= 0) {
    alert('Add items and create a bill first.');
    return;
  }
  if (received < grandTotal) {
    alert('Amount received is less than the bill total. Enter amount received first.');
    return;
  }
  const items = getCurrentBillItems();
  const method = document.getElementById('paymentMethod').value;
  saveSale(grandTotal, items, method, getTaxAmount(), getDiscountAmount());
  updateEarningsDisplay();
  renderRecords();
  menu.forEach(m => { qtyMap[m.name] = 0; });
  document.querySelectorAll('[data-qty]').forEach(el => { el.textContent = '0'; });
  document.querySelectorAll('[data-action="minus"]').forEach(btn => { btn.disabled = true; });
  document.getElementById('amountReceived').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('tableNo').value = '';
  document.getElementById('taxPercent').value = '0';
  document.getElementById('discountPercent').value = '0';
  updateBill();
  updatePaymentDisplay();
}

document.getElementById('btnCompletePayment').addEventListener('click', doSaveRecord);
document.getElementById('btnSaveRecord').addEventListener('click', doSaveRecord);

document.getElementById('btnExportRecords').addEventListener('click', exportRecords);

document.getElementById('btnClear').addEventListener('click', () => {
  menu.forEach(m => { qtyMap[m.name] = 0; });
  document.querySelectorAll('[data-qty]').forEach(el => { el.textContent = '0'; });
  document.querySelectorAll('[data-action="minus"]').forEach(btn => { btn.disabled = true; });
  document.getElementById('amountReceived').value = '';
  document.getElementById('taxPercent').value = '0';
  document.getElementById('discountPercent').value = '0';
  updateBill();
  updatePaymentDisplay();
  document.getElementById('customerName').value = '';
  document.getElementById('tableNo').value = '';
});
