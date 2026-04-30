import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider'; // Ensure this is imported
import { 
  Circle, Square, Play, Trash2, ChevronLeft, ChevronRight, 
  Activity, Magnet, Save, RefreshCcw, Volume2 
} from 'lucide-react';
import { AudioEngine, NOTE_FREQUENCIES } from './audio-engine';

interface RecordedNote {
  note: string;
  time: number;
}

interface PianoKeyboardProps {
  audioEngine: AudioEngine;
  tempo: number;
  onRecordingChange?: (recording: RecordedNote[]) => void;
  onSaveRequest?: () => void;
  initialRecording?: RecordedNote[];
}

const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];
const BLACK_KEY_POSITIONS = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];

const KEY_MAP: { [key: string]: string } = {
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 
  'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5',
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4', 'o': 'C#5', 'p': 'D#5'
};

export function PianoKeyboard({ audioEngine, tempo, onRecordingChange, onSaveRequest, initialRecording }: PianoKeyboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<RecordedNote[]>(initialRecording || []);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [pianoVolume, setPianoVolume] = useState(0.6); // NEW: Local piano volume state
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [timeSignature, setTimeSignature] = useState<'4/4' | '6/8'>('4/4');
  
  const heldKeys = useRef<Set<string>>(new Set());
  const beatCounter = useRef(0);
  const recordingStartTime = useRef<number>(0);
  const metronomeIntervalRef = useRef<any>(null);
  const playbackTimeouts = useRef<number[]>([]);

  const msPerBeat = 60000 / tempo;
  const gridSpacingMs = timeSignature === '4/4' ? msPerBeat / 2 : msPerBeat / 1.5;

  useEffect(() => {
    if (onRecordingChange) onRecordingChange(recording);
  }, [recording, onRecordingChange]);

  const quantize = (division: number) => {
    const gridStep = msPerBeat / (division / 4); 
    setRecording(recording.map(n => ({ 
      ...n, 
      time: Math.round(n.time / gridStep) * gridStep 
    })));
  };

  const playRecording = () => {
    if (recording.length === 0) return;
    audioEngine.resume();
    
    playbackTimeouts.current.forEach(clearTimeout);
    playbackTimeouts.current = [];

    recording.forEach((note) => {
      const timeoutId = window.setTimeout(() => {
        const baseFreq = NOTE_FREQUENCIES[note.note];
        if (baseFreq) {
          const frequency = baseFreq * Math.pow(2, octaveOffset);
          // Uses the current pianoVolume for preview
          audioEngine.playNote(frequency, pianoVolume, 0.8);
          
          setActiveNotes(prev => new Set(prev).add(note.note));
          setTimeout(() => setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note.note);
            return next;
          }), 250);
        }
      }, note.time);
      playbackTimeouts.current.push(timeoutId);
    });
  };

  const clearRecording = () => {
    playbackTimeouts.current.forEach(clearTimeout);
    setRecording([]);
  };

  useEffect(() => {
    if (metronomeOn && isRecording) {
      const beatsInMeasure = timeSignature === '4/4' ? 4 : 6;
      const interval = timeSignature === '4/4' ? msPerBeat : (msPerBeat / 1.5);
      metronomeIntervalRef.current = setInterval(() => {
        const isAccent = beatCounter.current % beatsInMeasure === 0;
        audioEngine.playMetronome(undefined, isAccent);
        beatCounter.current++;
      }, interval);
    } else {
      clearInterval(metronomeIntervalRef.current);
      beatCounter.current = 0;
    }
    return () => clearInterval(metronomeIntervalRef.current);
  }, [metronomeOn, isRecording, tempo, timeSignature, msPerBeat]);

  const playNote = (note: string) => {
    audioEngine.resume();
    const baseFreq = NOTE_FREQUENCIES[note];
    if (baseFreq) {
      const frequency = baseFreq * Math.pow(2, octaveOffset);
      // PASSING pianoVolume to the engine
      audioEngine.playNote(frequency, pianoVolume, 0.8);
      setActiveNotes(prev => new Set(prev).add(note));
      setTimeout(() => setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      }), 250);
      if (isRecording) {
        setRecording(prev => [...prev, { note, time: Date.now() - recordingStartTime.current }]);
      }
    }
  };

  // UPDATED: Keyboard Listener with Focus Guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const note = KEY_MAP[key];
      if (note && !heldKeys.current.has(key)) {
        heldKeys.current.add(key);
        playNote(note);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => heldKeys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveOffset, isRecording, pianoVolume]); // Rebind if volume changes

  return (
    <div className="space-y-6">
      {/* 1. TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setIsRecording(!isRecording); if(!isRecording) { recordingStartTime.current = Date.now(); setRecording([]); } }} 
            className={isRecording ? "bg-slate-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isRecording ? <Square className="size-4 mr-2" /> : <Circle className="size-4 mr-2 fill-current" />}
            {isRecording ? "Stop" : "Record"}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setMetronomeOn(!metronomeOn)} 
            className={metronomeOn ? "border-orange-500 text-orange-500 bg-orange-500/10" : "text-slate-300 border-slate-700"}
          >
            <Activity className="size-4 mr-2" /> 
            {metronomeOn ? "Click: ON" : "Click: OFF"}
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setTimeSignature(t => t === '4/4' ? '6/8' : '4/4')}
            className="font-mono text-xs bg-slate-800 text-white"
          >
            {timeSignature}
          </Button>

          <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-4">
             <Button size="icon" variant="ghost" className="size-8 text-slate-400" onClick={() => setOctaveOffset(o => Math.max(-2, o - 1))}><ChevronLeft className="size-4"/></Button>
             <span className="text-[10px] font-bold text-slate-500 uppercase">Oct {octaveOffset}</span>
             <Button size="icon" variant="ghost" className="size-8 text-slate-400" onClick={() => setOctaveOffset(o => Math.min(2, o + 1))}><ChevronRight className="size-4"/></Button>
          </div>

          {/* NEW: PIANO VOLUME SLIDER */}
          <div className="flex items-center gap-3 ml-2 border-l border-slate-700 pl-4 w-32">
            <Volume2 className="size-3 text-slate-500" />
            <Slider
              value={[pianoVolume]}
              onValueChange={(v) => setPianoVolume(v[0])}
              min={0}
              max={1}
              step={0.01}
              className="accent-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <Magnet className="size-3 text-slate-500" />
            <Button size="sm" variant="ghost" className="h-8 text-[10px] text-slate-300 hover:text-white" onClick={() => quantize(8)}>SNAP 1/8</Button>
            <Button size="sm" variant="ghost" className="h-8 text-[10px] text-slate-300 hover:text-white" onClick={() => quantize(16)}>SNAP 1/16</Button>
          </div>

          <Button 
            disabled={recording.length === 0 || isRecording}
            onClick={onSaveRequest} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
          >
            <Save className="size-4 mr-2" /> Save to Library
          </Button>
        </div>
      </div>

      {/* 2. PIANO KEYS */}
      <div className="bg-slate-950 p-10 rounded-xl border border-slate-800 shadow-2xl overflow-x-auto select-none">
        <div className="relative inline-block">
          <div className="flex gap-1">
            {WHITE_KEYS.map((note) => (
              <button
                key={note}
                onMouseDown={() => playNote(note)}
                className={`
                  w-14 h-60 bg-gradient-to-b from-slate-50 to-white border-x border-b-4 border-slate-300 rounded-b-xl
                  hover:from-slate-200 hover:to-slate-100 transition-all flex flex-col justify-end pb-4
                  ${activeNotes.has(note) ? 'from-blue-400 to-blue-200 border-blue-500 scale-[0.98] pt-2' : ''}
                `}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase">{note}</span>
              </button>
            ))}
          </div>
          <div className="absolute top-0 left-0 flex pointer-events-none w-full">
            {WHITE_KEYS.map((_, index) => {
              const blackKeyIndex = BLACK_KEY_POSITIONS.indexOf(index);
              const hasBlackKey = blackKeyIndex !== -1;
              return (
                <div key={index} className="relative w-[60px]">
                  {hasBlackKey && (
                    <button
                      onMouseDown={(e) => { e.stopPropagation(); playNote(BLACK_KEYS[blackKeyIndex]); }}
                      className={`
                        absolute left-[38px] w-10 h-36 bg-gradient-to-b from-slate-800 to-slate-950 
                        border-x border-b-4 border-black rounded-b-lg pointer-events-auto z-10 flex flex-col justify-end pb-2
                        ${activeNotes.has(BLACK_KEYS[blackKeyIndex]) ? 'from-blue-900 to-blue-700 border-blue-600 pt-1' : ''}
                      `}
                    >
                      <span className="text-[8px] font-medium text-slate-500 uppercase">{BLACK_KEYS[blackKeyIndex]}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. PIANO ROLL SCROLL */}
      <div className="h-44 bg-slate-900/90 rounded-xl border border-slate-800 p-4 overflow-x-auto relative shadow-inner">
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            backgroundSize: `${gridSpacingMs / 10}px 100%`, 
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px)' 
          }} 
        />
        <div className="relative h-full">
          {recording.map((note, i) => (
            <div 
              key={i} 
              className="absolute h-4 bg-purple-500 rounded-sm border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
              style={{ left: `${note.time / 10}px`, top: `${(WHITE_KEYS.indexOf(note.note) % 10) * 14}px`, width: '28px' }}
            >
              <span className="text-[7px] text-white pl-1 uppercase font-bold">{note.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PREVIEW & CLEAR CONTROLS */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          disabled={recording.length === 0 || isRecording}
          onClick={playRecording}
          className="w-48 border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
        >
          <RefreshCcw className="size-4 mr-2" />
          Preview Take
        </Button>
        
        <Button 
          variant="ghost" 
          disabled={recording.length === 0 || isRecording}
          onClick={clearRecording}
          className="text-slate-500 hover:text-red-400"
        >
          <Trash2 className="size-4 mr-2" />
          Clear Roll
        </Button>
      </div>
    </div>
  );
}