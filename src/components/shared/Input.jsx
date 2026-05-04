/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Input Component
   
   Props: label, type, value, onChange, placeholder, icon, iconRight,
          error, hint, required, disabled, fullWidth, multiline, rows
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';

/**
 * Input — styled form input with label, icon, error, and hint support.
 * Also handles textarea (multiline prop).
 */
function Input({
  label,
  type        = 'text',
  value       = '',
  onChange,
  placeholder,
  icon        = null,      // left icon (emoji or component)
  iconRight   = null,      // right icon (e.g., password toggle)
  onIconRightClick,
  error       = '',
  hint        = '',
  required    = false,
  disabled    = false,
  fullWidth   = true,
  multiline   = false,     // renders as <textarea>
  rows        = 4,
  autoFocus   = false,
  id,
  name,
  maxLength,
  style       = {},
  inputStyle  = {},
  className   = '',
}) {
  const [focused, setFocused] = useState(false);

  // Unique ID for label association
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

  const hasError  = !!error;
  const borderColor = hasError
    ? 'var(--color-error)'
    : focused
      ? 'var(--border-focus)'
      : 'var(--border-default)';

  const sharedInputStyle = {
    width: '100%',
    background: 'var(--bg-input)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    padding: icon ? '11px 14px 11px 42px' : iconRight ? '11px 42px 11px 14px' : '11px 14px',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    boxShadow: focused && !hasError ? '0 0 0 3px var(--gold-alpha-10)' : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
    resize: multiline ? 'vertical' : 'none',
    ...inputStyle,
  };

  return (
    <div
      className={className}
      style={{
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: hasError ? 'var(--color-error)' : focused ? 'var(--gold)' : 'var(--text-secondary)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
            transition: 'color var(--transition-fast)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-error)', marginLeft: 3 }}>*</span>
          )}
        </label>
      )}

      {/* Input Wrapper */}
      <div style={{ position: 'relative' }}>

        {/* Left Icon */}
        {icon && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 14,
              top: multiline ? 13 : '50%',
              transform: multiline ? 'none' : 'translateY(-50%)',
              color: focused ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: 16,
              pointerEvents: 'none',
              transition: 'color var(--transition-fast)',
              lineHeight: 1,
            }}
          >
            {icon}
          </div>
        )}

        {/* Input or Textarea */}
        {multiline ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            maxLength={maxLength}
            autoFocus={autoFocus}
            style={sharedInputStyle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            name={name}
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoFocus={autoFocus}
            style={sharedInputStyle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete={type === 'password' ? 'current-password' : undefined}
          />
        )}

        {/* Right Icon (e.g., password toggle) */}
        {iconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            aria-label="Toggle input action"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '2px 4px',
              lineHeight: 1,
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {iconRight}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          style={{
            marginTop: 5,
            fontSize: 11,
            color: 'var(--color-error)',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>⚠</span> {error}
        </p>
      )}

      {/* Hint message */}
      {hint && !error && (
        <p
          style={{
            marginTop: 5,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {hint}
        </p>
      )}

      {/* Character counter */}
      {maxLength && (
        <p
          style={{
            marginTop: 4,
            fontSize: 10,
            color: value.length >= maxLength * 0.9 ? 'var(--color-warning)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'right',
          }}
        >
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default Input;
