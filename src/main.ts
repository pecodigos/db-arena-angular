import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http'; // Import the HttpClient provider
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Extend the appConfig to include provideHttpClient
const extendedAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(), // Add HttpClient globally
  ],
};

bootstrapApplication(AppComponent, extendedAppConfig)
  .catch((err) => console.error(err));
