CREATE TABLE public.tipos_projeto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.tipos_projeto TO authenticated;
GRANT ALL ON public.tipos_projeto TO service_role;
ALTER TABLE public.tipos_projeto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aprovados leem tipos" ON public.tipos_projeto FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.aprovado));
CREATE POLICY "Aprovados criam tipos" ON public.tipos_projeto FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.aprovado));
CREATE POLICY "Aprovados excluem tipos" ON public.tipos_projeto FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.aprovado));
INSERT INTO public.tipos_projeto (nome) VALUES
 ('residencial'),('comercial'),('industrial'),('subestação'),('iluminação'),('automação');