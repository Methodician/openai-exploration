import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-signin-dialog',
  templateUrl: './signin-dialog.component.html',
  styleUrls: ['./signin-dialog.component.scss'],
})
export class SigninDialogComponent {
  email: string = '';
  password: string = '';

  public dialogRef = inject(MatDialogRef<SigninDialogComponent>);

  onSignIn = () => {
    this.dialogRef.close({ email: this.email, password: this.password });
  };
}
