import { Extension } from './Extension';

export class Logger {
  public readonly errors: string[] = [];
  private extBadgeStyle = '';
  private readonly ctxBadgeStyle: string;

  constructor(readonly parent: Extension, readonly VERBOSE: boolean, readonly context: string) {
    this.ctxBadgeStyle = Logger.makeStyleFromStr(this.context);
    if (this.parent.locale.isReady()) {
      this.init();
    }
  }

  public init(): void {
    this.extBadgeStyle = Logger.makeStyleFromStr(this.parent.getName());
  }

  public log(type: string, ...args: unknown[]): void {
    if (this.VERBOSE) {
      const prefix = `%c[${this.parent.getName()}]%c[${this.context}]%c[${type}]`;
      console.debug(prefix, this.extBadgeStyle, this.ctxBadgeStyle, Logger.makeStyleFromStr(type), ...args);
    }
  }

  public error(type: string, ...args: unknown[]): void {
    this.silentError(type, ...args);
    this.addError(type, ...args);
    this.parent.logger.addError(type, ...args);
  }

  public silentError(type: string, ...args: unknown[]): void {
    const prefix = `%c[${this.parent.getName()}]%c[${this.context}]%c[${type}]`;
    console.error(prefix, this.extBadgeStyle, this.ctxBadgeStyle, Logger.makeStyleFromStr(type), ...args);
  }

  public addError(type: string, ...args: unknown[]): void {
    this.errors.push(`[${this.context}][${type}]: ${args.join(' ')}`);
  }

  public warn(type: string, ...args: unknown[]): void {
    const prefix = `%c[${this.parent.getName()}]%c[${this.context}]%c[${type}]`;
    console.warn(prefix, this.extBadgeStyle, this.ctxBadgeStyle, Logger.makeStyleFromStr(type), ...args);
  }

  public static globalLog(type: string, ...args: unknown[]): void {
    const prefix = `%c[Extendium]%c[${type}]`;

    const style = Logger.makeStyleFromStr('Extendium');
    const typeStyle = Logger.makeStyleFromStr(type);

    console.debug(prefix, style, typeStyle, ...args);
  }

  // #region helpers
  private static makeStyleFromStr(input: string): string {
    const color = Logger.colorFromString(input);
    const text = Logger.getTextColorForBg(color);

    return Logger.makeBadgeStyle(color, text);
  }

  private static makeBadgeStyle(bg: string, fg: string): string {
    return [
      `background: ${bg}`,
      `color: ${fg}`,
      'padding: 1px 4px',
      'border-radius: 3px',
      'font-weight: 600',
    ].join('; ');
  }

  private static colorFromString(input: string): string {
    // Deterministic hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 6) - hash) + input.charCodeAt(i);
      hash |= 0; // Convert to 32bit int
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += (`00${value.toString(16)}`).slice(-2);
    }

    return color;
  }

  private static getTextColorForBg(hexBg: string): string {
    // YIQ contrast formula to decide black/white text
    const { r, g, b } = Logger.hexToRgb(hexBg);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return yiq >= 128 ? '#000000' : '#ffffff';
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number; } {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
  }
  // #endregion helpers
}
