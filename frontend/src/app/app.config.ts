import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Sin hidratacion incremental el HTML no lleva scripts en linea, lo que permite una CSP estricta.
    provideClientHydration(withNoIncrementalHydration()),
  ],
};
