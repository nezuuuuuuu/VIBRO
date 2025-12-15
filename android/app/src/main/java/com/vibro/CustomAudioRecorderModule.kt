package com.vibro

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.media.*
import android.os.Build
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

class CustomAudioRecorderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val tag = "CustomAudioRecorderModule"
    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private var isRecording = false
    private var audioTrack: AudioTrack? = null
    private val maxDurationMs = 5000

    override fun getName(): String = "CustomAudioRecorderModule"

    @ReactMethod
    fun requestMicrophonePermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val granted = reactContext.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Already recording")
            return
        }

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("AUDIO_RECORD_INIT_ERROR", "Failed to initialize AudioRecord")
                return
            }

            val totalAudioData = ByteArrayOutputStream()
            val buffer = ByteBuffer.allocateDirect(bufferSize).order(ByteOrder.LITTLE_ENDIAN)
            val tempData = ByteArray(bufferSize)

            audioRecord?.startRecording()
            isRecording = true

            recordingThread = Thread {
                try {

                    val maxSamples = 80000  // 80000 samples for 5 sec
                    var totalSamplesRead = 0
                    val startTime = System.currentTimeMillis()
                    while (isRecording && totalSamplesRead < maxSamples) {
                        buffer.clear()
                        val bytesRead = audioRecord?.read(buffer, bufferSize) ?: 0

                        if (bytesRead > 0) {
                            buffer.get(tempData, 0, bytesRead)
                            totalAudioData.write(tempData, 0, bytesRead)

                            val samplesRead = bytesRead / 2  // because 16-bit PCM = 2 bytes/sample
                            totalSamplesRead += samplesRead
                        }
                    }
                    stopAndReleaseRecording()

                    val base64Audio = Base64.encodeToString(totalAudioData.toByteArray(), Base64.NO_WRAP)
                    val eventParams = Arguments.createMap().apply {
                        putString("base64", base64Audio)
                    }
                    val promiseParams = Arguments.createMap().apply {
                        putString("base64", base64Audio)
                    }
                    sendEvent("onRecordingFinished", eventParams)
                    promise.resolve(promiseParams)

                } catch (e: Exception) {
                    Log.e(tag, "Recording error: ${e.message}")
                    stopAndReleaseRecording()
                    promise.reject("RECORDING_ERROR", e.message)
                }
            }
            recordingThread?.start()

        } catch (e: Exception) {
            Log.e(tag, "Start recording failed: ${e.message}")
            stopAndReleaseRecording()
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (isRecording) {
            isRecording = false
            recordingThread?.join()
            promise.resolve("Recording stopped.")
        } else {
            promise.resolve("Not recording.")
        }
    }

    @ReactMethod
    fun playAudio(base64Audio: String?, promise: Promise) {
        if (base64Audio.isNullOrEmpty()) {
            promise.reject("INVALID_INPUT", "Base64 audio string is null or empty.")
            return
        }

        try {
            val audioBytes = Base64.decode(base64Audio, Base64.NO_WRAP)
            val shortBuffer = ByteBuffer.wrap(audioBytes)
                .order(ByteOrder.LITTLE_ENDIAN)
                .asShortBuffer()
            val audioData = ShortArray(shortBuffer.remaining())
            shortBuffer.get(audioData)

            val minBufferSize = AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
            val bufferSize = maxOf(minBufferSize, audioData.size * 2)

            audioTrack = AudioTrack(
                AudioManager.STREAM_MUSIC,
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
                AudioTrack.MODE_STREAM
            )

            audioTrack?.play()
            audioTrack?.write(audioData, 0, audioData.size)

            Thread {
                try {
                    Thread.sleep((audioData.size * 1000L) / sampleRate + 100)
                } catch (_: InterruptedException) {}
                finally {
                    stopPlayback()
                    promise.resolve("Audio playback finished.")
                }
            }.start()

        } catch (e: Exception) {
            Log.e(tag, "Playback error: ${e.message}")
            promise.reject("PLAYBACK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopPlayback(promise: Promise) {
        try {
            stopPlayback()
            promise.resolve("Audio playback stopped.")
        } catch (e: Exception) {
            promise.reject("STOP_PLAYBACK_ERROR", e.message)
        }
    }

    private fun stopPlayback() {
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {
            Log.e(tag, "Error stopping playback: ${e.message}")
        } finally {
            audioTrack = null
        }
    }

    private fun stopAndReleaseRecording() {
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            Log.e(tag, "Error stopping/releasing recording: ${e.message}")
        } finally {
            audioRecord = null
            isRecording = false
            recordingThread = null
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }
}
