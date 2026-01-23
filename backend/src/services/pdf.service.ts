import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import Setting from '../models/Setting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoForPDF {
  id: number;
  title: string;
  resolutionLabel: string;
  durationSeconds: number;
  requestDate: Date;
  completionDate: Date;
  isTv: boolean;
  tvTitle?: string;
  versions: {
    id: number;
    resolutionLabel: string;
    durationSeconds: number;
    calculatedDuration: number;
  }[];
  calculatedDuration: number;
}

interface ProfessionalGroup {
  name: string;
  videos: VideoForPDF[];
  totalDuration: number;
}

interface ReportData {
  month: number;
  year: number;
  professionals: ProfessionalGroup[];
  totalUsed: number;
  limit: number;
  rollover: number;
  remaining: number;
}

class PDFService {
  private async getSettings(): Promise<Record<string, string>> {
    const settings = await Setting.findAll();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins > 0) {
      return `${mins}min ${secs}s`;
    }
    return `${secs}s`;
  }

  private getMonthName(month: number): string {
    const date = new Date(2024, month - 1, 1);
    return format(date, 'MMMM', { locale: ptBR });
  }

  async generateReportPDF(data: ReportData): Promise<Buffer> {
    const settings = await this.getSettings();

    const companyName = settings['company_name'] || 'Pix Filmes';
    const companyPhone = settings['company_phone'] || '';
    const companyAddress = settings['company_address'] || '';
    const companyCnpj = settings['company_cnpj'] || '';
    const logoPath = settings['company_logo_path'];

    let logoBase64 = '';
    if (logoPath) {
      // Convert relative path to absolute
      const absoluteLogoPath = logoPath.startsWith('/')
        ? path.join(process.cwd(), logoPath.substring(1))
        : logoPath;

      if (fs.existsSync(absoluteLogoPath)) {
        const logoBuffer = fs.readFileSync(absoluteLogoPath);
        const ext = path.extname(absoluteLogoPath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      }
    }

    const monthName = this.getMonthName(data.month);
    const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${monthName} ${data.year}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Titillium Web', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      font-size: 12px;
      line-height: 1.5;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4CAF50;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo {
      width: 80px;
      height: auto;
    }

    .company-name {
      font-size: 24px;
      font-weight: 900;
      color: #4CAF50;
    }

    .company-info {
      text-align: right;
      color: #525252;
      font-size: 11px;
    }

    .report-title {
      text-align: center;
      margin-bottom: 25px;
    }

    .report-title h1 {
      font-size: 20px;
      color: #1a1a1a;
      margin-bottom: 5px;
    }

    .report-title .date {
      color: #737373;
      font-size: 11px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-card.primary {
      background: #4CAF50;
      color: white;
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
    }

    .stat-card.primary .stat-label {
      color: rgba(255,255,255,0.9);
    }

    .videos-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }

    .videos-table th {
      background: #e5e5e5;
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .videos-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11px;
    }

    .videos-table tr:last-child td {
      border-bottom: none;
    }

    .video-title {
      font-weight: 600;
      color: #1a1a1a;
    }

    .video-tv {
      color: #4CAF50;
      font-size: 10px;
      display: block;
    }

    .versions-list {
      font-size: 10px;
      color: #737373;
      margin-top: 3px;
    }

    .duration-cell {
      text-align: right;
      font-weight: 600;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #a3a3a3;
      font-size: 10px;
    }

    @page {
      margin: 0;
      size: A4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : `<div class="company-name">${companyName}</div>`}
    </div>
    <div class="company-info">
      ${companyPhone ? `<div>${companyPhone}</div>` : ''}
      ${companyAddress ? `<div>${companyAddress}</div>` : ''}
      ${companyCnpj ? `<div>CNPJ: ${companyCnpj}</div>` : ''}
    </div>
  </div>

  <div class="report-title">
    <h1>Relatório de Vídeos - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${data.year}</h1>
    <div class="date">Gerado em ${reportDate}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card primary">
      <div class="stat-label">Utilizado</div>
      <div class="stat-value">${this.formatDuration(data.totalUsed)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Limite Base</div>
      <div class="stat-value">${this.formatDuration(data.limit - data.rollover)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Rollover</div>
      <div class="stat-value">+${this.formatDuration(data.rollover)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Disponível</div>
      <div class="stat-value">${this.formatDuration(data.remaining)}</div>
    </div>
  </div>

  <table class="videos-table">
    <thead>
      <tr>
        <th style="width: 25%">Título</th>
        <th style="width: 12%">Resolução</th>
        <th style="width: 12%">Profissional</th>
        <th style="width: 12%">Solicitado</th>
        <th style="width: 12%">Concluído</th>
        <th style="width: 27%; text-align: right">Duração</th>
      </tr>
    </thead>
    <tbody>
      ${data.professionals.flatMap((prof) =>
      prof.videos.map((video) => {
        const versionsTotal = video.versions.reduce((sum, v) => sum + v.calculatedDuration, 0);
        const totalDuration = video.calculatedDuration + versionsTotal;
        const versionsList = video.versions.length > 0 
          ? video.versions.map(v => v.resolutionLabel).join(', ')
          : '';
        return `
            <tr>
              <td>
                <span class="video-title">${video.title}</span>
                ${video.isTv && video.tvTitle ? `<span class="video-tv">TV: ${video.tvTitle}</span>` : ''}
                ${versionsList ? `<div style="font-size: 9px; color: #666; margin-top: 3px;">Versões: ${versionsList}</div>` : ''}
              </td>
              <td>${video.resolutionLabel}</td>
              <td>${prof.name}</td>
              <td>${format(new Date(video.requestDate), 'dd/MM/yyyy')}</td>
              <td>${format(new Date(video.completionDate), 'dd/MM/yyyy')}</td>
              <td class="duration-cell">
                ${this.formatDuration(totalDuration)}
                ${video.versions.length > 0 ? `<div class="versions-list" style="color: #4CAF50; margin-top: 2px;">(+ ${this.formatDuration(versionsTotal)} de ${video.versions.length} versã${video.versions.length === 1 ? 'o' : 'ões'})</div>` : ''}
              </td>
            </tr>
          `;
      })
    ).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo Sistema de Relatórios ${companyName}</p>
  </div>
</body>
</html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateDateRangeReportPDF(data: {
    startDate: Date;
    endDate: Date;
    dateField: string;
    professionals: ProfessionalGroup[];
    totalUsed: number;
    totalVideos: number;
    limit?: number;
    rollover?: number;
    remaining?: number;
  }): Promise<Buffer> {
    const settings = await this.getSettings();

    const companyName = settings['company_name'] || 'Pix Filmes';
    const companyPhone = settings['company_phone'] || '';
    const companyAddress = settings['company_address'] || '';
    const companyCnpj = settings['company_cnpj'] || '';
    const logoPath = settings['company_logo_path'];

    let logoBase64 = '';
    if (logoPath) {
      // Convert relative path to absolute
      const absoluteLogoPath = logoPath.startsWith('/')
        ? path.join(process.cwd(), logoPath.substring(1))
        : logoPath;

      if (fs.existsSync(absoluteLogoPath)) {
        const logoBuffer = fs.readFileSync(absoluteLogoPath);
        const ext = path.extname(absoluteLogoPath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      }
    }

    const formatDateBR = (d: Date) => format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });
    const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const dateFieldLabel = data.dateField === 'completionDate' ? 'Data de Conclusão' : 'Data de Solicitação';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${formatDateBR(data.startDate)} a ${formatDateBR(data.endDate)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Titillium Web', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      font-size: 12px;
      line-height: 1.5;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4CAF50;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo {
      width: 80px;
      height: auto;
    }

    .company-name {
      font-size: 24px;
      font-weight: 900;
      color: #4CAF50;
    }

    .company-info {
      text-align: right;
      color: #525252;
      font-size: 11px;
    }

    .report-title {
      text-align: center;
      margin-bottom: 25px;
    }

    .report-title h1 {
      font-size: 20px;
      color: #1a1a1a;
      margin-bottom: 5px;
    }

    .report-title .subtitle {
      color: #4CAF50;
      font-size: 13px;
      margin-bottom: 5px;
    }

    .report-title .date {
      color: #737373;
      font-size: 11px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-card.primary {
      background: #4CAF50;
      color: white;
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
    }

    .stat-card.primary .stat-label {
      color: rgba(255,255,255,0.9);
    }

    .videos-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }

    .videos-table th {
      background: #e5e5e5;
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .videos-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11px;
    }

    .videos-table tr:last-child td {
      border-bottom: none;
    }

    .video-title {
      font-weight: 600;
      color: #1a1a1a;
    }

    .video-tv {
      color: #4CAF50;
      font-size: 10px;
      display: block;
    }

    .versions-list {
      font-size: 10px;
      color: #737373;
      margin-top: 3px;
    }

    .duration-cell {
      text-align: right;
      font-weight: 600;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #a3a3a3;
      font-size: 10px;
    }

    @page {
      margin: 0;
      size: A4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : `<div class="company-name">${companyName}</div>`}
    </div>
    <div class="company-info">
      ${companyPhone ? `<div>${companyPhone}</div>` : ''}
      ${companyAddress ? `<div>${companyAddress}</div>` : ''}
      ${companyCnpj ? `<div>CNPJ: ${companyCnpj}</div>` : ''}
    </div>
  </div>

  <div class="report-title">
    <h1>Relatório de Vídeos</h1>
    <div class="subtitle">${formatDateBR(data.startDate)} a ${formatDateBR(data.endDate)}</div>
    <div class="date">Filtrado por: ${dateFieldLabel} | Gerado em ${reportDate}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card primary">
      <div class="stat-label">Total Utilizado</div>
      <div class="stat-value">${this.formatDuration(data.totalUsed)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Limite</div>
      <div class="stat-value">${this.formatDuration(data.limit || 0)}</div>
      ${data.rollover && data.rollover > 0 ? `<div style="font-size: 9px; margin-top: 3px; opacity: 0.8;">+${this.formatDuration(data.rollover)} rollover</div>` : ''}
    </div>
    <div class="stat-card">
      <div class="stat-label">Restante</div>
      <div class="stat-value">${this.formatDuration(data.remaining || 0)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total de Vídeos</div>
      <div class="stat-value">${data.totalVideos}</div>
    </div>
  </div>

  <table class="videos-table">
    <thead>
      <tr>
        <th style="width: 25%">Título</th>
        <th style="width: 12%">Resolução</th>
        <th style="width: 12%">Profissional</th>
        <th style="width: 12%">Solicitado</th>
        <th style="width: 12%">Concluído</th>
        <th style="width: 27%; text-align: right">Duração</th>
      </tr>
    </thead>
    <tbody>
      ${data.professionals.flatMap((prof) =>
      prof.videos.map((video) => {
        const versions = video.versions || [];
        const versionsTotal = versions.reduce((sum: number, v: any) => sum + (v.calculatedDuration || 0), 0);
        const totalDuration = (video.calculatedDuration || 0) + versionsTotal;
        const versionsList = versions.length > 0 
          ? versions.map((v: any) => v.resolutionLabel || '').filter(Boolean).join(', ')
          : '';
        return `
            <tr>
              <td>
                <span class="video-title">${video.title || ''}</span>
                ${video.isTv && video.tvTitle ? `<span class="video-tv">TV: ${video.tvTitle}</span>` : ''}
                ${versionsList ? `<div style="font-size: 9px; color: #666; margin-top: 3px;">Versões: ${versionsList}</div>` : ''}
              </td>
              <td>${video.resolutionLabel || ''}</td>
              <td>${prof.name || ''}</td>
              <td>${format(new Date(video.requestDate), 'dd/MM/yyyy')}</td>
              <td>${format(new Date(video.completionDate), 'dd/MM/yyyy')}</td>
              <td class="duration-cell">
                ${this.formatDuration(totalDuration)}
                ${versions.length > 0 ? `<div class="versions-list" style="color: #4CAF50; margin-top: 2px;">(+ ${this.formatDuration(versionsTotal)} de ${versions.length} versã${versions.length === 1 ? 'o' : 'ões'})</div>` : ''}
              </td>
            </tr>
          `;
      })
    ).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo Sistema de Relatórios ${companyName}</p>
  </div>
</body>
</html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

export default new PDFService();
