#include <Arduino.h>

#include "motors.hpp"
#include "wifi.hpp"
#include "bluetooth.hpp"
#include "leds.hpp"

#define WIRELESS_CONFIG_PIN 13

static bool isUsingWiFi = false;

// enums are used to give names to arbitrary values
// using values (e.g. -1, 0, or 1) in place of enums is valid
enum SteerDir
{
    SteerLeft = -1,
    SteerMiddle = 0,
    SteerRight = 1
};

enum MoveDir
{
    MoveForward = 1,
    MoveBackward = -1,
    MoveCoast = 0,
    MoveBrake = 2,
};

void setDrive(MoveDir move, SteerDir steer, int speed = 0)
{
    // dumb turning pls fix
    int backLeftSpeed = steer == SteerDir::SteerLeft ? speed : speed / 3;
    int backRightSpeed = steer == SteerDir::SteerRight ? speed : speed / 3;

    if (steer == SteerDir::SteerMiddle)
    {
        backLeftSpeed = speed;
        backRightSpeed = speed;
    }

    // Serial.println("backLeftSpeed: " + String(backLeftSpeed) + ", backRightSpeed: " + String(backRightSpeed));

    if (move == MoveDir::MoveForward)
    {
        motorWrite(BACK_LEFT, backLeftSpeed, TurnDirection::TurnCounterclockwise);
        motorWrite(BACK_RIGHT, backRightSpeed, TurnDirection::TurnCounterclockwise);
    }
    else if (move == MoveDir::MoveBackward)
    {
        motorWrite(BACK_LEFT, backLeftSpeed, TurnDirection::TurnClockwise);
        motorWrite(BACK_RIGHT, backRightSpeed, TurnDirection::TurnClockwise);
    }
    else if (move == MoveDir::MoveCoast || move == MoveDir::MoveBrake)
    {
        motorWrite(BACK_LEFT, 0, TurnDirection::TurnClockwise);
        motorWrite(BACK_RIGHT, 0, TurnDirection::TurnClockwise);
    }
}

void setupMotor(MotorConfig motor)
{
    pinMode(motor.hBridgeSideAPin, OUTPUT);
    pinMode(motor.hBridgeSideBPin, OUTPUT);
    pinMode(motor.enablePin, OUTPUT);

    motorWrite(motor, 0, TurnDirection::TurnClockwise);
}

void setup()
{
    Serial.begin(115200);

    ledMatrix.begin();

    setupMotor(BACK_LEFT);
    setupMotor(BACK_RIGHT);

    pinMode(WIRELESS_CONFIG_PIN, INPUT_PULLUP);

    ledMatrix.loadFrame(LEDMATRIX_EMOJI_HAPPY);
    delay(500);
    isUsingWiFi = digitalRead(WIRELESS_CONFIG_PIN) == HIGH;
    if (isUsingWiFi)
    {
        ledMatrix.loadFrame(WIFI_SETUP);
        Serial.println("Using wireless over WiFi...");
        WiFiDriver::setup();
    }
    else
    {
        ledMatrix.loadFrame(BLUETOOTH_SETUP);
        Serial.println("Using wireless over Bluetooth...");
        Bluetooth::init();
    }
}

void updateDrive(int drive, int steer)
{
    Serial.println("drive: " + String(drive) + ", steer: " + String(steer));
    if (drive == 0)
    {
        setDrive(MoveCoast, SteerMiddle);
    }
    else
    {
        SteerDir turn = SteerMiddle;
        if (steer == 0)
            turn = SteerMiddle;
        else if (steer < 0)
            turn = SteerRight;
        else
            turn = SteerLeft;

        setDrive(drive > 0 ? MoveForward : MoveBackward, turn, map(abs(drive), 0, 128, 0, 255));
    }
}

void loop()
{
    if (isUsingWiFi)
    {
        ledMatrix.loadFrame(WIFI_WAIT);

        WiFiDriver::blockingUpdate(
            [](int drive, int steer)
            {
                ledMatrix.loadFrame(WIFI_CONNECTED);
                updateDrive(drive, steer);
            });
    }
    else
    {
        ledMatrix.loadFrame(BLUETOOTH_WAIT);

        Bluetooth::blockingUpdate(
            [](int drive, int steer)
            {
                ledMatrix.loadFrame(BLUETOOTH_CONNECTED);
                updateDrive(drive, steer);
            });
    }
}
