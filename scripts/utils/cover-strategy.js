const fs = require('fs');
const path = require('path');

function normalizePhotoEntry(photo) {
  if (!photo) return null;
  if (typeof photo === 'string') return { path: photo, caption: '' };
  if (typeof photo === 'object' && photo.path) return { path: photo.path, caption: photo.caption || '' };
  return null;
}

function resolveCoverPlan({ data, config = {}, options = {}, repoRoot }) {
  const root = repoRoot || path.resolve(__dirname, '../..');
  const photos = (data.photos || []).map(normalizePhotoEntry).filter(Boolean);
  const logoPath = path.join(root, 'logo-200.png');

  if (options.aiCover) {
    const baseName = options.matchFile ? path.basename(options.matchFile, '.md') : `ai-${Date.now()}`;
    const expectedPath = path.join(root, 'output/posters', `cover-${baseName}.png`);
    return {
      strategy: 'ai-cover',
      sourceType: 'generated',
      sourcePath: null,
      expectedPath,
      generatedPath: null,
      reason: '命令行启用了 --ai-cover'
    };
  }

  if (data.cover) {
    const frontmatterCover = path.resolve(root, data.cover);
    return {
      strategy: 'frontmatter-cover',
      sourceType: 'frontmatter',
      sourcePath: data.cover,
      expectedPath: frontmatterCover,
      exists: fs.existsSync(frontmatterCover),
      reason: 'frontmatter 显式指定了 cover'
    };
  }

  const defaultCover = config.defaultCover || 'logo';
  if (defaultCover === 'logo') {
    return {
      strategy: 'logo',
      sourceType: 'logo',
      sourcePath: 'logo-200.png',
      expectedPath: logoPath,
      exists: fs.existsSync(logoPath),
      reason: '配置指定默认封面为 logo'
    };
  }

  if (defaultCover === 'first-photo') {
    const firstPhoto = photos.find((p) => p.path && !p.path.toLowerCase().includes('logo'));
    if (firstPhoto) {
      const firstPhotoPath = path.resolve(root, firstPhoto.path);
      return {
        strategy: 'first-photo',
        sourceType: 'photo',
        sourcePath: firstPhoto.path,
        expectedPath: firstPhotoPath,
        exists: fs.existsSync(firstPhotoPath),
        reason: '配置指定默认封面为第一张比赛照片'
      };
    }
  }

  if (photos.length > 0) {
    const fallbackPhoto = photos.find((p) => p.path && !p.path.toLowerCase().includes('logo'));
    if (fallbackPhoto) {
      const fallbackPhotoPath = path.resolve(root, fallbackPhoto.path);
      return {
        strategy: 'fallback-photo',
        sourceType: 'photo',
        sourcePath: fallbackPhoto.path,
        expectedPath: fallbackPhotoPath,
        exists: fs.existsSync(fallbackPhotoPath),
        reason: '未命中明确策略，回退到首张比赛照片'
      };
    }
  }

  return {
    strategy: 'logo-fallback',
    sourceType: 'logo',
    sourcePath: 'logo-200.png',
    expectedPath: logoPath,
    exists: fs.existsSync(logoPath),
    reason: '无比赛照片，回退到默认 logo'
  };
}

module.exports = {
  resolveCoverPlan,
  normalizePhotoEntry
};
