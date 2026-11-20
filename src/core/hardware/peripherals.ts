import {
  TrafficLightState,
  StepperMotorState,
  SevenSegmentState
} from '../../types/emulator';

export class PeripheralManager {
  public trafficLights: TrafficLightState;
  public stepperMotor: StepperMotorState;
  public sevenSegment: SevenSegmentState;
  public thermometerTemp = 24; // Celsius
  public heaterOn = false;

  public onStateChange?: () => void;

  constructor() {
    this.trafficLights = this.initTrafficLights();
    this.stepperMotor = this.initStepperMotor();
    this.sevenSegment = this.initSevenSegment();
  }

  public reset() {
    this.trafficLights = this.initTrafficLights();
    this.stepperMotor = this.initStepperMotor();
    this.sevenSegment = this.initSevenSegment();
    this.thermometerTemp = 24;
    this.heaterOn = false;
    if (this.onStateChange) this.onStateChange();
  }

  private initTrafficLights(): TrafficLightState {
    return {
      north: { red: true, yellow: false, green: false },
      south: { red: true, yellow: false, green: false },
      east: { red: true, yellow: false, green: false },
      west: { red: true, yellow: false, green: false }
    };
  }

  private initStepperMotor(): StepperMotorState {
    return {
      angle: 0,
      steps: 0,
      direction: 'idle',
      phaseHistory: [0],
      lastPortValue: 0
    };
  }

  private initSevenSegment(): SevenSegmentState {
    return {
      digits: [0, 0, 0, 0],
      rawMasks: [0x3F, 0x3F, 0x3F, 0x3F] // All '0'
    };
  }

  public handlePortRead(port: number): number {
    switch (port) {
      case 0x04: // Traffic lights
        return this.encodeTrafficLights() & 0xFF;
      case 0x05:
        return (this.encodeTrafficLights() >> 8) & 0xFF;
      case 0x07: // Stepper motor
        return this.stepperMotor.lastPortValue;
      case 0x12: // Thermometer
        return this.thermometerTemp & 0xFF;
      default:
        return 0;
    }
  }

  public handlePortWrite(port: number, value: number, isWord: boolean) {
    if (port === 0x04 || port === 0x05) {
      const fullVal = isWord ? value : (port === 0x04 ? (value & 0xFF) : (value << 8));
      this.decodeTrafficLights(fullVal);
    } else if (port === 0x07 || port === 0x09) {
      this.stepMotor(value & 0x0F);
    } else if (port === 0x10 || port === 0x11) {
      this.updateSevenSegment(port, value & 0xFF);
    } else if (port === 0x12) {
      // Thermometer / heater control
      this.heaterOn = (value & 1) !== 0;
      if (this.heaterOn && this.thermometerTemp < 100) this.thermometerTemp++;
      else if (!this.heaterOn && this.thermometerTemp > 18) this.thermometerTemp--;
    }

    if (this.onStateChange) this.onStateChange();
  }

  private decodeTrafficLights(val: number) {
    // 12 bits:
    // Bits 0-2: North (Red, Yellow, Green)
    // Bits 3-5: South (Red, Yellow, Green)
    // Bits 6-8: East (Red, Yellow, Green)
    // Bits 9-11: West (Red, Yellow, Green)
    this.trafficLights.north = {
      red: (val & (1 << 0)) !== 0,
      yellow: (val & (1 << 1)) !== 0,
      green: (val & (1 << 2)) !== 0
    };
    this.trafficLights.south = {
      red: (val & (1 << 3)) !== 0,
      yellow: (val & (1 << 4)) !== 0,
      green: (val & (1 << 5)) !== 0
    };
    this.trafficLights.east = {
      red: (val & (1 << 6)) !== 0,
      yellow: (val & (1 << 7)) !== 0,
      green: (val & (1 << 8)) !== 0
    };
    this.trafficLights.west = {
      red: (val & (1 << 9)) !== 0,
      yellow: (val & (1 << 10)) !== 0,
      green: (val & (1 << 11)) !== 0
    };
  }

  private encodeTrafficLights(): number {
    let val = 0;
    if (this.trafficLights.north.red) val |= (1 << 0);
    if (this.trafficLights.north.yellow) val |= (1 << 1);
    if (this.trafficLights.north.green) val |= (1 << 2);

    if (this.trafficLights.south.red) val |= (1 << 3);
    if (this.trafficLights.south.yellow) val |= (1 << 4);
    if (this.trafficLights.south.green) val |= (1 << 5);

    if (this.trafficLights.east.red) val |= (1 << 6);
    if (this.trafficLights.east.yellow) val |= (1 << 7);
    if (this.trafficLights.east.green) val |= (1 << 8);

    if (this.trafficLights.west.red) val |= (1 << 9);
    if (this.trafficLights.west.yellow) val |= (1 << 10);
    if (this.trafficLights.west.green) val |= (1 << 11);

    return val;
  }

  private stepMotor(phase: number) {
    const prev = this.stepperMotor.lastPortValue;
    this.stepperMotor.lastPortValue = phase;

    // Phase lookup sequence: 1 -> 2 -> 4 -> 8 (CW), 8 -> 4 -> 2 -> 1 (CCW)
    const cwPairs: Record<number, number> = { 1: 2, 2: 4, 4: 8, 8: 1, 3: 6, 6: 12, 12: 9, 9: 3 };
    const ccwPairs: Record<number, number> = { 2: 1, 4: 2, 8: 4, 1: 8, 6: 3, 12: 6, 9: 12, 3: 9 };

    if (cwPairs[prev] === phase) {
      this.stepperMotor.angle = (this.stepperMotor.angle + 15) % 360;
      this.stepperMotor.steps++;
      this.stepperMotor.direction = 'cw';
    } else if (ccwPairs[prev] === phase) {
      this.stepperMotor.angle = (this.stepperMotor.angle - 15 + 360) % 360;
      this.stepperMotor.steps++;
      this.stepperMotor.direction = 'ccw';
    } else {
      this.stepperMotor.direction = 'idle';
    }
  }

  private updateSevenSegment(port: number, val: number) {
    if (port === 0x10) {
      // Raw single digit or 8-bit number
      this.sevenSegment.rawMasks[3] = val;
      this.sevenSegment.digits[3] = this.maskToDigit(val);
    } else if (port === 0x11) {
      // 16-bit high digit or secondary display
      this.sevenSegment.rawMasks[2] = val;
      this.sevenSegment.digits[2] = this.maskToDigit(val);
    }
  }

  private maskToDigit(mask: number): number {
    const map: Record<number, number> = {
      0x3F: 0, 0x06: 1, 0x5B: 2, 0x4F: 3, 0x66: 4,
      0x6D: 5, 0x7D: 6, 0x07: 7, 0x7F: 8, 0x6F: 9
    };
    return map[mask & 0x7F] ?? (mask & 0x0F);
  }
}
