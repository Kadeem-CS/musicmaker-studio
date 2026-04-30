import { useState, useRef, useEffect } from 'react';
// Changed '../' to './' to find the UI components in the same folder tree
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Pause, Square, X } from 'lucide-react';
import { Progress } from './ui/progress';

// Changed '../' to './' since these are neighbors in the components folder
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
    let duration = 0;
    
    if (composition.beatPattern && composition.beatPattern[0]) {
      const stepDuration = (60 / composition.tempo / 4) * 1000;
      const beatDuration = composition.beatPattern[0].length * stepDuration;
      duration = Math.max(duration, beatDuration);
    }
    
    if (composition.pianoRecording && composition.pianoRecording.length > 0) {
      const lastNote = composition.pianoRecording[composition.pianoRecording.length - 1];
      duration = Math.max(duration, lastNote.time + 800); 
    }
    
    totalDurationRef.current = duration || 4000; 
  }, [composition]);

  const play = () => {
    audioEngine.resume();
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    
    if (composition.beatPattern && composition.beatPattern[0]) {
      const stepDuration = (60 / composition.tempo / 4) * 1000;
      const steps = composition.beatPattern[0].length;
      
      for (let step = 0; step < steps; step++) {
        composition.beatPattern.forEach((row, instrumentIndex) => {
          if (row[step]) {
            const instruments = ['kick', 'snare', 'hihat', 'clap'];
            const timeoutId = window.setTimeout(() => {
              audioEngine.playDrum(instruments[instrumentIndex]);
              setCurrentBeat(step);
            }, step * stepDuration);
            timeoutsRef.current.push(timeoutId);
          }
        });
      }
    }

    if (composition.pianoRecording) {
      composition.pianoRecording.forEach((note) => {
        const timeoutId = window.setTimeout(() => {
          const frequency = NOTE_FREQUENCIES[note.note as keyof typeof NOTE_FREQUENCIES];
          if (frequency) {
            audioEngine.playNote(frequency);
          }
        }, note.time);
        timeoutsRef.current.push(timeoutId);
      });
    }

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = (elapsed / totalDurationRef.current) * 100;
      
      if (progressPercent >= 100) {
        stop();
      } else {
        setProgress(progressPercent);
      }
    }, 30);
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * totalDurationRef.current;

  return (
    <Card className="p-6 bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">{composition.name}</h3>
            <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-slate-500">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-purple-400">{composition.tempo} BPM</span>
              <span className="uppercase tracking-widest">
                {composition.pianoRecording?.length ? `${composition.pianoRecording.length} MIDI Notes` : 'Audio Track'}
              </span>
            </div>
          </div>
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-1.5 bg-slate-800 overflow-hidden" />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
            <span>{formatDuration(currentTime)}</span>
            <span className="text-slate-600">{formatDuration(totalDurationRef.current)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            onClick={stop}
            variant="ghost"
            size="icon"
            disabled={!isPlaying && progress === 0}
            className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Square className="size-5 fill-current" />
          </Button>
          
          <Button
            onClick={isPlaying ? pause : play}
            className="rounded-full h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="size-7 fill-white" />
            ) : (
              <Play className="size-7 fill-white ml-1" />
            )}
          </Button>
        </div>

        {composition.beatPattern && isPlaying && (
          <div className="flex gap-1.5 justify-center pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {Array(composition.beatPattern[0]?.length || 16).fill(null).map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-5 rounded-sm transition-all duration-100 ${
                  index === currentBeat
                    ? 'bg-purple-400 scale-y-125 shadow-[0_0_12px_rgba(168,85,247,0.8)]'
                    : 'bg-slate-800 opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}