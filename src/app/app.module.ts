// Angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// NgFire
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import {
  provideDatabase,
  getDatabase,
  connectDatabaseEmulator,
} from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
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

// Internal
import { CompletionsComponent } from './components/completions/completions.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { ChatComponent } from './components/chat/chat.component';
@NgModule({
  declarations: [AppComponent, CompletionsComponent, ChatComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
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
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
