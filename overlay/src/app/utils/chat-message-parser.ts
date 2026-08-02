import {ChatEmoteMap, ChatMessage} from "@shared/chat-message";

export type ChatMessageSegment =
  | { type: "text"; value: string }
  | { type: "emote"; url: string; alt: string };

const TWITCH_EMOTE_BASE_URL = "https://static-cdn.jtvnw.net/emoticons/v2";

function twitchEmoteUrl(id: string): string {
  return `${TWITCH_EMOTE_BASE_URL}/${id}/default/dark/2.0`;
}

/**
 * Découpe le texte d'un message de tchat en segments texte/émote, en tenant
 * compte à la fois des émotes Twitch natives (positions précises fournies
 * par tmi.js) et des émotes BTTV/7TV de la chaîne (résolues mot par mot via
 * `emotesMap`, ces émotes n'ayant pas de position explicite).
 */
export function buildChatMessageSegments(message: ChatMessage, emotesMap: ChatEmoteMap): ChatMessageSegment[] {
  const segments: ChatMessageSegment[] = [];
  const text = message.message;
  const twitchEmotes = [...message.emotes].sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const emote of twitchEmotes) {
    if (emote.start < cursor || emote.end < emote.start || emote.end >= text.length) {
      continue;
    }
    if (emote.start > cursor) {
      segments.push(...splitTextWithEmotes(text.slice(cursor, emote.start), emotesMap));
    }
    const code = text.slice(emote.start, emote.end + 1);
    segments.push({type: "emote", url: twitchEmoteUrl(emote.id), alt: code});
    cursor = emote.end + 1;
  }

  if (cursor < text.length) {
    segments.push(...splitTextWithEmotes(text.slice(cursor), emotesMap));
  }

  return segments;
}

/** Découpe un fragment de texte (sans émote Twitch native) en repérant les émotes BTTV/7TV mot par mot. */
function splitTextWithEmotes(text: string, emotesMap: ChatEmoteMap): ChatMessageSegment[] {
  const segments: ChatMessageSegment[] = [];
  const tokens = text.split(/(\s+)/);

  for (const token of tokens) {
    if (token === "") {
      continue;
    }
    const url = emotesMap[token];
    if (url) {
      segments.push({type: "emote", url, alt: token});
    } else {
      segments.push({type: "text", value: token});
    }
  }

  return segments;
}

