CREATE TABLE public.card_parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_parceiros TO authenticated;
GRANT ALL ON public.card_parceiros TO service_role;

ALTER TABLE public.card_parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY parceiros_select ON public.card_parceiros FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY parceiros_insert ON public.card_parceiros FOR INSERT TO authenticated WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY parceiros_update ON public.card_parceiros FOR UPDATE TO authenticated USING (private.is_membro(auth.uid())) WITH CHECK (private.is_membro(auth.uid()));
CREATE POLICY parceiros_delete ON public.card_parceiros FOR DELETE TO authenticated USING (private.pode_excluir(auth.uid()));

CREATE INDEX idx_card_parceiros_card ON public.card_parceiros(card_id);

CREATE TRIGGER card_parceiros_updated_at BEFORE UPDATE ON public.card_parceiros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();