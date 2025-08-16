import { DialogBody, Field, SliderField } from '@steambrew/client';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import { useSettingsStore } from './settingsStore';

export function ExtendiumSettings(): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const { barMarginLeft, barMarginRight, setSettings } = useSettingsStore();

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
    </DialogBody>
  );
}
