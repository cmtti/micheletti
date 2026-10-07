ALTER TABLE public.projetos ADD COLUMN responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE public.chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('duvida','alteracao','problema_obra')),
  descricao text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_analise','respondido','fechado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chamados_projeto_idx ON public.chamados(projeto_id);
CREATE TABLE public.chamado_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  texto text NOT NULL,
  interna boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chamado_mensagens_idx ON public.chamado_mensagens(chamado_id);
CREATE TABLE public.chamado_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados, public.chamado_mensagens, public.chamado_anexos TO authenticated;
GRANT ALL ON public.chamados, public.chamado_mensagens, public.chamado_anexos TO service_role;

CREATE OR REPLACE FUNCTION private.equipe_ve_projeto(_uid uuid, _projeto_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.is_membro(_uid) AND (
    private.has_role(_uid, 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.projetos p WHERE p.id = _projeto_id AND (p.responsavel_id = _uid OR p.responsavel_id IS NULL)))
$$;
CREATE OR REPLACE FUNCTION private.equipe_ve_chamado(_uid uuid, _chamado_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = _chamado_id AND private.equipe_ve_projeto(_uid, c.projeto_id))
$$;
CREATE OR REPLACE FUNCTION private.cliente_ve_chamado(_uid uuid, _chamado_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = _chamado_id AND private.cliente_do_projeto(_uid, c.projeto_id))
$$;
REVOKE ALL ON FUNCTION private.equipe_ve_projeto(uuid,uuid), private.equipe_ve_chamado(uuid,uuid), private.cliente_ve_chamado(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.equipe_ve_projeto(uuid,uuid), private.equipe_ve_chamado(uuid,uuid), private.cliente_ve_chamado(uuid,uuid) TO authenticated;

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chamados select" ON public.chamados FOR SELECT TO authenticated
  USING (private.equipe_ve_projeto(auth.uid(), projeto_id) OR private.cliente_do_projeto(auth.uid(), projeto_id));
CREATE POLICY "chamados insert cliente" ON public.chamados FOR INSERT TO authenticated
  WITH CHECK (private.cliente_do_projeto(auth.uid(), projeto_id) AND autor_id = auth.uid() AND status = 'aberto');
CREATE POLICY "chamados update equipe" ON public.chamados FOR UPDATE TO authenticated
  USING (private.equipe_ve_projeto(auth.uid(), projeto_id)) WITH CHECK (private.equipe_ve_projeto(auth.uid(), projeto_id));
CREATE POLICY "chamados delete admin" ON public.chamados FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "mensagens select" ON public.chamado_mensagens FOR SELECT TO authenticated
  USING (private.equipe_ve_chamado(auth.uid(), chamado_id)
    OR (interna = false AND private.cliente_ve_chamado(auth.uid(), chamado_id)));
CREATE POLICY "mensagens insert" ON public.chamado_mensagens FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND (private.equipe_ve_chamado(auth.uid(), chamado_id)
    OR (interna = false AND private.cliente_ve_chamado(auth.uid(), chamado_id))));
CREATE POLICY "mensagens delete admin" ON public.chamado_mensagens FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "anexos chamado select" ON public.chamado_anexos FOR SELECT TO authenticated
  USING (private.equipe_ve_chamado(auth.uid(), chamado_id) OR private.cliente_ve_chamado(auth.uid(), chamado_id));
CREATE POLICY "anexos chamado insert" ON public.chamado_anexos FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND (private.equipe_ve_chamado(auth.uid(), chamado_id) OR private.cliente_ve_chamado(auth.uid(), chamado_id)));
CREATE POLICY "anexos chamado delete admin" ON public.chamado_anexos FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER chamados_updated_at BEFORE UPDATE ON public.chamados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.chamado_msg_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT NEW.interna AND private.is_membro(NEW.autor_id) THEN
    UPDATE public.chamados SET status = 'respondido' WHERE id = NEW.chamado_id AND status IN ('aberto','em_analise');
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.chamado_msg_status() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER chamado_mensagens_status AFTER INSERT ON public.chamado_mensagens
  FOR EACH ROW EXECUTE FUNCTION public.chamado_msg_status();

CREATE OR REPLACE FUNCTION public.portal_reabrir_chamado(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.cliente_ve_chamado(auth.uid(), _id) THEN RAISE EXCEPTION 'Sem acesso'; END IF;
  UPDATE public.chamados SET status = 'aberto' WHERE id = _id AND status = 'respondido';
END $$;
REVOKE ALL ON FUNCTION public.portal_reabrir_chamado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portal_reabrir_chamado(uuid) TO authenticated;

CREATE POLICY "chamados storage select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chamados' AND EXISTS (SELECT 1 FROM public.chamado_anexos a WHERE a.storage_path = name
    AND (private.equipe_ve_chamado(auth.uid(), a.chamado_id) OR private.cliente_ve_chamado(auth.uid(), a.chamado_id))));
CREATE POLICY "chamados storage insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chamados' AND (
    private.equipe_ve_chamado(auth.uid(), ((storage.foldername(name))[1])::uuid)
    OR private.cliente_ve_chamado(auth.uid(), ((storage.foldername(name))[1])::uuid)));