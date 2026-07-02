import cloudinary from "../utils/cloudinary.js";
import { prisma } from "../utils/prismaClient.js";

// Create a new User
export const createUser = async (
  req,
  res
) => {
  try {
    // If image is uploaded
    if (req?.file) {
      cloudinary.uploader.upload(req.file.path, async function (err, result) {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Something went wrong! Please try again.",
          });
        }
        // If image upload was successful
        else {
          // Get user from request.
          const user = JSON.parse(req.body?.user);

          //Find if user exists in DB
          const checkUser = await prisma.user.findUnique({
            where: {
              email: user?.email,
            },
          });

          if (!checkUser) {
            // Create a user in DB
            const createdUser = await prisma.user.create({
              data: {
                firebaseUID: user?.uid,
                email: user?.email,
                name: user?.name,
                photoURL: result?.secure_url,
                username: user?.username.toLowerCase(),
              },
            });

            // Send the createdUser
            res.status(200).send({ user: createdUser });
            return;
          } else {
            // Send the user in the DB
            res.status(200).send({ user: checkUser });
            return;
          }
        }
      });
    }
    // If image is not uploaded / google image used.
    else {
      const user = JSON.parse(req.body?.user);

      //Find if user exists in DB
      const checkUser = await prisma.user.findUnique({
        where: {
          email: user?.email,
        },
      });

      if (!checkUser) {
        // Create a user in DB
        const createdUser = await prisma.user.create({
          data: {
            firebaseUID: user?.uid,
            email: user?.email,
            name: user?.name,
            photoURL: user?.image,
            username: user?.username.toLowerCase(),
          },
        });

        // Send the createdUser
        res.status(200).send({ user: createdUser });
        return;
      } else {
        // Send the user in the DB
        res.status(200).send({ user: checkUser });
        return;
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Get Current User from DB
export const getCurrentUser = async (
  req,
  res
) => {
  try {
    // Get user info from request.
    const user = req.body?.user;

    // Get the user from DB
    const userInDB = await prisma.user.findUnique({
      where: {
        email: user?.email,
      },
    });

    // If user not present in DB
    if (!userInDB) {
      res.status(404).send({ data: "User does not exist." });
      return;
    }

    res.status(200).send({ user: userInDB });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Get User information
export const getUserProfile = async (
  req,
  res
) => {
  try {
    // Get user info from request.
    const username = req.body?.username;

    // Get the user from DB
    const userInDB = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        name: true,
        username: true,
        createdAt: true,
        photoURL: true,
      },
    });

    // If user not present in DB
    if (!userInDB) {
      res.status(404).send({ data: "User does not exist." });
      return;
    }

    // sending user
    res.status(200).send({ user: userInDB });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Check whether username already exists
export const checkIfUsernameExists = async (
  req,
  res
) => {
  try {
    // Get user info from request.
    const username = req.body?.username;

    // Get the user from DB
    const userInDB = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    // If user not present in DB
    if (!userInDB) {
      res.status(200).send({ exists: false });
      return;
    }

    // sending user
    res.status(200).send({ exists: true });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Update the User details - image, name, bio, username updateable0
export const updateUser = async (
  req,
  res
) => {
  try {
    // If image is uploaded
    if (req?.file) {
      cloudinary.uploader.upload(req.file.path, async function (err, result) {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Something went wrong! Please try again.",
          });
        }
        // If image upload was successful
        else {
          // Get user from request.
          const updatedUser = JSON.parse(req.body?.updatedUser);

          //Find if user exists in DB
          const checkUser = await prisma.user.findUnique({
            where: {
              id: req?.body?.userId,
            },
          });

          if (!checkUser) {
            // Send an error
            return res.status(404).send({ data: "User Not found" });
          } else {
            // Send the user in the DB
            const user = await prisma.user.update({
              where: {
                id: req?.body?.userId,
              },
              data: {
                username: updatedUser?.username,
                name: updatedUser?.name,
                photoURL: result?.secure_url,
              },
            });
            return res.status(200).send({ user: user });
          }
        }
      });
    }
    // If image is not uploaded / google image used.
    else {
      // Get user from request.
      const updatedUser = JSON.parse(req.body?.updatedUser);

      //Find if user exists in DB
      const checkUser = await prisma.user.findUnique({
        where: {
          id: req?.body?.userId,
        },
      });

      if (!checkUser) {
        // Send an error
        res.status(404).send({ data: "User Not found" });
        return;
      } else {
        // Send the user in the DB
        const user = await prisma.user.update({
          where: {
            id: req?.body?.userId,
          },
          data: {
            username: updatedUser?.username,
            name: updatedUser?.name,
          },
        });

        res.status(200).send({ user: user });
        return;
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// Delete the user
export const deleteUser = async (
  req,
  res
) => {
  try {
    const userId = req?.body?.userId;

    // Find the user along with their files and notes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userFiles: true,
        notes: true,
      },
    });

    if (!user) {
      res.status(404).send({ data: "User not found." });
      return;
    }

    // Delete all files from Cloudinary
    const fileDeletionResults = await Promise.allSettled(
      user.userFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(file.publicId, (err, result) => {
              if (err || result?.result !== "ok") return reject(err || result);
              resolve(result);
            });
          })
      )
    );

    // Optionally log failed deletions
    fileDeletionResults.forEach((result, i) => {
      if (result.status === "rejected") {
        console.warn(`Failed to delete file ${user.userFiles[i].publicId}`);
      }
    });

    // Delete notes and file metadata from DB
    await prisma.note.deleteMany({ where: { userId } });
    await prisma.userfile.deleteMany({ where: { userId } });

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    res
      .status(200)
      .send({ data: "User and all related data deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
