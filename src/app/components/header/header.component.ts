import { Component } from '@angular/core';
import { HeaderService } from 'src/app/services/header.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  headerText$ = this.headerService.headerText$;
  isTitleClickable$ = this.headerService.isTitleClickable$;
  isThereOtherStuff$ = this.headerService.isThereOtherStuff$;
  constructor(private headerService: HeaderService) {}

  onTitleClicked = () => {
    this.headerService.titleClicked();
  };

  onOtherStuffClicked = () => {
    this.headerService.otherStuffClicked();
  };
}
