// ForgeERP Document Engine 2.0
// Quote + Premium Delivery Note

const COMPANY_STORAGE_KEY = "forge_company_profile";

const DEFAULT_COMPANY = {
  name: "Firma Ünvanı",
  subtitle: "ForgeERP by EFE CNC",
  slogan: "Kalıp • CNC İşleme • Tersine Mühendislik • Kalite Kontrol",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxOffice: "",
  taxNumber: "",
  mersisNo: "",
  iban: "",
  logoUrl: "",
  footer: "Bu belge ForgeERP Document Engine 2.0 ile oluşturulmuştur.",
};

function getCompanyProfile() {
  try {
    const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
    return saved ? { ...DEFAULT_COMPANY, ...JSON.parse(saved) } : DEFAULT_COMPANY;
  } catch {
    return DEFAULT_COMPANY;
  }
}

function safe(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 0,
  })} ₺`;
}

function today() {
  return new Date().toLocaleDateString("tr-TR");
}

function docNo(prefix, value) {
  return value || `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
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
  }, 350);
}

function baseStyle() {
  return `
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 24px;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
        background: #f3f4f6;
      }

      .page {
        width: 794px;
        min-height: 1123px;
        margin: 0 auto;
        background: white;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 25px 80px rgba(15, 23, 42, 0.14);
      }

      .top {
        background: #0f172a;
        color: white;
        padding: 28px;
        display: grid;
        grid-template-columns: 1.3fr 0.8fr;
        gap: 24px;
      }

      .brand {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .logo {
        width: 86px;
        height: 86px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        color: rgba(255,255,255,0.45);
        font-size: 12px;
        font-weight: 800;
      }

      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 8px;
      }

      .brand h1 {
        margin: 0;
        font-size: 24px;
        letter-spacing: -0.04em;
      }

      .brand p {
        margin: 5px 0 0;
        color: rgba(255,255,255,0.72);
        font-size: 12px;
        line-height: 1.35;
      }

      .doc-title {
        text-align: right;
      }

      .doc-title .engine {
        font-size: 10px;
        color: rgba(255,255,255,0.45);
        letter-spacing: 0.14em;
        font-weight: 800;
      }

      .doc-title h2 {
        margin: 7px 0 10px;
        font-size: 30px;
        letter-spacing: -0.06em;
      }

      .doc-title p {
        margin: 5px 0;
        font-size: 12px;
        color: rgba(255,255,255,0.75);
      }

      .content {
        padding: 28px;
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }

      .card {
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 16px;
        background: #fff;
      }

      .soft {
        background: #f9fafb;
      }

      .card h3 {
        margin: 0 0 12px;
        font-size: 11px;
        text-transform: uppercase;
        color: #6b7280;
        letter-spacing: 0.08em;
      }

      .row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 7px 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }

      .row:last-child {
        border-bottom: 0;
      }

      .row span {
        color: #6b7280;
      }

      .row b {
        text-align: right;
        color: #111827;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        font-size: 12px;
        overflow: hidden;
        border-radius: 16px;
      }

      th {
        background: #0f172a;
        color: white;
        text-align: left;
        padding: 11px 10px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      td {
        padding: 11px 10px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }

      tbody tr:nth-child(even) {
        background: #f9fafb;
      }

      .summary {
        width: 320px;
        margin-left: auto;
        margin-top: 14px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 16px;
        background: #f9fafb;
      }

      .summary .grand {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 2px solid #0f172a;
        font-size: 15px;
      }

      .note {
        min-height: 78px;
        line-height: 1.5;
        color: #475569;
        font-size: 12px;
      }

      .signatures {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 44px;
      }

      .sign {
        height: 92px;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        padding: 14px;
        color: #64748b;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .footer {
        margin-top: 24px;
        padding-top: 14px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        color: #6b7280;
        font-size: 10px;
        line-height: 1.5;
      }

      .badge {
        display: inline-block;
        border-radius: 999px;
        background: #f1f5f9;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 800;
        color: #334155;
      }

      @media print {
        body {
          padding: 0;
          background: white;
        }

        .page {
          width: 100%;
          min-height: auto;
          box-shadow: none;
          border-radius: 0;
        }
      }
    </style>
  `;
}

function header(company, title, number, date) {
  return `
    <div class="top">
      <div class="brand">
        <div class="logo">
          ${
            company.logoUrl
              ? `<img src="${company.logoUrl}" alt="${safe(company.name)}" />`
              : `LOGO`
          }
        </div>

        <div>
          <h1>${safe(company.name)}</h1>
          <p>${safe(company.subtitle)}</p>
          <p>${safe(company.slogan)}</p>
          <p>${[company.phone, company.email, company.website].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      <div class="doc-title">
        <div class="engine">DOCUMENT ENGINE 2.0</div>
        <h2>${title}</h2>
        <p><b>No:</b> ${safe(number)}</p>
        <p><b>Tarih:</b> ${safe(date)}</p>
      </div>
    </div>
  `;
}

function footer(company) {
  return `
    <div class="footer">
      <div>
        <b>${safe(company.name)}</b><br/>
        ${safe(company.address)}<br/>
        Vergi Dairesi: ${safe(company.taxOffice)} · Vergi No: ${safe(company.taxNumber)}
      </div>

      <div style="text-align:right;">
        ${safe(company.footer)}<br/>
        ${company.mersisNo ? `MERSİS: ${company.mersisNo}<br/>` : ""}
        ${company.iban ? `IBAN: ${company.iban}` : ""}
      </div>
    </div>
  `;
}

export function printQuoteDocument(quote) {
  const company = getCompanyProfile();
  const operations = quote.operations || [];
  const totals = quote.totals || {};
  const quoteNo = safe(quote.id || quote.quoteNo);

  const html = `
    <html>
      <head>
        <title>${quoteNo} Teklif</title>
        ${baseStyle()}
      </head>

      <body>
        <div class="page">
          ${header(
            company,
            "TEKLİF FORMU",
            quoteNo,
            quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("tr-TR") : today()
          )}

          <div class="content">
            <div class="grid-2">
              <div class="card">
                <h3>Müşteri Bilgileri</h3>
                <div class="row"><span>Firma</span><b>${safe(quote.customer)}</b></div>
                <div class="row"><span>Yetkili</span><b>${safe(quote.contactName)}</b></div>
                <div class="row"><span>Telefon</span><b>${safe(quote.phone)}</b></div>
                <div class="row"><span>E-posta</span><b>${safe(quote.email)}</b></div>
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

            <div class="card" style="margin-top:14px;">
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

            <div class="grid-2" style="margin-top:14px;">
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

            <div class="grid-2" style="margin-top:18px;">
              <div class="card note">
                <h3>Teklif Şartları</h3>
                <p>
                  Bu teklif verilen teknik bilgiler doğrultusunda hazırlanmıştır.
                  Ölçü, malzeme, revizyon ve ek operasyon değişikliklerinde teklif yeniden değerlendirilir.
                  Teklif geçerlilik süresi 30 gündür.
                </p>
              </div>

              <div class="sign">
                <b>Kaşe / İmza</b>
                <span>Yetkili onayı</span>
              </div>
            </div>

            ${footer(company)}
          </div>
        </div>
      </body>
    </html>
  `;

  openDocument(html);
}

export function printDeliveryNoteDocument(job) {
  const company = getCompanyProfile();
  const deliveryNo = docNo("SVK", job.deliveryNo || job.jobNo || job.id);
  const rows = Array.isArray(job.items) && job.items.length
    ? job.items
    : [
        {
          name: job.title,
          material: job.material,
          quantity: 1,
          unit: "Adet",
          note: job.materialType || job.description,
        },
      ];

  const html = `
    <html>
      <head>
        <title>${deliveryNo} Sevk Formu</title>
        ${baseStyle()}
      </head>

      <body>
        <div class="page">
          ${header(company, "SEVK FORMU", deliveryNo, today())}

          <div class="content">
            <div class="grid-3">
              <div class="card soft">
                <h3>Müşteri</h3>
                <div class="row"><span>Firma</span><b>${safe(job.customer)}</b></div>
                <div class="row"><span>Yetkili</span><b>${safe(job.contactName)}</b></div>
                <div class="row"><span>Telefon</span><b>${safe(job.customerPhone || job.phone)}</b></div>
              </div>

              <div class="card soft">
                <h3>İş Bağlantısı</h3>
                <div class="row"><span>İş No</span><b>${safe(job.jobNo || job.id)}</b></div>
                <div class="row"><span>Teklif No</span><b>${safe(job.quoteNo)}</b></div>
                <div class="row"><span>Durum</span><b>${safe(job.status)}</b></div>
              </div>

              <div class="card soft">
                <h3>Sevk Bilgisi</h3>
                <div class="row"><span>Tip</span><b>${safe(job.deliveryType || "Standart Sevk")}</b></div>
                <div class="row"><span>Plaka</span><b>${safe(job.vehiclePlate)}</b></div>
                <div class="row"><span>Şoför</span><b>${safe(job.driverName)}</b></div>
              </div>
            </div>

            <div class="grid-2" style="margin-top:14px;">
              <div class="card">
                <h3>Alıcı Adresi</h3>
                <div class="note">${safe(job.customerAddress || job.address)}</div>
              </div>

              <div class="card">
                <h3>Teslim Bilgileri</h3>
                <div class="row"><span>Teslim Eden</span><b>${safe(company.name)}</b></div>
                <div class="row"><span>Teslim Alan</span><b>${safe(job.receiverName)}</b></div>
                <div class="row"><span>Tarih</span><b>${today()}</b></div>
              </div>
            </div>

            <div class="card" style="margin-top:14px;">
              <h3>Sevk Edilen Ürünler</h3>
              <table>
                <thead>
                  <tr>
                    <th style="width:45px;">#</th>
                    <th>Ürün / Parça</th>
                    <th>Malzeme</th>
                    <th style="width:85px;">Miktar</th>
                    <th style="width:80px;">Birim</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (item, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td><b>${safe(item.name || item.title || job.title)}</b></td>
                          <td>${safe(item.material || job.material)}</td>
                          <td>${safe(item.quantity || 1)}</td>
                          <td>${safe(item.unit || "Adet")}</td>
                          <td>${safe(item.note || job.materialType || job.description)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="grid-2" style="margin-top:14px;">
              <div class="card note">
                <h3>Sevk Notu</h3>
                <p>${safe(job.deliveryNote || job.description || "Ürün / parça teslim edilmiştir.")}</p>
              </div>

              <div class="card">
                <h3>Kontrol</h3>
                <div class="row"><span>Malzeme Tipi</span><b>${safe(job.materialType)}</b></div>
                <div class="row"><span>Makine</span><b>${safe(job.machineName || job.machine)}</b></div>
                <div class="row"><span>Operatör</span><b>${safe(job.operator)}</b></div>
              </div>
            </div>

            <div class="signatures">
              <div class="sign">
                <b>Teslim Eden</b>
                <span>Kaşe / İmza</span>
              </div>
              <div class="sign">
                <b>Teslim Alan</b>
                <span>Ad Soyad / İmza</span>
              </div>
              <div class="sign">
                <b>Firma Onayı</b>
                <span>Kaşe / İmza</span>
              </div>
            </div>

            ${footer(company)}
          </div>
        </div>
      </body>
    </html>
  `;

  openDocument(html);
}