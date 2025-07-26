import { showConfirmationModal } from 'components/ConfirmationModal';
import { extensionBarStorageKey, useExtensionsBarStore } from 'components/stores/extensionsBarStore';
import { usePopupsStore } from 'components/stores/popupsStore';
import React from 'react';
import { MdArrowBack, MdDelete, MdRefresh } from 'react-icons/md';

export function StorageManager(): React.ReactNode {
  const [storages, setStorages] = React.useState<[string, unknown][]>([]);
  const { setManagerPopup } = usePopupsStore();

  React.useEffect(() => {
    refreshStorages();
  }, []);

  function refreshStorages(): void {
    const storage: [string, unknown][] = Object.entries(localStorage).filter(([key]) =>
      key.endsWith('::local')
      || key.endsWith('::session')
      || key.endsWith('::sync')
      || key.endsWith('::managed')).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    storage.push(...Object.entries(localStorage).filter(([key]) => key.includes('extendium')));
    setStorages(storage);
  }

  function renderObject(obj: object, keyStr: string, depth = 0): React.ReactNode {
    return (
      <div className="storage-manager-item" style={{ paddingLeft: `${depth * 10}px` }}>
        <details key={keyStr}>
          <summary>{keyStr}</summary>
          {Object.entries(obj).map(([key, value]) => (
            typeof value === 'object' && value !== null
              ? renderObject(value as object, key, depth + 1)
              : <div className="storage-manager-item" style={{ paddingLeft: `${(depth + 1) * 10}px` }} key={key}>{key}: {String(value)}</div>
          ))}
        </details>
      </div>
    );
  }

  function removeStorage(key: string): void {
    showConfirmationModal({
      title: 'Clear storage',
      description: (
        <p>Are you sure you want to clear out the <br /> &quot;{formatStorageKey(key)}&quot;?</p>
      ),
      okButtonText: 'Clear',
      onOK: () => {
        localStorage.removeItem(key);
        if (key === extensionBarStorageKey) {
          useExtensionsBarStore.setState({ extensionsOrder: [] });
        }
        refreshStorages();
      },
      bNeverPopOut: true,
    });
  }

  function formatStorageKey(key: string): string {
    const [extensionId, area] = key.split('::');

    if (area === undefined) {
      return extensionId ?? 'Unknown';
    }

    return `${extensionId} (${area} storage)`;
  }

  return (
    <div className="storage-manager">
      <div className="header">
        <button onClick={() => { setManagerPopup({ route: null }); }} type="button" className="md-button">
          <MdArrowBack />
        </button>
        <h1>Storage Manager</h1>
        <button type="button" onClick={() => { refreshStorages(); }} className="md-button"><MdRefresh /></button>
      </div>
      <p>
        Here you can manage all data that Extendium has stored for each extension.
        <br />
        This is useful if you want to clear out all data for a specific extension if for example it is not working properly or if you want to reset settings.
        <br />
        All this data is stored in the Steam browser&apos;s local storage and can be accessed through the browser&apos;s developer tools on any steamloopback address like the extension backgrounds.
      </p>

      {storages.map(([key, value]) => (
        <div key={key} className="storage-manager-row">
          {renderObject(JSON.parse(value as string) as object, formatStorageKey(key))}
          <button type="button" onClick={() => { removeStorage(key); }}><MdDelete /></button>
        </div>
      ))}
    </div>
  );
}
