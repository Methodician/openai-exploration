// Angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular-centric libraries a la carte
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

// NgFire
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import {
  provideDatabase,
  getDatabase,
  connectDatabaseEmulator,
} from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import {
  provideFunctions,
  getFunctions,
  connectFunctionsEmulator,
} from '@angular/fire/functions';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { provideStorage, getStorage } from '@angular/fire/storage';

// AngularMaterial imports
// forms
import { MatFormFieldModule } from '@angular/material/form-field';
// input
import { MatInputModule } from '@angular/material/input';
// buttons
import { MatButtonModule } from '@angular/material/button';
// cards
import { MatCardModule } from '@angular/material/card';
// list
import { MatListModule } from '@angular/material/list';
// icon
import { MatIconModule } from '@angular/material/icon';
// toolbar
import { MatToolbarModule } from '@angular/material/toolbar';
// dialog
import { MatDialogModule } from '@angular/material/dialog';
// select
import { MatSelectModule } from '@angular/material/select';
// slider
import { MatSliderModule } from '@angular/material/slider';
// checkbox
import { MatCheckboxModule } from '@angular/material/checkbox';
// progress spinner
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Internal
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { ModelSelectComponent } from './components/model-select/model-select.component';
import { MessageComponent } from './components/message/message.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { ThreadComponent } from './components/thread/thread.component';
import { ThreadPreferencesDialogComponent } from './components/dialogs/thread-preferences-dialog/thread-preferences-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ModelSelectComponent,
    MessageComponent,
    HomeComponent,
    HeaderComponent,
    ThreadComponent,
    ThreadPreferencesDialogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HighlightModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => {
      const db = getDatabase();
      if (!environment.production) {
        connectDatabaseEmulator(db, 'localhost', 9000);
      }
      return db;
    }),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => {
      const functions = getFunctions();
      if (!environment.production) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        fullLibraryLoader: () => import('highlight.js'),
      },
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
