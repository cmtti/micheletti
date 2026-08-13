CREATE TYPE public.orcamento_status AS ENUM ('enviado','aprovado','recusado');
CREATE TYPE public.orcamento_item_tipo AS ENUM ('norma','atividade','parcela');

CREATE TABLE public.empresa_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL DEFAULT 'Lenzee Engenharia Elétrica e Consultoria',
  cnpj text NOT NULL DEFAULT '43.023.576/0001-87',
  crea text NOT NULL DEFAULT '2537550',
  engenheiro_nome text NOT NULL DEFAULT 'Hugo Henrique Coelho',
  engenheiro_titulo text NOT NULL DEFAULT 'Eng. Eletricista',
  engenheiro_crea text NOT NULL DEFAULT '5069773703',
  cidade_emissao text NOT NULL DEFAULT 'São Carlos',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_config TO authenticated;
GRANT ALL ON public.empresa_config TO service_role;
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY empresa_config_select ON public.empresa_config FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY empresa_config_insert ON public.empresa_config FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY empresa_config_update ON public.empresa_config FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER empresa_config_updated_at BEFORE UPDATE ON public.empresa_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.empresa_config DEFAULT VALUES;

CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  sequencial integer NOT NULL,
  ano integer NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL DEFAULT '',
  cliente_cnpj text,
  atividade text NOT NULL DEFAULT '',
  condicao text,
  local_obra text,
  escopo text,
  validade date,
  valor numeric NOT NULL DEFAULT 0,
  valor_descricao text NOT NULL DEFAULT 'Valor de Investimento do projeto das instalações elétricas',
  parcelas integer NOT NULL DEFAULT 1,
  condicao_pagamento text,
  prazo_entrega text,
  observacoes text,
  status public.orcamento_status NOT NULL DEFAULT 'enviado',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX orcamentos_ano_seq_idx ON public.orcamentos(ano, sequencial);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY orcamentos_select ON public.orcamentos FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY orcamentos_insert ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY orcamentos_update ON public.orcamentos FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY orcamentos_delete ON public.orcamentos FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));
CREATE TRIGGER orcamentos_updated_at BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  tipo public.orcamento_item_tipo NOT NULL,
  texto text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orcamento_itens_orcamento_idx ON public.orcamento_itens(orcamento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_itens TO authenticated;
GRANT ALL ON public.orcamento_itens TO service_role;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY orcamento_itens_select ON public.orcamento_itens FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY orcamento_itens_insert ON public.orcamento_itens FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY orcamento_itens_update ON public.orcamento_itens FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY orcamento_itens_delete ON public.orcamento_itens FOR DELETE TO authenticated USING (private.is_membro(auth.uid()));