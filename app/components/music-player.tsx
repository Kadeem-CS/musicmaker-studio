import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Slider } from './ui/slider';
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
  const [volume, setVolume] = useState(70);
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
    
    totalDurationRef.current = duration || 5000; // Default 5 seconds if no content
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

    // Auto-stop when complete
    const stopTimeoutId = window.setTimeout(() => {
      stop();
    }, totalDurationRef.current);
    timeoutsRef.current.push(stopTimeoutId);
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
    return () => {
      clearTimeouts();
    };
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * totalDurationRef.current;

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <div className="space-y-6">
        {/* Track Info */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{composition.name}</h3>
          <div className="flex gap-3 text-sm text-slate-400">
            <span>{composition.tempo} BPM</span>
            {composition.beatPattern && <span>• Beat Pattern</span>}
            {composition.pianoRecording && (
              <span>• {composition.pianoRecording.length} Piano Notes</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(totalDurationRef.current)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={stop}
            variant="outline"
            size="lg"
            disabled={!isPlaying && progress === 0}
            className="rounded-full"
          >
            <Square className="size-6" />
          </Button>
          
          <Button
            onClick={isPlaying ? pause : play}
            size="lg"
            className="rounded-full h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isPlaying ? (
              <Pause className="size-8" />
            ) : (
              <Play className="size-8 ml-1" />
            )}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="size-5 text-slate-400" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-slate-400 w-12">{volume}%</span>
        </div>

        {/* Beat Indicator */}
        {composition.beatPattern && isPlaying && (
          <div className="bg-slate-950/50 rounded-lg p-4">
            <div className="flex gap-1 justify-center">
              {Array(composition.beatPattern[0]?.length || 16).fill(null).map((_, index) => (
                <div
                  key={index}
                  className={`w-4 h-8 rounded transition-all ${
                    index === currentBeat
                      ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
