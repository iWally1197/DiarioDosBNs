begin;

-- Rotinas chamadas apenas por gatilhos não precisam ser expostas pela API.
revoke execute on function public.notify_activity_resubmission() from public, anon, authenticated;
revoke execute on function public.notify_class_activity() from public, anon, authenticated;
revoke execute on function public.notify_class_content() from public, anon, authenticated;
revoke execute on function public.notify_class_join() from public, anon, authenticated;
revoke execute on function public.notify_student_feedback() from public, anon, authenticated;
revoke execute on function public.protect_activity_review_fields() from public, anon, authenticated;
revoke execute on function public.seed_class_permissions() from public, anon, authenticated;
revoke execute on function public.seed_teacher_verification() from public, anon, authenticated;

-- Estas rotinas internas aparecem nas regras RLS de usuários conectados.
-- O acesso autenticado continua liberado para as políticas; visitantes não precisam chamá-las.
revoke execute on function public.is_student_of_class(uuid) from public, anon;
grant execute on function public.is_student_of_class(uuid) to authenticated;
revoke execute on function public.is_teacher_for_student(uuid) from public, anon;
grant execute on function public.is_teacher_for_student(uuid) to authenticated;
revoke execute on function public.is_teacher_of_class(uuid) from public, anon;
grant execute on function public.is_teacher_of_class(uuid) to authenticated;
revoke execute on function public.is_verified_teacher_of_class(uuid) from public, anon;
grant execute on function public.is_verified_teacher_of_class(uuid) to authenticated;
revoke execute on function public.student_has_activity(uuid, uuid) from public, anon;
grant execute on function public.student_has_activity(uuid, uuid) to authenticated;

commit;

