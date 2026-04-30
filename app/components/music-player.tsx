import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Pause, Square, X } from 'lucide-react'; // Added X for the close button
import { Progress } from './ui/progress';
import { AudioEngine, NOTE_FREQUENCIES } from './audio-engine';
import { SavedComposition } from './music-library';

interface MusicPlayerProps {
  composition: SavedComposition;
  audioEngine: AudioEngine;
  onClose?: () => void;
}

export function MusicPlayer({ composition, audioEngine, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  useEffect(() => {
    // Calculate total duration
    let duration = 0;
    
    if (composition.beatPattern && composition.beatPattern[0]) {
      const beatDuration = (composition.beatPattern[0].length * (60 / composition.tempo / 4)) * 1000;
      duration = Math.max(duration, beatDuration);
    }
    
    if (composition.pianoRecording && composition.pianoRecording.length > 0) {
      const lastNote = composition.pianoRecording[composition.pianoRecording.length - 1];
      duration = Math.max(duration, lastNote.time + 1000);
    }
    
    totalDurationRef.current = duration || 5000; 
  }, [composition]);

  const play = () => {
    audioEngine.resume();
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    
    // Play beat pattern
    if (composition.beatPattern && composition.beatPattern[0]) {
      const stepDuration = (60 / composition.tempo / 4) * 1000;
      const steps = composition.beatPattern[0].length;
      
      for (let step = 0; step < steps; step++) {
        composition.beatPattern.forEach((row, instrumentIndex) => {
          if (row[step]) {
            const instruments = ['kick', 'snare', 'hihat', 'clap'];
            const timeoutId = window.setTimeout(() => {
              // Engine uses current master volume automatically
              audioEngine.playDrum(instruments[instrumentIndex]);
              setCurrentBeat(step);
            }, step * stepDuration);
            timeoutsRef.current.push(timeoutId);
          }
        });
      }
    }

    // Play piano recording
    if (composition.pianoRecording) {
      composition.pianoRecording.forEach((note) => {
        const timeoutId = window.setTimeout(() => {
          const frequency = NOTE_FREQUENCIES[note.note];
          if (frequency) {
            audioEngine.playNote(frequency);
          }
        }, note.time);
        timeoutsRef.current.push(timeoutId);
      });
    }

    // Progress tracking
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = Math.min((elapsed / totalDurationRef.current) * 100, 100);
      setProgress(progressPercent);
      
      if (progressPercent >= 100) {
        stop();
      }
    }, 50);
  };

  const pause = () => {
    setIsPlaying(false);
    clearTimeouts();
  };

  const stop = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentBeat(0);
    clearTimeouts();
  };

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * totalDurationRef.current;

  return (
    <Card className="p-6 bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background Gradient Accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{composition.name}</h3>
            <div className="flex gap-3 text-[10px] font-mono text-slate-500 uppercase">
              <span>{composition.tempo} BPM</span>
              {composition.beatPattern && <span>• Percussion</span>}
              {composition.pianoRecording && (
                <span>• {composition.pianoRecording.length} MIDI Events</span>
              )}
            </div>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white -mt-2 -mr-2">
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5 bg-slate-800" />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(totalDurationRef.current)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={stop}
            variant="ghost"
            size="icon"
            disabled={!isPlaying && progress === 0}
            className="text-slate-400 hover:text-red-400"
          >
            <Square className="size-5" />
          </Button>
          
          <Button
            onClick={isPlaying ? pause : play}
            className="rounded-full h-14 w-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="size-6" />
            ) : (
              <Play className="size-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Beat Indicator (Condensed) */}
        {composition.beatPattern && isPlaying && (
          <div className="flex gap-1 justify-center pt-2">
            {Array(composition.beatPattern[0]?.length || 16).fill(null).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-4 rounded-sm transition-all duration-75 ${
                  index === currentBeat
                    ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}