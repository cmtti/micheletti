CREATE OR REPLACE FUNCTION public.protege_aprovacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.aprovado IS DISTINCT FROM OLD.aprovado
     AND NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar a aprovação de acesso';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_protege_aprovacao ON public.profiles;
CREATE TRIGGER profiles_protege_aprovacao BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protege_aprovacao();