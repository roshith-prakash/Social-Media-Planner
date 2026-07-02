import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// In-memory store for OAuth state and tokens (temporary for hackathon)
const authStore = new Map();

// Generate PKCE code verifier and challenge
function generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

// Request OAuth 2.0 authorization URL
async function requestAuthUrl() {
    const { verifier, challenge } = generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');

    authStore.set(state, { verifier, expires: Date.now() + 10 * 60 * 1000 });

    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.CLIENT_ID}&` +
        `redirect_uri=${process.env.REDIRECT_URI}&` +
        `scope=tweet.read%20tweet.write%20users.read%20offline.access&` +
        `state=${state}&` +
        `code_challenge=${challenge}&` +
        `code_challenge_method=S256`;

    return { url: authUrl, state };
}

// Exchange code for access token
async function exchangeCodeForToken({ code, verifier, redirectUri }) {
    const client = new TwitterApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
    });

    const tokens = await client.loginWithOAuth2({ code, codeVerifier: verifier, redirectUri });
    if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Invalid token response');
    }
    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
    };
}

// Fetch user data
async function fetchUserData(accessToken) {
    const client = new TwitterApi(accessToken);
    const { data: user } = await client.v2.me({
        'user.fields': 'id,username,name,profile_image_url',
    });
    if (!user?.id || !user?.username) {
        throw new Error('Invalid user data');
    }
    return user;
}

// Post a tweet
async function writeTweet({ accessToken }, tweetText) {
    const client = new TwitterApi(accessToken);
    if (!tweetText || tweetText.length > 280) {
        throw new Error('Invalid tweet text');
    }
    const tweet = await client.v2.tweet(tweetText);
    return { success: true, tweetId: tweet.data.id };
}

// Fetch trends
async function fetchTrends({ accessToken }) {
    const client = new TwitterApi(accessToken);
    // twitter-api-v2 trends API is v1.1 only
    const trends = await client.v1.trendsByPlace(1); // WOEID 1 = worldwide
    return trends[0]?.trends || [];
}

// ----------------- ROUTES ------------------

// Initiate login
router.get('/auth/twitter/login', async (req, res) => {
    try {
        const { url, state } = await requestAuthUrl();
        res.json({ url, state });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate auth', details: error.message });
    }
});

// OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
    }

    const authData = authStore.get(state);
    if (!authData || authData.expires < Date.now()) {
        authStore.delete(state);
        return res.status(400).json({ error: 'Invalid/expired state' });
    }

    try {
        const tokens = await exchangeCodeForToken({
            code,
            verifier: authData.verifier,
            redirectUri: process.env.REDIRECT_URI,
        });

        const user = await fetchUserData(tokens.accessToken);

        authStore.set(user.id, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expires: Date.now() + (tokens.expiresIn * 1000),
        });

        const redirectUrl = `http://localhost:3000/success?userId=${user.id}&username=${encodeURIComponent(user.username)}&name=${encodeURIComponent(user.name || '')}`;
        res.redirect(redirectUrl);
    } catch (error) {
        res.status(500).json({ error: 'Auth failed', details: error.message });
    } finally {
        authStore.delete(state);
    }
});

// Logout
router.post('/logout', (req, res) => {
    const { userId } = req.body;
    if (userId && authStore.has(userId)) {
        authStore.delete(userId);
        return res.json({ message: 'Logged out' });
    }
    res.status(400).json({ error: 'No session to logout' });
});

// Fetch trends
router.get('/api/trends', async (req, res) => {
    const { userId } = req.query;
    const userTokens = authStore.get(userId);
    if (!userTokens) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const trends = await fetchTrends(userTokens);
        res.json({ trends });
    } catch (error) {
        if (error.code === 401 && userTokens.refreshToken) {
            try {
                const client = new TwitterApi({
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                });
                const refreshed = await client.refreshOAuth2Token(userTokens.refreshToken);
                authStore.set(userId, {
                    accessToken: refreshed.accessToken,
                    refreshToken: refreshed.refreshToken,
                    expires: Date.now() + (refreshed.expiresIn * 1000),
                });
                const trends = await fetchTrends({ accessToken: refreshed.accessToken });
                res.json({ trends });
            } catch {
                res.status(401).json({ error: 'Token refresh failed' });
            }
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Post tweet
router.post('/api/post-tweet', async (req, res) => {
    const { userId, text } = req.body;
    const userTokens = authStore.get(userId);
    if (!userTokens) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await writeTweet(userTokens, text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cleanup expired states/tokens
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of authStore.entries()) {
        if (data.expires && data.expires < now) {
            authStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export default router;
