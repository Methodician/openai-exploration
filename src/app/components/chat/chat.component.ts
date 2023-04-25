import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, first, map } from 'rxjs';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  modelSearchText$ = new BehaviorSubject<string>(''); // the search query
  models$ = this.openaiService.getAvailableModels(); // assuming your models are of type any
  filteredModels$ = combineLatest([this.models$, this.modelSearchText$]).pipe(
    debounceTime(300),
    map(([models, searchText]) => {
      if (!models) {
        return null;
      }
      if (searchText === '') {
        return models;
      }
      return models.filter((model) =>
        model.id.toLowerCase().includes(searchText.toLowerCase())
      );
    })
  );
  selectedModelIndex$ = new BehaviorSubject<number>(0); // the index of the selected model in the list
  selectedModel$ = combineLatest([
    this.selectedModelIndex$,
    this.filteredModels$,
  ]).pipe(
    map(([index, models]) => {
      if (models && models.length > 0) {
        return models[index];
      } else {
        return undefined;
      }
    })
  );
  modelCount = 0; // the number of models in the list

  constructor(private openaiService: OpenaiService) {}

  ngOnInit(): void {
    this.openaiService.requestUpdatedModels();
    this.filteredModels$.subscribe((models) => {
      if (models && models.length > 0) {
        this.modelCount = models.length;
      }
    });
  }

  onSelect(index: number): void {
    this.selectedModelIndex$.next(index); // set the selected model when an option is clicked
  }

  onSearchChange($e: any): void {
    this.selectedModelIndex$.next(0); // reset the selected model when the search changes
    this.modelSearchText$.next($e.target.value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      if (this.selectedModelIndex$.value > 0) {
        this.selectedModelIndex$.next(this.selectedModelIndex$.value - 1);
      } else {
        this.selectedModelIndex$.next(this.modelCount - 1);
      }
    }
    if (event.key === 'ArrowDown') {
      if (this.selectedModelIndex$.value < this.modelCount - 1) {
        this.selectedModelIndex$.next(this.selectedModelIndex$.value + 1);
      } else {
        this.selectedModelIndex$.next(0);
      }
    }
  }
}
