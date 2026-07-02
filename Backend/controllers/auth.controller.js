import axios from "axios";

const getAccessToken = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/api/linkedin/callback',
  });
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'post',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const accessToken = await response.json();
  return accessToken;
};

export const getUserData = async (accessToken) => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: 'get',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const userData = await response.json();
  return userData;
};

export const postData = async (text, accessToken, authorURN) => {
  if (!text || !accessToken || !authorURN) {
    throw new Error('Missing required fields: text, accessToken, authorURN');
  }

  const postBody = {
    author: `urn:li:person:${authorURN}`, // e.g., "urn:li:person:XXXXXXXXX"
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    return {
      success: true,
      data: response.data,
      message: 'Post published successfully',
    };
  } catch (error) {
    console.error('LinkedIn API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

export const linkedInCallback = async (req, res) => {
  try {
    const { code } = req.query;

    // Get access token
    const accessToken = await getAccessToken(code);

    // Get user data using access token
    const userData = await getUserData(accessToken.access_token);

    if (!userData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve user data'
      });
    }

    // Check if user is registered
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = new User({
        name: userData.name,
        email: userData.email,
        phone: userData?.phone,
        avatar: userData?.picture
      });
      await user.save();
    }

    // Instead of JWT, send user data to frontend and redirect
    res.redirect(`http://localhost:5173/profile?user=${encodeURIComponent(JSON.stringify({
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }))}`);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getUser = async (req, res) => {
  try {
    // In a real app, you'd check session or other storage; here we assume frontend handles it
    // For simplicity, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'User data should be handled by frontend localStorage'
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'No user session found'
    });
  }
};