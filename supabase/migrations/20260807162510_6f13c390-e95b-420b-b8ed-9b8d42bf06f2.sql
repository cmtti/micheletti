DROP POLICY IF EXISTS checklist_delete ON public.checklist_itens;
CREATE POLICY checklist_delete ON public.checklist_itens
  FOR DELETE TO authenticated
  USING (private.pode_excluir(auth.uid()));

DROP POLICY IF EXISTS roles_admin_update ON public.user_roles;
CREATE POLICY roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (
    private.has_role(auth.uid(), 'admin'::public.app_role)
    AND NOT (role = 'admin'::public.app_role AND user_id = auth.uid())
  );

GRANT UPDATE ON public.user_roles TO authenticated;