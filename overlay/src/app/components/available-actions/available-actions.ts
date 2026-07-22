import { Component, input } from "@angular/core";
import { ActionKeyword } from "@shared/action-keyword";

@Component({
  selector: "app-available-actions",
  host: { class: "block" },
  template: `<!-- Les commandes disponibles seront listées ici -->`,
})
export class AvailableActions {
  readonly actions = input<ActionKeyword[]>([]);
}

