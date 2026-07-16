import { ExternalLink } from '@extension/Metadata';
import { Field } from '@steambrew/client';
import React, { useCallback, useMemo, useRef } from 'react';
import { t } from '../../i18n';

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
  title = t('extLinksTitle'),
  placeholder = t('extLinksPlaceholder'),
  addButtonLabel = t('extLinksAdd'),
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

      <Field description={t('extLinksDesc')} />

      <div className="ext-links-list">
        {items.length === 0
          ? (
              <div className="ext-links-empty">
                {t('extLinksEmpty')}
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
                  <label className="ext-links-toggle" title={t('extLinksRegexTooltip')}>
                    <input
                      type="checkbox"
                      checked={link.isRegex}
                      onChange={(e) => { setItem(idx, { ...link, isRegex: e.currentTarget.checked }, true); }}
                    />
                    <span>{t('extLinksRegex')}</span>
                  </label>
                  <button
                    type="button"
                    className="ext-links-remove"
                    onClick={() => { removeItem(idx); }}
                    title={t('extLinksRemove')}
                  >
                    {t('extLinksRemove')}
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
