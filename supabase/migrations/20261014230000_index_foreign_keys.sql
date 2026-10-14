begin;

-- Add covering indexes for foreign keys reported by the Supabase performance advisor.
-- These speed up joins and parent-row updates/deletes without changing access rules or data.
create index if not exists idx_activities_animation_id on public.activities (animation_id);
create index if not exists idx_activities_created_by on public.activities (created_by);
create index if not exists idx_activities_reviewed_by on public.activities (reviewed_by);
create index if not exists idx_activity_resources_activity_id on public.activity_resources (activity_id);
create index if not exists idx_activity_resources_created_by on public.activity_resources (created_by);
create index if not exists idx_activity_submissions_classroom_activity on public.activity_submissions (classroom_id, activity_id);
create index if not exists idx_animations_created_by on public.animations (created_by);
create index if not exists idx_class_announcements_classroom_id on public.class_announcements (classroom_id);
create index if not exists idx_class_announcements_created_by on public.class_announcements (created_by);
create index if not exists idx_class_lessons_classroom_id on public.class_lessons (classroom_id);
create index if not exists idx_class_lessons_created_by on public.class_lessons (created_by);
create index if not exists idx_class_permissions_updated_by on public.class_permissions (updated_by);
create index if not exists idx_class_resources_classroom_id on public.class_resources (classroom_id);
create index if not exists idx_class_resources_created_by on public.class_resources (created_by);
create index if not exists idx_classroom_activities_assigned_by on public.classroom_activities (assigned_by);
create index if not exists idx_classroom_activities_related_lesson_id on public.classroom_activities (related_lesson_id);
create index if not exists idx_classrooms_created_by on public.classrooms (created_by);
create index if not exists idx_courses_created_by on public.courses (created_by);
create index if not exists idx_downloads_animation_id on public.downloads (animation_id);
create index if not exists idx_downloads_created_by on public.downloads (created_by);
create index if not exists idx_favorites_animation_id on public.favorites (animation_id);
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress (lesson_id);
create index if not exists idx_physics_ai_messages_conversation_user on public.physics_ai_messages (conversation_id, user_id);
create index if not exists idx_physics_ai_messages_user_id on public.physics_ai_messages (user_id);
create index if not exists idx_site_settings_updated_by on public.site_settings (updated_by);
create index if not exists idx_submission_feedback_teacher_id on public.submission_feedback (teacher_id);
create index if not exists idx_teacher_verifications_reviewed_by on public.teacher_verifications (reviewed_by);

commit;
