// functions/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

// Helper: Check if a user is admin
const isAdmin = async (uid: string): Promise<boolean> => {
  const user = await admin.auth().getUser(uid);
  return !!user.customClaims?.admin;
};

// Change user role (Admin ↔ User)
export const setUserRole = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in");
  }

  // Check admin permission
  if (!(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Only admins can change roles");
  }

  // Validate data
  const data = request.data;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as any).uid !== "string" ||
    !["admin", "user"].includes((data as any).role as string)
  ) {
    throw new HttpsError("invalid-argument", "Invalid uid or role");
  }

  const { uid, role } = data as { uid: string; role: "admin" | "user" };

  // Set custom claims
  const customClaims: { admin?: boolean } = role === "admin" ? { admin: true } : {};
  await admin.auth().setCustomUserClaims(uid, customClaims);

  return { success: true };
});

// List all users
export const listAllUsers = onCall(async (request) => {
  if (!request.auth || !(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Only admins can list users");
  }

  const result = await admin.auth().listUsers();
  return {
    users: result.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || "No name",
      photoURL: u.photoURL,
      isAdmin: !!u.customClaims?.admin,
    })),
  };
});

// Create a new user (admin only)
export const createUser = onCall(async (request) => {
    if (!request.auth || !(await isAdmin(request.auth.uid))) {
      throw new HttpsError("permission-denied", "Only admins can create users");
    }
  
    const data = request.data;
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as any).email !== "string" ||
      typeof (data as any).password !== "string" ||
      (data as any).password.length < 6
    ) {
      throw new HttpsError("invalid-argument", "Valid email and password (6+ chars) required");
    }
  
    const { email, password, displayName = "" } = data as { email: string; password: string; displayName?: string };
  
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });
  
      return { uid: userRecord.uid, success: true };
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Email already in use");
      }
      throw new HttpsError("internal", "Failed to create user");
    }
  });

  // Delete a user (admin only)
export const deleteUser = onCall(async (request) => {
    if (!request.auth || !(await isAdmin(request.auth.uid))) {
      throw new HttpsError("permission-denied", "Only admins can delete users");
    }
  
    const data = request.data;
    if (typeof data !== "object" || data === null || typeof (data as any).uid !== "string") {
      throw new HttpsError("invalid-argument", "Valid uid required");
    }
  
    const { uid } = data as { uid: string };
  
    // Prevent self-deletion (safety)
    if (uid === request.auth.uid) {
      throw new HttpsError("failed-precondition", "You cannot delete your own account");
    }
  
    try {
      await admin.auth().deleteUser(uid);
      return { success: true };
    } catch (error: any) {
      throw new HttpsError("internal", "Failed to delete user: " + error.message);
    }
  });