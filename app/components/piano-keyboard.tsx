import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Circle, Square } from 'lucide-react';
import { AudioEngine, NOTE_FREQUENCIES } from './audio-engine';

interface RecordedNote {
  note: string;
  time: number;
}

interface PianoKeyboardProps {
  audioEngine: AudioEngine;
  onRecordingChange?: (recording: RecordedNote[]) => void;
  initialRecording?: RecordedNote[];
}

const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];

const BLACK_KEY_POSITIONS = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13];

export function PianoKeyboard({ audioEngine, onRecordingChange, initialRecording }: PianoKeyboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<RecordedNote[]>(initialRecording || []);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const recordingStartTime = useRef<number>(0);
  const playbackTimeoutRef = useRef<number[]>([]);

  useEffect(() => {
    if (onRecordingChange) {
      onRecordingChange(recording);
    }
  }, [recording, onRecordingChange]);

  const playNote = (note: string) => {
    audioEngine.resume();
    const frequency = NOTE_FREQUENCIES[note];
    if (frequency) {
      audioEngine.playNote(frequency);
      
      setActiveNotes(prev => new Set(prev).add(note));
      setTimeout(() => {
        setActiveNotes(prev => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
      }, 300);

      if (isRecording) {
        const elapsedTime = Date.now() - recordingStartTime.current;
        setRecording(prev => [...prev, { note, time: elapsedTime }]);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecording([]);
    recordingStartTime.current = Date.now();
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const playRecording = () => {
    if (recording.length === 0) return;

    recording.forEach((recordedNote) => {
      const timeoutId = window.setTimeout(() => {
        const frequency = NOTE_FREQUENCIES[recordedNote.note];
        if (frequency) {
          audioEngine.playNote(frequency);
          setActiveNotes(prev => new Set(prev).add(recordedNote.note));
          setTimeout(() => {
            setActiveNotes(prev => {
              const next = new Set(prev);
              next.delete(recordedNote.note);
              return next;
            });
          }, 300);
        }
      }, recordedNote.time);
      playbackTimeoutRef.current.push(timeoutId);
    });
  };

  const clearRecording = () => {
    setRecording([]);
    playbackTimeoutRef.current.forEach(id => clearTimeout(id));
    playbackTimeoutRef.current = [];
  };

  useEffect(() => {
    return () => {
      playbackTimeoutRef.current.forEach(id => clearTimeout(id));
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button onClick={startRecording} size="lg" variant="destructive">
            <Circle className="size-5 mr-2 fill-current" />
            Record
          </Button>
        ) : (
          <Button onClick={stopRecording} size="lg" variant="destructive">
            <Square className="size-5 mr-2 fill-current" />
            Stop Recording
          </Button>
        )}
        
        <Button 
          onClick={playRecording} 
          size="lg"
          disabled={recording.length === 0}
        >
          Play Recording
        </Button>
        
        <Button 
          onClick={clearRecording} 
          variant="outline" 
          size="lg"
          disabled={recording.length === 0}
        >
          Clear
        </Button>

        <div className="ml-auto text-sm text-slate-400">
          {recording.length} notes recorded
        </div>
      </div>

      {/* Piano Keys */}
      <div className="bg-slate-900 rounded-lg p-8 overflow-x-auto">
        <div className="relative inline-block">
          {/* White Keys */}
          <div className="flex gap-1">
            {WHITE_KEYS.map((note) => (
              <button
                key={note}
                onMouseDown={() => playNote(note)}
                className={`
                  w-16 h-64 bg-white border-2 border-slate-800 rounded-b-lg
                  hover:bg-slate-100 active:bg-slate-200 transition-colors
                  ${activeNotes.has(note) ? 'bg-blue-200' : ''}
                `}
              >
                <span className="block mt-auto mb-4 text-sm text-slate-600">
                  {note}
                </span>
              </button>
            ))}
          </div>

          {/* Black Keys */}
          <div className="absolute top-0 left-0 flex gap-1 pointer-events-none">
            {WHITE_KEYS.map((_, index) => {
              const blackKeyIndex = BLACK_KEY_POSITIONS.indexOf(index);
              const hasBlackKey = blackKeyIndex !== -1;
              
              return (
                <div key={index} className="relative w-16">
                  {hasBlackKey && (
                    <button
                      onMouseDown={() => playNote(BLACK_KEYS[blackKeyIndex])}
                      className={`
                        absolute right-0 translate-x-1/2 w-10 h-40 bg-slate-900 border-2 border-slate-700
                        rounded-b-lg pointer-events-auto z-10
                        hover:bg-slate-800 active:bg-slate-700 transition-colors
                        ${activeNotes.has(BLACK_KEYS[blackKeyIndex]) ? 'bg-blue-900' : ''}
                      `}
                    >
                      <span className="block mt-auto mb-4 text-xs text-white">
                        {BLACK_KEYS[blackKeyIndex]}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
