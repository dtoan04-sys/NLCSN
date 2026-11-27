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
    ax1.set_ylim(0, 108)
    ax1.set_yticks([0, 20, 40, 60, 80, 100])
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
    ax.set_ylim(0, 106)
    ax.set_yticks([0, 20, 40, 60, 80, 100])
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
    seeds = ["Seed 99\n(2.600 test)", "Seed 123\n(2.600 test)", "Seed 999\n(2.601 test)", "Trung bình\n(Mean ± Std)"]
    top1_raw = [81.04, 81.04, 80.51]
    top3_raw = [91.77, 90.62, 91.27]
    wf1_raw = [80.84, 80.98, 80.36]

    m1, s1 = float(np.mean(top1_raw)), float(np.std(top1_raw, ddof=1))
    mf, sf = float(np.mean(wf1_raw)), float(np.std(wf1_raw, ddof=1))
    m3, s3 = float(np.mean(top3_raw)), float(np.std(top3_raw, ddof=1))

    top1 = top1_raw + [m1]
    wf1 = wf1_raw + [mf]
    top3 = top3_raw + [m3]

    err1 = [0, 0, 0, s1]
    errf = [0, 0, 0, sf]
    err3 = [0, 0, 0, s3]

    x = np.arange(len(seeds))
    width = 0.25

    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    b1 = ax.bar(x - width, top1, width, yerr=err1, capsize=4, error_kw=dict(elinewidth=1.6, ecolor="#0f172a"), label=f"Top-1 Acc (Mean: {m1:.2f}% ± {s1:.2f}%)", color="#0284c7", edgecolor="#0f172a", linewidth=0.5)
    b2 = ax.bar(x, wf1, width, yerr=errf, capsize=4, error_kw=dict(elinewidth=1.6, ecolor="#0f172a"), label=f"Weighted F1 (Mean: {mf:.2f}% ± {sf:.2f}%)", color="#38bdf8", edgecolor="#0f172a", linewidth=0.5)
    b3 = ax.bar(x + width, top3, width, yerr=err3, capsize=4, error_kw=dict(elinewidth=1.6, ecolor="#0f172a"), label=f"Top-3 Acc (Mean: {m3:.2f}% ± {s3:.2f}%)", color="#1e3a8a", edgecolor="#0f172a", linewidth=0.5)

    ax.set_title(
        "KIỂM CHỨNG TÍNH TÁI LẬP QUA 3 RANDOM SEED 99, 123, 999 (TỪ SỐ 0 — 25.225 ẢNH ĐỘC BẢN)",
        fontsize=11.5,
        fontweight="bold",
        pad=14,
    )
    ax.set_ylabel("Độ chính xác (%)", fontsize=10.5, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(seeds, fontsize=10, fontweight="bold")
    ax.set_ylim(70, 100)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", frameon=True, fontsize=8.8)

    for bars, std_v in [(b1, s1), (b2, sf), (b3, s3)]:
        for idx, bar in enumerate(bars):
            h = bar.get_height()
            if idx == len(bars) - 1:
                ax.text(bar.get_x() + bar.get_width() / 2, h + std_v + 0.45, f"{h:.2f}%\n±{std_v:.2f}%", ha="center", va="bottom", fontsize=7.8, fontweight="bold", color="#0f172a")
            else:
                ax.text(bar.get_x() + bar.get_width() / 2, h + 0.45, f"{h:.2f}%", ha="center", va="bottom", fontsize=8.2, fontweight="bold")

    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "bieu_do_3_do_on_dinh_seed.png")
    plt.savefig(out_path, dpi=300)
    plt.close(fig)
    print(f"Đã tạo: {out_path}")


def ve_bieu_do_4_top_nham_lan_seed999():
    """Biểu đồ cột ngang Top 12 cặp loài nhầm lẫn nhiều nhất từ confusion_matrix.csv (Seed 999 — 2.601 ảnh Test)."""
    import pandas as pd

    csv_path = os.path.join(
        os.path.dirname(__file__),
        "00_Tai_Lieu_Bao_Cao",
        "Ket_Qua_Tu_So_0_99_123_999",
        "seed_999",
        "evaluation_report",
        "confusion_matrix.csv",
    )
    df = pd.read_csv(csv_path, index_col=0)
    pairs = []
    for true_cls in df.index:
        row_sum = int(df.loc[true_cls].sum())
        for pred_cls in df.columns:
            if true_cls != pred_cls:
                cnt = int(df.loc[true_cls, pred_cls])
                if cnt > 0:
                    pct = 100.0 * cnt / row_sum if row_sum > 0 else 0.0
                    pairs.append((cnt, pct, row_sum, true_cls, pred_cls))

    pairs.sort(key=lambda t: (t[0], t[1]), reverse=True)
    top12 = pairs[:12][::-1]

    labels = [f"{t}  →  {p}" for _, _, _, t, p in top12]
    counts = [c for c, _, _, _, _ in top12]
    pcts = [pct for _, pct, _, _, _ in top12]
    supports = [sup for _, _, sup, _, _ in top12]

    fig, ax = plt.subplots(figsize=(13.5, 6.4), dpi=300)
    y = np.arange(len(labels))
    colors = ["#1d4ed8" if c >= 5 else "#0284c7" if c >= 4 else "#38bdf8" for c in counts]
    bars = ax.barh(y, counts, height=0.66, color=colors, edgecolor="#0f172a", linewidth=0.6)

    fig.suptitle(
        "TOP 12 CẶP LOÀI NHẦM LẪN NHIỀU NHẤT TRÊN TẬP TEST ĐỘC LẬP (SEED 999 — 2.601 ẢNH)",
        fontsize=12.0,
        fontweight="bold",
        y=0.97,
    )
    ax.set_xlabel("Số ảnh bị dự đoán nhầm (ảnh)", fontsize=10.5, fontweight="bold")
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=8.8, fontweight="bold")
    ax.set_xlim(0, max(counts) + 3.8)
    ax.grid(axis="x", linestyle="--", alpha=0.4)

    for bar, c, pct, sup in zip(bars, counts, pcts, supports):
        ax.text(
            bar.get_width() + 0.14,
            bar.get_y() + bar.get_height() / 2,
            f"{c} ảnh ({pct:.1f}% của {sup} ảnh)",
            va="center",
            ha="left",
            fontsize=8.6,
            fontweight="bold",
            color="#0f172a",
        )

    plt.tight_layout(rect=[0, 0, 1, 0.93])
    out_path = os.path.join(OUTPUT_DIR, "hinh_3_4_top_nham_lan_seed999.png")
    plt.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Đã tạo: {out_path}")


if __name__ == "__main__":
    ve_bieu_do_1_da_mo_hinh()
    ve_bieu_do_2_ty_le_chia()
    ve_bieu_do_3_do_on_dinh_seed()
    ve_bieu_do_4_top_nham_lan_seed999()
    print("\nHoàn tất xuất toàn bộ 4 biểu đồ vào thư mục:", OUTPUT_DIR)
