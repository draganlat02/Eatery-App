import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8000/ws';

export function pretplatiSeNaTopic(topic, onPoruka) {
    const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
            client.subscribe(topic, (poruka) => {
                try {
                    const data = JSON.parse(poruka.body);
                    onPoruka(data);
                } catch (e) {
                    console.error('Greška pri parsiranju WebSocket poruke:', e);
                }
            });
        },
        onStompError: (frame) => {
            console.error('STOMP greška:', frame.headers?.message, frame.body);
        },
        onWebSocketError: (e) => {
            console.warn('WebSocket konekcija nije dostupna (backend možda nije pokrenut):', e);
        },
    });

    client.activate();
    return client;
}

export function odsviraliObavjestenje() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const oscilator = ctx.createOscillator();
        const pojacalo = ctx.createGain();

        oscilator.type = 'sine';
        oscilator.connect(pojacalo);
        pojacalo.connect(ctx.destination);

        pojacalo.gain.setValueAtTime(0.001, ctx.currentTime);
        pojacalo.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        oscilator.frequency.setValueAtTime(880, ctx.currentTime);
        oscilator.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.16);

        pojacalo.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

        oscilator.start();
        oscilator.stop(ctx.currentTime + 0.45);
    } catch (e) {
        console.warn('Zvučni signal nije podržan u ovom browseru.', e);
    }
}
