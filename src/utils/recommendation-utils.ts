import { NewsItem, detectCategory } from "./news-utils";

/**
 * Recommendation algorithm: reorders news based on user preferences.
 */
export const recommendNews = (
  newsArray: NewsItem[],
  preferences: Map<string, number>,
  likedIds: Set<string>
): NewsItem[] => {
  if (preferences.size === 0 && likedIds.size === 0) {
    return [...newsArray].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const maxPreferenceScore = Math.max(...Array.from(preferences.values()), 1);

  const scoredNews = newsArray.map(item => {
    let score = 0;
    const category = item.category || detectCategory(item.title || '', item.content || '');
    const source = item.source || '';

    const categoryScore = preferences.get(category) || 0;
    const normalizedCategoryScore = maxPreferenceScore > 0 ? (categoryScore / maxPreferenceScore) * 10 : 0;
    score += normalizedCategoryScore * 4;

    const sourceScore = preferences.get(`source:${source}`) || 0;
    const normalizedSourceScore = maxPreferenceScore > 0 ? (sourceScore / maxPreferenceScore) * 10 : 0;
    score += normalizedSourceScore * 2;

    const likesCount = item.likes || 0;
    if (likesCount > 0) {
      const likesBonus = Math.log10(1 + likesCount) * 1.5;
      score += likesBonus;
    }

    try {
      const newsDate = new Date(item.date || Date.now());
      const daysSincePublication = (Date.now() - newsDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublication < 0.5) score += 3;
      else if (daysSincePublication < 1) score += 2.5;
      else if (daysSincePublication < 3) score += 2;
      else if (daysSincePublication < 7) score += 1;
      else if (daysSincePublication < 30) score += 0.5;
    } catch (e) {
      // Ignore date errors
    }

    if (item.content && item.content.length > 100) {
      score += 0.5;
    }

    if (item.url) {
      score += 0.3;
    }

    return { item, score };
  });

  scoredNews.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
    const dateA = new Date(a.item.date).getTime();
    const dateB = new Date(b.item.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return b.item.id.localeCompare(a.item.id);
  });

  return scoredNews.map(n => n.item);
};
