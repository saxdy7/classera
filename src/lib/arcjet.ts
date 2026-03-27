import arcjet, {
  tokenBucket,
  slidingWindow,
  detectBot,
  validateEmail,
} from '@arcjet/next';

const aj = arcjet({
  key: process.env.ARCJET_KEY || '',
  characteristics: ['ip.src'],
  rules: [
    // Detect bots
    detectBot({
      mode: 'CHALLENGE', // Require proof of work for suspected bots
      patterns: {
        // Only flag obviously automated clients
        skip: [
          'Slack',
          'Telegram', // Allow legitimate services
        ],
      },
    }),

    // General API rate limit: 100 requests per minute
    slidingWindow({
      mode: 'CHALLENGE',
      interval: '1m',
      max: 100,
    }),
  ],
});

export default aj;

// Export specific rate limiters for different endpoints
export const communityPostRateLimit = tokenBucket({
  refillRate: 5, // 5 posts
  interval: 3600, // per hour
  capacity: 5,
});

export const communityCommentRateLimit = tokenBucket({
  refillRate: 10, // 10 comments
  interval: 3600, // per hour
  capacity: 10,
});

export const communityMessageRateLimit = tokenBucket({
  refillRate: 20, // 20 messages
  interval: 3600, // per hour
  capacity: 20,
});

export const aiToolRateLimit = tokenBucket({
  refillRate: 50, // 50 AI calls
  interval: 3600, // per hour
  capacity: 50,
});

export const razorpayCheckoutRateLimit = tokenBucket({
  refillRate: 2, // 2 checkout sessions
  interval: 3600, // per hour
  capacity: 2,
});
