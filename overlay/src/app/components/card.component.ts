import {Component, input} from "@angular/core";

@Component({
  selector: "app-card",
  host: {class: "block text-white p-2 rounded-[16px] bg-(--bg-card) border-4 border-white flex flex-col gap-1"},
  template: `
    <div class="text-[30px] border-b border-white/30 pb-1 mb-1 empty:hidden">{{ title() }}</div>
    <ng-content></ng-content>
  `,
})
export class CardComponent {
  public readonly title = input<string>()
}

