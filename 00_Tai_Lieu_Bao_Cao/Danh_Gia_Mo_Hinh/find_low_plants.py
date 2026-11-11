# -*- coding: utf-8 -*-
import pandas as pd
import json

df = pd.read_csv(r"E:\CNTT\NLCNHTTT\00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\Ket_Qua_Moi_80_10_10\split_counts_tieng_viet.csv")
col_total = df.columns[5] # Tổng số ảnh
df_sorted = df.sort_values(by=col_total, ascending=True)

with open(r"E:\CNTT\NLCNHTTT\00_Tai_Lieu_Bao_Cao\Danh_Gia_Mo_Hinh\low_count_plants.txt", "w", encoding="utf-8") as f:
    f.write("=== DANH SÁCH CÁC CÂY CẦN BỔ SUNG ẢNH NHẤT ===\n\n")
    for idx, row in df_sorted.head(30).iterrows():
        f.write(f"{row.iloc[0]} ({row.iloc[1]}): Hiện có {row.iloc[5]} ảnh (Train: {row.iloc[2]}, Test: {row.iloc[4]})\n")

print("Xong.")
