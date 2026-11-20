import React from 'react';
import {
  TrafficLightState,
  StepperMotorState,
  SevenSegmentState
} from '../types/emulator';
import { Compass, Gauge, Radio, Thermometer } from 'lucide-react';

interface PeripheralsPanelProps {
  trafficLights: TrafficLightState;
  stepperMotor: StepperMotorState;
  sevenSegment: SevenSegmentState;
  thermometerTemp: number;
  heaterOn: boolean;
}

export const PeripheralsPanel: React.FC<PeripheralsPanelProps> = ({
  trafficLights,
  stepperMotor,
  sevenSegment,
  thermometerTemp,
  heaterOn
}) => {
  const renderLight = (active: boolean, color: 'red' | 'yellow' | 'green') => {
    const colorClasses = {
      red: active
        ? 'bg-rose-500 shadow-md shadow-rose-500/80 border-rose-400'
        : 'bg-rose-950/40 border-rose-950',
      yellow: active
        ? 'bg-amber-400 shadow-md shadow-amber-400/80 border-amber-300'
        : 'bg-amber-950/40 border-amber-950',
      green: active
        ? 'bg-emerald-400 shadow-md shadow-emerald-400/80 border-emerald-300'
        : 'bg-emerald-950/40 border-emerald-950'
    };

    return (
      <div
        className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${colorClasses[color]}`}
      />
    );
  };

  const renderIntersectionLightBox = (
    label: string,
    lights: { red: boolean; yellow: boolean; green: boolean }
  ) => {
    return (
      <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 p-2 rounded-lg w-16">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
          {label}
        </span>
        <div className="flex flex-col gap-1.5 p-1 bg-slate-900 rounded-md border border-slate-800">
          {renderLight(lights.red, 'red')}
          {renderLight(lights.yellow, 'yellow')}
          {renderLight(lights.green, 'green')}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full overflow-y-auto p-1">
      {/* 1. Traffic Lights (Port 4) */}
      <div className="bg-[#111726] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Traffic Lights</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Port 4 / 5
          </span>
        </div>

        <div className="flex items-center justify-around py-2">
          {renderIntersectionLightBox('North', trafficLights.north)}
          {renderIntersectionLightBox('South', trafficLights.south)}
          {renderIntersectionLightBox('East', trafficLights.east)}
          {renderIntersectionLightBox('West', trafficLights.west)}
        </div>
        <div className="text-[10px] text-center font-mono text-slate-400 mt-1">
          OUT 4, AX (Controls all 12 lights across 4 directions)
        </div>
      </div>

      {/* 2. Stepper Motor (Port 7) */}
      <div className="bg-[#111726] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">Stepper Motor</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Port 7
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          {/* Rotating Motor Disk */}
          <div className="relative w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center shadow-inner">
            {/* Degree notches */}
            <div className="absolute top-1 text-[8px] font-mono text-slate-400">0°</div>
            <div className="absolute bottom-1 text-[8px] font-mono text-slate-400">180°</div>
            <div className="absolute left-1 text-[8px] font-mono text-slate-400">270°</div>
            <div className="absolute right-1 text-[8px] font-mono text-slate-400">90°</div>

            {/* Rotating Rotor Needle */}
            <div
              className="absolute w-1 h-10 bg-gradient-to-t from-transparent via-blue-500 to-cyan-300 origin-bottom rounded-full transition-transform duration-200 shadow-md shadow-cyan-400/50"
              style={{
                transform: `rotate(${stepperMotor.angle}deg)`,
                bottom: '50%'
              }}
            />
            <div className="w-4 h-4 rounded-full bg-slate-300 border-2 border-slate-800 z-10 shadow" />
          </div>

          {/* Motor telemetry & phase coils */}
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-mono text-slate-200">
              Angle: <span className="text-cyan-400 font-bold">{stepperMotor.angle}°</span>
            </div>
            <div className="text-xs font-mono text-slate-200">
              Steps: <span className="text-slate-400">{stepperMotor.steps}</span>
            </div>
            <div className="text-xs font-mono text-slate-200">
              Dir: <span className="text-amber-400 uppercase font-semibold">{stepperMotor.direction}</span>
            </div>

            {/* 4 Phases Indicators */}
            <div className="flex items-center gap-1.5 mt-1">
              {[0, 1, 2, 3].map(bit => {
                const active = (stepperMotor.lastPortValue & (1 << bit)) !== 0;
                return (
                  <div
                    key={bit}
                    className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                      active
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/50'
                        : 'bg-slate-900 text-slate-600 border-slate-800'
                    }`}
                  >
                    {String.fromCharCode(65 + bit)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-center font-mono text-slate-400 mt-1">
          OUT 7, AL (Phase bits: 0001b, 0010b, 0100b, 1000b)
        </div>
      </div>

      {/* 3. Seven Segment Display (Port 10 / 11) */}
      <div className="bg-[#111726] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">7-Segment Display</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Port 10 / 11
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 py-3 bg-slate-950/70 rounded-xl border border-slate-900">
          {sevenSegment.digits.map((digit, idx) => (
            <div
              key={idx}
              className="w-12 h-16 bg-black border-2 border-slate-800/80 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/5"
            >
              <span className="font-mono text-3xl font-black text-amber-400 tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                {digit}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-center font-mono text-slate-400 mt-1">
          OUT 10, AL (Standard 7-segment decoded mask e.g. 3Fh='0')
        </div>
      </div>

      {/* 4. Thermometer / Heater (Port 12) */}
      <div className="bg-[#111726] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-slate-200">Thermometer & Heater</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Port 12
          </span>
        </div>

        <div className="flex items-center justify-around py-2">
          {/* Temperature Column */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-20 bg-slate-950 border border-slate-800 rounded-full p-0.5 flex flex-col justify-end overflow-hidden">
              <div
                className="w-full bg-gradient-to-t from-blue-500 via-amber-500 to-rose-500 rounded-full transition-all duration-300"
                style={{ height: `${Math.min(100, Math.max(10, thermometerTemp))}%` }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {thermometerTemp}°C
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ambient sensor</span>
            </div>
          </div>

          {/* Heater Status */}
          <div className="flex flex-col items-center">
            <div
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition ${
                heaterOn
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              HEATER: {heaterOn ? 'ON' : 'OFF'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              OUT 12, 1 (Turns ON)
            </span>
          </div>
        </div>
        <div className="text-[10px] text-center font-mono text-slate-400 mt-1">
          IN AL, 12 (Reads Temp) | OUT 12, AL (Toggle Heater)
        </div>
      </div>
    </div>
  );
};
