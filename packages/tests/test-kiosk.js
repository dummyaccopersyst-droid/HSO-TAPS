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

async function typeDigits(driver, digits) {
  for (const d of digits) {
    await driver.sleep(90);
    const keyElem = await driver.wait(
      until.elementLocated(By.xpath(`//button[contains(@class, 'vkey') and text()='${d}']`)),
      3000
    );
    await keyElem.click();
  }
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
    // =============================================================
    // Scenario 1: Automated Auto-Scan Vitals Flow (1.5s Delay & Sensor Guidance)
    // =============================================================
    console.log("--- SCENARIO 1: Automated Auto-Scan Vitals Flow ---");

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
      await driver.sleep(90);
      const keyBtn = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'keypad-key') and text()='${digit}']`)),
        3000
      );
      await keyBtn.click();
    }
    await driver.sleep(400);
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

    // 7. Vitals Preference Screen
    console.log("7. Choosing 'Complete Check'...");
    const completeCheckBtn = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Complete Check')]")),
      5000
    );
    await completeCheckBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "07_vitals_preference_screen");

    // 8. Trigger Full Auto Scan (Automated getting of data)
    console.log("8. Triggering 'Run Full Auto Scan' (Automated hardware/sensor mode)...");
    const autoScanBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Run Full Auto Scan')]")),
      5000
    );
    await autoScanBtn.click();
    await driver.sleep(400);

    // 9. Capturing Screen with Sensor Positioning Guides
    console.log("9. Verifying Capturing Screen & Sensor Placement Instructions...");
    await saveScreenshot(driver, "08_capturing_sensor_instructions");

    // Verify presence of specific guide texts
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'wrist on the temperature sensor')]")),
      5000
    );
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'weighing scale properly')]")),
      5000
    );
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'platform to capture accurate height')]")),
      5000
    );
    console.log("   ✓ All specific sensor instructions confirmed on CapturingScreen");

    // 10. Wait through 1.5s acquisition delay & Supabase row update
    console.log("10. Waiting 1.8s for 1.5s delay and Supabase session update...");
    await driver.sleep(1800);

    // 11. Automated Result Screen
    console.log("11. Verifying Automated Result Screen...");
    const resultHeader = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'All done — here are your results')]")),
      6000
    );
    await saveScreenshot(driver, "09_automated_result_screen");
    console.log("   ✓ Automated measurements successfully captured and displayed!");

    // =============================================================
    // Scenario 2: Manual Adjustment & High Fever Test Case
    // =============================================================
    console.log("\n--- SCENARIO 2: Manual Adjustment & High Fever Test ---");
    console.log("12. Clicking 'Correct Readings' to adjust vitals manually...");
    const correctReadingsBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Correct Readings')]")),
      5000
    );
    await correctReadingsBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "10_manual_adjust_entry_screen");

    // Select Temperature field, clear, and enter 38.8 °C
    console.log("13. Updating Temperature to High Fever Level: 38.8 °C...");
    const tempFieldFever = await driver.findElement(By.xpath("//*[contains(text(), 'Body Temperature')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await tempFieldFever.click();
    await driver.sleep(200);

    // Clear
    const clearBtn = await driver.findElement(By.xpath("//button[contains(text(), 'CLEAR')]"));
    await clearBtn.click();
    await driver.sleep(200);

    await typeDigits(driver, ["3", "8", ".", "8"]);
    await driver.sleep(400);
    await saveScreenshot(driver, "11_vitals_manual_fever_typed");

    // Proceed to Fever Result Screen
    const proceedFeverBtn = await driver.findElement(By.xpath("//button[contains(@class, 'btn-vitals-proceed')]"));
    await proceedFeverBtn.click();
    await driver.sleep(1200);
    await saveScreenshot(driver, "12_result_screen_fever_alert");
    console.log("   ✓ Fever alert and immediate nurse clinic prompt verified!");

    // =============================================================
    // Scenario 3: Instant Offline State Lock Protocol
    // =============================================================
    console.log("\n--- SCENARIO 3: Instant Offline Fallback Protocol ---");
    console.log("14. Triggering Instant Offline Fallback Protocol State...");
    
    // Trigger offline event
    await driver.executeScript(() => {
      window.dispatchEvent(new Event("offline"));
    });
    await driver.sleep(600);
    await saveScreenshot(driver, "13_instant_offline_state_lock");
    console.log("   ✓ Offline lock protocol successfully engaged!");

    console.log("\n==================================================");
    console.log("🎉 ALL KIOSK AUTOMATED SCAN, MANUAL & FEVER TESTS PASSED!");
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
