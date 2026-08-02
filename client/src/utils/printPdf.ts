/**
 * Prints a PDF blob.
 * In Electron, delegates to the main process so webContents.print() is used.
 */
export async function printPdfBlob(
  blob: Blob,
  options: { silent?: boolean; documentName?: string } = {},
): Promise<void> {
  if (window.electronAPI?.isElectron && window.electronAPI.printPdf) {
    const result = await window.electronAPI.printPdf(
      await blob.arrayBuffer(),
      options,
    );
    if (!result.success) {
      throw new Error(result.error || "Print failed");
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Unable to open print preview");
  }

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
