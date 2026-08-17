import { VoteEntry, VoteStrategy } from "./vote-strategy.interface";

/**
 * Stratégie "anarchie" : tire au sort une action, avec un tirage biaisé pour
 * atténuer la domination d'une action très majoritaire tout en gardant les
 * actions très minoritaires proches de leur part réelle de suffrages.
 *
 * Voir `docs/anarchy-bias.md` pour le détail du fonctionnement mathématique
 * et des exemples chiffrés.
 *
 * Variables d'environnement :
 * - ANARCHY_BIAS_ENABLED : si "false", désactive le biais (tirage strictement
 *   proportionnel aux votes, comportement historique). Défaut "true".
 * - ANARCHY_BIAS_TARGET_SHARE : part de suffrages (0-1, exclu) utilisée comme
 *   point d'ancrage pour calibrer le biais (défaut 0.9, soit 90%).
 * - ANARCHY_BIAS_TARGET_PROBABILITY : probabilité de victoire visée (0-1,
 *   exclu) pour une action ayant `ANARCHY_BIAS_TARGET_SHARE` des suffrages
 *   (défaut 0.7, soit 70%).
 */
export class AnarchyStrategy implements VoteStrategy {
  private static readonly BIAS_ENABLED = process.env.ANARCHY_BIAS_ENABLED !== "false";

  private static readonly TARGET_SHARE = clampOpenUnit(
    parseFloat(process.env.ANARCHY_BIAS_TARGET_SHARE ?? "0.9"),
  );

  private static readonly TARGET_PROBABILITY = clampOpenUnit(
    parseFloat(process.env.ANARCHY_BIAS_TARGET_PROBABILITY ?? "0.7"),
  );

  /** Exposant du biais, dérivé des deux points d'ancrage ci-dessus (voir docs/anarchy-bias.md) */
  private static readonly EXPONENT = computeExponent(
    AnarchyStrategy.TARGET_SHARE,
    AnarchyStrategy.TARGET_PROBABILITY,
  );

  decide(entries: VoteEntry[]): VoteEntry[] {
    const pool = entries.filter((entry) => entry.count > 0).map((entry) => ({ ...entry }));
    const result: VoteEntry[] = [];

    while (pool.length > 0) {
      const winnerIndex = this.pickWinnerIndex(pool);
      result.push(pool[winnerIndex]);
      pool.splice(winnerIndex, 1);
    }

    return result;
  }

  /**
   * Tire au sort récursivement l'indice du "gagnant" parmi les indices
   * candidats restants : le meneur du sous-ensemble courant (celui avec le
   * plus de votes) gagne avec une probabilité biaisée dépendant uniquement
   * de sa part de suffrages *au sein de ce sous-ensemble* ; sinon, on
   * relance le même tirage parmi le reste. Cette récursion garantit qu'une
   * action ayant une part `p` des suffrages d'un sous-ensemble a toujours la
   * même probabilité de victoire `biasedProbability(p)`, quel que soit le
   * nombre d'autres actions et la façon dont elles se répartissent le reste
   * des votes (voir `docs/anarchy-bias.md`).
   */
  private pickWinnerIndex(pool: VoteEntry[], candidateIndexes?: number[]): number {
    const indexes = candidateIndexes ?? pool.map((_, i) => i);
    if (indexes.length === 1) {
      return indexes[0];
    }

    let leaderPos = 0;
    for (let i = 1; i < indexes.length; i++) {
      if (pool[indexes[i]].count > pool[indexes[leaderPos]].count) {
        leaderPos = i;
      }
    }
    const leaderIndex = indexes[leaderPos];

    const total = indexes.reduce((sum, i) => sum + pool[i].count, 0);
    const share = total > 0 ? pool[leaderIndex].count / total : 1 / indexes.length;

    const winProbability = AnarchyStrategy.BIAS_ENABLED
      ? biasedProbability(share, AnarchyStrategy.EXPONENT)
      : share;

    if (Math.random() < winProbability) {
      return leaderIndex;
    }

    const rest = indexes.filter((i) => i !== leaderIndex);
    return this.pickWinnerIndex(pool, rest);
  }
}

/**
 * Fonction de biais (type "pondération de probabilité" de Prelec/Karmarkar) :
 * w(p) = p^k / (p^k + (1-p)^k)
 * Monotone, w(0)=0, w(1)=1, w(0.5)=0.5, symétrique (w(p)+w(1-p)=1).
 */
function biasedProbability(share: number, exponent: number): number {
  if (share <= 0) return 0;
  if (share >= 1) return 1;
  const weighted = Math.pow(share, exponent);
  const weightedComplement = Math.pow(1 - share, exponent);
  return weighted / (weighted + weightedComplement);
}

/**
 * Calcule l'exposant `k` tel que `biasedProbability(targetShare, k) === targetProbability`,
 * via la relation logit(w(p)) = k * logit(p).
 */
function computeExponent(targetShare: number, targetProbability: number): number {
  if (targetShare === 0.5) {
    // Point fixe de la fonction : aucun exposant ne peut déplacer w(0.5), qui vaut toujours 0.5.
    return 1;
  }
  const logit = (x: number) => Math.log(x / (1 - x));
  return logit(targetProbability) / logit(targetShare);
}

/** Ramène une valeur dans ]0, 1[ (bornes ouvertes, pour éviter les divisions par zéro du logit). */
function clampOpenUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0.5;
  }
  return Math.min(Math.max(value, 1e-6), 1 - 1e-6);
}


