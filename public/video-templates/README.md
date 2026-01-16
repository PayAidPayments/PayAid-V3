# Video Templates

Place your video templates in this directory.

## Required Templates

Based on the template configuration in `lib/ai-influencer/video-templates.ts`, you need:

1. **testimonial-female-indoor.mp4** - Female testimonial style (30s)
2. **testimonial-male-indoor.mp4** - Male testimonial style (30s)
3. **demo-female.mp4** - Product demo style (45s)
4. **problem-solution-female.mp4** - Problem-solution style (40s)

## Template Requirements

- **Format:** MP4 (H.264 codec recommended)
- **Resolution:** 1080p (1920x1080) or 720p (1280x720)
- **Frame Rate:** 30fps
- **Duration:** Match the duration specified in template config
- **Content:** Pre-recorded videos with neutral backgrounds, suitable for face overlay

## Creating Templates

You can:
1. Record videos with actors/models
2. Use stock video footage
3. Create animated templates
4. Use AI-generated video backgrounds

## Production

In production, templates should be stored in:
- PayAid Drive
- S3/Cloud Storage
- CDN

Update `lib/ai-influencer/video-templates.ts` to use cloud URLs.
