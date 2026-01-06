export const adjectives = [
  "quick",
  "bright",
  "clever",
  "smart",
  "swift",
  "bold",
  "calm",
  "cool",
  "eager",
  "fair",
  "gentle",
  "happy",
  "jolly",
  "kind",
  "lively",
  "merry",
  "nice",
  "proud",
  "quiet",
  "sharp",
  "wise",
  "witty",
  "brave",
  "fresh",
];

export const nouns = [
  "fox",
  "wolf",
  "bear",
  "lion",
  "tiger",
  "eagle",
  "hawk",
  "owl",
  "deer",
  "horse",
  "panda",
  "koala",
  "otter",
  "seal",
  "whale",
  "shark",
  "dragon",
  "phoenix",
  "falcon",
  "raven",
  "lynx",
  "jaguar",
  "leopard",
  "cheetah",
];

export function generateSlug(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
}
