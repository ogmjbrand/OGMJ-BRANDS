/**
 * Invoicing Service - client_invoices / invoice_items
 *
 * invoice_number, subtotal, tax_amount and total are computed by database
 * triggers (generate_invoice_number, recalculate_invoice_total) — never set
 * them directly from here.
 */

import { createClient } from '@/lib/supabase/client';

export interface InvoiceClient {
  id: string;
  name: string;
  email: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  title: string | null;
  status: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  clients?: InvoiceClient | null;
  invoice_items?: InvoiceItem[];
}

/**
 * List invoices with filtering
 */
export async function listInvoices(
  businessId: string,
  options: {
    status?: string;
    clientId?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const supabase = createClient();
  let query = supabase
    .from('client_invoices')
    .select('*, clients(id, name, email)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as Invoice[];
}

/**
 * Get a single invoice with its line items and client
 */
export async function getInvoice(invoiceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_invoices')
    .select('*, clients(id, name, email), invoice_items(*)')
    .eq('id', invoiceId)
    .single();

  if (error) throw error;
  return data as unknown as Invoice;
}

/**
 * Create a new invoice as a single line item. invoice_number, subtotal,
 * tax_amount and total are all derived by database triggers once the item
 * is inserted.
 */
export async function createInvoice(
  businessId: string,
  input: {
    clientId?: string | null;
    title?: string;
    dueDate?: string;
    notes?: string;
    terms?: string;
    taxRate?: number;
    discount?: number;
    amount: number;
  }
) {
  const supabase = createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from('client_invoices')
    .insert({
      business_id: businessId,
      client_id: input.clientId || null,
      title: input.title || null,
      due_date: input.dueDate || null,
      notes: input.notes || null,
      terms: input.terms || null,
      tax_rate: input.taxRate ?? 0,
      discount: input.discount ?? 0,
    } as any)
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  const { error: itemError } = await supabase.from('invoice_items').insert({
    invoice_id: (invoice as any).id,
    description: input.title || 'Services rendered',
    quantity: 1,
    unit_price: input.amount,
  } as any);

  if (itemError) throw itemError;

  return getInvoice((invoice as any).id);
}

/**
 * Update invoice header fields. To change the billed amount, pass `amount`
 * — it updates the sole line item's unit_price so the total-recalc trigger
 * stays in sync; this only works cleanly for single-line-item invoices.
 */
export async function updateInvoice(
  invoiceId: string,
  updates: {
    clientId?: string | null;
    title?: string;
    dueDate?: string;
    notes?: string;
    terms?: string;
    taxRate?: number;
    discount?: number;
    status?: string;
    amount?: number;
  }
) {
  const supabase = createClient();

  const headerUpdate: Record<string, any> = {};
  if (updates.clientId !== undefined) headerUpdate.client_id = updates.clientId;
  if (updates.title !== undefined) headerUpdate.title = updates.title;
  if (updates.dueDate !== undefined) headerUpdate.due_date = updates.dueDate;
  if (updates.notes !== undefined) headerUpdate.notes = updates.notes;
  if (updates.terms !== undefined) headerUpdate.terms = updates.terms;
  if (updates.taxRate !== undefined) headerUpdate.tax_rate = updates.taxRate;
  if (updates.discount !== undefined) headerUpdate.discount = updates.discount;
  if (updates.status !== undefined) headerUpdate.status = updates.status;

  if (Object.keys(headerUpdate).length > 0) {
    const { error } = await supabase
      .from('client_invoices')
      .update(headerUpdate)
      .eq('id', invoiceId);
    if (error) throw error;
  }

  if (updates.amount !== undefined) {
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })
      .limit(1);
    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      const { error } = await supabase
        .from('invoice_items')
        .update({ unit_price: updates.amount, quantity: 1 } as any)
        .eq('id', (items[0] as any).id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('invoice_items').insert({
        invoice_id: invoiceId,
        description: updates.title || 'Services rendered',
        quantity: 1,
        unit_price: updates.amount,
      } as any);
      if (error) throw error;
    }
  }

  return getInvoice(invoiceId);
}

/**
 * Delete invoice (cascades to its line items)
 */
export async function deleteInvoice(invoiceId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('client_invoices').delete().eq('id', invoiceId);
  if (error) throw error;
}

/**
 * Mark invoice as sent
 */
export async function markInvoiceAsSent(invoiceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() } as any)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Invoice;
}

/**
 * Mark invoice as fully paid. There is no per-payment amount tracked on
 * this schema (no invoice_payments table), so this is all-or-nothing.
 */
export async function markInvoiceAsPaid(invoiceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Invoice;
}

/**
 * List the business's clients, for the invoice client picker
 */
export async function listClients(businessId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('business_id', businessId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as unknown as InvoiceClient[];
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(businessId: string) {
  const supabase = createClient();
  const { data: invoices, error } = await supabase
    .from('client_invoices')
    .select('status, total')
    .eq('business_id', businessId);

  if (error) throw error;

  const stats = {
    total_invoices: invoices?.length || 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    total_revenue: 0,
    paid_revenue: 0,
    outstanding: 0,
  };

  if (invoices) {
    invoices.forEach((inv: any) => {
      const total = Number(inv.total) || 0;
      stats.total_revenue += total;

      if (inv.status === 'draft') stats.draft++;
      else if (inv.status === 'sent') stats.sent++;
      else if (inv.status === 'paid') {
        stats.paid++;
        stats.paid_revenue += total;
      } else if (inv.status === 'overdue') stats.overdue++;
    });
    stats.outstanding = stats.total_revenue - stats.paid_revenue;
  }

  return stats;
}
