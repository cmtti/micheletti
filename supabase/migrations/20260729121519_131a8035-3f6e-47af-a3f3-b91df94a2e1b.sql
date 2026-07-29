
CREATE TYPE public.app_role AS ENUM ('admin','engenheiro','comercial','aprovador');
CREATE TYPE public.prioridade AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.projeto_status AS ENUM ('ativo','concluido','cancelado');
CREATE TYPE public.anexo_status AS ENUM ('rascunho','em_revisao','final_aprovado');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "roles_admin_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'admin'::public.app_role ELSE 'engenheiro'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_all" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.etapas_kanban (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  cor TEXT NOT NULL DEFAULT 'slate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapas_kanban TO authenticated;
GRANT ALL ON public.etapas_kanban TO service_role;
ALTER TABLE public.etapas_kanban ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapas_all" ON public.etapas_kanban FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.etapas_kanban (nome, ordem, cor) VALUES
 ('Solicitação/Backlog',1,'slate'),
 ('Em Orçamento',2,'blue'),
 ('Orçamento Enviado',3,'cyan'),
 ('Em Desenvolvimento',4,'indigo'),
 ('Em Revisão Técnica',5,'amber'),
 ('Aguardando Aprovação do Cliente',6,'violet'),
 ('Concluído/Entregue',7,'green'),
 ('Arquivado/Cancelado',8,'red');

CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'residencial',
  status public.projeto_status NOT NULL DEFAULT 'ativo',
  descricao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT ALL ON public.projetos TO service_role;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projetos_all" ON public.projetos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa_id UUID REFERENCES public.etapas_kanban(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  inicio_previsto DATE,
  fim_previsto DATE,
  inicio_real DATE,
  fim_real DATE,
  percentual INTEGER NOT NULL DEFAULT 0 CHECK (percentual BETWEEN 0 AND 100),
  prioridade public.prioridade NOT NULL DEFAULT 'media',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  custo_estimado NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo_real NUMERIC(14,2) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_all" ON public.cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentarios TO authenticated;
GRANT ALL ON public.comentarios TO service_role;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comentarios_select" ON public.comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "comentarios_insert" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "comentarios_update_own" ON public.comentarios FOR UPDATE TO authenticated USING (auth.uid() = autor_id);
CREATE POLICY "comentarios_delete_own" ON public.comentarios FOR DELETE TO authenticated USING (auth.uid() = autor_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.anexos_versao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  revisao INTEGER NOT NULL DEFAULT 1,
  status public.anexo_status NOT NULL DEFAULT 'rascunho',
  storage_path TEXT,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos_versao TO authenticated;
GRANT ALL ON public.anexos_versao TO service_role;
ALTER TABLE public.anexos_versao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_all" ON public.anexos_versao FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  norma TEXT NOT NULL,
  descricao TEXT,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_itens TO authenticated;
GRANT ALL ON public.checklist_itens TO service_role;
ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_all" ON public.checklist_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.projetos_apoio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome TEXT NOT NULL,
  storage_path TEXT,
  link_referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos_apoio TO authenticated;
GRANT ALL ON public.projetos_apoio TO service_role;
ALTER TABLE public.projetos_apoio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apoio_all" ON public.projetos_apoio FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.card_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  detalhe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.card_auditoria TO authenticated;
GRANT ALL ON public.card_auditoria TO service_role;
ALTER TABLE public.card_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria_select" ON public.card_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "auditoria_insert" ON public.card_auditoria FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
