/**
 * Invoicing Service - Invoice management, generation, and PDF export
 */

import { createClient } from '@/lib/supabase/client';
import { Invoice, InvoiceLineItem, InvoiceTemplate } from '@/lib/types';

const supabase = createClient();

/**
 * List invoices with filtering
 */
export async function listInvoices(
  businessId: string,
  options: {
    status?: string;
    contactId?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  let query = supabase
    .from<any>('invoices')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.contactId) {
    query = query.eq('contact_id', options.contactId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Invoice[];
}

/**
 * Get single invoice with line items
 */
export async function getInvoice(invoiceId: string) {
  const { data: invoice, error: invoiceError } = await supabase
    .from<any>('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) throw invoiceError;

  const { data: lineItems, error: itemsError } = await supabase
    .from<any>('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (itemsError) throw itemsError;

  return { ...(invoice as Invoice), line_items: lineItems as InvoiceLineItem[] };
}

/**
 * Create new invoice
 */
export async function createInvoice(businessId: string, invoice: Partial<Invoice>) {
  const { data, error } = await supabase
    .from<any>('invoices')
    .insert({
      ...invoice,
      business_id: businessId,
      status: invoice.status || 'draft',
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Invoice;
}

/**
 * Update invoice
 */
export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
  const { data, error } = await supabase
    .from<any>('invoices')
    .update(updates as any)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data as Invoice;
}

/**
 * Delete invoice
 */
export async function deleteInvoice(invoiceId: string) {
  const { error } = await supabase
    .from<any>('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
}

/**
 * Add line item to invoice
 */
export async function addLineItem(
  invoiceId: string,
  businessId: string,
  item: Partial<InvoiceLineItem>
) {
  const { data, error } = await supabase
    .from<any>('invoice_line_items')
    .insert({
      ...item,
      invoice_id: invoiceId,
      business_id: businessId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as InvoiceLineItem;
}

/**
 * Update line item
 */
export async function updateLineItem(
  lineItemId: string,
  updates: Partial<InvoiceLineItem>
) {
  const { data, error } = await supabase
    .from<any>('invoice_line_items')
    .update(updates as any)
    .eq('id', lineItemId)
    .select()
    .single();

  if (error) throw error;
  return data as InvoiceLineItem;
}

/**
 * Delete line item
 */
export async function deleteLineItem(lineItemId: string) {
  const { error } = await supabase
    .from<any>('invoice_line_items')
    .delete()
    .eq('id', lineItemId);

  if (error) throw error;
}

/**
 * Generate invoice number
 */
export async function generateInvoiceNumber(businessId: string, prefix = 'INV'): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const { data: existingInvoices } = await supabase
    .from<any>('invoices')
    .select('invoice_number')
    .eq('business_id', businessId)
    .like('invoice_number', `${prefix}-${year}${month}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (existingInvoices && existingInvoices.length > 0) {
    const lastNumber = existingInvoices[0].invoice_number;
    const match = lastNumber.match(/(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Mark invoice as sent
 */
export async function markInvoiceAsSent(invoiceId: string) {
  const { data, error } = await supabase
    .from<any>('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data as Invoice;
}

/**
 * Record invoice payment
 */
export async function recordInvoicePayment(
  invoiceId: string,
  businessId: string,
  payment: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_id?: string;
  }
) {
  // Create payment record
  const { data: paymentRecord, error: paymentError } = await supabase
    .from<any>('invoice_payments')
    .insert({
      invoice_id: invoiceId,
      business_id: businessId,
      ...payment,
    } as any)
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Get invoice to calculate new paid amount
  const invoice = await getInvoice(invoiceId);
  const newPaidAmount = (invoice.paid_amount || 0) + payment.amount;

  // Update invoice
  const newStatus =
    newPaidAmount >= invoice.total_amount ? 'paid' : 'partially_paid';

  await updateInvoice(invoiceId, {
    paid_amount: newPaidAmount,
    status: newStatus,
    paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
  });

  return paymentRecord;
}

/**
 * Get invoice templates
 */
export async function getInvoiceTemplates(businessId: string) {
  const { data, error } = await supabase
    .from<any>('invoice_templates')
    .select('*')
    .eq('business_id', businessId);

  if (error) throw error;
  return data as InvoiceTemplate[];
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(businessId: string) {
  const { data: invoices, error } = await supabase
    .from<any>('invoices')
    .select('status, total_amount, paid_amount')
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
      stats.total_revenue += inv.total_amount || 0;
      stats.paid_revenue += inv.paid_amount || 0;
      stats.outstanding += (inv.total_amount || 0) - (inv.paid_amount || 0);

      if (inv.status === 'draft') stats.draft++;
      else if (inv.status === 'sent') stats.sent++;
      else if (inv.status === 'paid') stats.paid++;
      else if (inv.status === 'overdue') stats.overdue++;
    });
  }

  return stats;
}
