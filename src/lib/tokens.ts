export const tokenPackages = [
  {
    id: 'tokens-10',
    name: '10 AI Tool Tokens',
    tokens: 10,
    price: 300, // Amount in INR rupees
    description: 'Get 10 tokens for AI-powered learning tools',
  },
  {
    id: 'tokens-50',
    name: '50 AI Tool Tokens',
    tokens: 50,
    price: 1000, 
    description: 'Get 50 tokens for AI-powered learning tools (20% bonus)',
  },
  {
    id: 'tokens-100',
    name: '100 AI Tool Tokens',
    tokens: 100,
    price: 1800, 
    description: 'Get 100 tokens for AI-powered learning tools (best value)',
  },
  {
    id: 'tokens-500',
    name: '500 AI Tool Tokens',
    tokens: 500,
    price: 8000, 
    description: 'Get 500 tokens for AI-powered learning tools',
  },
];

export function getTokenPackage(packageId: string) {
  return tokenPackages.find((pkg) => pkg.id === packageId);
}
