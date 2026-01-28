export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Legend';

const TIERS: RankTier[] = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Master',
  'Grandmaster',
  'Legend',
];

const DIVISIONS = ['I', 'II', 'III'] as const;

export function getRankIndexFromXP(xp: number): number {
  const safeXP = Number.isFinite(xp) ? xp : 0;
  return Math.max(0, Math.floor(safeXP / 500));
}

export function getRankFromXP(xp: number): { name: string; rankIndex: number; tier: RankTier; division: (typeof DIVISIONS)[number] } {
  const rankIndex = getRankIndexFromXP(xp);

  const tierIndex = Math.floor(rankIndex / 3);
  const divisionIndex = rankIndex % 3;

  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)];
  const division = DIVISIONS[divisionIndex];

  return {
    name: `${tier} ${division}`,
    rankIndex,
    tier,
    division,
  };
}
