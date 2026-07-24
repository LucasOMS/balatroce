import { Injectable, Logger } from "@nestjs/common";
import * as fs from "node:fs";
import * as path from "node:path";

/** Données d'authentification Twitch persistées sur disque */
export interface TwitchAuthData {
  accessToken: string;
  refreshToken?: string;
  /** Login (pseudo) du compte Twitch propriétaire du token */
  username?: string;
  obtainedAt: number;
  expiresIn?: number;
}

const TOKEN_FILE_PATH = path.join(process.cwd(), "twitch-auth.json");

/** Scopes nécessaires pour lire et écrire dans le chat Twitch */
const TWITCH_SCOPES = "chat:read chat:edit";

interface TwitchTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Gère l'authentification OAuth Twitch (flow "Authorization Code") et la
 * persistance du token dans un fichier (`twitch-auth.json`), plutôt que dans
 * des variables d'environnement.
 *
 * Variables d'environnement nécessaires (uniquement pour identifier
 * l'application Twitch, pas le token utilisateur) :
 * - TWITCH_CLIENT_ID : Client ID de l'application, créée sur https://dev.twitch.tv/console/apps
 * - TWITCH_CLIENT_SECRET : Client Secret de la même application
 * - TWITCH_REDIRECT_URI : URL de callback OAuth (défaut : http://localhost:3000/auth/twitch/callback),
 *   doit être enregistrée telle quelle dans les paramètres de l'application Twitch
 */
@Injectable()
export class TwitchAuthService {
  private readonly logger = new Logger(TwitchAuthService.name);
  private cachedAuth: TwitchAuthData | null | undefined = undefined;

  private get clientId(): string {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "TWITCH_CLIENT_ID n'est pas défini. Créez une application sur https://dev.twitch.tv/console/apps.",
      );
    }
    return clientId;
  }

  private get clientSecret(): string {
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error(
        "TWITCH_CLIENT_SECRET n'est pas défini. Créez une application sur https://dev.twitch.tv/console/apps.",
      );
    }
    return clientSecret;
  }

  private get redirectUri(): string {
    return process.env.TWITCH_REDIRECT_URI ?? "http://localhost:3000/auth/twitch/callback";
  }

  /** URL vers laquelle rediriger l'utilisateur pour démarrer l'autorisation Twitch */
  public buildAuthorizeUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: TWITCH_SCOPES,
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation reçu sur /auth/twitch/callback contre un
   * access/refresh token, récupère le pseudo associé, et enregistre le tout
   * dans le fichier `twitch-auth.json`.
   */
  public async handleAuthorizationCode(code: string): Promise<TwitchAuthData> {
    const tokenResponse = await this.requestToken({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri,
    });

    const username = await this.fetchUsername(tokenResponse.access_token);

    const auth: TwitchAuthData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      username,
      obtainedAt: Date.now(),
      expiresIn: tokenResponse.expires_in,
    };
    this.save(auth);
    return auth;
  }

  /** Tente de rafraîchir le token à partir du refresh_token stocké. Renvoie null si impossible. */
  public async refresh(): Promise<TwitchAuthData | null> {
    const current = this.load();
    if (!current?.refreshToken) {
      return null;
    }

    try {
      const tokenResponse = await this.requestToken({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: current.refreshToken,
      });

      const auth: TwitchAuthData = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? current.refreshToken,
        username: current.username,
        obtainedAt: Date.now(),
        expiresIn: tokenResponse.expires_in,
      };
      this.save(auth);
      return auth;
    } catch (err) {
      this.logger.error(`Impossible de rafraîchir le token Twitch : ${(err as Error).message}`);
      return null;
    }
  }

  public getAuth(): TwitchAuthData | null {
    return this.load();
  }

  public getAccessToken(): string | null {
    return this.load()?.accessToken ?? null;
  }

  public getUsername(): string | null {
    return this.load()?.username ?? null;
  }

  public isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  private async requestToken(params: Record<string, string>): Promise<TwitchTokenResponse> {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twitch OAuth error ${res.status.toString()} : ${text}`);
    }

    return (await res.json()) as TwitchTokenResponse;
  }

  private async fetchUsername(accessToken: string): Promise<string | undefined> {
    try {
      const res = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": this.clientId,
        },
      });
      if (!res.ok) {
        return undefined;
      }
      const body = (await res.json()) as { data?: { login?: string }[] };
      return body.data?.[0]?.login;
    } catch {
      return undefined;
    }
  }

  private load(): TwitchAuthData | null {
    if (this.cachedAuth !== undefined) {
      return this.cachedAuth;
    }
    try {
      const raw = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
      this.cachedAuth = JSON.parse(raw) as TwitchAuthData;
      return this.cachedAuth;
    } catch {
      this.cachedAuth = null;
      return null;
    }
  }

  private save(auth: TwitchAuthData): void {
    this.cachedAuth = auth;
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(auth, null, 2), "utf-8");
    this.logger.log(`Token Twitch enregistré dans ${TOKEN_FILE_PATH}`);
  }
}

