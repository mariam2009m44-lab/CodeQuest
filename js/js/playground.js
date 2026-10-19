
'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const editorFrame = document.getElementById('judge0Editor');
    const status = document.getElementById('editorStatus');

    if (!editorFrame || !status) {
        console.error(
            'Cody Academy: editor elements were not found.'
        );
        return;
    }

    let loaded = false;

    editorFrame.addEventListener('load', function () {
        loaded = true;
        status.textContent = 'تم تحميل المحرر';
        status.style.color = '#34D399';
    });

    editorFrame.addEventListener('error', function () {
        status.textContent = 'تعذر تحميل المحرر';
        status.style.color = '#FB7185';
    });

    // Show a helpful message if the external editor
    // does not finish loading.
    window.setTimeout(function () {
        if (!loaded) {
            status.textContent =
                'تحققي من الاتصال بالإنترنت أو افتحي المحرر مباشرة';
            status.style.color = '#FBBF24';
        }
    }, 12000);
});
