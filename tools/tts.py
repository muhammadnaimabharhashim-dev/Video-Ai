"""Offline TTS via the espeak-ng library bundled in the `espeakng-loader` wheel.
Usage as module: synth(text, voice='ms+m3', speed=150, pitch=40) -> (samples int16 ndarray, sample_rate)
"""
import ctypes, numpy as np, espeakng_loader

_lib = ctypes.CDLL(espeakng_loader.get_library_path())
_lib.espeak_Initialize.restype = ctypes.c_int
_SR = _lib.espeak_Initialize(2, 0, espeakng_loader.get_data_path().encode(), 0)  # 2 = synchronous playback off, samples via callback
_CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
_buf = []
def _cb(wav, n, ev):
    if wav and n > 0: _buf.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
    return 0
_cbref = _CB(_cb); _lib.espeak_SetSynthCallback(_cbref)

def synth(text, voice='ms+m3', speed=150, pitch=40, rng=None):
    _buf.clear()
    _lib.espeak_SetVoiceByName(voice.encode())
    _lib.espeak_SetParameter(1, speed, 0)   # rate (wpm)
    _lib.espeak_SetParameter(3, pitch, 0)   # pitch 0..100
    b = text.encode('utf-8')
    _lib.espeak_Synth(b, len(b) + 1, 0, 0, 0, 1, None, None)
    _lib.espeak_Synchronize()
    return (np.concatenate(_buf) if _buf else np.zeros(0, dtype=np.int16)), _SR
