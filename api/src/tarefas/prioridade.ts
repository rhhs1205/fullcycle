export const PRIORIDADES = ['baixa', 'media', 'alta'] as const;

export type Prioridade = (typeof PRIORIDADES)[number];
