#!/usr/bin/env tsx
import { storage } from "./storage";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function setupTestAdmin() {
  try {
    const count = await storage.getAdminCount();
    console.log(`\n📊 Current admin count: ${count}`);

    if (count === 0) {
      console.log("\n🔐 Creating test admin account...");
      const testAdmin = await storage.createAdminUser({
        username: "admin@kebabil.com",
        passwordHash: hashPassword("admin@kebabil123"),
        displayName: "Admin",
        role: "owner",
        isActive: true,
      });

      console.log("✅ Test admin created successfully!");
      console.log("   Email: admin@kebabil.com");
      console.log("   Password: admin@kebabil123");
      console.log(`   ID: ${testAdmin.id}`);
      console.log(`   Role: ${testAdmin.role}`);
    } else {
      console.log("ℹ️  Admin account already exists");
      const admin = await storage.getAdminByUsername("admin@kebabil.com");
      if (admin) {
        console.log(`   Email: ${admin.username}`);
        console.log(`   Display Name: ${admin.displayName}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
      }
    }

    console.log("\n🧪 Auth endpoints to test:");
    console.log("   POST /api/auth/login");
    console.log("   POST /api/auth/logout");
    console.log("   GET /api/auth/me");
    console.log("   GET /api/auth/needs-setup\n");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupTestAdmin();
