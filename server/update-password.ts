#!/usr/bin/env tsx
import { storage } from "./storage";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function updateAdminPassword() {
  try {
    console.log("\n🔄 Updating admin password...\n");

    const newPassword = "aamir";
    const newPasswordHash = hashPassword(newPassword);

    // Get the first admin user
    const admin = await storage.getAdminByUsername("admin@kebabil.com");

    if (!admin) {
      console.log("❌ Admin user 'admin@kebabil.com' not found");
      process.exit(1);
    }

    // Update the password
    await storage.updateAdminUser(admin.id, {
      passwordHash: newPasswordHash,
    });

    console.log("✅ Admin password updated successfully!");
    console.log(`\n📋 New login credentials:`);
    console.log(`   Email: ${admin.username}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}\n`);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

updateAdminPassword();
