ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visualizador';

CREATE OR REPLACE FUNCTION private.is_ativo(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND aprovado)
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.is_ativo(_user_id) AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.pode_editar(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.is_ativo(_user_id) AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','engenheiro'))
$$;

CREATE OR REPLACE FUNCTION private.pode_excluir(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.pode_editar(_user_id)
$$;

REVOKE ALL ON FUNCTION private.is_ativo(uuid), private.pode_editar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_ativo(uuid), private.pode_editar(uuid) TO authenticated;

-- Escritas passam a exigir papel de edição
DO $$
DECLARE r record; q text; c text; stmt text;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies
           WHERE schemaname IN ('public','storage') AND cmd IN ('INSERT','UPDATE')
             AND (coalesce(qual,'') LIKE '%is_membro%' OR coalesce(with_check,'') LIKE '%is_membro%')
  LOOP
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF r.qual IS NOT NULL THEN stmt := stmt || ' USING (' || replace(r.qual,'is_membro','pode_editar') || ')'; END IF;
    IF r.with_check IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || replace(r.with_check,'is_membro','pode_editar') || ')'; END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

ALTER POLICY comentarios_insert ON public.comentarios WITH CHECK (auth.uid() = autor_id AND private.pode_editar(auth.uid()));
ALTER POLICY comentarios_update_own ON public.comentarios USING (auth.uid() = autor_id AND private.pode_editar(auth.uid()));
ALTER POLICY comentarios_delete_own ON public.comentarios USING ((auth.uid() = autor_id AND private.pode_editar(auth.uid())) OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Aprovados leem tipos" ON public.tipos_projeto USING (private.is_membro(auth.uid()));
ALTER POLICY "Aprovados criam tipos" ON public.tipos_projeto WITH CHECK (private.pode_editar(auth.uid()));
ALTER POLICY "Aprovados excluem tipos" ON public.tipos_projeto USING (private.pode_editar(auth.uid()));
ALTER POLICY roles_select ON public.user_roles USING ((user_id = auth.uid() AND private.is_ativo(auth.uid())) OR private.has_role(auth.uid(), 'admin'));

-- Convidados: papel vem do convite (cadastro público desativado)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE primeiro boolean; papel text;
BEGIN
  primeiro := (SELECT count(*) FROM public.user_roles) = 0;
  papel := COALESCE(NEW.raw_app_meta_data->>'papel', NEW.raw_user_meta_data->>'papel');
  IF papel IS NULL OR papel NOT IN ('admin','engenheiro','visualizador') THEN papel := 'visualizador'; END IF;
  INSERT INTO public.profiles (id, nome, email, aprovado)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email, true)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (CASE WHEN primeiro THEN 'admin' ELSE papel END)::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;