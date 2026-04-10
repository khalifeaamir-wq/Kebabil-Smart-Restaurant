#!/usr/bin/env tsx
import { storage } from "./storage";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function resetAdminPassword() {
  try {
    console.log("\n🔄 Resetting admin password...\n");

    const testPassword = "admin@kebabil123";
    const testPasswordHash = hashPassword(testPassword);

    // Get the first admin user
    const admin = await storage.getAdminByUsername("admin@kebabil.com");

    if (!admin) {
      console.log("❌ Admin user 'admin@kebabil.com' not found");
      process.exit(1);
    }

    // Update the password
    await storage.updateAdminUser(admin.id, {
      passwordHash: testPasswordHash,
    });

    console.log("✅ Admin password reset successfully!");
    console.log(`\n📋 Login credentials:`);
    console.log(`   Email: ${admin.username}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}\n`);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

resetAdminPassword();
