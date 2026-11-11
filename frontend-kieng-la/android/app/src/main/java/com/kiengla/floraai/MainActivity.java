package com.kiengla.floraai;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0;
    private static final int CAMERA_PERM_REQUEST_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Xin quyền Camera ngay khi mở ứng dụng để WebRTC không bị chặn hoặc treo
        requestCameraPermissionIfNeeded();

        // 2. Cấu hình WebView tối ưu bộ nhớ & gắn JavascriptInterface + cấp quyền Camera WebRTC tự động
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            webView.addJavascriptInterface(new AndroidNativeBridge(this), "AndroidNative");

            // Tự động chấp thuận PermissionRequest (VIDEO_CAPTURE) của WebRTC sau khi user đã cấp quyền Android
            webView.setWebChromeClient(new BridgeWebChromeClient(this.getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                                == PackageManager.PERMISSION_GRANTED) {
                            request.grant(request.getResources());
                        } else {
                            ActivityCompat.requestPermissions(
                                MainActivity.this,
                                new String[]{Manifest.permission.CAMERA},
                                CAMERA_PERM_REQUEST_CODE
                            );
                            super.onPermissionRequest(request);
                        }
                    });
                }
            });
        }

        // 3. Đăng ký OnBackPressedCallback chuẩn Android 13/14/15/16 (TargetSDK 36)
        // Chặn hoàn toàn việc bấm nút Back hoặc vuốt cạnh màn hình bị văng thẳng ra màn hình chính
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchBackToWebApp();
            }
        });
    }

    private void requestCameraPermissionIfNeeded() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.CAMERA},
                CAMERA_PERM_REQUEST_CODE
            );
        }
    }

    private void dispatchBackToWebApp() {
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebView webView = this.getBridge().getWebView();
            webView.evaluateJavascript(
                "(function() { " +
                "  if (window.handleAndroidBack) { return window.handleAndroidBack(); } " +
                "  return 'EXIT'; " +
                "})()",
                value -> {
                    // Nếu hàm JS trả về "EXIT" (đang ở Trang chủ và không mở Modal nào) thì mới hỏi thoát app
                    if (value != null && value.contains("EXIT")) {
                        runOnUiThread(this::handleExit);
                    }
                }
            );
        } else {
            handleExit();
        }
    }

    @Override
    public void onBackPressed() {
        dispatchBackToWebApp();
    }

    public void handleExit() {
        long now = System.currentTimeMillis();
        if (now - lastBackPressTime < 2000) {
            finish();
        } else {
            lastBackPressTime = now;
            vibrateDevice(35);
            Toast.makeText(this, "Nhấn Back lần nữa để thoát FloraBotanic AI", Toast.LENGTH_SHORT).show();
        }
    }

    private void vibrateDevice(int durationMs) {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(durationMs);
                }
            }
        } catch (Exception ignored) {}
    }

    public class AndroidNativeBridge {
        private final Context context;

        public AndroidNativeBridge(Context ctx) {
            this.context = ctx;
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            vibrateDevice(ms);
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void shareText(String title, String text) {
            runOnUiThread(() -> {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                Intent shareIntent = Intent.createChooser(sendIntent, title);
                startActivity(shareIntent);
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(MainActivity.this::handleExit);
        }
    }
}
