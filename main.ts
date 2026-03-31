// ===== ZMIENNE POMOCNICZE =====
function clamp (v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}
function stopDrive () {
    pins.servoWritePin(AnalogPin.P0, 90)
    pins.servoWritePin(AnalogPin.P1, 90)
}
function setServoAngle (angle: number) {
    motor.servo(motor.Servos.S1, angle)
}
function changeAngle (num: number) {
    currentAValue += num
    currentAValue = clamp(currentAValue, 0, 180)
    motor.servo(motor.Servos.S1, currentAValue)
}
// speed: -90..90 (minus = tył, plus = przód)
function setDrive (leftSpeed: number, rightSpeed: number) {
    leftSpeed = clamp(deadzone(leftSpeed, 4), -90, 90)
    rightSpeed = clamp(deadzone(rightSpeed, 4), -90, 90)
    // micro:bit:
    // P0: 0 przód, 180 tył
    // P1: 180 przód, 0 tył
    pins.servoWritePin(AnalogPin.P0, clamp(90 - leftSpeed, 0, 180))
    pins.servoWritePin(AnalogPin.P1, clamp(90 + rightSpeed, 0, 180))
}
function parseAndDriveAxes (frame: string) {
    // format: X+05,Y-72
    if (frame.length < 9) {
        return
    }
    if (frame.charAt(0) != "X") {
        return
    }
    commaY = frame.indexOf(",Y")
    if (commaY < 2) {
        return
    }
    xStr = frame.substr(1, commaY - 1)
    yStr = frame.substr(commaY + 2, frame.length - (commaY + 2))
    xVal = parseFloat(xStr)
    yVal = parseFloat(yStr)
    // prosty check NaN bez isNaN (bardziej blok-friendly)
    if (!(xVal <= 999 && xVal >= -999)) {
        return
    }
    if (!(yVal <= 999 && yVal >= -999)) {
        return
    }
    xVal = clamp(xVal, -90, 90)
    yVal = clamp(yVal, -90, 90)
    driveFromAxes(xVal, yVal)
}
function deadzone (v: number, dz: number) {
    if (Math.abs(v) < dz) {
        return 0
    }
    return v
}
/**
 * ===== USTAWIENIA TRYBÓW (proste liczby - łatwe do bloków) =====
 */
// ===== ODBIÓR DANYCH PO USB SERIAL =====
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    receivedString = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    // usuń CR, jeśli jest
    if (receivedString.length > 0 && receivedString.charAt(receivedString.length - 1) == "\r") {
        receivedString = receivedString.substr(0, receivedString.length - 1)
    }
    // --- zmiana trybu ---
    if (receivedString == "mode_dpad") {
        currentMode = MODE_DPAD
        stopDrive()
        basic.showString("D")
        return
    }
    if (receivedString == "mode_analog") {
        currentMode = MODE_ANALOG
        stopDrive()
        basic.showString("A")
        return
    }
    if (receivedString == "mode_accelerometer") {
        currentMode = MODE_ACCEL
        stopDrive()
        basic.showString("T")
        return
    }
    // --- DPAD ---
    if (currentMode == MODE_DPAD) {
        if (receivedString == "UP") {
            setDrive(90, 90)
        } else if (receivedString == "DOWN") {
            setDrive(-90, -90)
        } else if (receivedString == "LEFT") {
            setDrive(90, -90)
            changeAngle(-5)
        } else if (receivedString == "RIGHT") {
            setDrive(-90, 90)
            changeAngle(5)
        } else if (receivedString == "left" || receivedString == "right" || receivedString == "up" || receivedString == "down") {
            stopDrive()
        }
        // miejsce na akcję A
        if (receivedString == "A") {
        	
        }
        // miejsce na akcję B
        if (receivedString == "B") {
        	
        }
        // miejsce na akcję B
        if (receivedString == "HORN") {
            music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }
    // --- ANALOG + ACCEL ---
    if (currentMode == MODE_ANALOG || currentMode == MODE_ACCEL) {
        parseAndDriveAxes(receivedString)
    }
    // suwaki
    if (receivedString.substr(0, 1) == "x") {
        led.plotBarGraph(
        parseFloat(receivedString.substr(1, 3)),
        180
        )
        setServoAngle(parseFloat(receivedString.substr(1, 3)))
    }
    if (receivedString.substr(0, 1) == "c") {
        led.plotBarGraph(
        parseFloat(receivedString.substr(1, 3)),
        180
        )
    }
})
function driveFromAxes (x: number, y: number) {
    // poprawione lewo/prawo
    left = y - x
    right = y + x
    setDrive(left, right)
}
let right = 0
let left = 0
let receivedString = ""
let yVal = 0
let xVal = 0
let yStr = ""
let xStr = ""
let commaY = 0
let rightSpeed = 0
let leftSpeed = 0
let currentAValue = 0
let MODE_DPAD = 0
let currentMode = 0
let MODE_ACCEL = 0
let MODE_ANALOG = 0
MODE_ANALOG = 1
MODE_ACCEL = 2
currentMode = MODE_DPAD
// ===== START =====
basic.showIcon(IconNames.SmallDiamond)
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
stopDrive()
currentAValue = 0
