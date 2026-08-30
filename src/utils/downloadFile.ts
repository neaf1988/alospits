/** Descarga un archivo en el navegador de forma compatible con PWA y móvil. */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 500);
}

function isMobileShareContext(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export async function saveJsonBackupFile(
  json: string,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

  if (isMobileShareContext()) {
    const file = new File([blob], filename, { type: 'application/json' });

    if (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: 'Respaldo A Los Pits',
          text: 'Respaldo de datos de A Los Pits',
        });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
      }
    }
  }

  downloadBlobFile(blob, filename);
  return 'downloaded';
}
