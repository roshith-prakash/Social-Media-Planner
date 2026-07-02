import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getUserData, postData } from "../controllers/auth.controller.js";


dotenv.config();
const prisma = new PrismaClient();
const router = express.Router();

// Validate environment variables
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_AS = process.env.LINKEDIN_CLIENT_AS;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:4000/api/v1/auth/callback';

if (!CLIENT_ID || !LINKEDIN_CLIENT_AS || !REDIRECT_URI) {
  throw new Error('Missing required environment variables: CLIENT_ID, LINKEDIN_CLIENT_AS, or REDIRECT_URI');
}

// Step 1: Redirect user to LinkedIn for authorization
router.get('/login', async (req, res) => {

  const scope = 'openid profile email';
  const state = Math.random().toString(36).substring(2); // still generated, but not stored
  const linkedInAuthUrl =
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&state=${state}` +
    `&scope=${scope}`;

  // console.log('Redirecting to LinkedIn:', linkedInAuthUrl);
  res.redirect(linkedInAuthUrl);
});

// Step 2: LinkedIn redirects here with code
router.get('/callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;
  console.log('Callback query:', { code });

  console.log("In Callback : ", state);

  if (error) {
    console.error(`LinkedIn OAuth error: ${error_description || error}`);
    return res.status(400).send(`Authentication failed: ${error_description || error}.`);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    // Step 3: Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_AS,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;
    // console.log('Access token received:', { access_token, expires_in });

    // Step 4: Get user profile
    const userData = await getUserData(access_token);
    console.log(userData);

    const userProfile = {
      linkedinId: userData.sub,
      firstName: userData.given_name,
      lastName: userData.family_name,
      email: userData.email,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      accessToken: access_token,
      profilePicture: userData.picture || null,
    };

    // console.log('User profile data:', userProfile);

    // Step 5: Save or update user profile in LinkedInUser collection
    const savedUser = await prisma.user.update({
      where: { id: state },
      data: {
        linkedinId: userProfile.linkedinId,
        linkedinFirst: userProfile.firstName,
        linkedinLast: userProfile.lastName,
        linkedinPicture: userProfile.profilePicture,
        linkedinToken: userProfile.accessToken,
        linkedinExpires: userProfile.expiresAt,
      },
    });

    // console.log('User saved to database:', savedUser);

    // Pass user data in redirect
    const userForFrontend = {
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      profilePicture: savedUser.profilePicture,
    };

    res.redirect(`http://localhost:3000/auth/linkedin?user=${encodeURIComponent(JSON.stringify(userForFrontend))}`);

    // res.json({
    //   id: savedUser.linkedinId,
    //   firstName: savedUser.firstName,
    //   lastName: savedUser.lastName,
    //   email: savedUser.email,
    //   profilePicture: savedUser.profilePicture,
    //   expiresAt: savedUser.expiresAt,
    // });

  } catch (error) {
    console.error('LinkedIn OAuth error:', error.message);
    res.status(500).send(`Failed to authenticate with LinkedIn: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
});

router.post('/post', async (req, res) => {
  const { text, accessToken, authorURN } = req.body;

  try {
    const result = await postData(text, accessToken, authorURN);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error posting data:', error);
    res.status(500).json({ error: 'Failed to post data' });
  }
});

export default router;
