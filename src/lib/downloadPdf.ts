export async function downloadAgreementPdf(htmlContent: string, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default

  // Create a wrapper with print-friendly styling
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `
    <div style="padding: 40px; font-family: Georgia, 'Times New Roman', serif; color: #111; max-width: 700px; margin: 0 auto; font-size: 13px; line-height: 1.7;">
      ${htmlContent}
    </div>
  `

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt: any = {
    margin: [10, 15, 10, 15],
    filename: filename.replace(/\.html$/, '.pdf'),
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  await html2pdf().set(opt).from(wrapper).save()
}
