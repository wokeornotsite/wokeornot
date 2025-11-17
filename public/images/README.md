# Image Assets

This folder should contain placeholder images for the application.

## Required Images

### placeholder.png
- **Usage:** Fallback for missing movie/TV show posters
- **Recommended size:** 500x750px (2:3 aspect ratio)
- **Format:** PNG
- **Suggested content:** Simple dark gradient with "No Image Available" text or WokeOrNot logo

### avatar-placeholder.png
- **Usage:** Default user avatar when no profile image is set
- **Recommended size:** 128x128px (1:1 aspect ratio)
- **Format:** PNG
- **Suggested content:** Simple user silhouette icon or initials placeholder

## Temporary Workaround

The application will gracefully handle missing images by:
- Using gradient backgrounds for missing posters
- Using initials or default icons for avatars
- Applying blur/grayscale effects to indicate missing content

## Adding Images

To add these images:
1. Create or download appropriate placeholder images
2. Place them in this `/public/images/` directory
3. Ensure filenames match exactly: `placeholder.png` and `avatar-placeholder.png`
