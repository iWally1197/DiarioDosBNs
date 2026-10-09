let diarioPublishedSlugsPromise;

export function loadPublishedAnimationSlugs() {
  if (!diarioPublishedSlugsPromise) {
    diarioPublishedSlugsPromise = (async () => {
      const { supabasePromise } = await import('./src-supabase.js?v=auth-fix-20261008');
      const supabase = await Promise.race([
        supabasePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo limite')), 7000))
      ]);
      if (!supabase) throw new Error('Serviço indisponível');
      const { data, error } = await supabase
        .from('animations')
        .select('slug')
        .eq('is_published', true);
      if (error) throw error;
      return new Set((data || []).map((item) => String(item.slug || '').trim()).filter(Boolean));
    })();
  }
  return diarioPublishedSlugsPromise;
}

export function isAnimationPublished(slugs, topicId, file) {
  return slugs.has(`${topicId}--${file}`);
}
