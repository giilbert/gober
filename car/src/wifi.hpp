#pragma once

#include <WiFiS3.h>

#include "utils.hpp"

const char SSID[] = "arduino";
const char PASSWORD[] = "gilbert12345";

WiFiServer server(80);

namespace WiFiDriver
{
    void setup()
    {
        int status = WiFi.beginAP(SSID, PASSWORD);

        assert_panic(status == WL_AP_LISTENING, (String("Failed to start WiFi AP. Error code: ") + String(status)).c_str());

        Serial.println("WiFi AP started");
        Serial.println("SSID: " + String(SSID));
        Serial.println("IP address: " + WiFi.localIP().toString());
        Serial.println("Default Gateway: " + WiFi.gatewayIP().toString());

        WiFi.setTimeout(1);

        server.begin(80);
    }

    static WiFiClient currentClient;
    static bool isClientConnected = false;

    void blockingUpdate(
        void (*updateDrive)(int, int))
    {
        static int lastStatus = WL_IDLE_STATUS;

        if (lastStatus != WiFi.status())
        {
            lastStatus = WiFi.status();

            if (lastStatus == WL_AP_CONNECTED)
                Serial.println("Device connected to AP");
            else
                Serial.println("Device disconnected from AP");
        }

        WiFiClient client = server.available();

        if (!client)
            return;

        while (client.connected())
        {
            if (!client.available())
                continue;

            static String readBuffer = "";
            char c = client.read();
            readBuffer += c;

            // read readBuffer until we find a new line
            int newlineIndex = readBuffer.indexOf('\n');
            if (newlineIndex != -1)
            {
                String fullMessage = readBuffer.substring(0, newlineIndex);

                int spaceIndex = fullMessage.indexOf(' ');

                if (spaceIndex != -1)
                {
                    int drive = fullMessage.substring(0, spaceIndex).toInt();
                    int steer = fullMessage.substring(spaceIndex + 1).toInt();
                    updateDrive(drive, steer);
                }

                readBuffer = readBuffer.substring(newlineIndex + 1);
            }
        }

        client.stop();
    }
}
