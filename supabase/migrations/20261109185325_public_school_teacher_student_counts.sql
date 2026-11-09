LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE public.public_account_counts (
  id boolean PRIMARY KEY DEFAULT true CHECK (id IS TRUE),
  students bigint NOT NULL DEFAULT 0 CHECK (students >= 0),
  teachers bigint NOT NULL DEFAULT 0 CHECK (teachers >= 0),
  schools bigint NOT NULL DEFAULT 0 CHECK (schools >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_account_counts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_account_counts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_account_counts TO anon, authenticated;

CREATE POLICY public_account_counts_read
  ON public.public_account_counts
  FOR SELECT TO anon, authenticated
  USING (id IS TRUE);

INSERT INTO public.public_account_counts (id, students, teachers, schools)
SELECT
  true,
  count(*) FILTER (WHERE role = 'aluno' AND status IN ('active','pending')),
  count(*) FILTER (WHERE role = 'professor' AND status IN ('active','pending')),
  count(*) FILTER (WHERE role = 'escola' AND status IN ('active','pending'))
FROM public.user_roles;

CREATE FUNCTION public.sync_public_account_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_students bigint := 0;
  v_teachers bigint := 0;
  v_schools bigint := 0;
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.status IN ('active','pending') THEN
    CASE OLD.role
      WHEN 'aluno' THEN v_students := v_students - 1;
      WHEN 'professor' THEN v_teachers := v_teachers - 1;
      WHEN 'escola' THEN v_schools := v_schools - 1;
      ELSE NULL;
    END CASE;
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.status IN ('active','pending') THEN
    CASE NEW.role
      WHEN 'aluno' THEN v_students := v_students + 1;
      WHEN 'professor' THEN v_teachers := v_teachers + 1;
      WHEN 'escola' THEN v_schools := v_schools + 1;
      ELSE NULL;
    END CASE;
  END IF;

  UPDATE public.public_account_counts
  SET students = students + v_students,
      teachers = teachers + v_teachers,
      schools = schools + v_schools,
      updated_at = now()
  WHERE id IS TRUE;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_public_account_counts() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER public_account_counts_track_insert_delete
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_account_counts();

CREATE TRIGGER public_account_counts_track_role_status_update
AFTER UPDATE OF role, status ON public.user_roles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_public_account_counts();

NOTIFY pgrst, 'reload schema';