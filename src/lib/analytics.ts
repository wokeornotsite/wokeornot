/**
 * Analytics Event Tracking
 * 
 * Unified interface for tracking user events across analytics providers
 * Currently supports: Google Analytics (GA4)
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, eventParams);
  }
};

/**
 * Track page views
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-C1RWGTWZ61', {
      page_path: url,
    });
  }
};

/**
 * Track user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
};

// ============================================
// Content Events
// ============================================

export const trackContentView = (contentId: string, contentType: 'movie' | 'tv' | 'kids', title: string) => {
  trackEvent('view_item', {
    item_id: contentId,
    item_name: title,
    item_category: contentType,
  });
};

export const trackContentSearch = (query: string, filters?: Record<string, any>) => {
  trackEvent('search', {
    search_term: query,
    ...filters,
  });
};

// ============================================
// Review Events
// ============================================

export const trackReviewSubmitted = (
  contentId: string,
  contentType: string,
  wokeScore: number,
  isAnonymous: boolean
) => {
  trackEvent('submit_review', {
    content_id: contentId,
    content_type: contentType,
    woke_score: wokeScore,
    is_anonymous: isAnonymous,
  });
};

export const trackReviewEdited = (reviewId: string, contentType: string) => {
  trackEvent('edit_review', {
    review_id: reviewId,
    content_type: contentType,
  });
};

export const trackReviewDeleted = (reviewId: string, contentType: string) => {
  trackEvent('delete_review', {
    review_id: reviewId,
    content_type: contentType,
  });
};

// ============================================
// Favorites Events
// ============================================

export const trackFavoriteAdded = (
  contentId: string,
  contentType: 'movie' | 'tv' | 'kids',
  title: string
) => {
  trackEvent('add_to_favorites', {
    content_id: contentId,
    content_type: contentType,
    content_title: title,
  });
};

export const trackFavoriteRemoved = (
  contentId: string,
  contentType: 'movie' | 'tv' | 'kids',
  title: string
) => {
  trackEvent('remove_from_favorites', {
    content_id: contentId,
    content_type: contentType,
    content_title: title,
  });
};

// ============================================
// User Events
// ============================================

export const trackSignUp = (method: 'email' | 'google') => {
  trackEvent('sign_up', {
    method,
  });
};

export const trackLogin = (method: 'email' | 'google') => {
  trackEvent('login', {
    method,
  });
};

export const trackLogout = () => {
  trackEvent('logout');
};

export const trackProfileUpdate = (field: string) => {
  trackEvent('update_profile', {
    field,
  });
};

// ============================================
// Forum Events
// ============================================

export const trackForumThreadCreated = (threadId: string, title: string) => {
  trackEvent('create_forum_thread', {
    thread_id: threadId,
    thread_title: title,
  });
};

export const trackForumCommentPosted = (threadId: string, commentId: string) => {
  trackEvent('post_forum_comment', {
    thread_id: threadId,
    comment_id: commentId,
  });
};

// ============================================
// Navigation Events
// ============================================

export const trackFilterApplied = (filterType: string, filterValue: string, page: string) => {
  trackEvent('apply_filter', {
    filter_type: filterType,
    filter_value: filterValue,
    page,
  });
};

export const trackSortApplied = (sortType: string, page: string) => {
  trackEvent('apply_sort', {
    sort_type: sortType,
    page,
  });
};

export const trackPaginationClick = (page: number, section: string) => {
  trackEvent('pagination_click', {
    page_number: page,
    section,
  });
};

// ============================================
// Engagement Events
// ============================================

export const trackShareClick = (contentType: string, contentId: string, platform: string) => {
  trackEvent('share', {
    content_type: contentType,
    content_id: contentId,
    method: platform,
  });
};

export const trackExternalLinkClick = (url: string, linkText: string) => {
  trackEvent('click_external_link', {
    link_url: url,
    link_text: linkText,
  });
};
