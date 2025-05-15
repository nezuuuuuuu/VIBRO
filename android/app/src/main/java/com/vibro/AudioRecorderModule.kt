package com.vibro

import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Timer
import java.util.TimerTask


class AudioRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "AudioRecorder"
    }
    val yamnet_labels = arrayOf(
        "Speech",
        "Child speech, kid speaking",
        "Conversation",
        "Narration, monologue",
        "Babbling",
        "Speech synthesizer",
        "Shout",
        "Bellow",
        "Whoop",
        "Yell",
        "Children shouting",
        "Screaming",
        "Whispering",
        "Laughter",
        "Baby laughter",
        "Giggle",
        "Snicker",
        "Belly laugh",
        "Chuckle, chortle",
        "Crying, sobbing",
        "Baby cry, infant cry",
        "Whimper",
        "Wail, moan",
        "Sigh",
        "Singing",
        "Choir",
        "Yodeling",
        "Chant",
        "Mantra",
        "Child singing",
        "Synthetic singing",
        "Rapping",
        "Humming",
        "Groan",
        "Grunt",
        "Whistling",
        "Breathing",
        "Wheeze",
        "Snoring",
        "Gasp",
        "Pant",
        "Snort",
        "Cough",
        "Throat clearing",
        "Sneeze",
        "Sniff",
        "Run",
        "Shuffle",
        "Walk, footsteps",
        "Chewing, mastication",
        "Biting",
        "Gargling",
        "Stomach rumble",
        "Burping, eructation",
        "Hiccup",
        "Fart",
        "Hands",
        "Finger snapping",
        "Clapping",
        "Heart sounds, heartbeat",
        "Heart murmur",
        "Cheering",
        "Applause",
        "Chatter",
        "Crowd",
        "Hubbub, speech noise, speech babble",
        "Children playing",
        "Animal",
        "Domestic animals, pets",
        "Dog",
        "Bark",
        "Yip",
        "Howl",
        "Bow-wow",
        "Growling",
        "Whimper (dog)",
        "Cat",
        "Purr",
        "Meow",
        "Hiss",
        "Caterwaul",
        "Livestock, farm animals, working animals",
        "Horse",
        "Clip-clop",
        "Neigh, whinny",
        "Cattle, bovinae",
        "Moo",
        "Cowbell",
        "Pig",
        "Oink",
        "Goat",
        "Bleat",
        "Sheep",
        "Fowl",
        "Chicken, rooster",
        "Cluck",
        "Crowing, cock-a-doodle-doo",
        "Turkey",
        "Gobble",
        "Duck",
        "Quack",
        "Goose",
        "Honk",
        "Wild animals",
        "Roaring cats (lions, tigers)",
        "Roar",
        "Bird",
        "Bird vocalization, bird call, bird song",
        "Chirp, tweet",
        "Squawk",
        "Pigeon, dove",
        "Coo",
        "Crow",
        "Caw",
        "Owl",
        "Hoot",
        "Bird flight, flapping wings",
        "Canidae, dogs, wolves",
        "Rodents, rats, mice",
        "Mouse",
        "Patter",
        "Insect",
        "Cricket",
        "Mosquito",
        "Fly, housefly",
        "Buzz",
        "Bee, wasp, etc.",
        "Frog",
        "Croak",
        "Snake",
        "Rattle",
        "Whale vocalization",
        "Music",
        "Musical instrument",
        "Plucked string instrument",
        "Guitar",
        "Electric guitar",
        "Bass guitar",
        "Acoustic guitar",
        "Steel guitar, slide guitar",
        "Tapping (guitar technique)",
        "Strum",
        "Banjo",
        "Sitar",
        "Mandolin",
        "Zither",
        "Ukulele",
        "Keyboard (musical)",
        "Piano",
        "Electric piano",
        "Organ",
        "Electronic organ",
        "Hammond organ",
        "Synthesizer",
        "Sampler",
        "Harpsichord",
        "Percussion",
        "Drum kit",
        "Drum machine",
        "Drum",
        "Snare drum",
        "Rimshot",
        "Drum roll",
        "Bass drum",
        "Timpani",
        "Tabla",
        "Cymbal",
        "Hi-hat",
        "Wood block",
        "Tambourine",
        "Rattle (instrument)",
        "Maraca",
        "Gong",
        "Tubular bells",
        "Mallet percussion",
        "Marimba, xylophone",
        "Glockenspiel",
        "Vibraphone",
        "Steelpan",
        "Orchestra",
        "Brass instrument",
        "French horn",
        "Trumpet",
        "Trombone",
        "Bowed string instrument",
        "String section",
        "Violin, fiddle",
        "Pizzicato",
        "Cello",
        "Double bass",
        "Wind instrument, woodwind instrument",
        "Flute",
        "Saxophone",
        "Clarinet",
        "Harp",
        "Bell",
        "Church bell",
        "Jingle bell",
        "Bicycle bell",
        "Tuning fork",
        "Chime",
        "Wind chime",
        "Change ringing (campanology)",
        "Harmonica",
        "Accordion",
        "Bagpipes",
        "Didgeridoo",
        "Shofar",
        "Theremin",
        "Singing bowl",
        "Scratching (performance technique)",
        "Pop music",
        "Hip hop music",
        "Beatboxing",
        "Rock music",
        "Heavy metal",
        "Punk rock",
        "Grunge",
        "Progressive rock",
        "Rock and roll",
        "Psychedelic rock",
        "Rhythm and blues",
        "Soul music",
        "Reggae",
        "Country",
        "Swing music",
        "Bluegrass",
        "Funk",
        "Folk music",
        "Middle Eastern music",
        "Jazz",
        "Disco",
        "Classical music",
        "Opera",
        "Electronic music",
        "House music",
        "Techno",
        "Dubstep",
        "Drum and bass",
        "Electronica",
        "Electronic dance music",
        "Ambient music",
        "Trance music",
        "Music of Latin America",
        "Salsa music",
        "Flamenco",
        "Blues",
        "Music for children",
        "New-age music",
        "Vocal music",
        "A capella",
        "Music of Africa",
        "Afrobeat",
        "Christian music",
        "Gospel music",
        "Music of Asia",
        "Carnatic music",
        "Music of Bollywood",
        "Ska",
        "Traditional music",
        "Independent music",
        "Song",
        "Background music",
        "Theme music",
        "Jingle (music)",
        "Soundtrack music",
        "Lullaby",
        "Video game music",
        "Christmas music",
        "Dance music",
        "Wedding music",
        "Happy music",
        "Sad music",
        "Tender music",
        "Exciting music",
        "Angry music",
        "Scary music",
        "Wind",
        "Rustling leaves",
        "Wind noise (microphone)",
        "Thunderstorm",
        "Thunder",
        "Water",
        "Rain",
        "Raindrop",
        "Rain on surface",
        "Stream",
        "Waterfall",
        "Ocean",
        "Waves, surf",
        "Steam",
        "Gurgling",
        "Fire",
        "Crackle",
        "Vehicle",
        "Boat, Water vehicle",
        "Sailboat, sailing ship",
        "Rowboat, canoe, kayak",
        "Motorboat, speedboat",
        "Ship",
        "Motor vehicle (road)",
        "Car",
        "Vehicle horn, car horn, honking",
        "Toot",
        "Car alarm",
        "Power windows, electric windows",
        "Skidding",
        "Tire squeal",
        "Car passing by",
        "Race car, auto racing",
        "Truck",
        "Air brake",
        "Air horn, truck horn",
        "Reversing beeps",
        "Ice cream truck, ice cream van",
        "Bus",
        "Emergency vehicle",
        "Police car (siren)",
        "Ambulance (siren)",
        "Fire engine, fire truck (siren)",
        "Motorcycle",
        "Traffic noise, roadway noise",
        "Rail transport",
        "Train",
        "Train whistle",
        "Train horn",
        "Railroad car, train wagon",
        "Train wheels squealing",
        "Subway, metro, underground",
        "Aircraft",
        "Aircraft engine",
        "Jet engine",
        "Propeller, airscrew",
        "Helicopter",
        "Fixed-wing aircraft, airplane",
        "Bicycle",
        "Skateboard",
        "Engine",
        "Light engine (high frequency)",
        "Dental drill, dentist's drill",
        "Lawn mower",
        "Chainsaw",
        "Medium engine (mid frequency)",
        "Heavy engine (low frequency)",
        "Engine knocking",
        "Engine starting",
        "Idling",
        "Accelerating, revving, vroom",
        "Door",
        "Doorbell",
        "Ding-dong",
        "Sliding door",
        "Slam",
        "Knock",
        "Tap",
        "Squeak",
        "Cupboard open or close",
        "Drawer open or close",
        "Dishes, pots, and pans",
        "Cutlery, silverware",
        "Chopping (food)",
        "Frying (food)",
        "Microwave oven",
        "Blender",
        "Water tap, faucet",
        "Sink (filling or washing)",
        "Bathtub (filling or washing)",
        "Hair dryer",
        "Toilet flush",
        "Toothbrush",
        "Electric toothbrush",
        "Vacuum cleaner",
        "Zipper (clothing)",
        "Keys jangling",
        "Coin (dropping)",
        "Scissors",
        "Electric shaver, electric razor",
        "Shuffling cards",
        "Typing",
        "Typewriter",
        "Computer keyboard",
        "Writing",
        "Alarm",
        "Telephone",
        "Telephone bell ringing",
        "Ringtone",
        "Telephone dialing, DTMF",
        "Dial tone",
        "Busy signal",
        "Alarm clock",
        "Siren",
        "Civil defense siren",
        "Buzzer",
        "Smoke detector, smoke alarm",
        "Fire alarm",
        "Foghorn",
        "Whistle",
        "Steam whistle",
        "Mechanisms",
        "Ratchet, pawl",
        "Clock",
        "Tick",
        "Tick-tock",
        "Gears",
        "Pulleys",
        "Sewing machine",
        "Mechanical fan",
        "Air conditioning",
        "Cash register",
        "Printer",
        "Camera",
        "Single-lens reflex camera",
        "Tools",
        "Hammer",
        "Jackhammer",
        "Sawing",
        "Filing (rasp)",
        "Sanding",
        "Power tool",
        "Drill",
        "Explosion",
        "Gunshot, gunfire",
        "Machine gun",
        "Fusillade",
        "Artillery fire",
        "Cap gun",
        "Fireworks",
        "Firecracker",
        "Burst, pop",
        "Eruption",
        "Boom",
        "Wood",
        "Chop",
        "Splinter",
        "Crack",
        "Glass",
        "Chink, clink",
        "Shatter",
        "Liquid",
        "Splash, splatter",
        "Slosh",
        "Squish",
        "Drip",
        "Pour",
        "Trickle, dribble",
        "Gush",
        "Fill (with liquid)",
        "Spray",
        "Pump (liquid)",
        "Stir",
        "Boiling",
        "Sonar",
        "Arrow",
        "Whoosh, swoosh, swish",
        "Thump, thud",
        "Thunk",
        "Electronic tuner",
        "Effects unit",
        "Chorus effect",
        "Basketball bounce",
        "Bang",
        "Slap, smack",
        "Whack, thwack",
        "Smash, crash",
        "Breaking",
        "Bouncing",
        "Whip",
        "Flap",
        "Scratch",
        "Scrape",
        "Rub",
        "Roll",
        "Crushing",
        "Crumpling, crinkling",
        "Tearing",
        "Beep, bleep",
        "Ping",
        "Ding",
        "Clang",
        "Squeal",
        "Creak",
        "Rustle",
        "Whir",
        "Clatter",
        "Sizzle",
        "Clicking",
        "Clickety-clack",
        "Rumble",
        "Plop",
        "Jingle, tinkle",
        "Hum",
        "Zing",
        "Boing",
        "Crunch",
        "Silence",
        "Sine wave",
        "Harmonic",
        "Chirp tone",
        "Sound effect",
        "Pulse",
        "Inside, small room",
        "Inside, large room or hall",
        "Inside, public space",
        "Outside, urban or manmade",
        "Outside, rural or natural",
        "Reverberation",
        "Echo",
        "Noise",
        "Environmental noise",
        "Static",
        "Mains hum",
        "Distortion",
        "Sidetone",
        "Cacophony",
        "White noise",
        "Pink noise",
        "Throbbing",
        "Vibration",
        "Television",
        "Radio",
        "Field recording"
    )

    private var isRecording = false
    private var record: AudioRecord? = null
    private var timerTask: TimerTask? = null
    private val timer = Timer()
    private var vibroInterpreter: VibroInterpreter? = null
    private val sampleRate = 16000
    private val rollingBuffer = ShortArray(sampleRate * 5)
    private var bufferOffset = 0
    private val bufferSize = AudioRecord.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )


    override fun getName(): String = NAME

    private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            promise.reject("RECORDING_ALREADY_ACTIVE", "Recording is already in progress.")
            return
        }

        try {
            vibroInterpreter = VibroInterpreter(reactApplicationContext, "VIBRO.tflite", 9)
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("MODEL_LOAD_ERROR", "Failed to load model: ${e.message}")
            return
        }

        record = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        record?.startRecording()
        isRecording = true

        timerTask = object : TimerTask() {
            override fun run() {
                val stepSize = sampleRate // 1 second of audio = 16000 samples
                val tempBuffer = ShortArray(stepSize)

                val readCount = record?.read(tempBuffer, 0, stepSize) ?: return
                if (readCount <= 0) return


                // Shift old data left by stepSize
                System.arraycopy(
                    rollingBuffer,
                    stepSize,
                    rollingBuffer,
                    0,
                    rollingBuffer.size - stepSize
                )
//                Log.d("DEBUG", "Rolling buffer size: ${rollingBuffer.size}")

                // Add new audio to the end of rolling buffer
                System.arraycopy(tempBuffer, 0, rollingBuffer, rollingBuffer.size - stepSize, stepSize)

                // Classify the current 5-second buffer
                val results = vibroInterpreter?.classify(rollingBuffer) ?: return
                val yamnetResult = results.first
                val customResult = results.second

                val eventData = Arguments.createMap()

                // Process YAMNet scores
                val yamnetPredictionArray = Arguments.createArray()
                yamnetResult?.forEachIndexed { index, confidence ->
                    val prediction = Arguments.createMap()
                    if(confidence.toDouble()>=.60) {
                        prediction.putString("label", yamnet_labels[index])
                        prediction.putDouble("confidence", confidence.toDouble())
                        yamnetPredictionArray.pushMap(prediction)
                    }
                }
                eventData.putArray("yamnetPredictions", yamnetPredictionArray)

                // Process custom scores
                val customPredictionArray = Arguments.createArray()
                customResult?.forEachIndexed { index, confidence ->
                    if(confidence.toDouble()>=.60) {
                        val prediction = Arguments.createMap()
                        prediction.putString("label", index.toString())
                        prediction.putDouble("confidence", confidence.toDouble())
                        customPredictionArray.pushMap(prediction)
                    }
                }
                eventData.putArray("customPredictions", customPredictionArray)
                val audioBase64 = shortArrayToBase64(rollingBuffer)
                Log.d("DEBUG", "Base64 audio length: ${audioBase64.length}")

                eventData.putString("audioBase64", audioBase64)

                sendEvent(reactApplicationContext, "onPrediction", eventData)
            }
        }
        timer.schedule(timerTask, 0, 1000)
        promise.resolve("Recording started.")
    }
    fun shortArrayToBase64(data: ShortArray): String {
        val byteBuffer = ByteBuffer.allocate(data.size * 2)
        byteBuffer.order(ByteOrder.LITTLE_ENDIAN)
        for (sample in data) {
            byteBuffer.putShort(sample)
        }
        return Base64.encodeToString(byteBuffer.array(), Base64.NO_WRAP)
    }


    @ReactMethod
    fun playAudio(base64Audio: String?, promise: Promise) {
        try {
            if (base64Audio.isNullOrEmpty()) {
                promise.reject("INVALID_INPUT", "Base64 audio string is null or empty.")
                return
            }

            Log.d("DEBUG", "Received base64 audio with size: ${base64Audio.length}")

            // 1. Decode the base64 string to byte array
            val audioBytes = Base64.decode(base64Audio, Base64.NO_WRAP)

            // 2. Convert byte array to short array (PCM 16-bit)
            val shortBuffer = ByteBuffer.wrap(audioBytes)
                .order(ByteOrder.LITTLE_ENDIAN)
                .asShortBuffer()
            val audioData = ShortArray(shortBuffer.remaining())
            shortBuffer.get(audioData)

            // 3. Prepare AudioTrack
            val sampleRate = 16000
            val channelConfig = AudioFormat.CHANNEL_OUT_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT
            val minBufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            val bufferSize = maxOf(minBufferSize, audioData.size * 2)

            val audioTrack = AudioTrack(
                AudioManager.STREAM_MUSIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize,
                AudioTrack.MODE_STREAM
            )

            // 4. Play audio
            audioTrack.play()
            audioTrack.write(audioData, 0, audioData.size)

            // 5. Stop and release after playing
            Thread {
                try {
                    val durationMs = (audioData.size * 1000L) / sampleRate
                    Thread.sleep(durationMs + 100)
                } catch (e: InterruptedException) {
                    Log.e("AudioRecorderModule", "Sleep interrupted: ${e.message}")
                } finally {
                    audioTrack.stop()
                    audioTrack.release()
                    promise.resolve("Audio playback finished.")
                }
            }.start()

        } catch (e: IllegalArgumentException) {
            Log.e("AudioRecorderModule", "IllegalArgumentException: ${e.message}")
            promise.reject("PLAYBACK_ERROR", "Invalid base64 audio data: ${e.message}")
        } catch (e: IOException) {
            Log.e("AudioRecorderModule", "IOException: ${e.message}")
            promise.reject("PLAYBACK_ERROR", "Error playing audio: ${e.message}")
        } catch (e: Exception) {
            Log.e("AudioRecorderModule", "Exception: ${e.message}")
            promise.reject("PLAYBACK_ERROR", "General error: ${e.message}")
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording) {
            promise.reject("NO_RECORDING", "No recording in progress.")
            return
        }

        isRecording = false
        timerTask?.cancel()
        record?.stop()
        record?.release()
        record = null
        promise.resolve("Recording stopped.")
    }
}
