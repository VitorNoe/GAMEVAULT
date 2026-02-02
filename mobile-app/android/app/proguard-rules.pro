# Keep ProGuard rules for Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }

# Keep app classes
-keep class com.gamevault.app.** { *; }

# Gson (if using)
-keepattributes Signature
-keepattributes *Annotation*

# Keep Kotlin metadata
-keepattributes RuntimeVisibleAnnotations
-keep class kotlin.Metadata { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
