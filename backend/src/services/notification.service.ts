import nodemailer from 'nodemailer';
import Setting from '../models/Setting';
import NotificationRecipient from '../models/NotificationRecipient';

interface NotificationPayload {
  subject: string;
  message: string;
  type: 'new_video' | 'report_generated' | 'limit_reached' | 'limit_warning';
}

class NotificationService {
  private async getSettings(): Promise<Record<string, string>> {
    const settings = await Setting.findAll();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }

  private async getEmailTransporter() {
    const settings = await this.getSettings();

    const host = settings['smtp_host'];
    const port = parseInt(settings['smtp_port'] || '587');
    const user = settings['smtp_user'];
    const pass = settings['smtp_password'];

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  private async sendEmail(to: string[], payload: NotificationPayload): Promise<boolean> {
    try {
      const transporter = await this.getEmailTransporter();
      if (!transporter) {
        console.log('Email not configured, skipping...');
        return false;
      }

      const settings = await this.getSettings();
      const fromName = settings['company_name'] || 'Pix Filmes';
      const fromEmail = settings['smtp_user'];

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: to.join(', '),
        subject: payload.subject,
        html: this.getEmailTemplate(payload),
      });

      console.log(`Email sent to ${to.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private getEmailTemplate(payload: NotificationPayload): string {
    const colors = {
      primary: '#4CAF50',
      text: '#1a1a1a',
      gray: '#737373',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: ${colors.primary}; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: ${colors.text}; margin-top: 0; }
    .content p { color: ${colors.gray}; line-height: 1.6; }
    .footer { padding: 20px; text-align: center; background: #f5f5f5; color: ${colors.gray}; font-size: 12px; }
    .button { display: inline-block; background: ${colors.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pix Filmes</h1>
    </div>
    <div class="content">
      <h2>${payload.subject}</h2>
      <p>${payload.message.replace(/\n/g, '<br>')}</p>
    </div>
    <div class="footer">
      <p>Sistema de Relatórios de Vídeos - Pix Filmes</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private async sendWhatsApp(phones: string[], payload: NotificationPayload): Promise<boolean> {
    try {
      const settings = await this.getSettings();

      const apiUrl = settings['evolution_api_url'];
      const apiToken = settings['evolution_api_token'];
      const instanceName = settings['evolution_instance_name'] || 'pixfilmes';

      if (!apiUrl || !apiToken) {
        console.log('WhatsApp not configured, skipping...');
        return false;
      }

      const message = `*${payload.subject}*\n\n${payload.message}`;

      for (const phone of phones) {
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

        try {
          const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiToken,
            },
            body: JSON.stringify({
              number: phoneWithCountry,
              text: message,
            }),
          });

          if (!response.ok) {
            console.error(`WhatsApp send failed for ${phone}:`, await response.text());
          }
        } catch (err) {
          console.error(`WhatsApp send error for ${phone}:`, err);
        }
      }

      console.log(`WhatsApp messages sent to ${phones.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return false;
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const recipients = await NotificationRecipient.findAll({
      where: { active: true },
    });

    const emails = recipients.filter((r) => r.type === 'email').map((r) => r.value);
    const phones = recipients.filter((r) => r.type === 'whatsapp').map((r) => r.value);

    const promises: Promise<boolean>[] = [];

    if (emails.length > 0) {
      promises.push(this.sendEmail(emails, payload));
    }

    if (phones.length > 0) {
      promises.push(this.sendWhatsApp(phones, payload));
    }

    await Promise.all(promises);
  }

  async notifyNewVideo(videoTitle: string, professionalName: string): Promise<void> {
    await this.notify({
      subject: 'Novo Vídeo Publicado',
      message: `Um novo vídeo foi publicado no sistema:\n\nTítulo: ${videoTitle}\nProfissional: ${professionalName}`,
      type: 'new_video',
    });
  }

  async notifyReportGenerated(month: number, year: number): Promise<void> {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    await this.notify({
      subject: 'Relatório Gerado',
      message: `O relatório de ${monthNames[month - 1]} de ${year} foi gerado e está disponível para download no sistema.`,
      type: 'report_generated',
    });
  }

  async notifyLimitReached(month: number, year: number, usedSeconds: number, limitSeconds: number): Promise<void> {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const formatDuration = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return mins > 0 ? `${mins}min ${s}s` : `${s}s`;
    };

    await this.notify({
      subject: 'Limite Mensal Atingido',
      message: `O limite mensal de vídeos para ${monthNames[month - 1]} de ${year} foi atingido!\n\nUtilizado: ${formatDuration(usedSeconds)}\nLimite: ${formatDuration(limitSeconds)}`,
      type: 'limit_reached',
    });
  }

  async notifyLimitWarning(month: number, year: number, usedSeconds: number, limitSeconds: number, percentage: number): Promise<void> {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const formatDuration = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return mins > 0 ? `${mins}min ${s}s` : `${s}s`;
    };

    await this.notify({
      subject: `Aviso: ${percentage}% do Limite Mensal Utilizado`,
      message: `Atenção! ${percentage}% do limite mensal de vídeos para ${monthNames[month - 1]} de ${year} foi utilizado.\n\nUtilizado: ${formatDuration(usedSeconds)}\nLimite: ${formatDuration(limitSeconds)}\nRestante: ${formatDuration(limitSeconds - usedSeconds)}`,
      type: 'limit_warning',
    });
  }

  async testNotification(type: 'email' | 'whatsapp', recipient: string): Promise<boolean> {
    const payload: NotificationPayload = {
      subject: 'Teste de Notificação',
      message: 'Esta é uma mensagem de teste do Sistema de Relatórios Pix Filmes.',
      type: 'new_video',
    };

    if (type === 'email') {
      return this.sendEmail([recipient], payload);
    } else {
      return this.sendWhatsApp([recipient], payload);
    }
  }
}

export default new NotificationService();
