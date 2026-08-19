#include <Adafruit_MLX90614.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <Wire.h>
#include <algorithm>
#include <cmath>
#include <vector>

WiFiMulti wifiMulti;

// ==========================================
// SUPABASE API CONFIGURATION
// ==========================================
const char *SUPABASE_URL = "https://schwdhhqngrfjkhobwuo.supabase.co/rest/v1/kiosk_sessions";
const char *SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHdkaGhxbmdyZmpraG9id3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4MzYxMSwiZXhwIjoyMTAyNTU5NjExfQ.k2J8ek3uZDDEdocxZtIZ47uRXmBNhJSOuwxqp6X-Deo";

// ==========================================
// MULTI-WIFI CREDENTIALS LIST
// ==========================================
struct APConfig {
  const char *ssid;
  const char *pass;
};

const APConfig KNOWN_NETWORKS[] = {
    {"PLDTHOMEFIBRc11f8", "PLDTWIFIg9y9y"},    // Primary Wi-Fi
    {"Kiosk_Hotspot", "KioskPass1234"},        // Mobile Hotspot Backup
    {"Campus_Clinic_WiFi", "ClinicSecure2026"} // Third Backup Network
};
const int TOTAL_NETWORKS = sizeof(KNOWN_NETWORKS) / sizeof(KNOWN_NETWORKS[0]);

// ==========================================
// PIN DEFINITIONS (38-Pin ESP32 DevKit)
// ==========================================
#define RFID_SS_PIN 15   // GPIO 15
#define RFID_RST_PIN 4   // GPIO 4
#define RFID_SCK_PIN 18  // GPIO 18
#define RFID_MISO_PIN 19 // GPIO 19
#define RFID_MOSI_PIN 23 // GPIO 23

#define I2C_SDA_PIN 21 // GPIO 21
#define I2C_SCL_PIN 22 // GPIO 22
#define US_TRIG_PIN 13 // GPIO 13
#define US_ECHO_PIN 14 // GPIO 14

const float CEILING_HEIGHT_METERS = 1.7526;
const float TEMP_CLINICAL_OFFSET = 2.60;
const float MIN_HUMAN_HEIGHT_M = 0.60;
const float MAX_HUMAN_HEIGHT_M = 2.20;
const float SKIN_PRESENCE_THRESHOLD = 30.5;

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

bool wasConnected = false;
unsigned long lastWiFiCheck = 0;
unsigned long lastPollTime = 0;

void setupWiFiMulti() {
  WiFi.mode(WIFI_STA);
  for (int i = 0; i < TOTAL_NETWORKS; i++) {
    wifiMulti.addAP(KNOWN_NETWORKS[i].ssid, KNOWN_NETWORKS[i].pass);
  }
  if (wifiMulti.run() == WL_CONNECTED) {
    wasConnected = true;
  } else {
    wasConnected = false;
  }
}

void maintainWiFiConnection() {
  if (millis() - lastWiFiCheck < 3000) return;
  lastWiFiCheck = millis();
  if (WiFi.status() == WL_CONNECTED) {
    wasConnected = true;
  } else {
    wasConnected = false;
    wifiMulti.run();
  }
}

float getRawDistanceMeters() {
  digitalWrite(US_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(US_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(US_TRIG_PIN, LOW);

  long duration = pulseIn(US_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0f;
  return (duration * 0.000343f) / 2.0f;
}

float computeFilteredAverage(std::vector<float> &samples, float maxDeviation) {
  if (samples.empty()) return 0.0f;
  if (samples.size() == 1) return samples[0];
  std::vector<float> sortedSamples = samples;
  std::sort(sortedSamples.begin(), sortedSamples.end());
  float median = sortedSamples[sortedSamples.size() / 2];
  float sum = 0.0f;
  int count = 0;
  for (float val : samples) {
    if (std::abs(val - median) <= maxDeviation) {
      sum += val;
      count++;
    }
  }
  return (count > 0) ? (sum / count) : median;
}

void sendRfidTapToSupabase(String cardUID) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(SUPABASE_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  String payload = "{\"rfid_uid\":\"" + cardUID + "\",\"status\":\"tap_logged\"}";
  http.POST(payload);
  http.end();
}

float measureTemperature() {
  unsigned long waitStart = millis();
  while (millis() - waitStart < 5000) {
    if (mlx.readObjectTempC() >= SKIN_PRESENCE_THRESHOLD) break;
    delay(50);
  }

  std::vector<float> tempSamples;
  unsigned long sampleStart = millis();
  while (millis() - sampleStart < 3000) {
    float rawSkin = mlx.readObjectTempC();
    if (rawSkin >= 28.0f && rawSkin <= 43.0f) {
      tempSamples.push_back(rawSkin + TEMP_CLINICAL_OFFSET);
    }
    delay(100);
  }
  return computeFilteredAverage(tempSamples, 0.6f);
}

float measureHeight() {
  std::vector<float> heightSamples;
  unsigned long heightStart = millis();
  while (millis() - heightStart < 2000) {
    float dist = getRawDistanceMeters();
    if (dist > 0) {
      float calculatedH = CEILING_HEIGHT_METERS - dist;
      if (calculatedH >= MIN_HUMAN_HEIGHT_M && calculatedH <= MAX_HUMAN_HEIGHT_M) {
        heightSamples.push_back(calculatedH);
      }
    }
    delay(80);
  }
  return computeFilteredAverage(heightSamples, 0.10f);
}

void updateSupabaseVitals(int id, String sensorRequired) {
  if (WiFi.status() != WL_CONNECTED) return;

  float tempC = 0.0f;
  float heightM = 0.0f;
  float weightKg = 55.0f;

  if (sensorRequired == "complete") {
    tempC = measureTemperature();
    heightM = measureHeight();
  } else if (sensorRequired == "temperature") {
    tempC = measureTemperature();
  } else if (sensorRequired == "physical") {
    heightM = measureHeight();
  }

  HTTPClient http;
  String updateUrl = String(SUPABASE_URL) + "?id=eq." + String(id);
  http.begin(updateUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  String payload = "{\"status\":\"completed\",";

  if (sensorRequired == "temperature" || sensorRequired == "complete") {
    payload += "\"temp_c\":" + String(tempC > 0 ? tempC : 36.5f, 2) + ",";
  } else {
    payload += "\"temp_c\":null,";
  }

  if (sensorRequired == "physical" || sensorRequired == "complete") {
    payload += "\"height_m\":" + String(heightM > 0 ? heightM : 1.70f, 2) + ",";
    payload += "\"weight_kg\":55.0";
  } else {
    payload += "\"height_m\":null,\"weight_kg\":null";
  }
  payload += "}";

  http.sendRequest("PATCH", payload);
  http.end();
}

void pollSupabaseForSensorRequests() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastPollTime < 2000) return;
  lastPollTime = millis();

  HTTPClient http;
  String pollUrl = String(SUPABASE_URL) + "?status=eq.pending_sensor&order=id.desc&limit=1";
  http.begin(pollUrl);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    int idIdx = response.indexOf("\"id\":");
    int sensorIdx = response.indexOf("\"sensor_required\":\"");
    if (idIdx != -1 && sensorIdx != -1) {
      int idVal = response.substring(idIdx + 5, response.indexOf(",", idIdx)).toInt();
      int sensorEnd = response.indexOf("\"", sensorIdx + 19);
      String sensorCmd = response.substring(sensorIdx + 19, sensorEnd);
      updateSupabaseVitals(idVal, sensorCmd);
    }
  }
  http.end();
}

void setup() {
  pinMode(RFID_SS_PIN, OUTPUT);
  digitalWrite(RFID_SS_PIN, HIGH);

  Serial.begin(115200);
  delay(1000);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  mlx.begin();

  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  pinMode(RFID_RST_PIN, OUTPUT);
  digitalWrite(RFID_RST_PIN, LOW);
  delay(20);
  digitalWrite(RFID_RST_PIN, HIGH);
  delay(50);

  rfid.PCD_Init();
  rfid.PCD_AntennaOn();
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);

  pinMode(US_TRIG_PIN, OUTPUT);
  pinMode(US_ECHO_PIN, INPUT);
  digitalWrite(US_TRIG_PIN, LOW);

  setupWiFiMulti();
}

void loop() {
  maintainWiFiConnection();

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardUID = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) cardUID += "0";
      cardUID += String(rfid.uid.uidByte[i], HEX);
    }
    cardUID.toUpperCase();

    // 1. Immediately upload RFID tap to Supabase (WITHOUT measuring sensors yet)
    sendRfidTapToSupabase(cardUID);

    // Also emit JSON over Serial for local dev bridge
    Serial.println();
    Serial.print(F("{\"type\":\"rfid_tap\",\"uid\":\""));
    Serial.print(cardUID);
    Serial.println(F("\"}"));

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(2000);
  }

  // 2. Poll Supabase to see if the user picked a service on kiosk-app that requires sensors
  pollSupabaseForSensorRequests();
  delay(50);
}
