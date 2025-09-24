import { Extension } from '@extension/Extension';
import { callable, DialogButton, Spinner, Toggle } from '@steambrew/client';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { FaArrowCircleUp, FaExclamationCircle } from 'react-icons/fa';
import { useUpdateStore } from 'updates/updateStore';
import { showConfirmationModal } from '../components/ConfirmationModal';
import { downloadExtensionUpdate } from './Downloader/download-manager';
import { showRemoveModal } from './RemoveModal';
import { showRestartModal } from './RestartModal';

const ToggleExtension = callable<[{ name: string; enabled: boolean; }], void>('ToggleExtension');

export function ExtensionManagerComponent({ extension }: { readonly extension: Extension; }): React.ReactNode {
  const { setManagerPopup } = usePopupsStore();
  const hasUpdate = useUpdateStore(state => state.updateAvailable.includes(extension.folderName));
  const { updateAvailable, setUpdateStore } = useUpdateStore();
  const [updating, setUpdating] = React.useState(false);
  const missingMetadata = extension.metadata === undefined;

  function handleToggleChange(value: boolean): void {
    ToggleExtension({ name: extension.folderName, enabled: value });
    // TODO: make work
  }

  const extensionHasErrors = extension.logger.errors.length > 0;

  function handleReinstallInfoClick(): void {
    showConfirmationModal({
      title: 'Metadata missing',
      description: 'This extension is missing its update metadata, so it cannot be updated automatically. Please reinstall it from its original Chrome Web Store URL. Or ignore this message if you don\'t want updates.',
      okButtonText: 'OK',
    });
  }

  async function handleUpdateClick(): Promise<void> {
    if (updating) return;
    if (extension.metadata === undefined) {
      showConfirmationModal({
        title: 'Update information missing',
        description: 'Could not find metadata for this extension to perform an update. Try reinstalling it from the Chrome Web Store URL.',
        okButtonText: 'OK',
      });

      return;
    }
    try {
      setUpdating(true);
      const ok = await downloadExtensionUpdate(extension.folderName, extension.metadata);
      if (ok) {
        showRestartModal();
      } else {
        showConfirmationModal({
          title: 'Update failed',
          description: 'Failed to download and install the update. Check logs for details.',
          okButtonText: 'OK',
        });
      }
    } finally {
      setUpdating(false);
      setUpdateStore({ updateAvailable: updateAvailable.filter(name => name !== extension.folderName) });
    }
  }

  return (
    <div className="extension-card">
      <div className="extension-main">
        <div className="icon" style={{ position: 'relative' }}>
          <img src={extension.action.getDefaultIconUrl(48)} />
          {extensionHasErrors && (
            <FaExclamationCircle color="red" size={24} />
          )}
          {hasUpdate && (
            <div
              className={`update-badge${updating ? ' disabled' : ''}`}
              onClick={updating ? undefined : handleUpdateClick}
              title={updating ? 'Updating…' : 'Update available – click to update'}
            >
              <FaArrowCircleUp />
            </div>
          )}
        </div>

        <div className="content">
          <div className="name-and-version layout-horizontal-center">
            <div className="name">{extension.getName()}</div>
            <span className="version secondary-text">{extension.getVersion()}</span>
            {missingMetadata
              ? (
                  <span
                    role="button"
                    className="warn-pill"
                    onClick={handleReinstallInfoClick}
                    title="Missing update metadata. Reinstall from original URL."
                  >
                    Reinstall required
                  </span>
                )
              : hasUpdate && (
                <span
                  role="button"
                  className={`update-pill${updating ? ' disabled' : ''}`}
                  onClick={updating ? undefined : handleUpdateClick}
                  title={updating ? 'Updating…' : 'Update to latest'}
                >
                  {updating ? <><Spinner />Updating…</> : 'Update'}
                </span>
              )}
          </div>
          <div className="description secondary-text">
            {extension.getDescription() ?? 'No description...'}
          </div>
        </div>
      </div>
      <div className="extension-buttons">
        <DialogButton onClick={() => { setManagerPopup({ route: `info/${extension.getName()}` }); }}>Details</DialogButton>
        <DialogButton onClick={() => { showRemoveModal(extension); }}>Remove</DialogButton>
        {/* @ts-expect-error style does not exist */}
        <Toggle onChange={handleToggleChange} style={{ display: 'none' }} value />
      </div>
    </div>
  );
}
