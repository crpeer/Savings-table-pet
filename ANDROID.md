# Android 试装包

## 已构建

- APK：`D:\CRPEER\build-artifacts\SavingsTablePet-debug.apk`
- Package：`com.crpeer.savingstablepet`
- versionName `1.0` / versionCode `1`
- minSdk 24 / targetSdk 36
- Debug 签名，仅用于个人试装，不适合直接上架

## 安装到手机

1. 把 APK 传到 Android 手机（USB、微信文件传输或网盘都可以）。
2. 在手机上允许“安装未知应用”。
3. 点击 APK 安装。

如果手机已开启 USB 调试并连接电脑，也可以直接：

```powershell
D:\CRPEER\toolchain\android-sdk\platform-tools\adb.exe install -r D:\CRPEER\build-artifacts\SavingsTablePet-debug.apk
```

## 重新构建

当前工具链位置：

- JDK 21：`D:\CRPEER\toolchain\jdk21\jdk-21.0.2`
- Android SDK：`D:\CRPEER\toolchain\android-sdk`
- Gradle 缓存：`D:\CRPEER\toolchain\gradle-home`

在项目根目录用 PowerShell 执行：

```powershell
$env:JAVA_HOME = "D:\CRPEER\toolchain\jdk21\jdk-21.0.2"
$env:ANDROID_HOME = "D:\CRPEER\toolchain\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = "D:\CRPEER\toolchain\gradle-home"

npm run build:web
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug
```

构建产物：

`android\app\build\outputs\apk\debug\app-debug.apk`

## 说明

- 根目录 `.gitignore` 排除了 `node_modules`、`www`、`android/local.properties` 和构建产物。
- 项目路径含中文，因此 `android/gradle.properties` 设置了 `android.overridePathCheck=true`。
- `android/gradle/wrapper/gradle-wrapper.properties` 使用 Huawei Cloud 镜像下载 Gradle，因为官方源在当前网络下会重定向到 GitHub 且很慢；需要时可切回 `services.gradle.org`。
- 这是 Capacitor WebView 外壳，`npm run build:web` 会把网页资源复制到 `www`，`npx cap sync android` 再同步进 Android 工程。
