import { ExternalLink } from '@extension/Metadata';
import { Field } from '@steambrew/client';
import React, { useCallback, useMemo, useRef } from 'react';

export interface ExternalLinksManagerProps {
  onChange(next: ExternalLink[]): void;
  onSave(list: ExternalLink[]): void;
  readonly addButtonLabel?: string;
  readonly allowEmpty?: boolean; // if false, empty items are filtered out on blur/remove
  readonly className?: string;
  readonly placeholder?: string;
  readonly title?: string;
  readonly value: ExternalLink[];
}

export default function DynamicListManager({
  value,
  onChange,
  onSave,
  title = 'External links',
  placeholder = 'Paste or type a link…',
  addButtonLabel = 'Add link',
  className,
  allowEmpty = false,
}: ExternalLinksManagerProps): React.ReactNode {
  const items = useMemo(() => value, [value]);
  const isFirstLoad = useRef(true);

  const setItem = useCallback(
    (index: number, next: ExternalLink, doSave = false) => {
      const copy = items.slice();
      copy[index] = next;
      isFirstLoad.current = false;
      onChange(copy);
      if (doSave) onSave(copy);
    },
    [items, onChange],
  );

  const addItem = useCallback(() => {
    isFirstLoad.current = false;
    const next: ExternalLink[] = [...items, { match: '', isRegex: false }];
    onChange(next);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
      onSave(next);
    },
    [items, onChange],
  );

  const onBlurCleanup = useCallback(() => {
    isFirstLoad.current = false;
    onSave(items);
    if (allowEmpty) return;
    const cleaned = items.filter(s => s.match.trim().length > 0);
    if (cleaned.length !== items.length) onChange(cleaned);
  }, [allowEmpty, items, onChange]);

  return (
    <div className={['ext-links-manager', className].filter(Boolean).join(' ')}>
      <div className="ext-links-header">
        <span className="ext-links-title">{title}</span>
      </div>

      <Field description="Manage URL patterns that should always open in an external browser. For each entry, provide a string to match against the URL. If 'Regex' is checked, the string is treated as a regular expression. Otherwise, it performs a simple case sensitive text search." />

      <div className="ext-links-list">
        {items.length === 0
          ? (
              <div className="ext-links-empty">
                No links yet.
              </div>
            )
          : (
              items.map((link, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={`${idx}`} className="ext-links-row">
                  <input
                    className="styled-input"
                    type="text"
                    inputMode="url"
                    value={link.match}
                    autoFocus={idx === items.length - 1 && !isFirstLoad.current}
                    placeholder={placeholder}
                    onChange={(e) => { setItem(idx, { ...link, match: e.currentTarget.value }); }}
                    onBlur={onBlurCleanup}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Add a new row when pressing Enter on the last item
                        if (idx === items.length - 1) addItem();
                      } else if (e.key === 'Backspace' && link.match.length === 0) {
                        // Backspace on empty row removes it
                        e.preventDefault();
                        removeItem(idx);
                      }
                    }}
                  />
                  <label className="ext-links-toggle" title="Treat match as a regular expression">
                    <input
                      type="checkbox"
                      checked={link.isRegex}
                      onChange={(e) => { setItem(idx, { ...link, isRegex: e.currentTarget.checked }, true); }}
                    />
                    <span>Regex</span>
                  </label>
                  <button
                    type="button"
                    className="ext-links-remove"
                    onClick={() => { removeItem(idx); }}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
      </div>

      <div className="ext-links-actions">
        <button type="button" className="ext-links-add" onClick={addItem}>
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}
