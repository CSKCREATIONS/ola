import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a DOM element (or element id) to a multi-page PDF using html2canvas + jsPDF.
 * @param {HTMLElement|string} elementOrSelector - DOM element or selector/id string.
 * @param {string} filename - output filename (e.g. 'report.pdf').
 * @param {object} options - optional settings: { imgWidth, marginTop }
 * @returns {Promise<void>} resolves when file is saved.
 */
export default async function exportElementToPdf(elementOrSelector, filename = 'export.pdf', options = {}) {
  const { imgWidth = 190, marginTop = 10 } = options;

  let input;
  if (typeof elementOrSelector === 'string') {
    input = document.getElementById(elementOrSelector) || document.querySelector(elementOrSelector);
  } else {
    input = elementOrSelector;
  }

  if (!input) throw new Error('Elemento no encontrado para exportar a PDF');

  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = marginTop;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + marginTop;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
