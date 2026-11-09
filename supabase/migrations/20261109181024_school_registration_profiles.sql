CREATE TABLE public.school_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text NOT NULL CHECK (char_length(btrim(school_name)) BETWEEN 2 AND 180),
  school_type text NOT NULL CHECK (school_type IN ('municipal','estadual','federal','privada','comunitaria','confessional','militar','outra')),
  inep_code text CHECK (inep_code IS NULL OR inep_code ~ '^[0-9]{8}$'),
  director_name text NOT NULL CHECK (char_length(btrim(director_name)) BETWEEN 2 AND 160),
  responsible_position text NOT NULL CHECK (char_length(btrim(responsible_position)) BETWEEN 2 AND 120),
  contact_phone text NOT NULL CHECK (char_length(btrim(contact_phone)) BETWEEN 8 AND 30),
  institutional_email text,
  postal_code text CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{8}$'),
  street text NOT NULL CHECK (char_length(btrim(street)) BETWEEN 2 AND 180),
  address_number text NOT NULL CHECK (char_length(btrim(address_number)) BETWEEN 1 AND 30),
  address_complement text,
  neighborhood text NOT NULL CHECK (char_length(btrim(neighborhood)) BETWEEN 2 AND 120),
  city text NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 120),
  state char(2) NOT NULL CHECK (state ~ '^[A-Z]{2}$'),
  website_url text,
  education_levels text[] NOT NULL CHECK (cardinality(education_levels) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX school_profiles_inep_code_unique
  ON public.school_profiles (inep_code)
  WHERE inep_code IS NOT NULL;

ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.school_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.school_profiles TO authenticated;

DROP POLICY IF EXISTS school_profiles_select_own_or_admin ON public.school_profiles;
CREATE POLICY school_profiles_select_own_or_admin
  ON public.school_profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS school_profiles_update_own_or_admin ON public.school_profiles;
CREATE POLICY school_profiles_update_own_or_admin
  ON public.school_profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
  WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_requested text;
  v_role public.account_role;
  v_status public.account_status;
  v_age text;
  v_education text;
  v_degree text;
  v_school_name text;
  v_school_type text;
  v_inep_code text;
  v_school_stages text[];
  v_school_email text;
  v_postal_code text;
  v_state text;
  v_website_url text;
BEGIN
  IF new.raw_user_meta_data->>'terms_version' IS DISTINCT FROM '1.0'
     OR new.raw_user_meta_data->>'privacy_version' IS DISTINCT FROM '1.1' THEN
    RAISE EXCEPTION 'Aceite vigente dos termos e da política é obrigatório.';
  END IF;

  v_requested := new.raw_user_meta_data->>'requested_role';
  IF v_requested IS NULL OR v_requested NOT IN ('aluno','professor','escola') THEN
    RAISE EXCEPTION 'Escolha aluno, professor ou escola para criar a conta.';
  END IF;

  IF NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'display_name','')),'') IS NULL THEN
    RAISE EXCEPTION 'Informe seu nome para criar a conta.';
  END IF;

  IF v_requested='professor' THEN
    IF new.raw_user_meta_data->>'teacher_verification_ack' IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Confirme que a conta de professor precisa de aprovação.';
    END IF;
    v_role := 'professor';
    v_status := 'pending';
  ELSIF v_requested='escola' THEN
    IF new.raw_user_meta_data->>'school_registration_ack' IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Confirme que você está autorizado a cadastrar esta escola.';
    END IF;
    v_role := 'escola';
    v_status := 'pending';
  ELSE
    v_role := 'aluno';
    v_status := 'active';
  END IF;

  v_age := CASE WHEN new.raw_user_meta_data->>'age_range' IN
    ('Até 12 anos','13 a 15 anos','16 a 17 anos','18 a 24 anos','25 a 39 anos','40 anos ou mais')
    THEN new.raw_user_meta_data->>'age_range' ELSE NULL END;
  v_education := CASE WHEN new.raw_user_meta_data->>'education_level' IN
    ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro')
    THEN new.raw_user_meta_data->>'education_level' ELSE NULL END;
  v_degree := CASE WHEN new.raw_user_meta_data->>'teacher_degree_level' IN
    ('Bacharelado','Licenciatura','Tecnólogo','Especialização','Mestrado acadêmico','Mestrado profissional','Doutorado acadêmico','Doutorado profissional','Ainda cursando graduação','Outro')
    THEN new.raw_user_meta_data->>'teacher_degree_level' ELSE NULL END;

  IF v_requested <> 'escola' AND v_age IS NULL THEN
    RAISE EXCEPTION 'Selecione sua faixa etária.';
  END IF;
  IF v_requested='aluno' AND v_education IS NULL THEN
    RAISE EXCEPTION 'Selecione sua etapa de ensino.';
  END IF;
  IF v_requested='professor' AND (
    v_degree IS NULL OR NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'teacher_degree_program','')),'') IS NULL
  ) THEN
    RAISE EXCEPTION 'Informe sua formação docente.';
  END IF;

  IF v_requested='escola' THEN
    v_school_name := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_name','')),'');
    v_school_type := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_type','')),'');
    v_inep_code := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_inep_code','')),'');
    v_school_email := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_institutional_email','')),'');
    v_postal_code := NULLIF(REGEXP_REPLACE(COALESCE(new.raw_user_meta_data->>'school_postal_code',''),'[^0-9]','','g'),'');
    v_state := UPPER(TRIM(COALESCE(new.raw_user_meta_data->>'school_state','')));
    v_website_url := NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_website_url','')),'');

    IF char_length(COALESCE(v_school_name,'')) NOT BETWEEN 2 AND 180 THEN
      RAISE EXCEPTION 'Informe o nome da escola (de 2 a 180 caracteres).';
    END IF;
    IF v_school_type NOT IN ('municipal','estadual','federal','privada','comunitaria','confessional','militar','outra') THEN
      RAISE EXCEPTION 'Selecione a rede ou o tipo administrativo da escola.';
    END IF;
    IF v_inep_code IS NOT NULL AND v_inep_code !~ '^[0-9]{8}$' THEN
      RAISE EXCEPTION 'O código INEP deve ter 8 números.';
    END IF;
    IF char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_director_name','')),'')) NOT BETWEEN 2 AND 160 THEN
      RAISE EXCEPTION 'Informe o nome completo do diretor ou da diretora.';
    END IF;
    IF char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_responsible_position','')),'')) NOT BETWEEN 2 AND 120 THEN
      RAISE EXCEPTION 'Informe sua função na escola.';
    END IF;
    IF length(regexp_replace(COALESCE(new.raw_user_meta_data->>'school_contact_phone',''),'[^0-9]','','g')) NOT BETWEEN 10 AND 13 THEN
      RAISE EXCEPTION 'Informe um telefone escolar válido com DDD.';
    END IF;
    IF v_school_email IS NOT NULL AND v_school_email !~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'Informe um e-mail institucional válido.';
    END IF;
    IF v_postal_code IS NOT NULL AND v_postal_code !~ '^[0-9]{8}$' THEN
      RAISE EXCEPTION 'O CEP deve ter 8 números.';
    END IF;
    IF char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_street','')),'')) NOT BETWEEN 2 AND 180
       OR char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_address_number','')),'')) NOT BETWEEN 1 AND 30
       OR char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_neighborhood','')),'')) NOT BETWEEN 2 AND 120
       OR char_length(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'school_city','')),'')) NOT BETWEEN 2 AND 120 THEN
      RAISE EXCEPTION 'Informe o endereço completo da escola, incluindo bairro e cidade.';
    END IF;
    IF v_state !~ '^[A-Z]{2}$' THEN
      RAISE EXCEPTION 'Selecione a UF da escola.';
    END IF;
    IF v_website_url IS NOT NULL AND v_website_url !~* '^https?://' THEN
      RAISE EXCEPTION 'Informe o site institucional começando com https:// ou http://.';
    END IF;
    IF jsonb_typeof(new.raw_user_meta_data->'school_education_levels') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Selecione ao menos uma etapa de ensino atendida pela escola.';
    END IF;
    SELECT COALESCE(array_agg(value), ARRAY[]::text[])
      INTO v_school_stages
      FROM jsonb_array_elements_text(new.raw_user_meta_data->'school_education_levels') AS stages(value);
    IF cardinality(v_school_stages) = 0 OR NOT (v_school_stages <@ ARRAY[
      'Educação Infantil','Ensino Fundamental I','Ensino Fundamental II','Ensino Médio',
      'Ensino Técnico','Ensino Superior','Educação de Jovens e Adultos (EJA)','Educação Especial'
    ]::text[]) THEN
      RAISE EXCEPTION 'Revise as etapas de ensino selecionadas.';
    END IF;
  END IF;

  INSERT INTO public.profiles(
    id, display_name, terms_version, privacy_version, age_range,
    education_level, education_detail, teacher_degree_level,
    teacher_degree_program, teacher_institution
  ) VALUES (
    new.id,
    LEFT(COALESCE(new.raw_user_meta_data->>'display_name',''),100),
    '1.0',
    '1.1',
    CASE WHEN v_requested='escola' THEN NULL ELSE v_age END,
    v_education,
    NULLIF(LEFT(COALESCE(new.raw_user_meta_data->>'education_detail',''),100),''),
    v_degree,
    NULLIF(LEFT(COALESCE(new.raw_user_meta_data->>'teacher_degree_program',''),160),''),
    NULLIF(LEFT(COALESCE(new.raw_user_meta_data->>'teacher_institution',''),160),'')
  );

  IF v_requested='escola' THEN
    INSERT INTO public.school_profiles(
      user_id, school_name, school_type, inep_code, director_name,
      responsible_position, contact_phone, institutional_email, postal_code,
      street, address_number, address_complement, neighborhood, city, state,
      website_url, education_levels
    ) VALUES (
      new.id,
      v_school_name,
      v_school_type,
      v_inep_code,
      LEFT(TRIM(new.raw_user_meta_data->>'school_director_name'),160),
      LEFT(TRIM(new.raw_user_meta_data->>'school_responsible_position'),120),
      LEFT(TRIM(new.raw_user_meta_data->>'school_contact_phone'),30),
      v_school_email,
      v_postal_code,
      LEFT(TRIM(new.raw_user_meta_data->>'school_street'),180),
      LEFT(TRIM(new.raw_user_meta_data->>'school_address_number'),30),
      NULLIF(LEFT(TRIM(COALESCE(new.raw_user_meta_data->>'school_address_complement','')),120),''),
      LEFT(TRIM(new.raw_user_meta_data->>'school_neighborhood'),120),
      LEFT(TRIM(new.raw_user_meta_data->>'school_city'),120),
      v_state,
      v_website_url,
      v_school_stages
    );
  END IF;

  INSERT INTO public.user_roles(user_id,role,status)
  VALUES(new.id,v_role,v_status);

  RETURN new;
END;
$function$;

NOTIFY pgrst, 'reload schema';