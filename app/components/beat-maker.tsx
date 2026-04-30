import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { AudioEngine } from './audio-engine';

interface BeatMakerProps {
  audioEngine: AudioEngine;
  onPatternChange?: (pattern: boolean[][]) => void;
  initialPattern?: boolean[][];
  initialTempo?: number;
}

const INSTRUMENTS = ['kick', 'snare', 'hihat', 'clap'];
const STEPS = 16;

export function BeatMaker({ audioEngine, onPatternChange, initialPattern, initialTempo = 120 }: BeatMakerProps) {
  const [pattern, setPattern] = useState<boolean[][]>(() => {
    if (initialPattern && initialPattern.length > 0) return initialPattern;
    return Array(INSTRUMENTS.length).fill(null).map(() => Array(STEPS).fill(false));
  });

  // NEW: Individual Volume State for each channel
  const [volumes, setVolumes] = useState<number[]>([1, 0.8, 0.6, 0.7]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tempo, setTempo] = useState(initialTempo);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (onPatternChange) onPatternChange(pattern);
  }, [pattern, onPatternChange]);

  const toggleStep = (instrumentIndex: number, stepIndex: number) => {
    const newPattern = pattern.map((row, i) =>
      i === instrumentIndex
        ? row.map((step, j) => (j === stepIndex ? !step : step))
        : row
    );
    setPattern(newPattern);
  };

  const handleVolumeChange = (index: number, value: number) => {
    const newVolumes = [...volumes];
    newVolumes[index] = value;
    setVolumes(newVolumes);
  };

  const playStep = (step: number) => {
    audioEngine.resume();
    pattern.forEach((row, instrumentIndex) => {
      if (row[step]) {
        // PASSING THE VOLUME: Now the engine knows how hard to hit the drum
        audioEngine.playDrum(INSTRUMENTS[instrumentIndex], volumes[instrumentIndex]);
      }
    });
  };

  const startPlayback = () => {
    setIsPlaying(true);
    let step = 0;
    // Calculate step duration based on 16th notes
    const stepDuration = (60 / tempo / 4) * 1000;
    
    intervalRef.current = window.setInterval(() => {
      setCurrentStep(step);
      playStep(step);
      step = (step + 1) % STEPS;
    }, stepDuration);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearPattern = () => {
    setPattern(Array(INSTRUMENTS.length).fill(null).map(() => Array(STEPS).fill(false)));
    stopPlayback();
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }, [tempo]);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex gap-2">
          <Button
            onClick={isPlaying ? stopPlayback : startPlayback}
            className={isPlaying ? "bg-slate-700" : "bg-purple-600 hover:bg-purple-700"}
            size="lg"
          >
            {isPlaying ? <Pause className="size-5 mr-2" /> : <Play className="size-5 mr-2" />}
            {isPlaying ? 'Stop' : 'Start'}
          </Button>
          <Button onClick={clearPattern} variant="ghost" size="lg" className="text-slate-500 hover:text-red-400">
            <RotateCcw className="size-5 mr-2" />
            Reset
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tempo</p>
            <p className="text-xl font-mono font-bold text-white leading-none">{tempo} <span className="text-xs text-slate-500">BPM</span></p>
          </div>
          <Slider
            value={[tempo]}
            onValueChange={(v) => setTempo(v[0])}
            min={60}
            max={200}
            step={1}
            className="w-32"
          />
        </div>
      </div>

      {/* Mixer & Sequencer Grid */}
      <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 shadow-inner">
        <div className="space-y-4">
          {INSTRUMENTS.map((instrument, instrumentIndex) => (
            <div key={instrument} className="flex items-center gap-6 group">
              {/* CHANNEL STRIP (Mixer Section) */}
              <div className="w-40 flex flex-col gap-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{instrument}</span>
                  <span className="text-[10px] font-mono text-purple-400">{Math.round(volumes[instrumentIndex] * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="size-3 text-slate-600" />
                  <Slider
                    value={[volumes[instrumentIndex]]}
                    onValueChange={(v) => handleVolumeChange(instrumentIndex, v[0])}
                    min={0}
                    max={1}
                    step={0.01}
                    className="flex-1 accent-purple-500"
                  />
                </div>
              </div>

              {/* STEP SEQUENCER SECTION */}
              <div className="flex gap-1">
                {Array(STEPS).fill(null).map((_, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(instrumentIndex, stepIndex)}
                    className={`
                      w-10 h-10 rounded-md border-2 transition-all duration-75
                      ${pattern[instrumentIndex][stepIndex]
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 shadow-lg shadow-purple-900/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }
                      ${currentStep === stepIndex ? 'ring-2 ring-white scale-110 z-10' : ''}
                      ${stepIndex % 4 === 0 ? 'ml-1.5' : ''}
                    `}
                  >
                    {currentStep === stepIndex && pattern[instrumentIndex][stepIndex] && (
                      <div className="w-full h-full bg-white/20 animate-ping rounded-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}