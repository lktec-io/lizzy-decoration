import apiClient from './apiClient';

function openPdfBlob(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Revoke after a delay long enough for the new tab to load the blob URL.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function printSingleLabel(productId, { branchId, size } = {}) {
  const { data } = await apiClient.get(`/products/${productId}/label`, {
    params: { branchId, size },
    responseType: 'blob',
  });
  openPdfBlob(data);
}

export async function printBulkLabels(productIds, { branchId, size } = {}) {
  const { data } = await apiClient.post(
    '/products/labels',
    { productIds, branchId, size },
    { responseType: 'blob' },
  );
  openPdfBlob(data);
}
