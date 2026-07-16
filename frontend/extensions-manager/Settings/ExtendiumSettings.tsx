import { DialogBody, Field, SliderField, Toggle } from '@steambrew/client';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import { t } from '../../i18n';
import { ExternalLinksManager } from './ExternalLinksMananger';
import { useSettingsStore } from './settingsStore';

export function ExtendiumSettings(): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { barMarginLeft, barMarginRight, showCompatibilityPills, openLinksInCurrentTab, language, setSettings } = useSettingsStore();

  return (
    <DialogBody>
      <div className="header">
        <button onClick={() => { setManagerPopup({ route: null }); }} type="button" className="md-button">
          <MdArrowBack />
        </button>
        <h1>{t('settingsTitle')}</h1>
      </div>
      <Field description={t('settingsDesc')} />
      <SliderField
        label={t('marginRight')}
        value={barMarginRight}
        min={-200}
        max={200}
        onChange={(value) => { setSettings({ barMarginRight: value }); }}
        showValue
        editableValue
        resetValue={0}
      />
      <SliderField
        label={t('marginLeft')}
        value={barMarginLeft}
        min={-200}
        max={200}
        onChange={(value) => { setSettings({ barMarginLeft: value }); }}
        showValue
        editableValue
        resetValue={0}
      />
      <Field label={t('showCompPillsLabel')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{t('showCompPillsSpan')}</span>
          <Toggle
            onChange={(value) => { setSettings({ showCompatibilityPills: value }); }}
            value={showCompatibilityPills}
          />
        </div>
      </Field>
      <Field label={t('languageLabel')} description={t('languageDesc')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="styled-input"
            style={{ width: '200px', cursor: 'pointer', outline: 'none' }}
            value={language}
            onChange={(e) => { setSettings({ language: e.currentTarget.value as 'auto' | 'en' | 'ja' }); }}
          >
            <option style={{ background: '#222' }} value="auto">{t('langAuto')}</option>
            <option style={{ background: '#222' }} value="en">{t('langEn')}</option>
            <option style={{ background: '#222' }} value="ja">{t('langJa')}</option>
          </select>
        </div>
      </Field>
      <ExternalLinksManager />
      <Field label={t('openLinksLabel')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1rem' }}>
          <span>{t('openLinksSpan')}</span>
          <Toggle
            onChange={(value) => { setSettings({ openLinksInCurrentTab: value }); }}
            value={openLinksInCurrentTab}
          />
        </div>
      </Field>

    </DialogBody>
  );
}
