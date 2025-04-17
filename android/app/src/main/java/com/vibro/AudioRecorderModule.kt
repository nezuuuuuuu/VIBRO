package com.vibro

import android.Manifest
import android.content.pm.PackageManager
import android.media.*
import android.os.Environment
import android.util.Log
import android.widget.Toast
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.text.SimpleDateFormat
import java.util.*
import kotlin.concurrent.thread
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream


import org.tensorflow.lite.support.audio.TensorAudio;
import org.tensorflow.lite.support.label.Category;
import org.tensorflow.lite.task.audio.classifier.AudioClassifier;
import org.tensorflow.lite.task.audio.classifier.Classifications;


class AudioRecorderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "AudioRecorder"
    }
    private var mEmitter: DeviceEventManagerModule? = null
    private val modelPath = "yamnet_classification.tflite"
    private val probabilityThreshold = 0.60f
    private var classifier: AudioClassifier? = null
    private var tensor: TensorAudio? = null
    private var record: AudioRecord? = null
    private var timerTask: TimerTask? = null
    private var isRecording = false
    private val timer = Timer()

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            return
        }
        isRecording = true
        val context = reactApplicationContext
        // Loading the model from the assets folder
        try {
            Log.d("classifier","classifier initialize")
            classifier = AudioClassifier.createFromFile(context, modelPath)
            Log.d("startRecording","classifier initialize")
        } catch (e: IOException) {
            e.printStackTrace()
            return
        }

        // Creating an audio recorder
        tensor = classifier?.createInputTensorAudio()
        Log.d("startRecording","tensor initialize")
        // showing the audio recorder specification
        val format = classifier?.requiredTensorAudioFormat
        val specs = "Number of channels: ${format?.channels}\nSample Rate: ${format?.sampleRate}"
        Log.d("SPECS",specs)

        // Creating and start recording
        record = classifier?.createAudioRecord()
        record?.startRecording()

        timerTask = object : TimerTask() {
            override fun run() {
                // Classifying audio data
                val numberOfSamples = tensor?.load(record) ?: 0
                val output = classifier?.classify(tensor) ?: emptyList()

                // Filtering out classifications with low probability
                val finalOutput = mutableListOf<Category>()
                for (classifications in output) {
                    for (category in classifications.categories) {
                        if (category.score > probabilityThreshold) {
                            finalOutput.add(category)
                        }
                    }
                }

                // Sorting the results
                finalOutput.sortByDescending { it.score }

                if (finalOutput.isNotEmpty()) {
                    val firstPrediction = finalOutput.first()
                    val currentTime = System.currentTimeMillis()

                    val params = Arguments.createMap()
                    params.putDouble("time", currentTime.toDouble()) // Convert to Double for WritableMap
                    params.putString("label", firstPrediction.label)
                    params.putDouble("confidence", firstPrediction.score.toDouble()) // Convert to Double

                    sendEvent(reactApplicationContext, "onPrediction", params)
                }
            }
        }

        timer.schedule(timerTask, 1, 500)
    }

    @ReactMethod
    fun stopRecording() {
        if (!isRecording) {
            return
        }
        isRecording = false

        timerTask?.cancel()
        record?.stop()
    }

    private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun getName(): String {
        return NAME
    }
}