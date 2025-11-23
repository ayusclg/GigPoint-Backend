export const customHash = (input: string): string => {
  let hash = 0;
  const prime = 31;

  for (let i = 0; i < input.length; i++) {
    hash = (hash * prime + input.charCodeAt(i)) % 1_000_000_007;
  }

  return hash.toString(16); // convert to hex string
};

export const compareHash = (input: string, hashed: string): boolean => {
  return customHash(input) === hashed;
};
