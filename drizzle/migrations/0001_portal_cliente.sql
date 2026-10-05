-- Equipe interna = ativo e com papel diferente de cliente
CREATE OR REPLACE FUNCTION private.is_membro(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND p.aprovado AND ur.role::text <> 'cliente')
$$;

ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS prazo_entrega date;
ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS valor_contrato numeric;
ALTER TABLE public.anexos_versao ADD COLUMN IF NOT EXISTS visivel_cliente boolean NOT NULL DEFAULT false;
ALTER TABLE public.etapas_kanban ADD COLUMN IF NOT EXISTS etapa_cliente text DEFAULT 'projeto';
UPDATE public.etapas_kanban SET etapa_cliente = CASE
  WHEN nome ILIKE '%orçamento%' OR nome ILIKE '%orcamento%' THEN 'orcamento'
  WHEN nome ILIKE '%revis%' THEN 'revisao'
  WHEN nome ILIKE '%aprova%' THEN 'aprovacao'
  WHEN nome ILIKE '%conclu%' OR nome ILIKE '%entreg%' THEN 'concluido'
  WHEN nome ILIKE '%arquiv%' OR nome ILIKE '%cancel%' THEN NULL
  ELSE 'projeto' END;

CREATE TABLE public.projeto_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.projeto_clientes TO authenticated;
GRANT ALL ON public.projeto_clientes TO service_role;
ALTER TABLE public.projeto_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_select ON public.projeto_clientes FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY pc_insert ON public.projeto_clientes FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY pc_delete ON public.projeto_clientes FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));

CREATE TABLE public.projeto_parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  vencimento date,
  pago boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projeto_parcelas TO authenticated;
GRANT ALL ON public.projeto_parcelas TO service_role;
ALTER TABLE public.projeto_parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY pp_select ON public.projeto_parcelas FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY pp_insert ON public.projeto_parcelas FOR INSERT TO authenticated WITH CHECK (private.pode_editar(auth.uid()));
CREATE POLICY pp_update ON public.projeto_parcelas FOR UPDATE TO authenticated USING (private.pode_editar(auth.uid())) WITH CHECK (private.pode_editar(auth.uid()));
CREATE POLICY pp_delete ON public.projeto_parcelas FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE OR REPLACE FUNCTION private.cliente_do_projeto(_user_id uuid, _projeto_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT private.has_role(_user_id, 'cliente'::public.app_role)
    AND EXISTS (SELECT 1 FROM public.projeto_clientes WHERE user_id = _user_id AND projeto_id = _projeto_id)
$$;

CREATE OR REPLACE FUNCTION private.cliente_ve_arquivo(_user_id uuid, _path text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.anexos_versao a JOIN public.cards c ON c.id = a.card_id
    WHERE a.storage_path = _path AND a.visivel_cliente AND private.cliente_do_projeto(_user_id, c.projeto_id))
$$;

CREATE POLICY anexos_storage_cliente_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'anexos' AND private.cliente_ve_arquivo(auth.uid(), name));

-- Leituras do portal: somente campos liberados
CREATE OR REPLACE FUNCTION public.portal_meus_projetos()
 RETURNS TABLE(id uuid, nome text, tipo text, prazo_entrega date, etapa text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.nome, p.tipo, p.prazo_entrega,
    CASE WHEN p.status = 'concluido' THEN 'concluido' ELSE (
      SELECT (ARRAY['orcamento','projeto','revisao','aprovacao','concluido'])[min(array_position(ARRAY['orcamento','projeto','revisao','aprovacao','concluido'], e.etapa_cliente))]
      FROM public.cards c JOIN public.etapas_kanban e ON e.id = c.etapa_id
      WHERE c.projeto_id = p.id AND e.etapa_cliente IS NOT NULL) END
  FROM public.projetos p
  WHERE private.cliente_do_projeto(auth.uid(), p.id)
  ORDER BY p.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.portal_projeto(_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT private.cliente_do_projeto(auth.uid(), _id) THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'tipo', p.tipo, 'prazo_entrega', p.prazo_entrega,
    'etapa', (SELECT m.etapa FROM public.portal_meus_projetos() m WHERE m.id = p.id),
    'valor_contrato', COALESCE(p.valor_contrato, (SELECT sum(valor) FROM public.projeto_parcelas WHERE projeto_id = p.id), 0),
    'parcelas', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', x.id, 'descricao', x.descricao, 'valor', x.valor, 'vencimento', x.vencimento, 'pago', x.pago) ORDER BY x.ordem, x.vencimento, x.created_at)
       FROM public.projeto_parcelas x WHERE x.projeto_id = p.id), '[]'::jsonb),
    'arquivos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'nome_arquivo', a.nome_arquivo, 'revisao', a.revisao, 'status', a.status, 'storage_path', a.storage_path, 'created_at', a.created_at) ORDER BY a.created_at DESC)
       FROM public.anexos_versao a JOIN public.cards c ON c.id = a.card_id WHERE c.projeto_id = p.id AND a.visivel_cliente), '[]'::jsonb)
  ) INTO r FROM public.projetos p WHERE p.id = _id;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.portal_meus_projetos() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.portal_projeto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portal_meus_projetos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.portal_projeto(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE primeiro boolean; papel text;
BEGIN
  primeiro := (SELECT count(*) FROM public.user_roles) = 0;
  papel := COALESCE(NEW.raw_app_meta_data->>'papel', NEW.raw_user_meta_data->>'papel');
  IF papel IS NULL OR papel NOT IN ('admin','engenheiro','visualizador','cliente') THEN papel := 'visualizador'; END IF;
  INSERT INTO public.profiles (id, nome, email, aprovado)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email, true)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (CASE WHEN primeiro THEN 'admin' ELSE papel END)::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;