import PDFDocument from 'pdfkit';
import { ApiError } from '../utils/apiError.js';
import * as productRepository from '../repositories/product.repository.js';
import * as qrCodeService from './qrCode.service.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { logger } from '../config/logger.js';

const MM_TO_PT = 2.83465;
const mm = (value) => value * MM_TO_PT;

// Multiple paper/sticker sizes, per spec. Dimensions in mm.
const LABEL_SIZES = {
  small: { width: 40, height: 25 },
  medium: { width: 60, height: 35 },
  large: { width: 90, height: 50 },
};

const PAGE_WIDTH = mm(210); // A4
const PAGE_HEIGHT = mm(297);
const PAGE_MARGIN = mm(8);
const LABEL_GAP = mm(3);

export async function buildLabelsPdf(productIds, branchName, sizeKey) {
  if (!productIds?.length) throw new ApiError(400, 'Select at least one product');

  const size = LABEL_SIZES[sizeKey] || LABEL_SIZES.medium;
  const labelWidth = mm(size.width);
  const labelHeight = mm(size.height);

  const columns = Math.max(1, Math.floor((PAGE_WIDTH - 2 * PAGE_MARGIN + LABEL_GAP) / (labelWidth + LABEL_GAP)));
  const rows = Math.max(1, Math.floor((PAGE_HEIGHT - 2 * PAGE_MARGIN + LABEL_GAP) / (labelHeight + LABEL_GAP)));
  const perPage = columns * rows;

  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, autoFirstPage: false });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  for (let i = 0; i < productIds.length; i += 1) {
    const product = await productRepository.findById(productIds[i]);
    if (!product) continue;

    const qrImageBuffer = await qrCodeService.getQrImageBuffer(product.id);

    const positionInPage = i % perPage;
    if (positionInPage === 0) doc.addPage();

    const col = positionInPage % columns;
    const row = Math.floor(positionInPage / columns);
    const x = PAGE_MARGIN + col * (labelWidth + LABEL_GAP);
    const y = PAGE_MARGIN + row * (labelHeight + LABEL_GAP);

    doc.rect(x, y, labelWidth, labelHeight).stroke('#E5E7EB');

    const qrSize = labelHeight - mm(4);
    doc.image(qrImageBuffer, x + mm(2), y + mm(2), { width: qrSize, height: qrSize });

    const textX = x + qrSize + mm(4);
    const textWidth = labelWidth - qrSize - mm(6);
    doc
      .fontSize(8)
      .fillColor('#111111')
      .text(product.name, textX, y + mm(2), { width: textWidth, height: labelHeight - mm(4), ellipsis: true })
      .fontSize(7)
      .fillColor('#6B7280')
      .text(product.code, textX, y + mm(2) + 11, { width: textWidth })
      .fontSize(9)
      .fillColor('#111111')
      .text(formatCurrency(product.selling_price), textX, y + mm(2) + 22, { width: textWidth });

    if (branchName) {
      doc.fontSize(6).fillColor('#6B7280').text(branchName, textX, y + labelHeight - mm(6), { width: textWidth });
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      logger.info('PDF generated', { productCount: productIds.length });
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}
