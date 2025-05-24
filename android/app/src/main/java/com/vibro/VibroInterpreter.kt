package com.vibro

import android.content.Context
import android.util.Log
import org.tensorflow.lite.Interpreter
import java.io.File
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.io.FileInputStream

class VibroInterpreter(private val context: Context, private val modelFileName: String, private val numClasses: Int) {
    private var interpreter: Interpreter


    init {
        interpreter = Interpreter(loadModelFile(modelFileName))
    }

    private fun loadModelFile(modelFileName: String): MappedByteBuffer {
        val file = File(context.filesDir, modelFileName)
        val fileInputStream = FileInputStream(file)
        val fileChannel = fileInputStream.channel
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, 0, fileChannel.size())
    }

    fun shortToFloat(samples: ShortArray): FloatArray {
        return samples.map { it / 32768.0f }.toFloatArray()
    }

    fun classify(audioSamples: ShortArray): Pair<FloatArray?, FloatArray?> {
        val input = shortToFloat(audioSamples)

        val yamnetScores = FloatArray(521)
        val customScores = FloatArray(numClasses)
        val outputMap = mutableMapOf<Int, Any>()
        outputMap[0] = yamnetScores
        outputMap[1] = customScores

        interpreter.runForMultipleInputsOutputs(arrayOf(input), outputMap)

        val yamnetResult = outputMap[0] as? FloatArray
        val customResult = outputMap[1] as? FloatArray

        Log.d("VibroInterpreter", "YAMNet Predictions: ${yamnetResult?.joinToString()}")
        Log.d("VibroInterpreter", "Custom Predictions: ${customResult?.joinToString()}")

        return Pair(yamnetResult, customResult)
    }
}
