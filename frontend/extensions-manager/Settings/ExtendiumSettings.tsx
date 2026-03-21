import { DialogBody, Field, SliderField, Toggle } from '@steambrew/client';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import { ExternalLinksManager } from './ExternalLinksMananger';
import { useSettingsStore } from './settingsStore';

export function ExtendiumSettings(): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { barMarginLeft, barMarginRight, showCompatibilityPills, openLinksInCurrentTab, setSettings } = useSettingsStore();

  return (
    <DialogBody>
      <div className="header">
        <button onClick={() => { setManagerPopup({ route: null }); }} type="button" className="md-button">
          <MdArrowBack />
        </button>
        <h1>Extendium Settings</h1>
      </div>
      <Field description="If the extension bar is covered up by other buttons or you want to move it you can change the margin here" />
      <SliderField
        label="Margin right"
        value={barMarginRight}
        min={-200}
        max={200}
        onChange={(value) => { setSettings({ barMarginRight: value }); }}
        showValue
        editableValue
        resetValue={0}
      />
      <SliderField
        label="Margin left"
        value={barMarginLeft}
        min={-200}
        max={200}
        onChange={(value) => { setSettings({ barMarginLeft: value }); }}
        showValue
        editableValue
        resetValue={0}
      />
      <Field label="Show compatibility status pills next to extension names in the extension manager">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Show compatibility pills</span>
          <Toggle
            onChange={(value) => { setSettings({ showCompatibilityPills: value }); }}
            value={showCompatibilityPills}
          />
        </div>
      </Field>
      <ExternalLinksManager />
      <Field label="Always open links in current tab on left click (ignores target blank)">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Open in current tab</span>
          <Toggle
            onChange={(value) => { setSettings({ openLinksInCurrentTab: value }); }}
            value={openLinksInCurrentTab}
          />
        </div>
      </Field>

    </DialogBody>
  );
}
