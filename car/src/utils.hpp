#pragma once

#include <Arduino.h>

void panic(const char *message)
{
    Serial.println("PANIC: " + String(message));
    while (true)
        ;
}

void assert_panic(bool condition, const char *message)
{
    if (!condition)
        panic(message);
}