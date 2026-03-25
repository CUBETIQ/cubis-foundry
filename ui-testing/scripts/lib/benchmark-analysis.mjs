import { promises as fs } from "node:fs";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value) {
  return Math.round(clamp(value, 1, 5) * 10) / 10;
}

function scoreFromPenalty(base, penalty) {
  return roundScore(base - penalty);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function extractStyleBlock(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/i);
  return match ? match[1] : "";
}

function extractBody(html) {
  const match = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function countTag(body, tagName) {
  return countMatches(body, new RegExp(`<${tagName}(\\s|>)`, "gi"));
}

function countSemanticTags(body) {
  return ["main", "nav", "section", "article", "header", "aside", "button"].reduce(
    (sum, tagName) => sum + countTag(body, tagName),
    0,
  );
}

function countDirectChildren(body, className) {
  const marker = `class="${className}"`;
  const start = body.indexOf(marker);
  if (start === -1) return 0;
  const openStart = body.lastIndexOf("<", start);
  if (openStart === -1) return 0;
  const openEnd = body.indexOf(">", openStart);
  if (openEnd === -1) return 0;

  let depth = 1;
  let directChildren = 0;
  let index = openEnd + 1;
  while (index < body.length && depth > 0) {
    const nextOpen = body.indexOf("<", index);
    if (nextOpen === -1) break;

    if (body.startsWith("<!--", nextOpen)) {
      const commentEnd = body.indexOf("-->", nextOpen + 4);
      index = commentEnd === -1 ? body.length : commentEnd + 3;
      continue;
    }

    if (body.startsWith("</", nextOpen)) {
      const closeEnd = body.indexOf(">", nextOpen);
      depth -= 1;
      index = closeEnd === -1 ? body.length : closeEnd + 1;
      continue;
    }

    const openTagEnd = body.indexOf(">", nextOpen);
    if (openTagEnd === -1) break;
    const openTag = body.slice(nextOpen + 1, openTagEnd).trim();
    const tagName = openTag.split(/\s+/)[0];
    const selfClosing =
      openTag.endsWith("/") ||
      ["meta", "link", "img", "input", "br", "hr"].includes(tagName.toLowerCase());

    if (depth === 1) {
      directChildren += 1;
    }
    if (!selfClosing) {
      depth += 1;
    }
    index = openTagEnd + 1;
  }

  return directChildren;
}

function extractRuleBody(cssText, selector) {
  const bodies = [];
  const rulePattern = /(^|})\s*([^@][^{]+)\{([^{}]*)\}/gms;
  let match;
  while ((match = rulePattern.exec(cssText)) !== null) {
    const selectorList = match[2]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (selectorList.includes(selector)) {
      bodies.push(match[3]);
    }
  }
  return bodies.join("\n");
}

function detectShellColumns(cssText) {
  const shellRule = extractRuleBody(cssText, ".shell");
  const pageRule = extractRuleBody(cssText, ".page");
  const shellMatch = shellRule.match(/grid-template-columns:\s*([^;]+);/i);
  const pageMatch = pageRule.match(/grid-template-columns:\s*([^;]+);/i);
  const value = shellMatch?.[1] || pageMatch?.[1] || "";
  if (!value) return 1;
  if (value.includes("repeat(")) {
    const repeatMatch = value.match(/repeat\(\s*(\d+)/i);
    return repeatMatch ? Number.parseInt(repeatMatch[1], 10) : 2;
  }
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function maxClampRem(cssText, selector) {
  const rule = extractRuleBody(cssText, selector);
  const match = rule.match(/font-size:\s*clamp\([^,]+,[^,]+,\s*([0-9.]+)rem\)/i);
  return match ? Number.parseFloat(match[1]) : 0;
}

function selectorHasProperty(cssText, selector, property) {
  return new RegExp(`${property}\\s*:`, "i").test(extractRuleBody(cssText, selector));
}

function ruleHasPositiveRadius(ruleText) {
  const matches = [...ruleText.matchAll(/border-radius\s*:\s*([^;]+);/gi)];
  return matches.some((match) => {
    const value = match[1].trim().toLowerCase();
    return !/^(0|0px|0rem|0em|0%)$/.test(value);
  });
}

function extractMediaBlock(cssText) {
  const matches = [...cssText.matchAll(/@media\s*\(max-width:[^)]+\)\s*\{([\s\S]*?)\n\s*\}/gi)];
  return matches.map((match) => match[1]).join("\n");
}

function detectTypographyFamily(styleDirection, cssText) {
  if (/terminal/.test(styleDirection)) return /font-family:[^;]*(mono|IBM Plex Mono|JetBrains Mono)/i.test(cssText);
  if (/(editorial|luxury|monochrome|newsprint)/.test(styleDirection)) {
    return /font-family:[^;]*(serif|Georgia|Canela|Iowan|Palatino)/i.test(cssText);
  }
  return /font-family:[^;]*(sans|Inter|Avenir|IBM Plex Sans|Suisse)/i.test(cssText);
}

function analyzeFixtureHtml({ html, scenario }) {
  const cssText = extractStyleBlock(html);
  const body = extractBody(html);
  const mediaText = extractMediaBlock(cssText);

  const gradients = countMatches(cssText, /gradient\(/gi);
  const borderRadiusUses = countMatches(cssText, /border-radius\s*:/gi);
  const pillRadiusUses = countMatches(cssText, /border-radius:\s*(999px|999rem|50%)/gi);
  const zeroRadiusUses = countMatches(cssText, /border-radius:\s*0\b/gi);
  const buttonCount = countTag(body, "button");
  const sectionCount = countTag(body, "section");
  const articleCount = countTag(body, "article");
  const headingCount = countMatches(body, /<h[1-4](\s|>)/gi);
  const shellColumns = detectShellColumns(cssText);
  const shellChildren = Math.max(countDirectChildren(body, "shell"), countDirectChildren(body, "page"));
  const h1Max = Math.max(maxClampRem(cssText, ".hero-copy h1"), maxClampRem(cssText, ".headline-copy h2"), maxClampRem(cssText, ".rail-header h1"));
  const h1HasMaxWidth =
    selectorHasProperty(cssText, ".hero-copy h1", "max-width") ||
    selectorHasProperty(cssText, ".headline-copy h2", "max-width") ||
    selectorHasProperty(cssText, ".rail-header h1", "max-width");
  const mediaReorders = countMatches(mediaText, /\border\s*:/gi);
  const mediaColumnResets = countMatches(mediaText, /grid-template-columns\s*:\s*1fr/gi);
  const mediaLayoutChanges = mediaReorders + mediaColumnResets;
  const semanticCount = countSemanticTags(body);

  const layoutOccupancyRisk =
    shellColumns >= 2 && shellChildren < shellColumns ? "high"
    : shellColumns >= 2 && shellChildren === shellColumns ? "low"
    : "low";

  const collisionRisk =
    h1Max >= 5.2 && !h1HasMaxWidth ? "high"
    : h1Max >= 4.5 && !h1HasMaxWidth ? "medium"
    : "low";

  const styleDirection = scenario.primary_style_direction;
  let stylePenalty = 0;
  if (!detectTypographyFamily(styleDirection, cssText)) stylePenalty += 1;
  if (/material/.test(styleDirection) && borderRadiusUses < 8) stylePenalty += 1;
  if (/monochrome|editorial/.test(styleDirection) && zeroRadiusUses === 0) stylePenalty += 0.6;
  if (/saas/.test(styleDirection) && buttonCount < 3) stylePenalty += 0.5;
  if (/terminal/.test(styleDirection) && !/mono/i.test(cssText)) stylePenalty += 1;

  const texturePenalty =
    gradients >= 4 ? 1.3 :
    gradients >= 3 ? 0.8 :
    gradients >= 2 ? 0.3 : 0;

  const geometryPenalty =
    borderRadiusUses === 0 ? 1.5 :
    borderRadiusUses < 4 ? 1 :
    pillRadiusUses === 0 && /material|saas/.test(styleDirection) ? 0.6 : 0;

  const responsivePenalty =
    mediaLayoutChanges === 0 ? 1.8 :
    mediaReorders === 0 ? 0.9 : 0.2;

  const occupancyPenalty =
    layoutOccupancyRisk === "high" ? 3 :
    layoutOccupancyRisk === "medium" ? 1.5 : 0;

  const collisionPenalty =
    collisionRisk === "high" ? 1.8 :
    collisionRisk === "medium" ? 0.8 : 0;

  const interactionPenalty =
    buttonCount < 2 ? 2 :
    buttonCount < 4 ? 1 : 0;

  const accessibilityPenalty =
    semanticCount < 8 ? 1.5 :
    headingCount < 3 ? 0.8 : 0;

  const designPenalty =
    sectionCount < 2 ? 1.4 :
    articleCount < 2 ? 0.8 : 0;

  const antiSlopPenalty =
    gradients >= 4 && /avoid .*gradient/i.test(scenario.anti_slop_constraints.join(" ")) ? 1.4 :
    articleCount < 2 ? 0.8 : 0.2;

  return {
    metrics: {
      gradients,
      borderRadiusUses,
      pillRadiusUses,
      zeroRadiusUses,
      buttonCount,
      sectionCount,
      articleCount,
      headingCount,
      shellColumns,
      shellChildren,
      h1Max,
      h1HasMaxWidth,
      mediaReorders,
      mediaColumnResets,
      semanticCount,
    },
    risks: {
      layoutOccupancy: layoutOccupancyRisk,
      collision: collisionRisk,
    },
    scores: {
      design: scoreFromPenalty(5, designPenalty),
      anti: scoreFromPenalty(5, antiSlopPenalty),
      responsive: scoreFromPenalty(5, responsivePenalty),
      interaction: scoreFromPenalty(5, interactionPenalty),
      accessibility: scoreFromPenalty(5, accessibilityPenalty),
      style: scoreFromPenalty(5, stylePenalty),
      composition: scoreFromPenalty(5, collisionPenalty),
      occupancy: scoreFromPenalty(5, occupancyPenalty),
      mobile: scoreFromPenalty(5, responsivePenalty + (mediaReorders === 0 ? 0.5 : 0)),
      texture: scoreFromPenalty(5, texturePenalty),
      geometry: scoreFromPenalty(5, geometryPenalty),
    },
  };
}

function parseAtlasSections(body) {
  const matches = [...body.matchAll(/<section class="section ([^"]+)" id="([^"]+)">([\s\S]*?)<\/section>/gi)];
  return matches.map((match) => ({
    className: match[1],
    id: match[2],
    html: match[3],
  }));
}

export async function analyzeFixtureFile(filePath, scenario) {
  const html = await fs.readFile(filePath, "utf8");
  return analyzeFixtureHtml({ html, scenario });
}

export async function analyzeStyleAtlas(atlasPath) {
  const html = await fs.readFile(atlasPath, "utf8");
  const cssText = extractStyleBlock(html);
  const body = extractBody(html);
  const sections = parseAtlasSections(body);
  const laneSummaries = sections.map((section) => {
    const cardRule = extractRuleBody(cssText, `.${section.className} .card`);
    const buttonRule = extractRuleBody(cssText, `.${section.className} .button`);
    const rounded = ruleHasPositiveRadius(cardRule) || ruleHasPositiveRadius(buttonRule);
    const tactile =
      /material|saas|terminal/.test(section.id) ||
      /fab|sheet|chip/i.test(section.html);
    const componentCount = countMatches(section.html, /class="(card|button|field|mini-chip|stat)/gi);
    return {
      id: section.id,
      rounded,
      tactile,
      component_count: componentCount,
    };
  });

  const roundedLaneCount = laneSummaries.filter((lane) => lane.rounded).length;
  const tactileLaneCount = laneSummaries.filter((lane) => lane.tactile).length;
  const hardEdgeLaneCount = laneSummaries.length - roundedLaneCount;
  const atlasGradients = countMatches(cssText, /gradient\(/gi);

  return {
    lane_count: laneSummaries.length,
    rounded_lane_count: roundedLaneCount,
    hard_edge_lane_count: hardEdgeLaneCount,
    tactile_lane_count: tactileLaneCount,
    background_gradient_count: atlasGradients,
    lanes: laneSummaries,
    geometry_diversity_score: scoreFromPenalty(
      5,
      roundedLaneCount === 0 || hardEdgeLaneCount === 0 ? 2 : roundedLaneCount < 2 ? 0.8 : 0,
    ),
  };
}
