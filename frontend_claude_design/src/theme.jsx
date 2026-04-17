/* Shared design tokens. Exposes window.C, window.LIGHT, window.DARK, window.useTheme */
const C = {
  accent:"#E07355", accentHov:"#C85E40",
  accentBg:"rgba(224,115,85,0.10)", accentBg2:"rgba(224,115,85,0.18)",
  blue:"#4A7FC1", blueBg:"rgba(74,127,193,0.11)",
  green:"#5A9E72", greenBg:"rgba(90,158,114,0.11)",
  gold:"#C49A3C", goldBg:"rgba(196,154,60,0.11)",
  red:"#C0504A", redBg:"rgba(192,80,74,0.10)",
  purple:"#9B6DD9", purpleBg:"rgba(155,109,217,0.11)",
};
const LIGHT = {
  bg:"#F5F2EE", surface:"#FFFFFF", surface2:"#F0ECE6",
  text:"#1A1A1A", textSub:"#6B6560", textMuted:"#9B9590",
  border:"#E4DDD4", border2:"#D4CCC2",
  sidebar:"#FAFAF8", sidebarBorder:"#E4DDD4",
};
const DARK = {
  bg:"#141414", surface:"#1E1E1E", surface2:"#252525",
  text:"#F0EDE8", textSub:"#9B9590", textMuted:"#6B6560",
  border:"#2E2E2E", border2:"#3A3A3A",
  sidebar:"#191919", sidebarBorder:"#2A2A2A",
};

// Shared font stacks
const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_SERIF = "'Lora', Georgia, serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

Object.assign(window, { C, LIGHT, DARK, FONT_SANS, FONT_SERIF, FONT_MONO });
