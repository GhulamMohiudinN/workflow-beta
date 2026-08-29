"use client";

import { useMemo, useState } from "react";
import { FiDownload, FiPlus, FiSend, FiX } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { invoiceAPI } from "../../api/invoiceAPI";

const EMPTY_INVOICE = {
  invoiceNumber: "",
  issueDate: "",
  servicePeriod: "",
  currency: "USD",
  supplier: { name: "", abn: "", website: "" },
  client: { name: "", representative: "", address: "" },
  items: [{ description: "", period: "", amount: "" }],
  paymentTerms: "",
  notes: "",
};

export default function InvoicingPage() {
  const [invoice, setInvoice] = useState(EMPTY_INVOICE);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const totalAmount = useMemo(
    () => invoice.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2),
    [invoice.items]
  );

  const updateItem = (idx, field, value) => {
    const items = [...invoice.items];
    items[idx] = { ...items[idx], [field]: value };
    setInvoice({ ...invoice, items });
  };

  const addItem = () => setInvoice({ ...invoice, items: [...invoice.items, { description: "", period: "", amount: "" }] });
  const removeItem = (idx) => setInvoice({ ...invoice, items: invoice.items.filter((_, i) => i !== idx) });

  const handleSend = async () => {
    if (!recipientEmail.trim()) return toast.error("Enter a recipient email address");
    if (!invoice.invoiceNumber.trim()) return toast.error("Invoice number is required");
    if (!totalAmount || Number(totalAmount) <= 0) return toast.error("Add at least one line item with an amount");

    setSending(true);
    const res = await invoiceAPI.sendInvoice({
      to: recipientEmail.trim(),
      invoice: { ...invoice, totalAmount },
    });
    if (res.success) toast.success(`Invoice sent to ${recipientEmail}`);
    else toast.error(res.error || "Failed to send invoice");
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-xl font-black text-slate-900">Invoicing</h1>
        <p className="mt-1 text-sm text-slate-500">Create a simple invoice, preview it, and email it directly.</p>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="iris-no-print space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Invoice Number">
            <input value={invoice.invoiceNumber} onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
              placeholder="e.g. INV-2026-001" className={inputCls} />
          </Field>
          <Field label="Issue Date">
            <input type="date" value={invoice.issueDate} onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Service Period">
            <input value={invoice.servicePeriod} onChange={(e) => setInvoice({ ...invoice, servicePeriod: e.target.value })}
              placeholder="e.g. January 2026" className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Supplier</p>
            <Field label="Name">
              <input value={invoice.supplier.name} onChange={(e) => setInvoice({ ...invoice, supplier: { ...invoice.supplier, name: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="ABN / Business Number">
              <input value={invoice.supplier.abn} onChange={(e) => setInvoice({ ...invoice, supplier: { ...invoice.supplier, abn: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="Website">
              <input value={invoice.supplier.website} onChange={(e) => setInvoice({ ...invoice, supplier: { ...invoice.supplier, website: e.target.value } })} className={inputCls} />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Client</p>
            <Field label="Name">
              <input value={invoice.client.name} onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, name: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="Represented by">
              <input value={invoice.client.representative} onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, representative: e.target.value } })} className={inputCls} />
            </Field>
            <Field label="Address">
              <input value={invoice.client.address} onChange={(e) => setInvoice({ ...invoice, client: { ...invoice.client, address: e.target.value } })} className={inputCls} />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Line Items</p>
          <div className="space-y-2">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Description" className={`${inputClsFlex} min-w-0 flex-[2]`} />
                <input value={item.period} onChange={(e) => updateItem(idx, "period", e.target.value)}
                  placeholder="Period" className={`${inputClsFlex} min-w-0 flex-1`} />
                <input value={item.amount} onChange={(e) => updateItem(idx, "amount", e.target.value)}
                  placeholder="Amount" type="number" step="0.01" className={`${inputClsFlex} w-32 shrink-0`} />
                <button type="button" onClick={() => removeItem(idx)}
                  className="rounded-lg border border-slate-200 bg-white px-3 text-sm text-red-500 hover:bg-red-50">
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900">
            <FiPlus size={12} /> Add line item
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <input value={invoice.currency} onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Total (auto-calculated)">
            <input value={`${totalAmount} ${invoice.currency}`} disabled className={`${inputCls} bg-slate-50 font-bold`} />
          </Field>
        </div>

        <Field label="Payment Terms">
          <input value={invoice.paymentTerms} onChange={(e) => setInvoice({ ...invoice, paymentTerms: e.target.value })}
            placeholder="e.g. Payment due within 14 days of invoice receipt" className={inputCls} />
        </Field>

        <Field label="Notes (optional)">
          <textarea value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} rows={2} className={inputCls} />
        </Field>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Recipient email address" type="email" className={`${inputCls} max-w-xs`} />
          <button type="button" onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            <FiSend size={14} /> {sending ? "Sending…" : "Send Invoice"}
          </button>
          <button type="button" onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <FiDownload size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ── Printable preview ────────────────────────────────────────────── */}
      <div className="iris-print-area rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-black text-slate-900">INVOICE</h1>
        <div className="mt-2 space-y-0.5 text-xs text-slate-600">
          {invoice.invoiceNumber && <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>}
          {invoice.issueDate && <p><strong>Issue Date:</strong> {invoice.issueDate}</p>}
          {invoice.servicePeriod && <p><strong>Service Period:</strong> {invoice.servicePeriod}</p>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Supplier</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{invoice.supplier.name || "—"}</p>
            {invoice.supplier.abn && <p className="text-xs text-slate-600">ABN: {invoice.supplier.abn}</p>}
            {invoice.supplier.website && <p className="text-xs text-slate-600">{invoice.supplier.website}</p>}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Client</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{invoice.client.name || "—"}</p>
            {invoice.client.representative && <p className="text-xs text-slate-600">Represented by {invoice.client.representative}</p>}
            {invoice.client.address && <p className="text-xs text-slate-600">{invoice.client.address}</p>}
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2">Period</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2">{item.description || "—"}</td>
                <td className="py-2">{item.period || "—"}</td>
                <td className="py-2 text-right">{item.amount || "0"} {invoice.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-right">
          <p className="text-xs text-slate-400">TOTAL DUE</p>
          <p className="text-2xl font-black text-slate-900">{totalAmount} {invoice.currency}</p>
        </div>

        {invoice.paymentTerms && <p className="mt-6 text-xs text-slate-500"><strong>Payment Terms:</strong> {invoice.paymentTerms}</p>}
        {invoice.notes && <p className="mt-2 text-xs text-slate-500">{invoice.notes}</p>}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none";
// Same look as inputCls, without `w-full` — for inputs inside a flex row,
// where w-full fights with flex-1/flex-[2] sizing and produces broken widths.
const inputClsFlex = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}
