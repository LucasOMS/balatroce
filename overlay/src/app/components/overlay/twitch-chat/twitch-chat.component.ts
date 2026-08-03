import {Component, computed, effect, ElementRef, inject, viewChild} from "@angular/core";
import {CardComponent} from "../../card.component";
import {ChatSocket} from "../../../services/chat-socket";
import {buildChatMessageSegments, ChatMessageSegment} from "../../../utils/chat-message-parser";

interface DisplayedChatMessage {
  id: string;
  username: string;
  animate: boolean;
  segments: ChatMessageSegment[];
}

/**
 * Affiche les derniers messages du tchat Twitch (jusqu'à 30, le plus récent
 * en bas), avec le rendu des émotes Twitch natives, BTTV et 7TV de la
 * chaîne. Les commandes de jeu (ActionKeyword) ne sont jamais envoyées ici
 * par le serveur, elles n'apparaissent donc jamais dans le tchat.
 *
 * Toujours connecté au vrai tchat de la chaîne Twitch configurée
 * (TWITCH_CHANNEL côté serveur) : aucune donnée mockée.
 */
@Component({
  selector: "app-twitch-chat",
  host: {class: "flex flex-col min-h-0"},
  imports: [CardComponent],
  template: `
    <app-card class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div #scrollContainer class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
        @for (item of displayedMessages(); track item.id) {
          <div class="text-[20px] leading-tight break-words" [class.chat-message-enter]="item.animate">
            <span class="text-zevent-500 font-bold">{{ item.username }}</span><span class="text-white">:</span>
            @for (segment of item.segments; track $index) {
              @if (segment.type === 'text') {
                <span class="text-white whitespace-pre-wrap">{{ segment.value }}</span>
              } @else {
                <img
                  [src]="segment.url" [alt]="segment.alt" [title]="segment.alt"
                  class="inline-block h-[26px] align-middle mx-0.5" />
              }
            }
          </div>
        }
      </div>
    </app-card>
  `,
})
export class TwitchChatComponent {
  private readonly chatSocket = inject(ChatSocket);

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>("scrollContainer");

  protected readonly displayedMessages = computed<DisplayedChatMessage[]>(() => {
    const emotes = this.chatSocket.emotes();
    return this.chatSocket.messages().map((message) => ({
      id: message.id,
      username: message.username,
      animate: message.animate,
      segments: buildChatMessageSegments(message, emotes),
    }));
  });

  constructor() {
    // Fait défiler automatiquement vers le bas à chaque nouveau message, pour que le plus récent reste visible.
    effect(() => {
      this.displayedMessages();
      queueMicrotask(() => {
        const el = this.scrollContainer()?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }
}

