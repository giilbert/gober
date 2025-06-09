#include <Arduino.h>
#include <ArduinoBLE.h>

namespace Bluetooth
{

    BLEService PrimaryService(/* id */ "ccdec9d2-8902-4b73-84f0-c60c17caa35f");

    BLECharacteristic DriveCharacteristic(
        /* id */ "f3bbbc56-b817-4dd1-b11a-0964109f4811",
        /* permission */ BLEWrite,
        /* size */ 1,
        /* fixed length? */ true);

    BLECharacteristic SteerCharacteristic(
        /* id */ "3d150571-e7da-48cf-bdb0-f2dedededede",
        /* permission */ BLEWrite,
        /* size */ 1,
        /* fixed length? */ true);

    BLECharacteristic BleepCharacteristic(
        /* id */ "a241fe62-1524-4dbd-8949-2b71a40905bd",
        /* permission */ BLEWrite,
        /* size */ 1,
        /* fixed length? */ true);

    const char NAME[] = "gober";

    // sometimes the BLE module fails to start due to it already being connected.
    // this function will tell the BLE module to reset and restart the sketch.
    void tryOrRetryStartBLE()
    {
        Serial.println("starting BLE module..");

        // send AT command to reset the BLE module (connected to Serial2)
        Serial2.write("AT+RESET\n");
        Serial2.flush();
        delay(1000);

        if (!BLE.begin())
        {
            Serial.println("starting BLE module failed, resetting and retrying..");

            // try to reset the BLE module again
            Serial2.write("AT+RESET\n");
            delay(3000);

            // restart the program
            NVIC_SystemReset();
            while (1)
                ;
        }
    }

    void init()
    {
        // used to indicate the state of the BLE module
        pinMode(LED_BUILTIN, OUTPUT);

        // wait for serial port to connect
        while (!Serial)
        {
        }

        Bluetooth::tryOrRetryStartBLE();

        BLE.setDeviceName(NAME);
        BLE.setLocalName(NAME);

        BLE.setEventHandler(BLEDiscovered, [](BLEDevice central)
                            { Serial.println("[discovered] address=" + central.address()); });
        BLE.setEventHandler(BLEConnected, [](BLEDevice central)
                            { Serial.println("[connected] address=" + central.address()); });
        BLE.setEventHandler(BLEDisconnected, [](BLEDevice central)
                            { Serial.println("[disconnected] address=" + central.address()); });

        PrimaryService.addCharacteristic(DriveCharacteristic);
        PrimaryService.addCharacteristic(SteerCharacteristic);
        PrimaryService.addCharacteristic(BleepCharacteristic);
        DriveCharacteristic.writeValue((int8_t)0, false);
        SteerCharacteristic.writeValue((int8_t)0, false);
        BleepCharacteristic.writeValue((int8_t)0, false);

        BLE.addService(PrimaryService);
        BLE.setAdvertisedService(PrimaryService);
        BLE.advertise();

        Serial.println("BLE server is now running, waiting for connections...");
    }

    void updateIndicatorLed()
    {
        static int lastBlink = 0;

        if (!BLE.connected())
        {
            if (millis() - lastBlink > 500)
            {
                lastBlink = millis();
                digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
            }
        }
        else
        {
            digitalWrite(LED_BUILTIN, HIGH);
        }
    }

    typedef struct State
    {
        int8_t drive;
        int8_t steer;
        int8_t bleep;
    } State;

    State update()
    {
        BLE.poll();
        Bluetooth::updateIndicatorLed();

        State state;
        DriveCharacteristic.readValue(state.drive);
        SteerCharacteristic.readValue(state.steer);
        BleepCharacteristic.readValue(state.bleep);
        return state;
    }

    void blockingUpdate(void (*callback)(int drive, int steer))
    {
        while (true)
        {
            BLE.poll();
            Bluetooth::updateIndicatorLed();

            if (BLE.connected())
            {
                State state = update();
                callback(state.drive, state.steer);
            }

            delay(10);
        }
    }
}
