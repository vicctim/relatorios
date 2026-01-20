import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Register Portuguese locale
registerLocale('pt-BR', ptBR);

interface DateInputProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  id?: string;
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  className = '',
  hasError = false,
  id,
}: DateInputProps) {
  // Convert string to Date for DatePicker
  const dateValue = value ? new Date(value + 'T00:00:00') : null;

  // Convert Date to string (YYYY-MM-DD format for backend)
  const handleChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  // Custom input component with calendar icon
  const CustomInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type="text"
          value={value}
          onClick={onClick}
          readOnly
          placeholder={placeholder}
          className={`input pr-10 cursor-pointer ${hasError ? 'input-error' : ''} ${className}`}
        />
        <Calendar
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
        />
      </div>
    )
  );

  CustomInput.displayName = 'CustomDateInput';

  return (
    <DatePicker
      selected={dateValue}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale="pt-BR"
      placeholderText={placeholder}
      customInput={<CustomInput />}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      todayButton="Hoje"
      isClearable={false}
    />
  );
}
