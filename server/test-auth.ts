#!/usr/bin/env node
/**
 * Auth Test Script - Tests the admin authentication endpoints
 * Run with: npx tsx server/test-auth.ts
 */

const BASE_URL = "http://localhost:5000";
let sessionCookie = "";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function request(method: string, endpoint: string, body?: unknown, includeSession = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (sessionCookie && includeSession) {
    headers["Cookie"] = sessionCookie;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    // Extract Set-Cookie header if present
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      sessionCookie = setCookie.split(";")[0];
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests() {
  console.log("\n🧪 Admin Auth Testing Suite\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("━".repeat(60));

  // Test 1: Check if setup is needed
  console.log("\n1️⃣  Checking setup status...");
  try {
    const res = await request("GET", "/api/auth/needs-setup", undefined, false);
    const passed = res.status === 200 && typeof res.data.needsSetup === "boolean";
    results.push({
      name: "GET /api/auth/needs-setup",
      passed,
      details: passed ? `Setup needed: ${res.data.needsSetup}` : `Status: ${res.status}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `- ${results[0].details}`);
  } catch (error) {
    results.push({
      name: "GET /api/auth/needs-setup",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Test 2: Test login
  console.log("\n2️⃣  Testing login...");
  try {
    const res = await request("POST", "/api/auth/login", {
      username: "admin@kebabil.com",
      password: "admin@kebabil123",
    });

    const passed = res.status === 200 && res.data.id && res.data.username;
    results.push({
      name: "POST /api/auth/login",
      passed,
      details: passed ? `Logged in as: ${res.data.username}` : `Status: ${res.status}, Response: ${JSON.stringify(res.data)}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `-`, results[results.length - 1].details);
  } catch (error) {
    results.push({
      name: "POST /api/auth/login",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Test 3: Test /me endpoint with valid session
  console.log("\n3️⃣  Testing /api/auth/me with session...");
  try {
    const res = await request("GET", "/api/auth/me");
    const passed = res.status === 200 && res.data.authenticated === true && res.data.user;
    results.push({
      name: "GET /api/auth/me (authenticated)",
      passed,
      details: passed ? `User: ${res.data.user?.username}` : `Response: ${JSON.stringify(res.data)}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `-`, results[results.length - 1].details);
  } catch (error) {
    results.push({
      name: "GET /api/auth/me (authenticated)",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Test 4: Test logout
  console.log("\n4️⃣  Testing logout...");
  try {
    const res = await request("POST", "/api/auth/logout");
    const passed = res.status === 200;
    results.push({
      name: "POST /api/auth/logout",
      passed,
      details: passed ? "Session cleared" : `Status: ${res.status}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `-`, results[results.length - 1].details);
    sessionCookie = ""; // Clear session
  } catch (error) {
    results.push({
      name: "POST /api/auth/logout",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Test 5: Test /me endpoint without session
  console.log("\n5️⃣  Testing /api/auth/me without session...");
  try {
    const res = await request("GET", "/api/auth/me", undefined, false);
    const passed = res.status === 200 && res.data.authenticated === false;
    results.push({
      name: "GET /api/auth/me (unauthenticated)",
      passed,
      details: passed ? "Correctly returned unauthenticated" : `Response: ${JSON.stringify(res.data)}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `-`, results[results.length - 1].details);
  } catch (error) {
    results.push({
      name: "GET /api/auth/me (unauthenticated)",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Test 6: Test invalid login
  console.log("\n6️⃣  Testing invalid login...");
  try {
    const res = await request("POST", "/api/auth/login", {
      username: "admin@kebabil.com",
      password: "wrongpassword",
    });
    const passed = res.status === 401;
    results.push({
      name: "POST /api/auth/login (invalid credentials)",
      passed,
      details: passed ? "Correctly rejected" : `Status: ${res.status}`,
    });
    console.log(passed ? "✅ PASS" : "❌ FAIL", `-`, results[results.length - 1].details);
  } catch (error) {
    results.push({
      name: "POST /api/auth/login (invalid credentials)",
      passed: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
    console.log("❌ FAIL", `-`, results[results.length - 1].details);
  }

  // Summary
  console.log("\n" + "━".repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📈 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Review the output above.");
  }
}

runTests().catch(console.error);
