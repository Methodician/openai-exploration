import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signOut,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { SigninDialogComponent } from '../components/dialogs/signin-dialog/signin-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  public dialog = inject(MatDialog);

  authState$ = authState(this.auth);

  signIn = () => {
    const dialogRef = this.dialog.open(SigninDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
      if (result) {
        signInWithEmailAndPassword(this.auth, result.email, result.password)
          .then((credentials) => {
            console.log('signed in');
          })
          .catch((err) => {
            if (err.code === 'auth/user-not-found') {
              alert(
                'User not found. Try again. If you really want to get in, ask Jacob for help. This is private software.'
              );
              this.signIn();
            }
            if (err.code === 'auth/wrong-password') {
              alert(
                'Wrong password. Try again. If you really want to get in, ask Jacob for help. This is private software.'
              );
              this.signIn();
            }
            if (err.code === 'auth/invalid-email') {
              alert(
                'You entered an invalid email. Try again. If you really want to get in, ask Jacob for help. This is private software.'
              );
              this.signIn();
            }
            if (err.code === 'auth/missing-password') {
              alert(
                'You must enter a password. Try again. If you really want to get in, ask Jacob for help. This is private software.'
              );
              this.signIn();
            }
            console.log(err.code, err.message);
          });
      }
    });
  };

  signOut = () => signOut(this.auth).then(() => console.log('signed out'));
}
