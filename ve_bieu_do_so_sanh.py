"""
Script vẽ biểu đồ khoa học (300 DPI) phục vụ báo cáo Niên luận / Đồ án FloraBotanic AI.
Dữ liệu được lấy trực tiếp từ các thực nghiệm đối chứng trên tập 90 loài kiểng lá (80-10-10).
"""

import os
import numpy as np
import matplotlib.pyplot as plt

# Tạo thư mục lưu biểu đồ đầu ra
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "bao_tham_khao", "bieu_do")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Cấu hình font & style chuyên nghiệp chuẩn bài báo
plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Segoe UI"]
plt.rcParams["axes.unicode_minus"] = False


def ve_bieu_do_1_da_mo_hinh():
    """Biểu đồ 1: So sánh đối chứng 4 kiến trúc (Số liệu đo thực tế Từ số 0 — Doi_Chieu_4_Mo_Hinh_Tu_So_0_vs_Mau.csv)."""
    models = [
        "Custom CNN\n(From Scratch)",
        "MobileNetV2\n(Đề tài đề xuất)",
        "ResNet50\n(Transfer)",
        "EfficientNetB0\n(Transfer)",
    ]
    top1_acc = [60.32, 80.51, 83.35, 84.47]
    top3_acc = [78.74, 91.27, 93.19, 93.89]
    sizes_mb = [7.26, 9.62, 91.31, 16.69]
    params_m = [1.88, 2.37, 23.77, 4.16]
    latency_ms = [0.98, 5.04, 7.10, 9.61]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.8), dpi=300)
    fig.suptitle(
        "SO SÁNH ĐỐI CHỨNG 4 MÔ HÌNH ĐO THỰC TẾ TỪ SỐ 0 (90 LOÀI, 2.601 ẢNH TEST, 80-10-10)",
        fontsize=12.5,
        fontweight="bold",
        y=0.98,
    )

    x = np.arange(len(models))
    w = 0.34
    b_top1 = ax1.bar(x - w / 2, top1_acc, w, label="Top-1 Accuracy (%)", color="#0284c7", edgecolor="#0f172a", linewidth=0.5)
    b_top3 = ax1.bar(x + w / 2, top3_acc, w, label="Top-3 Accuracy (%)", color="#38bdf8", edgecolor="#0f172a", linewidth=0.5)
    ax1.set_title("Độ chính xác Top-1 & Top-3 (%)", fontsize=11, fontweight="bold", pad=10)
    ax1.set_ylabel("Độ chính xác (%)", fontsize=10, fontweight="bold")
    ax1.set_xticks(x)
    ax1.set_xticklabels(models, fontsize=9, fontweight="bold")
    ax1.set_ylim(50, 102)
    ax1.grid(axis="y", linestyle="--", alpha=0.4)
    ax1.legend(loc="upper left", fontsize=8.5, frameon=True)

    for bar in b_top1:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width() / 2, h + 0.6, f"{h:.2f}%", ha="center", va="bottom", fontsize=8, fontweight="bold", color="#0369a1")
    for bar in b_top3:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width() / 2, h + 0.6, f"{h:.2f}%", ha="center", va="bottom", fontsize=8, fontweight="bold", color="#0284c7")

    colors_size = ["#64748b", "#0284c7", "#dc2626", "#0ea5e9"]
    bars2 = ax2.bar(models, sizes_mb, color=colors_size, width=0.52, edgecolor="#0f172a", linewidth=0.6)
    ax2.set_title("Kích thước tệp .keras (MB), Tham số & Độ trễ GPU T4", fontsize=11, fontweight="bold", pad=10)
    ax2.set_ylabel("Kích thước tệp .keras (MB)", fontsize=10, fontweight="bold")
    ax2.set_ylim(0, 112)
    ax2.grid(axis="y", linestyle="--", alpha=0.4)
    for bar, size_v, param_v, lat_v in zip(bars2, sizes_mb, params_m, latency_ms):
        ax2.text(
            bar.get_x() + bar.get_width() / 2,
            size_v + 2.0,
            f"{size_v:.2f} MB\n({param_v:.2f}M | {lat_v:.2f}ms)",
            ha="center",
            va="bottom",
            fontsize=8,
            fontweight="bold",
        )

    plt.tight_layout(rect=[0, 0, 1, 0.93])
    out_path = os.path.join(OUTPUT_DIR, "bieu_do_1_so_sanh_da_mo_hinh.png")
    plt.savefig(out_path, dpi=300)
    plt.close(fig)
    print(f"Đã tạo: {out_path}")


def ve_bieu_do_2_ty_le_chia():
    """Biểu đồ 2: So sánh hiệu năng trước (70-15-15) và sau (80-10-10)."""
    metrics = ["Top-1\nAccuracy", "Top-3\nAccuracy", "Macro\nPrecision", "Macro\nRecall", "Macro\nF1-Score"]
    old_70_15_15 = [70.29, 85.79, 71.99, 67.71, 68.33]
    new_80_10_10 = [73.76, 88.11, 75.37, 71.97, 72.04]

    x = np.arange(len(metrics))
    width = 0.35

    fig, ax = plt.subplots(figsize=(11, 5.5), dpi=300)
    rects1 = ax.bar(x - width / 2, old_70_15_15, width, label="Phiên bản cũ (70% - 15% - 15%)", color="#94a3b8")
    rects2 = ax.bar(x + width / 2, new_80_10_10, width, label="Phiên bản tối ưu (80% - 10% - 10%)", color="#0284c7")

    ax.set_title(
        "SO SÁNH HIỆU NĂNG MÔ HÌNH MOBILENETV2 THEO TỶ LỆ CHIA DỮ LIỆU",
        fontsize=12.5,
        fontweight="bold",
        pad=14,
    )
    ax.set_ylabel("Giá trị (%)", fontsize=10.5, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=10, fontweight="bold")
    ax.set_ylim(55, 96)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper left", frameon=True, fontsize=9.5)

    for r1, r2 in zip(rects1, rects2):
        h1, h2 = r1.get_height(), r2.get_height()
        diff = h2 - h1
        ax.text(r1.get_x() + r1.get_width() / 2, h1 + 0.5, f"{h1:.2f}%", ha="center", va="bottom", fontsize=8.5)
        ax.text(
            r2.get_x() + r2.get_width() / 2,
            h2 + 0.5,
            f"{h2:.2f}%\n(+{diff:.2f}%)",
            ha="center",
            va="bottom",
            fontsize=8.5,
            fontweight="bold",
            color="#0369a1",
        )

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "bieu_do_2_so_sanh_ty_le_chia.png")
    plt.savefig(out_path, dpi=300)
    plt.close(fig)
    print(f"Đã tạo: {out_path}")


def ve_bieu_do_3_do_on_dinh_seed():
    """Biểu đồ 3: Kiểm chứng tính tái lập qua 3 Random Seed (99, 123, 999 — Từ số 0, Mean ± Std)."""
    seeds = ["Seed 99\n(2.600 test)", "Seed 123\n(2.600 test)", "Seed 999\n(2.601 test)"]
    top1 = [81.04, 81.04, 80.51]
    top3 = [91.77, 90.62, 91.27]
    wf1 = [80.84, 80.98, 80.36]

    x = np.arange(len(seeds))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 5.2), dpi=300)
    b1 = ax.bar(x - width, top1, width, label=f"Top-1 Acc (Mean: {np.mean(top1):.2f}% ± {np.std(top1, ddof=1):.2f}%)", color="#0284c7")
    b2 = ax.bar(x, wf1, width, label=f"Weighted F1 (Mean: {np.mean(wf1):.2f}% ± {np.std(wf1, ddof=1):.2f}%)", color="#38bdf8")
    b3 = ax.bar(x + width, top3, width, label=f"Top-3 Acc (Mean: {np.mean(top3):.2f}% ± {np.std(top3, ddof=1):.2f}%)", color="#1e3a8a")

    ax.set_title(
        "KIỂM CHỨNG TÍNH TÁI LẬP QUA 3 RANDOM SEED 99, 123, 999 (TỪ SỐ 0 — 25.225 ẢNH ĐỘC BẢN)",
        fontsize=11.5,
        fontweight="bold",
        pad=14,
    )
    ax.set_ylabel("Độ chính xác (%)", fontsize=10.5, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(seeds, fontsize=10.5, fontweight="bold")
    ax.set_ylim(70, 100)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", frameon=True, fontsize=9)

    for bars in [b1, b2, b3]:
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2, h + 0.5, f"{h:.2f}%", ha="center", va="bottom", fontsize=8.5, fontweight="bold")

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "bieu_do_3_do_on_dinh_seed.png")
    plt.savefig(out_path, dpi=300)
    plt.close(fig)
    print(f"Đã tạo: {out_path}")


if __name__ == "__main__":
    ve_bieu_do_1_da_mo_hinh()
    ve_bieu_do_2_ty_le_chia()
    ve_bieu_do_3_do_on_dinh_seed()
    print("\nHoàn tất xuất toàn bộ 3 biểu đồ vào thư mục:", OUTPUT_DIR)
