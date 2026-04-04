(function() {
    class AmbientAudioManager {
        constructor() {
            this.ctx = null;
            this.master = null;
            this.mode = 'off';
            this.started = false;
            this.timer = null;
            this.step = 0;
            this.unlocked = false;

            this._installUnlockHandlers();
        }

        _installUnlockHandlers() {
            const unlock = () => {
                this.unlock();
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('pointerdown', unlock, { passive: true });
            window.addEventListener('keydown', unlock, { passive: true });
            window.addEventListener('touchstart', unlock, { passive: true });
        }

        _ensureContext() {
            if (this.ctx) return this.ctx;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;

            this.ctx = new AudioCtx();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.0;
            this.master.connect(this.ctx.destination);
            return this.ctx;
        }

        async unlock() {
            const ctx = this._ensureContext();
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                try {
                    await ctx.resume();
                } catch {
                    return;
                }
            }
            this.unlocked = true;
            if (this.mode !== 'off') this._start();
        }

        setMode(mode) {
            const next = mode === 'big2' || mode === 'home' ? mode : 'off';
            this.mode = next;

            if (!this.unlocked || !this._ensureContext()) return;
            if (next === 'off') {
                this._stop();
                return;
            }
            this._start();
        }

        _start() {
            if (!this.ctx || !this.master) return;

            const now = this.ctx.currentTime;
            const target = this.mode === 'big2' ? 0.07 : 0.055;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.linearRampToValueAtTime(target, now + 0.5);

            if (this.started) return;
            this.started = true;
            this.step = 0;

            this._scheduleChunk(this.ctx.currentTime + 0.03);
            this.timer = setInterval(() => {
                this._scheduleChunk(this.ctx.currentTime + 0.05);
            }, 920);
        }

        _stop() {
            if (!this.ctx || !this.master) return;
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.linearRampToValueAtTime(0.0, now + 0.45);

            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            this.started = false;
        }

        _scheduleChunk(startAt) {
            if (!this.ctx || this.mode === 'off') return;

            const patterns = this.mode === 'big2'
                ? [
                    [220.0, 261.63, 329.63],
                    [246.94, 293.66, 349.23],
                    [196.0, 246.94, 311.13],
                    [220.0, 277.18, 329.63]
                ]
                : [
                    [196.0, 246.94, 293.66],
                    [174.61, 220.0, 261.63],
                    [220.0, 261.63, 329.63],
                    [196.0, 233.08, 293.66]
                ];

            const chord = patterns[this.step % patterns.length];
            this.step += 1;

            const noteStep = this.mode === 'big2' ? 0.19 : 0.22;
            const arp = [chord[0], chord[1], chord[2], chord[1], chord[2], chord[0], chord[1], chord[2]];
            arp.forEach((freq, index) => {
                this._voice(freq, startAt + (index * noteStep), 0.16, 'triangle', this.mode === 'big2' ? 0.08 : 0.065);
            });

            const bassFreq = chord[0] / 2;
            this._voice(bassFreq, startAt, 0.5, 'sine', this.mode === 'big2' ? 0.14 : 0.11);
            this._voice((chord[1] / 2), startAt + 0.46, 0.44, 'sine', this.mode === 'big2' ? 0.13 : 0.1);

            this._kick(startAt);
            this._kick(startAt + 0.46);
            this._hat(startAt + 0.23);
            this._hat(startAt + 0.69);
        }

        _voice(freq, when, duration, type, volume) {
            if (!this.ctx || !this.master) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, when);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, when);
            filter.Q.value = 0.7;

            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(volume, when + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.master);

            osc.start(when);
            osc.stop(when + duration + 0.02);
        }

        _kick(when) {
            if (!this.ctx || !this.master) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(115, when);
            osc.frequency.exponentialRampToValueAtTime(48, when + 0.12);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, when);

            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(this.mode === 'big2' ? 0.08 : 0.06, when + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.master);

            osc.start(when);
            osc.stop(when + 0.16);
        }

        _hat(when) {
            if (!this.ctx || !this.master) return;

            const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - (i / data.length));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(4200, when);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(this.mode === 'big2' ? 0.026 : 0.02, when + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.master);

            noise.start(when);
            noise.stop(when + 0.04);
        }
    }

    window.AmbientAudio = new AmbientAudioManager();
})();