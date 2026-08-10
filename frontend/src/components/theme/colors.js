// InfoTally Color Palette Design Tokens
// Approved Locked Color System (4 Colors + Elevated Surface)

export const primaryWhite = '#FFFFFF';
export const softBlue = '#DFE5F3';
export const mutedSageGreen = '#557373';
export const warmWhite = '#F2EFEA';
export const deepBlack = '#0D0D0D';
export const darkCardBg = '#161616'; // Slightly elevated dark surface derived from background (no yellow/brown tint)

export const colors = {
  light: {
    background: primaryWhite,
    softSections: warmWhite,
    cards: primaryWhite,
    accent: mutedSageGreen,
    highlights: softBlue,
    primaryText: deepBlack
  },
  dark: {
    background: deepBlack,
    cards: darkCardBg,
    accent: mutedSageGreen,
    highlights: softBlue,
    primaryText: warmWhite
  }
};
