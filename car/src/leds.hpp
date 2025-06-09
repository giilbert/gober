#pragma once

#include <Arduino_LED_Matrix.h>

ArduinoLEDMatrix ledMatrix;

const uint32_t WIFI_CONNECTED[3] = {0x882a8,
                                    0x45080500,
                                    0x20000000};

const uint32_t BLUETOOTH_CONNECTED[3] = {0xe0090290,
                                         0x4e089509,
                                         0x20e00000};

const uint32_t WIFI_WAIT[3] = {0x880a8,
                               0x5000000,
                               0xaa000000};

const uint32_t BLUETOOTH_WAIT[3] = {0xe0090090,
                                    0xe009009,
                                    0x55e00000};

const uint32_t BLUETOOTH_SETUP[3] = {0xf0088088,
                                     0xf0e8908,
                                     0x8ef0100e};

const uint32_t WIFI_SETUP[3] = {0x82082054,
                                0x54e2900,
                                0xe00100e};
