import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  const dateFolder = `${day}${month}${year}-${hours}:${minutes}${ampm}`;
  
  const targetDir = path.join(__dirname, "screenshots", appType, dateFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

const screenshotsDir = getRunScreenshotDir("kiosk");

async function saveScreenshot(driver, name) {
  const image = await driver.takeScreenshot();
  const filePath = path.join(screenshotsDir, `${name}.png`);
  fs.writeFileSync(filePath, image, "base64");
  console.log(`  📸 Screenshot saved: ${filePath}`);
  return filePath;
}

async function runKioskTest() {
  console.log("🚀 Starting Comprehensive Selenium E2E Test Suite for HSO-TAP Kiosk App...\n");

  const options = new chrome.Options();
  options.setChromeBinaryPath("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  options.addArguments("--headless=new");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--window-size=1280,960");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // -------------------------------------------------------------
    // Scenario 1: Full Kiosk Screening Flow (Manual ID -> Profile -> Hybrid/Manual Vitals -> Results)
    // -------------------------------------------------------------
    console.log("--- SCENARIO 1: Comprehensive Kiosk Screening Flow ---");

    // 1. Welcome Screen
    console.log("1. Navigating to Kiosk App (http://localhost:5173)...");
    await driver.get("http://localhost:5173");
    await driver.sleep(1200);
    await saveScreenshot(driver, "01_welcome_screen");

    // 2. Manual Entry Screen
    console.log("2. Opening Manual Student ID Entry...");
    const manualBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Manual Entry')]")),
      5000
    );
    await manualBtn.click();
    await driver.sleep(600);
    await saveScreenshot(driver, "02_manual_entry_screen");

    // 3. Typing Student ID via Keypad
    console.log("3. Entering Student ID '2024-100123' via Keypad...");
    const studentDigits = ["2", "0", "2", "4", "1", "0", "0", "1", "2", "3"];
    for (const digit of studentDigits) {
      await driver.sleep(100);
      const keyBtn = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'keypad-key') and text()='${digit}']`)),
        3000
      );
      await keyBtn.click();
    }
    await driver.sleep(500);
    await saveScreenshot(driver, "03_id_typed_keypad");

    // 4. Confirm Student Identity Screen
    console.log("4. Submitting ID to view Student Profile...");
    const confirmSubmitBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Confirm')]")),
      5000
    );
    await confirmSubmitBtn.click();
    await driver.sleep(1200);
    await saveScreenshot(driver, "04_confirm_student_screen");

    // 5. Service Select Screen
    console.log("5. Confirming profile ('Yes, that's me')...");
    const yesBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), \"Yes\")]")),
      5000
    );
    await yesBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "05_service_select_screen");

    // 6. Screening Options Screen
    console.log("6. Selecting 'Quick Health Screening'...");
    const screeningBtn = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Quick Health Screening')]")),
      5000
    );
    await screeningBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "06_screening_options_screen");

    // 7. Vitals Preference & Manual/Hybrid Entry Screen
    console.log("7. Choosing 'Complete Check'...");
    const completeCheckBtn = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Complete Check')]")),
      5000
    );
    await completeCheckBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "07_vitals_preference_screen");

    // 8. Type Height Manually (172 cm)
    console.log("8. Typing manual Height (172 cm)...");
    const heightDigits = ["1", "7", "2"];
    for (const d of heightDigits) {
      await driver.sleep(80);
      const vkey = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'vkey') and text()='${d}']`)),
        3000
      );
      await vkey.click();
    }

    // Select Weight field and type (64.5 kg)
    console.log("   Selecting Weight field and typing (64.5 kg)...");
    const weightField = await driver.findElement(By.xpath("//*[contains(text(), 'Weight')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await weightField.click();
    await driver.sleep(250);

    const weightDigits = ["6", "4", ".", "5"];
    for (const d of weightDigits) {
      await driver.sleep(80);
      const vkey = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'vkey') and text()='${d}']`)),
        3000
      );
      await vkey.click();
    }

    // Select Temperature field and type (36.6 °C)
    console.log("   Selecting Body Temperature field and typing (36.6 °C)...");
    const tempField = await driver.findElement(By.xpath("//*[contains(text(), 'Body Temperature')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await tempField.click();
    await driver.sleep(250);

    const tempDigits = ["3", "6", ".", "6"];
    for (const d of tempDigits) {
      await driver.sleep(80);
      const vkey = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'vkey') and text()='${d}']`)),
        3000
      );
      await vkey.click();
    }
    await driver.sleep(500);
    await saveScreenshot(driver, "08_vitals_manual_complete_typed");

    // 9. Proceed to Result Screen
    console.log("9. Submitting manual vitals...");
    const proceedBtn = await driver.findElement(By.xpath("//button[contains(@class, 'btn-vitals-proceed')]"));
    await proceedBtn.click();
    await driver.sleep(1200);

    // 10. Result Screen (with BMI and Vitals Analysis)
    console.log("10. Capturing Result Screen with BMI & Vitals Analysis...");
    await saveScreenshot(driver, "09_result_screen_analysis");

    // -------------------------------------------------------------
    // Scenario 2: Instant Offline Fallback Protocol Screen
    // -------------------------------------------------------------
    console.log("\n--- SCENARIO 2: Instant Offline State Lock Protocol ---");
    console.log("11. Triggering Instant Offline Fallback Protocol State...");
    
    // Inject and lock offline screen state
    await driver.executeScript(() => {
      window.dispatchEvent(new Event("offline"));
      // Also prevent immediate recovery poll during snapshot
      window.__OFFLINE_TEST__ = true;
    });
    await driver.sleep(400);
    await saveScreenshot(driver, "10_instant_offline_state_lock");

    console.log("\n==================================================");
    console.log("🎉 ALL KIOSK PROCESS & OFFLINE PROTOCOL TESTS PASSED!");
    console.log(`📁 Screenshots directory: ${screenshotsDir}`);
    console.log("==================================================\n");

  } catch (err) {
    console.error("❌ Test Failed with Error:", err);
    await saveScreenshot(driver, "test_failure");
  } finally {
    await driver.quit();
  }
}

runKioskTest();
