// ForgeERP Document Engine 1.1
// Teklif PDF + Sevk İrsaliyesi

function money(value) {
  return `${Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 0,
  })} ₺`;
}

function safe(value) {
  return value || "—";
}

function today() {
  return new Date().toLocaleDateString("tr-TR");
}

function openDocument(html) {
  const win = window.open("", "_blank");

  if (!win) {
    alert("Pop-up engellendi. Tarayıcıdan izin ver.");
    return;
  }

  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

function baseStyle() {
  return `
    <style>
      * { box-sizing: border-box; }

      body {
        margin: 0;
        padding: 24px;
        font-family: Arial, sans-serif;
        color: #0f172a;
        background: white;
      }

      .page {
        max-width: 794px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 16px;
        margin-bottom: 18px;
      }

      .brand h1 {
        margin: 0;
        font-size: 24px;
        letter-spacing: -0.04em;
      }

      .brand p {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 12px;
      }

      .doc-title {
        text-align: right;
      }

      .doc-title h2 {
        margin: 0;
        font-size: 22px;
      }

      .doc-title p {
        margin: 5px 0 0;
        color: #64748b;
        font-size: 12px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }

      .card {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
      }

      .card h3 {
        margin: 0 0 10px;
        font-size: 12px;
        text-transform: uppercase;
        color: #334155;
        letter-spacing: 0.04em;
      }

      .row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 6px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }

      .row span {
        color: #64748b;
      }

      .row b {
        text-align: right;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th {
        background: #f8fafc;
        color: #64748b;
        text-align: left;
        padding: 9px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 11px;
        text-transform: uppercase;
      }

      td {
        padding: 9px;
        border-bottom: 1px solid #e2e8f0;
      }

      .summary {
        width: 300px;
        margin-left: auto;
        margin-top: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
      }

      .summary .grand {
        margin-top: 8px;
        padding-top: 10px;
        border-top: 2px solid #0f172a;
        font-size: 16px;
      }

      .note {
        min-height: 70px;
        font-size: 12px;
        color: #475569;
      }

      .footer {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .terms {
        font-size: 11px;
        color: #64748b;
        line-height: 1.5;
      }

      .sign {
        height: 80px;
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        padding: 12px;
        color: #64748b;
        font-size: 12px;
      }

      @media print {
        body { padding: 16px; }
      }
    </style>
  `;
}

export function printQuoteDocument(quote) {
  const operations = quote.operations || [];
  const totals = quote.totals || {};

  const html = `
    <html>
      <head>
        <title>${safe(quote.id)} Teklif</title>
        ${baseStyle()}
      </head>

      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <h1>EFE CNC KALIP</h1>
              <p>ForgeERP by EFE CNC</p>
              <p>Kalıp • CNC İşleme • Tersine Mühendislik • Kalite Kontrol</p>
              <p>www.efecnckalip.com</p>
            </div>

            <div class="doc-title">
              <h2>TEKLİF FORMU</h2>
              <p><b>${safe(quote.id)}</b></p>
              <p>${quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("tr-TR") : today()}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>Müşteri Bilgileri</h3>
              <div class="row"><span>Firma</span><b>${safe(quote.customer)}</b></div>
              <div class="row"><span>Yetkili</span><b>—</b></div>
              <div class="row"><span>Telefon</span><b>—</b></div>
              <div class="row"><span>E-posta</span><b>—</b></div>
            </div>

            <div class="card">
              <h3>Parça / İş Bilgileri</h3>
              <div class="row"><span>İş / Parça</span><b>${safe(quote.title)}</b></div>
              <div class="row"><span>Teklif Türü</span><b>${safe(quote.quoteType)}</b></div>
              <div class="row"><span>Malzeme</span><b>${safe(quote.material)}</b></div>
              <div class="row"><span>Malzeme Tipi</span><b>${safe(quote.materialType)}</b></div>
              <div class="row"><span>Ağırlık</span><b>${Number(quote.calculatedWeight || totals.materialWeight || 0).toFixed(2)} kg</b></div>
            </div>
          </div>

          <div class="card">
            <h3>Operasyon Listesi</h3>
            <table>
              <thead>
                <tr>
                  <th>Operasyon</th>
                  <th>Saat</th>
                  <th>Saatlik</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${
                  operations.length
                    ? operations
                        .map(
                          (op) => `
                            <tr>
                              <td>${safe(op.name)}</td>
                              <td>${safe(op.hours)}</td>
                              <td>${money(op.hourlyRate)}</td>
                              <td>${money(Number(op.hours || 0) * Number(op.hourlyRate || 0))}</td>
                            </tr>
                          `
                        )
                        .join("")
                    : `<tr><td colspan="4">Operasyon bulunmuyor.</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <div class="grid" style="margin-top:12px;">
            <div class="card note">
              <h3>Notlar</h3>
              <p>${safe(quote.note)}</p>
            </div>

            <div class="summary">
              <h3>Maliyet Özeti</h3>
              <div class="row"><span>İşçilik</span><b>${money(totals.operationTotal)}</b></div>
              <div class="row"><span>Malzeme</span><b>${money(totals.materialTotal)}</b></div>
              <div class="row"><span>Ek Maliyet</span><b>${money(totals.extraCost)}</b></div>
              <div class="row"><span>Kâr</span><b>${money(totals.profit)}</b></div>
              <div class="row grand"><span>Genel Toplam</span><b>${money(totals.grandTotal)}</b></div>
            </div>
          </div>

          <div class="footer">
            <div class="terms">
              <b>Teklif Şartları</b><br/>
              Bu teklif verilen teknik bilgiler doğrultusunda hazırlanmıştır. Ölçü, malzeme, revizyon ve ek operasyon değişikliklerinde teklif yeniden değerlendirilir. Teklif geçerlilik süresi 30 gündür.
            </div>

            <div class="sign">
              Kaşe / İmza
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  openDocument(html);
}

export function printDeliveryNoteDocument(job) {
  const html = `
    <html>
      <head>
        <title>${safe(job.jobNo || job.id)} Sevk Formu</title>
        ${baseStyle()}
      </head>

      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <h1>EFE CNC KALIP</h1>
              <p>ForgeERP by EFE CNC</p>
              <p>Kalıp • CNC İşleme • Tersine Mühendislik • Kalite Kontrol</p>
              <p>www.efecnckalip.com</p>
            </div>

            <div class="doc-title">
              <h2>SEVK FORMU</h2>
              <p><b>${safe(job.jobNo || job.id)}</b></p>
              <p>${today()}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>Alıcı Bilgileri</h3>
              <div class="row"><span>Firma</span><b>${safe(job.customer)}</b></div>
              <div class="row"><span>Yetkili</span><b>—</b></div>
              <div class="row"><span>Telefon</span><b>—</b></div>
              <div class="row"><span>Adres</span><b>—</b></div>
            </div>

            <div class="card">
              <h3>İş Bilgileri</h3>
              <div class="row"><span>İş No</span><b>${safe(job.jobNo || job.id)}</b></div>
              <div class="row"><span>Teklif No</span><b>${safe(job.quoteNo)}</b></div>
              <div class="row"><span>İş / Parça</span><b>${safe(job.title)}</b></div>
              <div class="row"><span>Malzeme</span><b>${safe(job.material)}</b></div>
            </div>
          </div>

          <div class="card">
            <h3>Sevk Edilen Ürünler</h3>
            <table>
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Ürün / Parça</th>
                  <th>Malzeme</th>
                  <th>Adet</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>${safe(job.title)}</td>
                  <td>${safe(job.material)}</td>
                  <td>1</td>
                  <td>${safe(job.materialType)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid" style="margin-top:12px;">
            <div class="card note">
              <h3>Sevk Notu</h3>
              <p>Ürün / parça teslim edilmiştir.</p>
            </div>

            <div class="card">
              <h3>Teslim Bilgileri</h3>
              <div class="row"><span>Teslim Eden</span><b>EFE CNC KALIP</b></div>
              <div class="row"><span>Teslim Alan</span><b>—</b></div>
              <div class="row"><span>Araç / Plaka</span><b>—</b></div>
              <div class="row"><span>Tarih</span><b>${today()}</b></div>
            </div>
          </div>

          <div class="footer">
            <div class="sign">Teslim Eden<br/><br/>Kaşe / İmza</div>
            <div class="sign">Teslim Alan<br/><br/>Kaşe / İmza</div>
          </div>
        </div>
      </body>
    </html>
  `;

  openDocument(html);
}