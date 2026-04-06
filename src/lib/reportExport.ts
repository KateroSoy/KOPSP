type CsvExportConfig = {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

type PrintableReportConfig = {
  title: string;
  subtitle?: string;
  summary?: Array<{
    label: string;
    value: string;
  }>;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  helperText?: string;
};

const escapeCell = (value: string | number | null | undefined) => {
  const text = `${value ?? ""}`.replace(/"/g, '""');
  return `"${text}"`;
};

export const exportRowsToCsv = ({ filename, headers, rows }: CsvExportConfig) => {
  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const renderPrintableHtml = ({
  title,
  subtitle,
  summary = [],
  headers,
  rows,
  helperText,
}: PrintableReportConfig) => `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #0f172a;
        margin: 24px;
      }
      h1 {
        font-size: 24px;
        margin: 0 0 6px;
      }
      p {
        margin: 0;
        color: #475569;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin: 24px 0;
      }
      .card {
        border: 1px solid #dbeafe;
        border-radius: 16px;
        padding: 14px;
        background: #f8fafc;
      }
      .card-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 6px;
      }
      .card-value {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid #e2e8f0;
        padding: 10px 12px;
        font-size: 12px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #ecfdf5;
        color: #065f46;
      }
      .helper {
        margin-top: 12px;
        font-size: 12px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ""}
    ${
      summary.length > 0
        ? `<div class="summary">${summary
            .map(
              (item) => `
                <div class="card">
                  <div class="card-label">${item.label}</div>
                  <div class="card-value">${item.value}</div>
                </div>`,
            )
            .join("")}</div>`
        : ""
    }
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
    ${
      helperText
        ? `<p class="helper">${helperText}</p>`
        : '<p class="helper">Gunakan opsi "Simpan sebagai PDF" pada dialog cetak jika ingin menyimpan file PDF.</p>'
    }
  </body>
</html>`;

export const openPrintReport = (config: PrintableReportConfig) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=720");

  if (!printWindow) {
    throw new Error("Jendela cetak diblokir oleh browser.");
  }

  printWindow.document.open();
  printWindow.document.write(renderPrintableHtml(config));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
