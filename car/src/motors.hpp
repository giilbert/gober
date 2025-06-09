#include <Arduino.h>

typedef struct MotorConfig
{
    int hBridgeSideAPin;
    int hBridgeSideBPin;
    int enablePin;
} MotorConfig;

MotorConfig BACK_RIGHT = {
    .hBridgeSideAPin = 7,
    .hBridgeSideBPin = 2,
    .enablePin = 11};

MotorConfig BACK_LEFT = {
    .hBridgeSideAPin = 9,
    .hBridgeSideBPin = 10,
    .enablePin = 4};

enum TurnDirection
{
    TurnClockwise,
    TurnCounterclockwise,
    TurnCoast,
    TurnBrake
};

void motorWrite(MotorConfig motor, int speed, TurnDirection direction);
void setupMotor(MotorConfig motor);

void motorWrite(MotorConfig motor, int speed, TurnDirection direction)
{
    if (direction == TurnDirection::TurnClockwise)
    {
        digitalWrite(motor.hBridgeSideAPin, LOW);
        digitalWrite(motor.hBridgeSideBPin, HIGH);
    }
    else if (direction == TurnDirection::TurnCounterclockwise)
    {
        digitalWrite(motor.hBridgeSideAPin, HIGH);
        digitalWrite(motor.hBridgeSideBPin, LOW);
    }
    else if (direction == TurnDirection::TurnCoast)
    {
        digitalWrite(motor.hBridgeSideAPin, HIGH);
        digitalWrite(motor.hBridgeSideBPin, HIGH);
    }
    else if (direction == TurnDirection::TurnBrake)
    {
        digitalWrite(motor.hBridgeSideAPin, LOW);
        digitalWrite(motor.hBridgeSideBPin, LOW);
    }

    analogWrite(motor.enablePin, speed);
}

void motorShuffle(MotorConfig motor)
{
    Serial.println("turn clockwise");
    motorWrite(motor, 255, TurnDirection::TurnClockwise);
    delay(1000);
    motorWrite(motor, 0, TurnDirection::TurnCoast);
    delay(1000);
    Serial.println("turn counterclockwise");
    motorWrite(motor, 255, TurnDirection::TurnCounterclockwise);
    delay(1000);
    motorWrite(motor, 0, TurnDirection::TurnCoast);
    delay(1000);
    Serial.println("----- done -----");
}