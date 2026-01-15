# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a match report management system for 河伯FC (Hebo FC), an amateur football team. The system uses Markdown files with frontmatter metadata to store match reports, and generates HTML pages, statistics, and WeChat-compatible articles from the source data.

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
- `npm run setup-netlify` - Initial Netlify setup

### Utilities
- `npm run update` - Update/integrated command for various operations

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
- Uses readline for user input
- Generates filename as `{date}-{opponent}.md`
- Creates corresponding photos directory at `photos/{date}/`
- Auto-opens photos folder after creation

**parse-report.js** - Extract structured data from unstructured text
- Uses regex patterns to find goals from Chinese text (e.g., "12分钟 XX 破门")
- Extracts player names from comma/顿号 separated lists
- Useful for migrating existing reports

**generate-stats.js** - Statistics aggregation
- Parses all `.md` files in `matches/`
- Tracks attendance counts and MVP awards
- Outputs both JSON (`stats/stats.json`) and Markdown (`stats/stats.md`)
- Calculates attendance rates and MVP rankings

**modern-matches.js** - Modern HTML generator
- Creates responsive glassmorphism design
- Calculates MVP statistics across all matches
- Generates single-page app with match cards and MVP leaderboard
- Auto-opens in browser after generation

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

- Uses `gray-matter` package for frontmatter parsing
- No build step required - scripts are plain Node.js
- Generated HTML uses inline CSS for portability
- Modern design uses CSS gradients, backdrop-filter for glass effects
- Mobile-responsive with media queries
- Deployment targets Netlify for static hosting

## WeChat Integration

The `sync-wechat.js` script converts match reports to WeChat-compatible HTML format with inline styles suitable for the WeChat Official Account editor.
