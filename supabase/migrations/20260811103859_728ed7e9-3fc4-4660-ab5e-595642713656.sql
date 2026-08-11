-- Cascatas para exclusão de cards
ALTER TABLE public.comentarios DROP CONSTRAINT comentarios_card_id_fkey,
  ADD CONSTRAINT comentarios_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE public.anexos_versao DROP CONSTRAINT anexos_versao_card_id_fkey,
  ADD CONSTRAINT anexos_versao_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_itens DROP CONSTRAINT checklist_itens_card_id_fkey,
  ADD CONSTRAINT checklist_itens_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;
ALTER TABLE public.card_auditoria DROP CONSTRAINT card_auditoria_card_id_fkey,
  ADD CONSTRAINT card_auditoria_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;

-- Exclusão de etapa não bloqueia cards
ALTER TABLE public.cards DROP CONSTRAINT cards_etapa_id_fkey,
  ADD CONSTRAINT cards_etapa_id_fkey FOREIGN KEY (etapa_id) REFERENCES public.etapas_kanban(id) ON DELETE SET NULL;

-- Exclusão de conta de usuário
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey,
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.cards DROP CONSTRAINT cards_responsavel_id_fkey,
  ADD CONSTRAINT cards_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.comentarios DROP CONSTRAINT comentarios_autor_id_fkey,
  ADD CONSTRAINT comentarios_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.anexos_versao DROP CONSTRAINT anexos_versao_autor_id_fkey,
  ADD CONSTRAINT anexos_versao_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.card_auditoria DROP CONSTRAINT card_auditoria_autor_id_fkey,
  ADD CONSTRAINT card_auditoria_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.projetos DROP CONSTRAINT projetos_created_by_fkey,
  ADD CONSTRAINT projetos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Papéis descontinuados viram engenheiro
DELETE FROM public.user_roles ur
 WHERE ur.role IN ('comercial','aprovador')
   AND EXISTS (SELECT 1 FROM public.user_roles x WHERE x.user_id = ur.user_id AND x.role = 'engenheiro');
UPDATE public.user_roles SET role = 'engenheiro' WHERE role IN ('comercial','aprovador');