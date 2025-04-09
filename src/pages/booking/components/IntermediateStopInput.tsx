
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface IntermediateStopInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddStop: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onBlur: () => void;
  onFocus: () => void;
  suggestions: string[];
  showSuggestions: boolean;
  onSelectSuggestion: (suggestion: string) => void;
}

const IntermediateStopInput: React.FC<IntermediateStopInputProps> = ({
  value,
  onChange,
  onAddStop,
  inputRef,
  onBlur,
  onFocus,
  suggestions,
  showSuggestions,
  onSelectSuggestion
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="new-stop" className="text-blue-400">Parada Intermedia</Label>
      <div className="relative">
        <Input
          type="text"
          id="new-stop"
          placeholder="Añadir parada intermedia"
          value={value}
          onChange={onChange}
          ref={inputRef}
          className="bg-slate-800/70 border border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          onBlur={onBlur}
          onFocus={onFocus}
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 py-1 shadow-lg ring-1 ring-blue-500 border border-blue-500/30">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-900/30 text-gray-300"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-2">
          <Button 
            type="button" 
            size="sm" 
            onClick={onAddStop}
            className="bg-blue-900/30 text-blue-400 border border-blue-500/30 hover:bg-blue-800/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntermediateStopInput;
