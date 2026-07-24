import {Controller, Get, Query, Res} from "@nestjs/common";
import type {Response} from "express";
import {TwitchAuthService} from "../services/twitch-auth.service";

@Controller("auth/twitch")
export class TwitchAuthController {
    constructor(private readonly twitchAuthService: TwitchAuthService) {
    }

    /**
     * Démarre le flow d'autorisation OAuth Twitch : redirige le navigateur vers
     * la page d'autorisation Twitch. Ouvrez cette URL dans un navigateur :
     * GET /auth/twitch/login
     */
    @Get("login")
    login(@Res() res: Response): void {
        res.redirect(this.twitchAuthService.buildAuthorizeUrl());
    }

    /**
     * Callback appelé par Twitch une fois l'utilisateur authentifié. Échange le
     * code reçu contre un token, et l'enregistre dans `twitch-auth.json`.
     * GET /auth/twitch/callback?code=...
     */
    @Get("callback")
    async callback(
        @Query("code") code: string | undefined,
        @Query("error_description") errorDescription: string | undefined,
        @Res() res: Response,
    ): Promise<void> {
        if (!code) {
            res
                .status(400)
                .send(`<h1>Échec de l'authentification Twitch</h1><p>${errorDescription ?? "Code d'autorisation manquant."}</p>`);
            return;
        }

        try {
            const auth = await this.twitchAuthService.handleAuthorizationCode(code);
            res.send(`
        <h1>✅ Connecté à Twitch</h1>
        <p>Compte : <b>${auth.username ?? "inconnu"}</b></p>
        <p>Le token a été enregistré dans <code>twitch-auth.json</code>.</p>
        <p><b>Redémarrez le serveur balatroce si celui-ci tournait déjà.</b> Vous pouvez fermer cette page. </p>
      `);
        } catch (err) {
            res.status(500).send(`<h1>Erreur</h1><pre>${(err as Error).message}</pre>`);
        }
    }

    /**
     * Statut de l'authentification Twitch courante.
     * GET /auth/twitch/status
     */
    @Get("status")
    status(): { authenticated: boolean; username: string | null } {
        return {
            authenticated: this.twitchAuthService.isAuthenticated(),
            username: this.twitchAuthService.getUsername(),
        };
    }
}

