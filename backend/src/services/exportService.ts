/**
 * Export Service — CSV & PDF generation for collections and admin reports.
 *
 * CSV: manual string builder (no extra deps).
 * PDF: pdfkit for PoC-grade documents.
 */
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// ─── CSV helpers ─────────────────────────────────────────────────────

const escapeCsv = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Convert an array of objects to a CSV string.
 * @param headers  { key, label } – key in data, label for header row
 * @param rows     plain objects
 */
export function toCsv(
  headers: { key: string; label: string }[],
  rows: Record<string, any>[],
): string {
  const headerLine = headers.map((h) => escapeCsv(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsv(row[h.key])).join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}

// ─── PDF helpers ─────────────────────────────────────────────────────

interface PdfTableOptions {
  title: string;
  subtitle?: string;
  headers: { key: string; label: string; width?: number }[];
  rows: Record<string, any>[];
  generatedAt?: string;
}

/**
 * Build a PDF buffer from tabular data using pdfkit.
 */
export async function toPdf(options: PdfTableOptions): Promise<Buffer> {
  const { title, subtitle, headers, rows, generatedAt } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    // Branding
    doc.fontSize(22).fillColor('#7c3aed').text('GAMEVAULT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#1f2937').text(title, { align: 'center' });
    if (subtitle) {
      doc.fontSize(10).fillColor('#6b7280').text(subtitle, { align: 'center' });
    }
    doc.moveDown(0.5);

    const timestamp = generatedAt || new Date().toISOString();
    doc.fontSize(8).fillColor('#9ca3af').text(`Generated: ${timestamp}`, { align: 'right' });
    doc.moveDown(0.8);

    // Compute column widths
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const defaultWidth = pageWidth / headers.length;
    const colWidths = headers.map((h) => h.width || defaultWidth);

    // Table header row
    const drawTableHeader = (y: number) => {
      let x = doc.page.margins.left;
      doc.fontSize(9).fillColor('#ffffff');
      headers.forEach((h, i) => {
        doc.rect(x, y, colWidths[i], 20).fill('#7c3aed');
        doc.fillColor('#ffffff').text(h.label, x + 4, y + 5, {
          width: colWidths[i] - 8,
          height: 14,
          ellipsis: true,
        });
        x += colWidths[i];
      });
      return y + 20;
    };

    let y = drawTableHeader(doc.y);

    // Data rows
    rows.forEach((row, rowIdx) => {
      if (y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
        y = doc.page.margins.top;
        y = drawTableHeader(y);
      }

      const bgColor = rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff';
      let x = doc.page.margins.left;
      headers.forEach((h, i) => {
        doc.rect(x, y, colWidths[i], 18).fill(bgColor);
        const val = row[h.key] ?? '';
        doc.fontSize(8).fillColor('#374151').text(String(val), x + 4, y + 4, {
          width: colWidths[i] - 8,
          height: 12,
          ellipsis: true,
        });
        x += colWidths[i];
      });
      y += 18;
    });

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#9ca3af').text(`Total rows: ${rows.length}`, doc.page.margins.left, y + 10);

    doc.end();
  });
}

// ─── Report-specific formatters ──────────────────────────────────────

export const REPORT_DEFINITIONS: Record<
  string,
  {
    title: string;
    headers: { key: string; label: string; width?: number }[];
  }
> = {
  'top-games': {
    title: 'Top Rated Games',
    headers: [
      { key: 'id', label: 'ID', width: 50 },
      { key: 'title', label: 'Title', width: 250 },
      { key: 'slug', label: 'Slug', width: 180 },
      { key: 'average_rating', label: 'Avg Rating', width: 80 },
      { key: 'total_reviews', label: 'Reviews', width: 70 },
    ],
  },
  'most-reviewed': {
    title: 'Most Reviewed Games',
    headers: [
      { key: 'id', label: 'ID', width: 50 },
      { key: 'title', label: 'Title', width: 250 },
      { key: 'slug', label: 'Slug', width: 180 },
      { key: 'average_rating', label: 'Avg Rating', width: 80 },
      { key: 'total_reviews', label: 'Reviews', width: 70 },
    ],
  },
  'active-users': {
    title: 'Most Active Users',
    headers: [
      { key: 'id', label: 'ID', width: 50 },
      { key: 'name', label: 'Name', width: 200 },
      { key: 'email', label: 'Email', width: 220 },
      { key: 'review_count', label: 'Reviews', width: 80 },
      { key: 'activity_count', label: 'Activities', width: 80 },
    ],
  },
  rereleases: {
    title: 'Re-release Requests Summary',
    headers: [
      { key: 'id', label: 'ID', width: 50 },
      { key: 'game_title', label: 'Game', width: 250 },
      { key: 'total_votes', label: 'Votes', width: 70 },
      { key: 'status', label: 'Status', width: 80 },
      { key: 'created_at', label: 'Created', width: 120 },
    ],
  },
  'registration-trend': {
    title: 'User Registration Trend (12 months)',
    headers: [
      { key: 'month', label: 'Month', width: 150 },
      { key: 'count', label: 'Registrations', width: 150 },
    ],
  },
  'review-trend': {
    title: 'Review Trend (12 months)',
    headers: [
      { key: 'month', label: 'Month', width: 150 },
      { key: 'count', label: 'Reviews', width: 120 },
      { key: 'avg_rating', label: 'Avg Rating', width: 120 },
    ],
  },
};

export const COLLECTION_HEADERS: { key: string; label: string; width?: number }[] = [
  { key: 'id', label: 'ID', width: 40 },
  { key: 'game_title', label: 'Game', width: 180 },
  { key: 'platform_name', label: 'Platform', width: 100 },
  { key: 'status', label: 'Status', width: 70 },
  { key: 'format', label: 'Format', width: 60 },
  { key: 'acquisition_date', label: 'Acquired', width: 80 },
  { key: 'price_paid', label: 'Price', width: 55 },
  { key: 'hours_played', label: 'Hours', width: 50 },
  { key: 'rating', label: 'Rating', width: 45 },
  { key: 'personal_notes', label: 'Notes', width: 100 },
];
