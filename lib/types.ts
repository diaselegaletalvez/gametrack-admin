import type { PlanCodigo } from '@/constants/plans';

export type Plan = {
  id: string;
  codigo: PlanCodigo;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
};

export type ActivationCode = {
  code: string;
  plan_id: string;
  dias_validade: number;
  max_usos: number;
  usos: number;
  ativo: boolean;
  origem: 'admin' | 'trial' | 'webhook' | 'promo';
  created_at: string;
  created_by: string | null;
  plan?: { codigo: PlanCodigo; nome: string } | null;
};

export type CatalogoJogo = {
  id: string;
  nome: string;
  descricao: string | null;
  plataforma: string;
  genero: string;
  imagem_url: string | null;
  created_at: string;
};

// Linha retornada pela view/RPC `admin_list_users` (definida em supabase/sql/001_admin_panel.sql)
export type AdminUserRow = {
  user_id: string;
  email: string | null;
  nome_completo: string | null;
  gametag: string | null;
  coins: number;
  is_admin: boolean;
  plano_codigo: PlanCodigo | null;
  plano_nome: string | null;
  expira_em: string | null;
  created_at: string;
};
