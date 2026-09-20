function parseMinutes(hhmm) {
    if (!hhmm) return null;
    const m = String(hhmm).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
}

export function formatRadnoVrijeme(od, doV) {
    if (!od && !doV) return '';
    return `${od || '—'} – ${doV || '—'}`;
}

export function jeOtvoreno(od, doV, now = new Date()) {
    const from = parseMinutes(od);
    const to = parseMinutes(doV);
    if (from == null || to == null) return null;
    const cur = now.getHours() * 60 + now.getMinutes();
    if (from === to) return true;
    if (from < to) return cur >= from && cur < to;
    return cur >= from || cur < to;
}

export function statusRadnogVremena(od, doV) {
    const open = jeOtvoreno(od, doV);
    const hours = formatRadnoVrijeme(od, doV);
    if (open === null) {
        return { label: 'Radno vrijeme nije uneseno', open: null, hours };
    }
    return {
        label: open ? 'Otvoreno' : 'Zatvoreno',
        open,
        hours,
    };
}
