let diarioPublishedSlugsPromise;

function withDeadline(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}

export function loadPublishedAnimationSlugs() {
  if (!diarioPublishedSlugsPromise) {
    const request = (async () => {
      const { supabasePromise } = await import('./src-supabase.js?v=auth-fix-20261008');
      const supabase = await withDeadline(
        supabasePromise,
        5000,
        'O serviço de publicação demorou para iniciar.'
      );
      if (!supabase) throw new Error('Serviço indisponível');
      const { data, error } = await withDeadline(
        supabase.from('animations').select('slug').eq('is_published', true),
        5000,
        'A consulta de publicação demorou para responder.'
      );
      if (error) throw error;
      return new Set((data || []).map((item) => String(item.slug || '').trim()).filter(Boolean));
    })();
    const cached = request.catch((error) => {
      if (diarioPublishedSlugsPromise === cached) diarioPublishedSlugsPromise = null;
      throw error;
    });
    diarioPublishedSlugsPromise = cached;
  }
  return diarioPublishedSlugsPromise;
}

export function isAnimationPublished(slugs, topicId, file) {
  return slugs.has(`${topicId}--${file}`);
}
