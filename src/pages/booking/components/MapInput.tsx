
import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MapInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const MapInput: React.FC<MapInputProps> = ({
  id,
  placeholder,
  value,
  onChange,
  inputRef
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
      <Input
        type="text"
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 bg-slate-800/70 border border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        ref={inputRef}
      />
    </div>
  );
};

export default MapInput;
