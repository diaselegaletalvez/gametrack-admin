// Códigos de plano (espelha a tabela plans.codigo do Supabase).
export type PlanCodigo =
  | 'gratis'
  | 'basic'
  | 'premium'
  | 'elite'
  | 'familia'
  | 'escolar'
  | 'youtuber';

export const PLAN_CODIGOS: PlanCodigo[] = [
  'gratis',
  'basic',
  'premium',
  'elite',
  'familia',
  'escolar',
  'youtuber',
];

export const PLAN_LABEL: Record<PlanCodigo, string> = {
  gratis: 'Grátis',
  basic: 'Basic',
  premium: 'Premium',
  elite: 'Elite',
  familia: 'Família',
  escolar: 'Escolar',
  youtuber: 'Youtuber',
};

export const PLAN_COLOR: Record<PlanCodigo, string> = {
  gratis: '#9CA3AF',
  basic: '#60A5FA',
  premium: '#8B5CF6',
  elite: '#F59E0B',
  familia: '#34D399',
  escolar: '#22D3EE',
  youtuber: '#EC4899',
};
