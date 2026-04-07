import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';
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
    // Initialize with a valid pattern
    if (initialPattern && initialPattern.length > 0 && initialPattern[0] && initialPattern[0].length > 0) {
      return initialPattern;
    }
    return Array(INSTRUMENTS.length).fill(null).map(() => Array(STEPS).fill(false));
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tempo, setTempo] = useState(initialTempo);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (onPatternChange) {
      onPatternChange(pattern);
    }
  }, [pattern, onPatternChange]);

  const toggleStep = (instrumentIndex: number, stepIndex: number) => {
    const newPattern = pattern.map((row, i) =>
      i === instrumentIndex
        ? row.map((step, j) => (j === stepIndex ? !step : step))
        : row
    );
    setPattern(newPattern);
  };

  const playStep = (step: number) => {
    audioEngine.resume();
    pattern.forEach((row, instrumentIndex) => {
      if (row[step]) {
        audioEngine.playDrum(INSTRUMENTS[instrumentIndex]);
      }
    });
  };

  const startPlayback = () => {
    setIsPlaying(true);
    let step = 0;
    
    const stepDuration = (60 / tempo / 4) * 1000; // Quarter note duration in ms
    
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
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }, [tempo]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={isPlaying ? stopPlayback : startPlayback}
          size="lg"
        >
          {isPlaying ? <Pause className="size-5 mr-2" /> : <Play className="size-5 mr-2" />}
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
        <Button onClick={clearPattern} variant="outline" size="lg">
          <RotateCcw className="size-5 mr-2" />
          Clear
        </Button>
        
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm">Tempo: {tempo} BPM</span>
          <Slider
            value={[tempo]}
            onValueChange={(value) => setTempo(value[0])}
            min={60}
            max={180}
            step={1}
            className="w-32"
          />
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="bg-slate-900 rounded-lg p-6">
        <div className="space-y-2">
          {INSTRUMENTS.map((instrument, instrumentIndex) => (
            <div key={instrument} className="flex items-center gap-2">
              <div className="w-16 text-sm font-medium capitalize text-slate-300">
                {instrument}
              </div>
              <div className="flex gap-1">
                {Array(STEPS).fill(null).map((_, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(instrumentIndex, stepIndex)}
                    className={`
                      w-10 h-10 rounded border-2 transition-all
                      ${pattern[instrumentIndex][stepIndex]
                        ? 'bg-blue-500 border-blue-400'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }
                      ${currentStep === stepIndex ? 'ring-2 ring-yellow-400' : ''}
                      ${stepIndex % 4 === 0 ? 'ml-1' : ''}
                    `}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}