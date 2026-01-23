import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '-';
    }
    
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '-';
    }
    
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDuration(seconds: number): string {
  // Arredondar segundos para evitar frações
  const roundedSeconds = Math.round(seconds);
  
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }

  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${hours}h`;
}

export function formatDurationDetailed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Formata duração com ênfase nos segundos (para exibição visual)
 * Retorna objeto com timeFormatted (h/m) e secondsOnly (apenas segundos)
 */
export function formatTimeWithEmphasis(seconds: number): { timeFormatted: string; secondsOnly: string } {
  const totalSeconds = Math.round(seconds);
  
  if (seconds < 60) {
    return {
      timeFormatted: '',
      secondsOnly: `${totalSeconds}s`
    };
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    const timeStr = remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}` : `${minutes}m 0`;
    return {
      timeFormatted: timeStr,
      secondsOnly: `${totalSeconds}s`
    };
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const timeStr = remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h 0m`;
  
  return {
    timeFormatted: timeStr,
    secondsOnly: `${totalSeconds}s`
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatResolution(width: number, height: number): string {
  return `${width}x${height}`;
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Gera URL de compartilhamento usando domínio configurado ou fallback para window.location.origin
 */
export function getShareUrl(slug: string): string {
  // process.env.SHARE_URL é injetado pelo webpack.DefinePlugin durante o build
  // Em runtime, process.env pode não estar disponível, então verificamos também via window
  let shareDomain = '';
  
  // Tentar obter do process.env (injetado pelo webpack.DefinePlugin)
  // O webpack substitui process.env.SHARE_URL pelo valor real durante o build
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore - process.env é injetado pelo webpack
    shareDomain = String(process.env.SHARE_URL || '').trim();
  }
  
  // Se não encontrou, usar window.location.origin como fallback
  // Mas se window.location.origin for relatorio.pixfilmes.com, usar arquivos.pixfilmes.com
  let baseUrl = shareDomain;
  
  if (!baseUrl && typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    // Se estiver em relatorio.pixfilmes.com, usar arquivos.pixfilmes.com
    if (currentOrigin.includes('relatorio.pixfilmes.com')) {
      baseUrl = currentOrigin.replace('relatorio.pixfilmes.com', 'arquivos.pixfilmes.com');
    } else {
      baseUrl = currentOrigin;
    }
  }
  
  // Fallback final
  if (!baseUrl) {
    baseUrl = 'https://arquivos.pixfilmes.com';
  }
  
  // Garantir que não tenha barra dupla
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanSlug = slug.replace(/^\/+/, '');
  
  const finalUrl = `${cleanBaseUrl}/s/${cleanSlug}`;
  
  // Debug sempre (para ajudar a identificar o problema)
  console.log('[getShareUrl]', {
    shareDomain,
    baseUrl,
    finalUrl,
    processEnv: typeof process !== 'undefined' ? process.env : 'undefined',
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'undefined'
  });
  
  return finalUrl;
}

/**
 * Calcula o aspect ratio CSS baseado nas dimensões do vídeo
 * Retorna um objeto de estilo para aplicar no container do player
 */
export function getVideoAspectRatioStyle(
  widthPixels?: number | null,
  heightPixels?: number | null
): React.CSSProperties {
  // Se não tiver dimensões, usa 16:9 como padrão
  if (!widthPixels || !heightPixels) {
    return { aspectRatio: '16 / 9' };
  }

  // Calcula o aspect ratio
  const ratio = widthPixels / heightPixels;

  // Proporções específicas que o usuário pediu:
  // 9:16 (1080x1920) - vertical/portrait
  // 1:1 (quadrado)
  // 4:3 (landscape tradicional)
  // 3:4 (vertical)
  
  // Tolerância para detectar proporções próximas
  const tolerance = 0.01;
  
  // 9:16 = 0.5625
  if (Math.abs(ratio - 9/16) < tolerance) {
    return { aspectRatio: '9 / 16' };
  }
  
  // 1:1 = 1.0
  if (Math.abs(ratio - 1) < tolerance) {
    return { aspectRatio: '1 / 1' };
  }
  
  // 4:3 = 1.333...
  if (Math.abs(ratio - 4/3) < tolerance) {
    return { aspectRatio: '4 / 3' };
  }
  
  // 3:4 = 0.75
  if (Math.abs(ratio - 3/4) < tolerance) {
    return { aspectRatio: '3 / 4' };
  }
  
  // Para outras proporções, usa o cálculo exato
  // Simplifica a fração usando MDC
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const simplifiedWidth = widthPixels / gcd(widthPixels, heightPixels);
  const simplifiedHeight = heightPixels / gcd(widthPixels, heightPixels);
  
  return { aspectRatio: `${simplifiedWidth} / ${simplifiedHeight}` };
}
