// ═══════════════════════════════════════════════════════════════
// INVOICE GENERATOR
// Generate PDF invoices for payments
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate invoice PDF
 */
export async function generateInvoice(paymentId: string): Promise<string> {
    const supabase = await createClient();

    // Get payment with user and plan details
    const { data: payment } = await (supabase
        .from('payments') as any)
        .select(`
      *,
      users(name, email, phone),
      subscription_plans(name, duration_months)
    `)
        .eq('id', paymentId)
        .single();

    if (!payment) {
        throw new Error('Payment not found');
    }

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const fileName = `invoice_${payment.invoice_number}.pdf`;
    const tempDir = path.join(process.cwd(), 'temp', 'invoices');
    await fs.mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, fileName);
    const writeStream = doc.pipe(require('fs').createWriteStream(filePath));

    // Header
    doc
        .fontSize(20)
        .text('UPSC CSE Master', 50, 50)
        .fontSize(10)
        .text('Tax Invoice', 50, 80)
        .text(`Invoice #: ${payment.invoice_number}`, 50, 95)
        .text(`Date: ${new Date(payment.completed_at).toLocaleDateString('en-IN')}`, 50, 110);

    // Bill To
    doc
        .fontSize(12)
        .text('Bill To:', 50, 150)
        .fontSize(10)
        .text(payment.users.name, 50, 170)
        .text(payment.users.email, 50, 185)
        .text(payment.users.phone || '', 50, 200);

    // Table header
    const tableTop = 270;
    doc
        .fontSize(10)
        .text('Description', 50, tableTop)
        .text('Amount (₹)', 350, tableTop, { width: 90, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Items
    let y = tableTop + 30;

    const baseAmount = payment.amount / (1 + payment.gst_percentage / 100);
    const gstAmount = payment.amount - baseAmount;

    doc
        .text(payment.subscription_plans.name, 50, y)
        .text(baseAmount.toFixed(2), 350, y, { width: 90, align: 'right' });

    y += 25;
    doc
        .text(`GST (${payment.gst_percentage}%)`, 50, y)
        .text(gstAmount.toFixed(2), 350, y, { width: 90, align: 'right' });

    // Total
    y += 40;
    doc
        .fontSize(12)
        .text('Total Amount:', 50, y)
        .text(`₹${payment.amount.toFixed(2)}`, 350, y, { width: 90, align: 'right' });

    // Footer
    doc
        .fontSize(8)
        .text('Thank you for your purchase!', 50, 700, { align: 'center' })
        .text('This is a computer-generated invoice.', 50, 715, { align: 'center' });

    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Upload to storage
    const pdfBuffer = await fs.readFile(filePath);

    const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`${paymentId}/${fileName}`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (uploadError) {
        throw new Error('Failed to upload invoice');
    }

    const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(`${paymentId}/${fileName}`);

    // Update payment with invoice URL
    await (supabase
        .from('payments') as any)
        .update({ invoice_url: urlData.publicUrl })
        .eq('id', paymentId);

    // Cleanup temp file
    await fs.unlink(filePath).catch(() => { });

    return urlData.publicUrl;
}