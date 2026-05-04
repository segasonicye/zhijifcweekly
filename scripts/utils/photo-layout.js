const path = require('path');

function extractUsedImageBasenames(markdown) {
  const usedImages = new Set();
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    usedImages.add(path.basename(match[2]));
  }
  return usedImages;
}

function normalizePhotos(photos = []) {
  return photos
    .map((p) => {
      if (typeof p === 'string') return { path: p, caption: '' };
      if (p && typeof p === 'object' && p.path) return { path: p.path, caption: p.caption || '' };
      return null;
    })
    .filter(Boolean);
}

function buildLayoutBlock(batch, mode) {
  if (batch.length === 1) {
    const p = batch[0];
    return `
<section style="margin: 25px 0; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden;">
  ![${p.caption || ''}](${p.path})
  ${p.caption ? `<div style="font-size: 13px; color: #888; padding: 8px; background: #f9f9f9;">${p.caption}</div>` : ''}
</section>\n\n`;
  }

  if (mode === 2 && batch.length === 2) {
    let block = `<section style="margin: 20px 0; display: flex; justify-content: space-between; align-items: flex-start;">`;
    batch.forEach((p) => {
      block += `
  <div style="width: 48%; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    ![${p.caption || ''}](${p.path})
  </div>`;
    });
    block += `</section>\n\n`;
    return block;
  }

  let block = `<section style="margin: 25px 0;">
  <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; padding-left: 5px; border-left: 3px solid #1890ff;">📸 精彩图集 (向左滑动)</div>
  <div style="overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; padding-bottom: 10px;">`;
  batch.forEach((p) => {
    block += `
    <div style="display: inline-block; width: 75%; margin-right: 12px; vertical-align: top; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      ![${p.caption || ''}](${p.path})
    </div>`;
  });
  block += `  </div>\n</section>\n\n`;
  return block;
}

function appendTrailingPhotoWall(photosToInsert) {
  if (!photosToInsert.length) return '';

  let html = `
<hr style="margin: 40px 0 20px; border: 0; border-top: 1px dashed #eee;" />
<section>
  <h3 style="text-align: center; margin-bottom: 15px; font-size: 16px;">更多瞬间</h3>
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">`;

  photosToInsert.forEach((p) => {
    html += `
    <div style="width: 32%; margin-bottom: 10px; border-radius: 4px; overflow: hidden;">
      ![${p.caption || ''}](${p.path})
    </div>`;
  });

  html += `  </div>\n</section>\n\n`;
  return html;
}

function autoInsertUnusedPhotos(body, photos = []) {
  const normalizedPhotos = normalizePhotos(photos);
  const usedImages = extractUsedImageBasenames(body);
  const unusedPhotos = normalizedPhotos.filter((p) => {
    if (!p.path) return false;
    if (p.path.toLowerCase().includes('logo')) return false;
    return !usedImages.has(path.basename(p.path));
  });

  if (!unusedPhotos.length) {
    return {
      changed: false,
      body,
      report: {
        usedCount: usedImages.size,
        unusedCount: 0,
        insertedCount: 0,
        insertedModes: [],
        appendedWallCount: 0
      }
    };
  }

  const paragraphs = body.split('\n\n').filter((p) => p.trim() !== '');
  const photosToInsert = [...unusedPhotos];
  const layoutPattern = [2, 1, 3, 2];
  let patternIndex = 0;
  let newBody = '';
  const insertedModes = [];

  const totalBatches = Math.ceil(photosToInsert.length / 1.8);
  const interval = Math.max(2, Math.floor(paragraphs.length / (totalBatches + 1)));

  paragraphs.forEach((para, index) => {
    newBody += para + '\n\n';

    if (photosToInsert.length > 0 && (index + 1) % interval === 0) {
      const mode = layoutPattern[patternIndex % layoutPattern.length];
      let grabCount = 1;
      if (mode === 2) grabCount = 2;
      if (mode === 3) grabCount = 3;
      grabCount = Math.min(grabCount, photosToInsert.length);

      if (grabCount > 0) {
        const batch = photosToInsert.splice(0, grabCount);
        const blockMode = batch.length === 1 ? 1 : (batch.length === 2 ? 2 : 3);
        insertedModes.push(blockMode);
        newBody += buildLayoutBlock(batch, blockMode);
        patternIndex++;
      }
    }
  });

  const trailingWallCount = photosToInsert.length;
  if (trailingWallCount > 0) {
    newBody += appendTrailingPhotoWall(photosToInsert);
  }

  return {
    changed: true,
    body: newBody,
    report: {
      usedCount: usedImages.size,
      unusedCount: unusedPhotos.length,
      insertedCount: unusedPhotos.length,
      insertedModes,
      appendedWallCount: trailingWallCount,
      interval,
      paragraphCount: paragraphs.length
    }
  };
}

module.exports = {
  autoInsertUnusedPhotos,
  normalizePhotos,
  extractUsedImageBasenames
};
