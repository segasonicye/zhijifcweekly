# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a match report management system for 河伯FC (Hebo FC) / 知己FC, an amateur football team. The system uses Markdown files with YAML frontmatter to store match reports, and generates HTML pages, statistics, and WeChat Official Account-compatible articles.

**Team Name Note**: The codebase references both "河伯FC" (Hebo FC) and "知己FC" (Zhiji FC) - these refer to the same team. Use "知己FC" in new code/statistics for consistency.

## Important Workflow Notes

**After creating or modifying match reports, you MUST regenerate output files:**
- Run `npm run matches` to regenerate the matches.html page with updated match listings
- Run `npm run stats` to update statistics if match data changed
- The `output/` directory contains generated files that are not automatically updated when `matches/` files change

## Key Commands

### Content Creation
- `npm run new` - Interactive prompt to create a new match report Markdown file in `matches/`
- `npm run parse` - Parse existing match report text and extract structured data (goals, attendance)
- `npm run add-photos` - Add photo references to match reports interactively

### Statistics & Analysis
- `npm run stats` - Generate attendance and MVP statistics from all match reports, outputs to `stats/` directory

### HTML Generation
- `npm run matches` - Generate modern HTML match viewing page with glassmorphism design (outputs to `output/matches.html`)
- `npm run matches-classic` - Generate classic HTML match list view
- `npm run preview` - Preview a specific match report as HTML

### Deployment
- `npm run deploy` - Deploy to Netlify (requires Netlify CLI setup)
- `npm run deploy-drop` - Quick deploy via Netlify Drop
- `npm run deploy-cli` - Deploy using Netlify CLI
- `npm run deploy-auto` - Automated deployment script
- `npm run setup-netlify` - Initial Netlify setup

### Utilities
- `npm run update` - Update/integrated command for various operations
- `npm run parse` - Parse existing match report text and extract structured data
- `npm run auto-parse` - Auto-parse utility

### Voting & Engagement
- `npm run vote` - Generate WeChat article for team anthem voting (interactive prompt)

## Architecture

### Data Model

Match reports are stored as Markdown files with YAML frontmatter in `matches/` directory:

```yaml
---
title: "比赛标题"
date: '2026-01-03'
opponent: 党校队
score: 20-26
location: 福沁球场
mvp: 高主席
photos: []
scorers:
  - name: 高主席
    goals: 7
attendance: []
---
```

**Key fields:**
- `scorers` - Can have `name` + `goals` (count) OR `name` + `minute` (specific time) + optional `assist`
- `attendance` - Array of player names who attended
- `mvp` - Single player name for Man of the Match
- `photos` - Array of photo objects with `path` and `caption`

### Core Scripts

**new-post.js** - Interactive CLI for creating match reports
- Uses Node.js `readline` for user input (no external CLI dependencies)
- Generates filename as `{date}-{opponent}.md`
- Creates corresponding photos directory at `photos/{date}/`
- Auto-opens photos folder using platform-specific commands (`open` on macOS, `explorer` on Windows, `xdg-open` on Linux)
- Replaces template variables: `title`, `date`, `opponent`, `score`, `location`, `attendance`, photo paths

**parse-report.js** - Extract structured data from unstructured text
- Uses regex patterns to find goals from Chinese text (e.g., "12分钟 XX 破门")
- Extracts player names from comma/顿号 separated lists
- Useful for migrating existing reports

**generate-stats.js** - Statistics aggregation and ranking
- Parses all `.md` files in `matches/` directory using `gray-matter`
- Tracks: attendance counts, MVP awards, total matches
- Outputs both JSON (`stats/stats.json`) and Markdown (`stats/stats.md`)
- Calculates attendance rates and MVP rankings
- Sorts matches by date (newest first)
- Exports `parseMatches()`, `calculateStats()`, `generateRankings()` functions for reuse

**modern-matches.js** - Modern HTML generator (glassmorphism design)
- Generates `output/matches.html` with responsive design
- Calculates MVP statistics across all matches
- Creates single-page app with match cards and MVP leaderboard
- Uses CSS features: `backdrop-filter` for glass effects, CSS Grid/Flexbox
- Auto-opens in browser after generation (platform-specific)
- All CSS is inline for portability

### Photo Organization

Photos are stored in `photos/YYYY-MM-DD/` directories and referenced in match reports. The system supports:
- Manual photo organization
- Photo renaming via `organize-photos.js` (sequential numbering)
- Photo embedding in generated HTML

## File Structure

```
matches/           # Source Markdown files with frontmatter
photos/            # Organized by date: YYYY-MM-DD/
stats/             # Generated statistics (JSON + Markdown)
output/            # Generated HTML files
templates/         # Match report template
scripts/           # All utility scripts
```

## Working with Match Reports

When editing or creating match reports:
1. Always use the template structure from `templates/match-template.md`
2. Ensure dates are in YYYY-MM-DD format
3. Use Chinese punctuation for Chinese text (顿号、 for lists)
4. Keep scorer data consistent - either use `goals` count or `minute` specific times
5. MVP and attendance data drives the statistics generation

## Development Notes

- **Dependencies**: Only `gray-matter` (for YAML frontmatter parsing) is required for core functionality
- **No build step**: All scripts are plain Node.js, run directly with `node scripts/name.js`
- **HTML generation**: Uses inline CSS for portability (no external stylesheets)
- **Modern design**: CSS gradients, `backdrop-filter` for glassmorphism, CSS Grid/Flexbox
- **Mobile-responsive**: Media queries for responsive layouts
- **Deployment**: Netlify for static hosting (devDependency: `netlify-cli`)
- **File encoding**: All files use UTF-8
- **Date format**: Always use `YYYY-MM-DD` format for consistency

## Adding New Features

When extending the system:
1. Follow the existing pattern: CLI input → parse data → generate output
2. Use `gray-matter` for reading/writing match report frontmatter
3. Auto-open generated files in browser using platform detection pattern
4. Store generated files in `output/` directory
5. Export functions from scripts for potential reuse by other scripts

## WeChat Integration

The WeChat workflow uses multiple scripts for different publishing needs:

**Standard Publishing:**
- `sync-wechat.js` - Converts match reports to WeChat-compatible HTML with inline styles
- `wechat-auto.js` - Automated WeChat article generation
- `wechat-specific.js` - Generate article for specific date (`npm run wechat:date`)
- `wechat-workflow.js` - Full WeChat publishing workflow (`npm run wechat:latest` for latest, `npm run wechat:all` for all)

**Style-Specific Publishing (NEW):**
- `publish:ins` - Generate WeChat article with Ins/Instagram style (minimalist, elegant, for 内战/internal matches)
- `publish:battle` - Generate WeChat article with "hot-blooded" battle style (passionate red theme, for 外战/external matches)
- `wechat-template-ins.js` - Ins-style template (clean, black/white/gray with gradient accents)
- `wechat-template-battle.js` - Battle-style template (red theme, intense combat atmosphere)

**WeChat Bot (EXPERIMENTAL):**
- `wechat-bot.js` - WeChat bot for automated match report creation via WeChat
  - Requires: `npm install wechaty wechaty-puppet-wechat file-box`
  - Commands: `/new`, `/info`, `/finish`, `/publish`, `/help`
  - Supports text and image input directly from WeChat
  - Automatically generates Markdown files in `matches/` directory
  - See `BOT_QUICKSTART.md` for setup instructions

All WeChat scripts generate HTML with inline CSS (no external stylesheets) as required by WeChat Official Account editor.

## Platform Compatibility

Scripts use platform detection for file operations:
- **macOS**: Uses `open` command to open folders/URLs
- **Windows**: Uses `explorer` command
- **Linux**: Uses `xdg-open` command

See `new-post.js:167-180` for the auto-open implementation pattern.

## Template System Architecture

The system uses a modular template architecture for WeChat publishing:

1. **Template Pattern** (`scripts/wechat-template-*.js`):
   - Each template exports a `getArticleTemplate(data, contentHTML, photos)` function
   - Templates define complete HTML structure with inline CSS
   - Markdown-to-HTML conversion happens in publisher scripts, not templates
   - Templates receive processed HTML content, not raw Markdown

2. **Publisher Scripts** (`scripts/publish-*.js`):
   - `publish-ins.js` - Uses Ins-style template
   - `publish-battle.js` - Uses battle-style template
   - Both follow the same workflow:
     a. Read latest match from `matches/` directory
     b. Convert Markdown body to HTML using `markdownToHTML()`
     c. Load photos from `photos/{date}/` directory
     d. Call template's `getArticleTemplate()` with data
     e. Save to `output/` directory
     f. Auto-open in browser

3. **Template Design Philosophy**:
   - **Ins Style**: Minimalist, heavy whitespace, black/white/gray with gradient accents (purple/orange), suitable for 内战/internal matches
   - **Battle Style**: Intense red theme, high contrast, combat elements (swords/shields), suitable for 外战/external matches

4. **Adding New Templates**:
   - Create `scripts/wechat-template-{name}.js` with `getArticleTemplate()` export
   - Create corresponding `scripts/publish-{name}.js` publisher script
   - Add npm script to `package.json`: `"publish:{name}": "node scripts/publish-{name}.js"`
   - Follow existing publisher script structure for consistency

## Data Flow Patterns

**Match Report Creation:**
1. User runs `npm run new` or uses WeChat bot
2. Script creates `{date}-{opponent}.md` in `matches/` with YAML frontmatter
3. Photos stored in `photos/{date}/` directory
4. Manual editing of Markdown file as needed

**HTML Generation:**
1. Publisher script reads latest match file
2. Uses `gray-matter` to parse frontmatter (data) and body (content)
3. Converts Markdown to HTML with regex replacements
4. Merges data + HTML content + photos into template
5. Outputs single HTML file with inline styles to `output/`

**Statistics & Listings:**
1. `generate-stats.js` scans all `matches/*.md` files
2. Aggregates attendance, MVP, scorer data
3. Outputs JSON (`stats/stats.json`) and Markdown (`stats/stats.md`)
4. `modern-matches.js` generates `output/matches.html` with all match listings
5. Both scripts need manual rerun after match data changes
