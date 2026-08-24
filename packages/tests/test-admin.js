import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dynamically creates timestamped screenshot folders e.g. screenshots/admin/18aug26-6:36pm
function getRunScreenshotDir(appType) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = monthNames[now.getMonth()];
  const year = String(now.getFullYear()).slice(-2);

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;

  const dateFolder = `${day}${month}${year}-${hours}:${minutes}${ampm}`; // e.g. "18aug26-6:36pm"
  
  const targetDir = path.join(__dirname, "screenshots", appType, dateFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

const screenshotsDir = getRunScreenshotDir("admin");

async function saveScreenshot(driver, name) {
  const image = await driver.takeScreenshot();
  const filePath = path.join(screenshotsDir, `${name}.png`);
  fs.writeFileSync(filePath, image, "base64");
  console.log(`  📸 Screenshot saved: ${filePath}`);
}

async function runAdminTest() {
  console.log("🚀 Starting Comprehensive Selenium E2E Test for HSO-TAP Admin Portal...\n");

  const options = new chrome.Options();
  options.setChromeBinaryPath("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  options.addArguments("--headless=new");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Step 1: Navigate to Admin Portal Login
    console.log("1. Navigating to Admin Portal Login (http://localhost:5174/login)...");
    await driver.get("http://localhost:5174/login");
    await driver.sleep(1000);
    await saveScreenshot(driver, "01_login_page");

    // Step 2: Fill in Admin Credentials (admin@nufv.edu.ph / admin123)
    console.log("2. Entering Admin Credentials (admin@nufv.edu.ph)...");
    const emailInput = await driver.wait(until.elementLocated(By.id("login-email")), 5000);
    const passwordInput = await driver.findElement(By.id("login-password"));

    await emailInput.clear();
    await emailInput.sendKeys("admin@nufv.edu.ph");
    await passwordInput.clear();
    await passwordInput.sendKeys("admin123");
    await saveScreenshot(driver, "02_credentials_entered");

    // Step 3: Click Login Button
    console.log("3. Submitting Login Form...");
    const submitBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
    await submitBtn.click();
    await driver.sleep(1500);
    await saveScreenshot(driver, "03_dashboard_page");

    // Step 4: Verify Dashboard Page
    console.log("4. Verifying Dashboard & Live Queue Table...");
    const dashText = await driver.findElement(By.tagName("body")).getText();
    if (dashText.includes("Dashboard") || dashText.includes("Live Queue") || dashText.includes("Queue")) {
      console.log("   ✅ Login Successful! Dashboard loaded.");
    }

    // Step 5: Navigate to EMR (Electronic Medical Records) Page
    console.log("5. Navigating to EMR (Student Medical Records) Page...");
    const emrNav = await driver.wait(until.elementLocated(By.xpath("//a[contains(@href, '/emr') or contains(text(), 'EMR')]")), 5000);
    await emrNav.click();
    await driver.sleep(1000);
    await saveScreenshot(driver, "04_emr_page");

    // Step 6: Navigate to Analytics Page
    console.log("6. Navigating to Analytics & Reporting Page...");
    const analyticsNav = await driver.wait(until.elementLocated(By.xpath("//a[contains(@href, '/analytics') or contains(text(), 'Analytics')]")), 5000);
    await analyticsNav.click();
    await driver.sleep(1000);
    await saveScreenshot(driver, "05_analytics_page");

    // Step 7: Navigate to Forms Page
    console.log("7. Navigating to Medical Clearance / Forms Requests Page...");
    const formsNav = await driver.wait(until.elementLocated(By.xpath("//a[contains(@href, '/forms') or contains(text(), 'Forms')]")), 5000);
    await formsNav.click();
    await driver.sleep(1000);
    await saveScreenshot(driver, "06_forms_page");

    // Step 8: Navigate to Admin Settings Page
    console.log("8. Navigating to System Admin & User Management Page...");
    const adminNav = await driver.wait(until.elementLocated(By.xpath("//a[contains(@href, '/admin') or contains(text(), 'Admin')]")), 5000);
    await adminNav.click();
    await driver.sleep(1000);
    await saveScreenshot(driver, "07_admin_settings_page");

    console.log("\n==================================================");
    console.log("🎉 COMPREHENSIVE ADMIN PORTAL TEST PASSED!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("❌ Admin Test Failed with Error:", err);
    await saveScreenshot(driver, "admin_test_failure");
  } finally {
    await driver.quit();
  }
}

runAdminTest();
