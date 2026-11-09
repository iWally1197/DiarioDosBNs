ALTER TABLE public.school_profiles
  ADD CONSTRAINT school_profiles_education_levels_valid
    CHECK (
      cardinality(education_levels) > 0
      AND education_levels <@ ARRAY[
        'Educação Infantil','Ensino Fundamental I','Ensino Fundamental II','Ensino Médio',
        'Ensino Técnico','Ensino Superior','Educação de Jovens e Adultos (EJA)','Educação Especial'
      ]::text[]
    ),
  ADD CONSTRAINT school_profiles_contact_phone_valid
    CHECK (length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 13),
  ADD CONSTRAINT school_profiles_institutional_email_valid
    CHECK (institutional_email IS NULL OR institutional_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  ADD CONSTRAINT school_profiles_website_url_valid
    CHECK (website_url IS NULL OR website_url ~* '^https?://');
