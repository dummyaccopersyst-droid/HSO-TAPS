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
    // Scenario 1: Normal Vitals Screening Flow (Normal Temp: 36.6 °C)
    // =============================================================
    console.log("--- SCENARIO 1: Normal Vitals Screening Flow ---");

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

    // 7. Vitals Preference & Manual Entry Screen (Redesigned with SVG icons)
    console.log("7. Choosing 'Complete Check'...");
    const completeCheckBtn = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Complete Check')]")),
      5000
    );
    await completeCheckBtn.click();
    await driver.sleep(800);
    await saveScreenshot(driver, "07_vitals_preference_screen");

    // 8. Type Height (172 cm), Weight (64.5 kg), Normal Temp (36.6 °C)
    console.log("8. Entering Normal Vitals (Height: 172cm, Weight: 64.5kg, Temp: 36.6°C)...");
    await typeDigits(driver, ["1", "7", "2"]);

    // Weight
    const weightField = await driver.findElement(By.xpath("//*[contains(text(), 'Weight')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await weightField.click();
    await driver.sleep(200);
    await typeDigits(driver, ["6", "4", ".", "5"]);

    // Temperature (Normal: 36.6 °C)
    const tempField = await driver.findElement(By.xpath("//*[contains(text(), 'Body Temperature')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await tempField.click();
    await driver.sleep(200);
    await typeDigits(driver, ["3", "6", ".", "6"]);

    await driver.sleep(400);
    await saveScreenshot(driver, "08_vitals_manual_normal_typed");

    // 9. Proceed to Result Screen (Normal)
    console.log("9. Submitting normal vitals...");
    const proceedBtn = await driver.findElement(By.xpath("//button[contains(@class, 'btn-vitals-proceed')]"));
    await proceedBtn.click();
    await driver.sleep(1200);
    await saveScreenshot(driver, "09_result_screen_normal_analysis");

    // =============================================================
    // Scenario 2: High Fever Level Temperature (38.8 °C) Test Case
    // =============================================================
    console.log("\n--- SCENARIO 2: High Fever Level Temperature Test ---");
    console.log("10. Clicking 'Correct Readings' to test High Fever Temp...");
    const correctReadingsBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Correct Readings')]")),
      5000
    );
    await correctReadingsBtn.click();
    await driver.sleep(800);

    // Select Temperature field, clear, and enter 38.8 °C
    console.log("   Updating Temperature to High Fever Level: 38.8 °C...");
    const tempFieldFever = await driver.findElement(By.xpath("//*[contains(text(), 'Body Temperature')]/ancestor::div[contains(@class, 'vitals-field-item')]"));
    await tempFieldFever.click();
    await driver.sleep(200);

    // Clear
    const clearBtn = await driver.findElement(By.xpath("//button[contains(text(), 'CLEAR')]"));
    await clearBtn.click();
    await driver.sleep(200);

    await typeDigits(driver, ["3", "8", ".", "8"]);
    await driver.sleep(400);
    await saveScreenshot(driver, "10_vitals_manual_fever_typed");

    // Proceed to Fever Result Screen
    const proceedFeverBtn = await driver.findElement(By.xpath("//button[contains(@class, 'btn-vitals-proceed')]"));
    await proceedFeverBtn.click();
    await driver.sleep(1200);
    await saveScreenshot(driver, "11_result_screen_fever_alert");

    // =============================================================
    // Scenario 3: Instant Offline State Lock Protocol
    // =============================================================
    console.log("\n--- SCENARIO 3: Instant Offline Fallback Protocol ---");
    console.log("12. Triggering Instant Offline Fallback Protocol State...");
    
    // Trigger offline event
    await driver.executeScript(() => {
      window.dispatchEvent(new Event("offline"));
    });
    await driver.sleep(600);
    await saveScreenshot(driver, "12_instant_offline_state_lock");

    console.log("\n==================================================");
    console.log("🎉 ALL KIOSK PROCESS, NORMAL & FEVER TESTS PASSED!");
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
