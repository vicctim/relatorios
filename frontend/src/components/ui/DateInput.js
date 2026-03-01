import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
// Register Portuguese locale
registerLocale('pt-BR', ptBR);
export default function DateInput({ value, onChange, placeholder = 'DD/MM/AAAA', className = '', hasError = false, id, }) {
    // Convert string to Date for DatePicker
    const dateValue = value ? new Date(value + 'T00:00:00') : null;
    // Convert Date to string (YYYY-MM-DD format for backend)
    const handleChange = (date) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        }
        else {
            onChange('');
        }
    };
    // Custom input component with calendar icon
    const CustomInput = forwardRef(({ value, onClick }, ref) => (_jsxs("div", { className: "relative", children: [_jsx("input", { id: id, ref: ref, type: "text", value: value, onClick: onClick, readOnly: true, placeholder: placeholder, className: `input pr-10 cursor-pointer ${hasError ? 'input-error' : ''} ${className}` }), _jsx(Calendar, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" })] })));
    CustomInput.displayName = 'CustomDateInput';
    return (_jsx("div", { className: "relative", style: { zIndex: 10 }, children: _jsx(DatePicker, { selected: dateValue, onChange: handleChange, dateFormat: "dd/MM/yyyy", locale: "pt-BR", placeholderText: placeholder, customInput: _jsx(CustomInput, {}), showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select", todayButton: "Hoje", isClearable: false, popperClassName: "date-picker-popper", popperPlacement: "bottom-start", withPortal: false }) }));
}
