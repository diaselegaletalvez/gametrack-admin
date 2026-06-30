-- ============================================================
-- GameTrack Admin — RLS de admin + RPCs do painel
-- Cole tudo isto no SQL Editor do Supabase do projeto GameTrack
-- e rode UMA vez. Idempotente.
--
-- PRÉ-REQUISITOS (já devem estar no banco do GameTrack):
--   - tabela profiles com coluna is_admin (SQL 007)
--   - função activate_plan_for_user(uid, plan_id, origem, dias) (SQL 008)
--   - função gen_activation_code(plan_codigo) (SQL 008)
--   - tabelas activation_codes, catalogo_jogos, plans, user_subscriptions
--
-- Tudo aqui roda SECURITY DEFINER e checa public.is_current_user_admin()
-- antes de qualquer escrita sensível. Nada exige service_role.
-- ============================================================


-- ------------------------------------------------------------
-- 0) Helper: o usuário logado é admin?
-- ------------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;


-- ------------------------------------------------------------
-- 1) RLS: admins podem LER activation_codes
--    (escrita acontece via RPC admin_create_codes)
-- ------------------------------------------------------------
drop policy if exists "activation_codes_admin_select" on public.activation_codes;
create policy "activation_codes_admin_select" on public.activation_codes
  for select
  to authenticated
  using (public.is_current_user_admin());


-- ------------------------------------------------------------
-- 2) RLS: admins podem gerenciar catalogo_jogos
-- ------------------------------------------------------------
drop policy if exists "catalogo_admin_insert" on public.catalogo_jogos;
create policy "catalogo_admin_insert" on public.catalogo_jogos
  for insert
  to authenticated
  with check (public.is_current_user_admin());

drop policy if exists "catalogo_admin_update" on public.catalogo_jogos;
create policy "catalogo_admin_update" on public.catalogo_jogos
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "catalogo_admin_delete" on public.catalogo_jogos;
create policy "catalogo_admin_delete" on public.catalogo_jogos
  for delete
  to authenticated
  using (public.is_current_user_admin());


-- ------------------------------------------------------------
-- 3) RPC: admin_list_users
--    Lista todos os usuários do auth.users + perfil + plano ativo.
--    Reservado pra admin.
-- ------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  nome_completo text,
  gametag text,
  coins integer,
  is_admin boolean,
  plano_codigo text,
  plano_nome text,
  expira_em timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'admin_only';
  end if;

  return query
    select
      u.id              as user_id,
      u.email::text     as email,
      p.nome_completo,
      p.gametag,
      coalesce(p.coins, 0) as coins,
      coalesce(p.is_admin, false) as is_admin,
      pl.codigo         as plano_codigo,
      pl.nome           as plano_nome,
      us.expira_em,
      u.created_at
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_subscriptions us
      on us.user_id = u.id and us.ativo = true
    left join public.plans pl on pl.id = us.plan_id
    order by u.created_at desc;
end; $$;

grant execute on function public.admin_list_users() to authenticated;


-- ------------------------------------------------------------
-- 4) RPC: admin_set_user_plan
--    Admin troca o plano de QUALQUER usuário.
--    Reutiliza activate_plan_for_user (fonte única).
-- ------------------------------------------------------------
create or replace function public.admin_set_user_plan(
  p_user_id uuid,
  p_codigo  text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo  text := lower(trim(p_codigo));
  v_plan_id uuid;
  v_expira  timestamptz;
begin
  if not public.is_current_user_admin() then
    return json_build_object('ok', false, 'error', 'admin_only');
  end if;
  if p_user_id is null then
    return json_build_object('ok', false, 'error', 'user_id_required');
  end if;
  select id into v_plan_id from public.plans where codigo = v_codigo and ativo;
  if v_plan_id is null then
    return json_build_object('ok', false, 'error', 'plan_not_found');
  end if;

  -- 0 dias = sem expiração (admin força permanente em teste)
  v_expira := public.activate_plan_for_user(p_user_id, v_plan_id, 'admin', 0);

  return json_build_object('ok', true, 'plan_id', v_plan_id, 'expira_em', v_expira);
end; $$;

grant execute on function public.admin_set_user_plan(uuid, text) to authenticated;


-- ------------------------------------------------------------
-- 5) RPC: admin_create_codes
--    Gera N códigos do tipo GT-<PLANO>-XXXXXXXX ou <PREFIXO>-...
-- ------------------------------------------------------------
create or replace function public.admin_create_codes(
  p_plan_codigo   text,
  p_quantidade    integer default 1,
  p_dias_validade integer default 30,
  p_max_usos      integer default 1,
  p_prefixo       text    default null
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_codigo  text;
  v_resultado text[] := array[]::text[];
  i int;
  v_tentativa int;
  v_prefixo text := upper(trim(coalesce(p_prefixo, '')));
begin
  if not public.is_current_user_admin() then
    raise exception 'admin_only';
  end if;
  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 500 then
    raise exception 'quantidade fora do intervalo (1..500)';
  end if;
  if p_max_usos is null or p_max_usos < 1 then
    raise exception 'max_usos deve ser >= 1';
  end if;
  if p_dias_validade is null or p_dias_validade < 0 then
    raise exception 'dias_validade deve ser >= 0';
  end if;

  select id into v_plan_id from public.plans
    where codigo = lower(trim(p_plan_codigo)) and ativo;
  if v_plan_id is null then
    raise exception 'plan_not_found';
  end if;

  for i in 1..p_quantidade loop
    v_tentativa := 0;
    loop
      v_tentativa := v_tentativa + 1;
      v_codigo := public.gen_activation_code(p_plan_codigo);
      if v_prefixo <> '' and v_prefixo <> 'GT' then
        v_codigo := v_prefixo || substr(v_codigo, 3);
      end if;
      begin
        insert into public.activation_codes (
          code, plan_id, dias_validade, max_usos, origem, created_by
        ) values (
          v_codigo, v_plan_id, p_dias_validade, p_max_usos, 'admin', auth.uid()
        );
        v_resultado := array_append(v_resultado, v_codigo);
        exit;
      exception when unique_violation then
        if v_tentativa > 5 then
          raise exception 'falha ao gerar código único após 5 tentativas';
        end if;
      end;
    end loop;
  end loop;

  return v_resultado;
end; $$;

grant execute on function public.admin_create_codes(text, integer, integer, integer, text) to authenticated;


-- ------------------------------------------------------------
-- 6) RPC: admin_reset_user_data
--    Zera dados de teste de UMA conta. Não apaga login/perfil/plano.
-- ------------------------------------------------------------
create or replace function public.admin_reset_user_data(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apagados_jogos      int := 0;
  v_apagados_sessoes    int := 0;
  v_apagados_conquistas int := 0;
  v_apagados_pets       int := 0;
  v_apagados_missoes    int := 0;
  v_apagados_compras    int := 0;
begin
  if not public.is_current_user_admin() then
    return json_build_object('ok', false, 'error', 'admin_only');
  end if;
  if p_user_id is null then
    return json_build_object('ok', false, 'error', 'user_id_required');
  end if;

  -- Sessões e jogos (sessões têm FK pra jogos com cascade, mas apago em ordem segura)
  delete from public.sessoes where user_id = p_user_id;
  get diagnostics v_apagados_sessoes = row_count;

  delete from public.jogos where user_id = p_user_id;
  get diagnostics v_apagados_jogos = row_count;

  delete from public.conquistas where user_id = p_user_id;
  get diagnostics v_apagados_conquistas = row_count;

  -- Apaga só as tabelas que existem (todas estas existem na Fase 2; protege com IF EXISTS)
  begin
    delete from public.user_pets where user_id = p_user_id;
    get diagnostics v_apagados_pets = row_count;
  exception when undefined_table then null;
  end;

  begin
    delete from public.user_missions where user_id = p_user_id;
    get diagnostics v_apagados_missoes = row_count;
  exception when undefined_table then null;
  end;

  begin
    delete from public.user_purchases where user_id = p_user_id;
    get diagnostics v_apagados_compras = row_count;
  exception when undefined_table then null;
  end;

  -- Zera moedas (perfil permanece)
  update public.profiles set coins = 0 where user_id = p_user_id;

  return json_build_object(
    'ok', true,
    'apagados', json_build_object(
      'jogos', v_apagados_jogos,
      'sessoes', v_apagados_sessoes,
      'conquistas', v_apagados_conquistas,
      'user_pets', v_apagados_pets,
      'user_missions', v_apagados_missoes,
      'user_purchases', v_apagados_compras
    )
  );
end; $$;

grant execute on function public.admin_reset_user_data(uuid) to authenticated;
