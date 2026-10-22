import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptLoad: Promise<TurnstileApi> | null = null;

// Carga el script de Cloudflare una sola vez por pagina.
function loadTurnstile(doc: Document): Promise<TurnstileApi> {
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const api = doc.defaultView?.turnstile;
      if (api) {
        resolve(api);
      } else {
        reject(new Error('Turnstile is not available'));
      }
    };
    script.onerror = () => {
      scriptLoad = null;
      reject(new Error('Turnstile failed to load'));
    };
    doc.head.appendChild(script);
  });
  return scriptLoad;
}

@Component({
  selector: 'app-turnstile-widget',
  template: '<div #container></div>',
  styles: ':host { display: block; min-height: 65px; }',
})
export class TurnstileWidget {
  readonly siteKey = input.required<string>();

  /** Emite el token cuando el desafio se resuelve, y null cuando vence o falla. */
  readonly tokenChange = output<string | null>();
  readonly loadFailed = output<void>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private api: TurnstileApi | null = null;
  private widgetId: string | null = null;

  constructor() {
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    // Solo en el navegador, y cuando el formulario esta por aparecer en pantalla.
    afterNextRender(() => {
      const element = this.container().nativeElement;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            this.render(doc, element);
          }
        },
        { rootMargin: '400px' },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        if (this.api && this.widgetId) {
          this.api.remove(this.widgetId);
        }
      });
    });
  }

  /** Pide un desafio nuevo; los tokens de Turnstile sirven para un solo envio. */
  reset(): void {
    this.tokenChange.emit(null);
    if (this.api && this.widgetId) {
      this.api.reset(this.widgetId);
    }
  }

  private async render(doc: Document, element: HTMLElement): Promise<void> {
    try {
      this.api = await loadTurnstile(doc);
    } catch {
      this.loadFailed.emit();
      return;
    }
    this.widgetId = this.api.render(element, {
      sitekey: this.siteKey(),
      theme: 'auto',
      language: 'es',
      size: 'flexible',
      callback: (token: string) => this.tokenChange.emit(token),
      'expired-callback': () => this.tokenChange.emit(null),
      'error-callback': () => this.tokenChange.emit(null),
    });
  }
}
