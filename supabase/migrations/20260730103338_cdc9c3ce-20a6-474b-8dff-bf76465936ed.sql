-- 1. Private schema for security-definer helpers (not exposed to the API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_membro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.pode_excluir(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','engenheiro')
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_membro(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.pode_excluir(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_membro(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.pode_excluir(uuid) TO authenticated, service_role;

-- 2. Drop permissive policies
DROP POLICY IF EXISTS anexos_all ON public.anexos_versao;
DROP POLICY IF EXISTS auditoria_select ON public.card_auditoria;
DROP POLICY IF EXISTS auditoria_insert ON public.card_auditoria;
DROP POLICY IF EXISTS cards_all ON public.cards;
DROP POLICY IF EXISTS checklist_all ON public.checklist_itens;
DROP POLICY IF EXISTS clientes_all ON public.clientes;
DROP POLICY IF EXISTS comentarios_select ON public.comentarios;
DROP POLICY IF EXISTS comentarios_delete_own ON public.comentarios;
DROP POLICY IF EXISTS etapas_all ON public.etapas_kanban;
DROP POLICY IF EXISTS apoio_all ON public.projetos_apoio;
DROP POLICY IF EXISTS projetos_all ON public.projetos;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS roles_select ON public.user_roles;
DROP POLICY IF EXISTS roles_admin_insert ON public.user_roles;
DROP POLICY IF EXISTS roles_admin_delete ON public.user_roles;

-- public.has_role is no longer referenced by any policy
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. Team-member scoped policies
CREATE POLICY anexos_select ON public.anexos_versao FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY anexos_insert ON public.anexos_versao FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY anexos_update ON public.anexos_versao FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY anexos_delete ON public.anexos_versao FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE POLICY auditoria_select ON public.card_auditoria FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY auditoria_insert ON public.card_auditoria FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id AND private.is_membro(auth.uid()));

CREATE POLICY cards_select ON public.cards FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY cards_insert ON public.cards FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY cards_update ON public.cards FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY cards_delete ON public.cards FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE POLICY checklist_select ON public.checklist_itens FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY checklist_insert ON public.checklist_itens FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY checklist_update ON public.checklist_itens FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY checklist_delete ON public.checklist_itens FOR DELETE TO authenticated USING (private.is_membro(auth.uid()));

CREATE POLICY clientes_select ON public.clientes FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY clientes_insert ON public.clientes FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY clientes_update ON public.clientes FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY clientes_delete ON public.clientes FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE POLICY comentarios_select ON public.comentarios FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY comentarios_delete_own ON public.comentarios FOR DELETE TO authenticated
  USING (auth.uid() = autor_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY etapas_select ON public.etapas_kanban FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY etapas_insert ON public.etapas_kanban FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY etapas_update ON public.etapas_kanban FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY etapas_delete ON public.etapas_kanban FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY apoio_select ON public.projetos_apoio FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY apoio_insert ON public.projetos_apoio FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY apoio_update ON public.projetos_apoio FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY apoio_delete ON public.projetos_apoio FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE POLICY projetos_select ON public.projetos FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY projetos_insert ON public.projetos FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY projetos_update ON public.projetos FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY projetos_delete ON public.projetos FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));

CREATE POLICY roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY roles_admin_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin') AND NOT (role = 'admin' AND user_id = auth.uid()));
CREATE POLICY roles_admin_delete ON public.user_roles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));