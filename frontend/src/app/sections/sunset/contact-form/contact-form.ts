import { Component, afterNextRender, signal, viewChild } from '@angular/core';
import { FieldTree, FormField, TreeValidationResult, form, submit, validate } from '@angular/forms/signals';
import { sendContact } from '../../../core/contact-api';
import { contactConfig } from '../../../core/contact-config';
import {
  INVALID_FORM_MESSAGE,
  SLOW_SEND_MESSAGE,
  SUCCESS_MESSAGE,
  TOKEN_PENDING_MESSAGE,
  TURNSTILE_FAILED_MESSAGE,
  errorMessage,
  fieldMessage,
} from './contact-messages';
import { ContactField, checkField } from './contact-rules';
import { TurnstileWidget } from './turnstile-widget/turnstile-widget';

interface ContactModel {
  name: string;
  email: string;
  message: string;
  // Honeypot: una persona nunca lo ve ni lo llena.
  website: string;
}

const EMPTY: ContactModel = { name: '', email: '', message: '', website: '' };
const FIELDS: ContactField[] = ['name', 'email', 'message'];

// Si la API estaba dormida el envio tarda; pasado este tiempo se avisa a la persona.
const SLOW_SEND_AFTER_MS = 3000;

type Status = { kind: 'success' | 'error' | 'info'; text: string } | null;

@Component({
  selector: 'app-contact-form',
  imports: [FormField, TurnstileWidget],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
})
export class ContactForm {
  private readonly config = contactConfig();
  private readonly turnstile = viewChild.required(TurnstileWidget);
  private readonly model = signal<ContactModel>({ ...EMPTY });
  private shownAt = 0;

  // El formulario envuelve al modelo; cada campo se valida con las mismas reglas del backend.
  protected readonly contactForm = form(this.model, (path) => {
    for (const field of FIELDS) {
      validate(path[field], ({ value }) => {
        const reason = checkField(field, value());
        return reason ? { kind: reason, message: fieldMessage(field, reason) } : undefined;
      });
    }
  });

  protected readonly siteKey = this.config.turnstileSiteKey;
  protected readonly token = signal<string | null>(null);
  protected readonly status = signal<Status>(null);

  constructor() {
    afterNextRender(() => (this.shownAt = performance.now()));
  }

  /** Mensaje de error a mostrar bajo el campo, solo despues de que la persona lo toco. */
  protected fieldError(field: FieldTree<string>): string | null {
    const state = field();
    return state.touched() && state.invalid() ? (state.errors()[0]?.message ?? null) : null;
  }

  protected onTurnstileFailed(): void {
    this.status.set({ kind: 'error', text: TURNSTILE_FAILED_MESSAGE });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.status.set(null);
    await submit(this.contactForm, {
      action: () => this.send(),
      onInvalid: () => this.status.set({ kind: 'error', text: INVALID_FORM_MESSAGE }),
    });
  }

  private async send(): Promise<TreeValidationResult> {
    const token = this.token();
    if (!token) {
      this.status.set({ kind: 'error', text: TOKEN_PENDING_MESSAGE });
      return undefined;
    }

    const slowNotice = setTimeout(
      () => this.status.set({ kind: 'info', text: SLOW_SEND_MESSAGE }),
      SLOW_SEND_AFTER_MS,
    );
    const result = await sendContact(this.config.apiUrl, {
      ...this.model(),
      elapsedMs: Math.round(performance.now() - this.shownAt),
      turnstileToken: token,
    });
    clearTimeout(slowNotice);
    this.turnstile().reset();

    if (result.ok) {
      this.contactForm().reset({ ...EMPTY });
      this.shownAt = performance.now();
      this.status.set({ kind: 'success', text: SUCCESS_MESSAGE });
      return undefined;
    }

    this.status.set({ kind: 'error', text: errorMessage(result.code, result.retryAfterSeconds) });
    // Los errores por campo del servidor se muestran bajo cada campo, igual que los del cliente.
    return Object.entries(result.fields ?? {})
      .filter((entry): entry is [ContactField, string] => FIELDS.includes(entry[0] as ContactField))
      .map(([field, reason]) => ({
        fieldTree: this.contactForm[field],
        kind: 'server',
        message: fieldMessage(field, reason),
      }));
  }
}
