/**
 * Pre-canned warn / ban reason templates surfaced in the admin moderation
 * dialogs. Admins can pick a template to auto-fill the textarea, then edit
 * freely before submitting.
 *
 * Adding a new template: append an entry below. Keep `key` stable; UI uses it.
 */

export type ModerationTemplate = {
  key: string;
  label: string;
  body: string;
};

export const WARN_TEMPLATES: ModerationTemplate[] = [
  {
    key: 'spam',
    label: 'Spam / promotional content',
    body: 'Your account has been flagged for posting spam or promotional content. Please review our community guidelines.',
  },
  {
    key: 'incivility',
    label: 'Personal attack / incivility',
    body: 'Your recent activity contained personal attacks or uncivil language. Please keep discussion respectful.',
  },
  {
    key: 'low-effort',
    label: 'Low-effort / off-topic reviews',
    body: 'Your reviews appear to be low-effort or unrelated to the rated content. Please provide substantive feedback.',
  },
  {
    key: 'rating-abuse',
    label: 'Rating manipulation',
    body: 'Your rating pattern suggests manipulation (e.g., coordinated voting, sockpuppeting). Please rate honestly.',
  },
];

export const BAN_TEMPLATES: ModerationTemplate[] = [
  {
    key: 'repeat-violations',
    label: 'Repeat policy violations',
    body: 'Account suspended after repeated violations of our community guidelines despite prior warnings.',
  },
  {
    key: 'harassment',
    label: 'Harassment / threats',
    body: 'Account suspended for harassment, threats, or targeted abuse toward other community members.',
  },
  {
    key: 'spam-account',
    label: 'Spam / bot account',
    body: 'Account suspended — identified as a spam or automated account.',
  },
  {
    key: 'illegal-content',
    label: 'Illegal or prohibited content',
    body: 'Account suspended for posting illegal or otherwise prohibited content.',
  },
];
