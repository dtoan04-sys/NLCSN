// Dữ liệu địa giới hành chính Việt Nam chuẩn 2 cấp mới (Tỉnh/Thành phố -> Phường/Xã/Đặc khu, bỏ cấp Quận/Huyện)
// Bao gồm đầy đủ 34 Tỉnh/Thành phố theo đề án sáp nhập 2025/2026 và các tỉnh thành quen thuộc để dễ tra cứu.

export const VIETNAM_PROVINCES_2_TIER = [
  {
    name: 'TP. Hồ Chí Minh',
    aliases: ['Thành phố Hồ Chí Minh', 'Hồ Chí Minh', 'TP.HCM', 'TPHCM', 'Ho Chi Minh City', 'Sài Gòn', 'Bình Dương', 'Bà Rịa - Vũng Tàu'],
    wards: [
      'Phường Sài Gòn',
      'Phường Bến Thành',
      'Phường Tân Định',
      'Phường Đa Kao',
      'Phường Chợ Quán',
      'Phường Chợ Lớn',
      'Phường Gia Định',
      'Phường Bình Thạnh',
      'Phường Phú Nhuận',
      'Phường Tân Bình',
      'Phường Tân Phú',
      'Phường Gò Vấp',
      'Phường Thủ Đức',
      'Phường Thảo Điền',
      'Phường An Phú',
      'Phường Hiệp Bình',
      'Phường Linh Trung',
      'Phường Tân Phong',
      'Phường Phú Mỹ',
      'Phường Hòa Hưng',
      'Phường Phú Thọ',
      'Phường Bình Tiên',
      'Phường Phú Định',
      'Phường Chánh Hưng',
      'Phường Bình Đông',
      'Phường An Đông',
      'Phường Minh Phụng',
      'Phường Tân Thuận',
      'Phường Bình Tân',
      'Phường An Lạc',
      'Phường Thủ Dầu Một',
      'Phường Dĩ An',
      'Phường Thuận An',
      'Phường Vũng Tàu',
      'Phường Bà Rịa',
      'Xã Bình Chánh',
      'Xã Nhà Bè',
      'Xã Hóc Môn',
      'Xã Củ Chi',
      'Xã Cần Giờ',
      'Đặc khu Côn Đảo'
    ]
  },
  {
    name: 'Hà Nội',
    aliases: ['Thành phố Hà Nội', 'TP. Hà Nội', 'Ha Noi', 'Hanoi'],
    wards: [
      'Phường Hoàn Kiếm',
      'Phường Cửa Nam',
      'Phường Ba Đình',
      'Phường Ngọc Hà',
      'Phường Giảng Võ',
      'Phường Đống Đa',
      'Phường Kim Liên',
      'Phường Văn Miếu - Quốc Tử Giám',
      'Phường Láng',
      'Phường Ô Chợ Dừa',
      'Phường Hai Bà Trưng',
      'Phường Bạch Mai',
      'Phường Vĩnh Tuy',
      'Phường Cầu Giấy',
      'Phường Dịch Vọng',
      'Phường Nghĩa Đô',
      'Phường Yên Hòa',
      'Phường Tây Hồ',
      'Phường Phú Thượng',
      'Phường Thanh Xuân',
      'Phường Khương Đình',
      'Phường Hoàng Mai',
      'Phường Định Công',
      'Phường Hoàng Liệt',
      'Phường Long Biên',
      'Phường Việt Hưng',
      'Phường Bồ Đề',
      'Phường Hà Đông',
      'Phường Dương Nội',
      'Phường Từ Liêm',
      'Phường Mỹ Đình',
      'Phường Tây Mỗ',
      'Phường Sơn Tây',
      'Xã Đông Anh',
      'Xã Gia Lâm',
      'Xã Thanh Trì',
      'Xã Hoài Đức',
      'Xã Đan Phượng',
      'Xã Sóc Sơn',
      'Xã Mê Linh',
      'Xã Thường Tín',
      'Xã Thạch Thất',
      'Xã Quốc Oai'
    ]
  },
  {
    name: 'TP. Cần Thơ',
    aliases: ['Thành phố Cần Thơ', 'Cần Thơ', 'Can Tho', 'Sóc Trăng', 'Hậu Giang'],
    wards: [
      'Phường Ninh Kiều',
      'Phường Cái Khế',
      'Phường Tân An',
      'Phường An Hòa',
      'Phường An Bình',
      'Phường Hưng Lợi',
      'Phường Xuân Khánh',
      'Phường Bình Thủy',
      'Phường Long Tuyền',
      'Phường Trà Nóc',
      'Phường Bùi Hữu Nghĩa',
      'Phường Cái Răng',
      'Phường Hưng Phú',
      'Phường Lê Bình',
      'Phường Thường Thạnh',
      'Phường Ô Môn',
      'Phường Châu Văn Liêm',
      'Phường Thốt Nốt',
      'Phường Thuận An',
      'Phường Vị Thanh',
      'Phường Ngã Bảy',
      'Phường Long Mỹ',
      'Phường Sóc Trăng',
      'Phường Phú Lợi',
      'Phường Vĩnh Châu',
      'Phường Ngã Năm',
      'Xã Phong Điền',
      'Xã Mỹ Khánh',
      'Xã Thới Lai',
      'Xã Cờ Đỏ',
      'Xã Vĩnh Thạnh',
      'Xã Phụng Hiệp',
      'Xã Châu Thành',
      'Xã Kế Sách',
      'Xã Mỹ Xuyên',
      'Xã Trần Đề'
    ]
  },
  {
    name: 'Đà Nẵng',
    aliases: ['Thành phố Đà Nẵng', 'TP. Đà Nẵng', 'Da Nang', 'Quảng Nam'],
    wards: [
      'Phường Hải Châu',
      'Phường Thạch Thang',
      'Phường Hòa Cường',
      'Phường Thanh Khê',
      'Phường An Khê',
      'Phường Sơn Trà',
      'Phường An Hải',
      'Phường Phước Mỹ',
      'Phường Ngũ Hành Sơn',
      'Phường Mỹ An',
      'Phường Hòa Hải',
      'Phường Liên Chiểu',
      'Phường Hòa Khánh',
      'Phường Cẩm Lệ',
      'Phường Hòa Xuân',
      'Phường Hội An',
      'Phường Tam Kỳ',
      'Phường Điện Bàn',
      'Xã Hòa Vang',
      'Xã Hòa Tiến',
      'Xã Bà Nà',
      'Xã Duy Xuyên',
      'Xã Thăng Bình',
      'Xã Núi Thành',
      'Đặc khu Hoàng Sa'
    ]
  },
  {
    name: 'Hải Phòng',
    aliases: ['Thành phố Hải Phòng', 'TP. Hải Phòng', 'Hai Phong', 'Hải Dương'],
    wards: [
      'Phường Hồng Bàng',
      'Phường Ngô Quyền',
      'Phường Lê Chân',
      'Phường Hải An',
      'Phường Kiến An',
      'Phường Đồ Sơn',
      'Phường Dương Kinh',
      'Phường Thủy Nguyên',
      'Phường An Dương',
      'Phường Hải Dương',
      'Phường Chí Linh',
      'Phường Kinh Môn',
      'Xã An Lão',
      'Xã Kiến Thụy',
      'Xã Tiên Lãng',
      'Xã Vĩnh Bảo',
      'Đặc khu Cát Hải',
      'Đặc khu Bạch Long Vĩ'
    ]
  },
  {
    name: 'Huế',
    aliases: ['Thành phố Huế', 'TP. Huế', 'Thừa Thiên Huế', 'Thừa Thiên - Huế', 'Hue'],
    wards: [
      'Phường Thuận Hóa',
      'Phường Phú Xuân',
      'Phường Vĩnh Ninh',
      'Phường Phú Hội',
      'Phường Xuân Phú',
      'Phường Vỹ Dạ',
      'Phường An Cựu',
      'Phường Kim Long',
      'Phường Hương Thủy',
      'Phường Hương Trà',
      'Phường Phong Điền',
      'Xã Quảng Điền',
      'Xã Phú Vang',
      'Xã Phú Lộc',
      'Xã A Lưới'
    ]
  },
  {
    name: 'An Giang',
    aliases: ['Tỉnh An Giang', 'Kiên Giang'],
    wards: [
      'Phường Long Xuyên',
      'Phường Mỹ Bình',
      'Phường Mỹ Xuyên',
      'Phường Châu Đốc',
      'Phường Núi Sam',
      'Phường Tân Châu',
      'Phường Rạch Giá',
      'Phường Vĩnh Thanh',
      'Phường Hà Tiên',
      'Xã Thoại Sơn',
      'Xã Châu Phú',
      'Xã Châu Thành',
      'Xã Chợ Mới',
      'Xã Phú Tân',
      'Xã Tri Tôn',
      'Xã Tịnh Biên',
      'Xã Hòn Đất',
      'Xã Giồng Riềng',
      'Đặc khu Phú Quốc',
      'Đặc khu Kiên Hải'
    ]
  },
  {
    name: 'Đồng Tháp',
    aliases: ['Tỉnh Đồng Tháp', 'Tiền Giang'],
    wards: [
      'Phường Cao Lãnh',
      'Phường Mỹ Phú',
      'Phường Sa Đéc',
      'Phường Tân Quy Đông',
      'Phường Hồng Ngự',
      'Phường Mỹ Tho',
      'Phường Gò Công',
      'Phường Cai Lậy',
      'Xã Lấp Vò',
      'Xã Lai Vung',
      'Xã Châu Thành',
      'Xã Thanh Bình',
      'Xã Tam Nông',
      'Xã Tháp Mười',
      'Xã Cái Bè',
      'Xã Chợ Gạo'
    ]
  },
  {
    name: 'Vĩnh Long',
    aliases: ['Tỉnh Vĩnh Long', 'Bến Tre', 'Trà Vinh'],
    wards: [
      'Phường Long Châu',
      'Phường Phước Hậu',
      'Phường Tân Ngãi',
      'Phường Bình Minh',
      'Phường Bến Tre',
      'Phường Phú Khương',
      'Phường Trà Vinh',
      'Phường Duyên Hải',
      'Xã Long Hồ',
      'Xã Mang Thít',
      'Xã Vũng Liêm',
      'Xã Tam Bình',
      'Xã Trà Ôn',
      'Xã Châu Thành',
      'Xã Chợ Lách',
      'Xã Mỏ Cày',
      'Xã Càng Long'
    ]
  },
  {
    name: 'Cà Mau',
    aliases: ['Tỉnh Cà Mau', 'Bạc Liêu'],
    wards: [
      'Phường Tân Thành',
      'Phường An Xuyên',
      'Phường Lý Văn Lâm',
      'Phường Hòa Thành',
      'Phường Bạc Liêu',
      'Phường Giá Rai',
      'Xã Thới Bình',
      'Xã U Minh',
      'Xã Trần Văn Thời',
      'Xã Cái Nước',
      'Xã Đầm Dơi',
      'Xã Năm Căn',
      'Xã Ngọc Hiển',
      'Xã Đất Mũi',
      'Xã Vĩnh Lợi',
      'Xã Hòa Bình'
    ]
  },
  {
    name: 'Đồng Nai',
    aliases: ['Tỉnh Đồng Nai', 'Bình Phước'],
    wards: [
      'Phường Biên Hòa',
      'Phường Trấn Biên',
      'Phường Tân Hiệp',
      'Phường Long Bình',
      'Phường Trảng Dài',
      'Phường Long Khánh',
      'Phường Đồng Xoài',
      'Phường Bình Long',
      'Phường Phước Long',
      'Xã Long Thành',
      'Xã Nhơn Trạch',
      'Xã Trảng Bom',
      'Xã Vĩnh Cửu',
      'Xã Thống Nhất',
      'Xã Xuân Lộc',
      'Xã Cẩm Mỹ',
      'Xã Định Quán',
      'Xã Tân Phú',
      'Xã Chơn Thành'
    ]
  },
  {
    name: 'Tây Ninh',
    aliases: ['Tỉnh Tây Ninh', 'Long An'],
    wards: [
      'Phường Tân Ninh',
      'Phường Hòa Thành',
      'Phường Trảng Bàng',
      'Phường Gò Dầu',
      'Phường Tân An',
      'Phường Kiến Tường',
      'Xã Dương Minh Châu',
      'Xã Châu Thành',
      'Xã Tân Biên',
      'Xã Tân Châu',
      'Xã Bến Cầu',
      'Xã Bến Lức',
      'Xã Đức Hòa',
      'Xã Cần Giuộc',
      'Xã Cần Đước'
    ]
  },
  {
    name: 'Lâm Đồng',
    aliases: ['Tỉnh Lâm Đồng', 'Đắk Nông', 'Bình Thuận'],
    wards: [
      'Phường Xuân Hương - Đà Lạt',
      'Phường Cam Ly - Đà Lạt',
      'Phường Lâm Viên - Đà Lạt',
      'Phường Xuân Trường - Đà Lạt',
      'Phường Lang Biang - Đà Lạt',
      'Phường Bảo Lộc',
      'Phường B’Lao',
      'Phường Gia Nghĩa',
      'Phường Phan Thiết',
      'Phường Mũi Né',
      'Phường La Gi',
      'Xã Đức Trọng',
      'Xã Di Linh',
      'Xã Lâm Hà',
      'Xã Đơn Dương',
      'Xã Lạc Dương',
      'Đặc khu Phú Quý'
    ]
  },
  {
    name: 'Khánh Hòa',
    aliases: ['Tỉnh Khánh Hòa', 'Ninh Thuận'],
    wards: [
      'Phường Nha Trang',
      'Phường Bắc Nha Trang',
      'Phường Nam Nha Trang',
      'Phường Vĩnh Hải',
      'Phường Phước Hải',
      'Phường Cam Ranh',
      'Phường Ninh Hòa',
      'Phường Phan Rang - Tháp Chàm',
      'Xã Diên Khánh',
      'Xã Cam Lâm',
      'Xã Vạn Ninh',
      'Xã Khánh Vĩnh',
      'Xã Ninh Hải',
      'Xã Ninh Phước',
      'Đặc khu Trường Sa'
    ]
  },
  {
    name: 'Đắk Lắk',
    aliases: ['Tỉnh Đắk Lắk', 'Phú Yên'],
    wards: [
      'Phường Buôn Ma Thuột',
      'Phường Tân Lợi',
      'Phường Tân An',
      'Phường Thành Nhất',
      'Phường Buôn Hồ',
      'Phường Tuy Hòa',
      'Phường Sông Cầu',
      'Phường Đông Hòa',
      'Xã Cư M’gar',
      'Xã Krông Pắc',
      'Xã Ea Kar',
      'Xã Krông Ana',
      'Xã Buôn Đôn',
      'Xã Tuy An'
    ]
  },
  {
    name: 'Gia Lai',
    aliases: ['Tỉnh Gia Lai', 'Bình Định'],
    wards: [
      'Phường Pleiku',
      'Phường Diên Hồng',
      'Phường Hội Phú',
      'Phường An Khê',
      'Phường Ayun Pa',
      'Phường Quy Nhơn',
      'Phường An Nhơn',
      'Phường Hoài Nhơn',
      'Xã Chư Sê',
      'Xã Đak Đoa',
      'Xã Ia Grai',
      'Xã Tuy Phước',
      'Xã Phù Cát',
      'Xã Tây Sơn'
    ]
  },
  {
    name: 'Quảng Ngãi',
    aliases: ['Tỉnh Quảng Ngãi', 'Kon Tum'],
    wards: [
      'Phường Cẩm Thành',
      'Phường Nghĩa Lộ',
      'Phường Trương Quang Trọng',
      'Phường Đức Phổ',
      'Phường Kon Tum',
      'Xã Bình Sơn',
      'Xã Sơn Tịnh',
      'Xã Tư Nghĩa',
      'Xã Mộ Đức',
      'Xã Ngọc Hồi',
      'Xã Đắk Hà',
      'Xã Măng Đen',
      'Đặc khu Lý Sơn'
    ]
  },
  {
    name: 'Quảng Trị',
    aliases: ['Tỉnh Quảng Trị', 'Quảng Bình'],
    wards: [
      'Phường Đông Hà',
      'Phường Quảng Trị',
      'Phường Đồng Hới',
      'Phường Ba Đồn',
      'Xã Vĩnh Linh',
      'Xã Gio Linh',
      'Xã Triệu Phong',
      'Xã Hải Lăng',
      'Xã Hướng Hóa',
      'Xã Lệ Thủy',
      'Xã Quảng Ninh',
      'Xã Bố Trạch',
      'Đặc khu Cồn Cỏ'
    ]
  },
  {
    name: 'Hà Tĩnh',
    aliases: ['Tỉnh Hà Tĩnh'],
    wards: [
      'Phường Thành Sen',
      'Phường Trần Phú',
      'Phường Hà Huy Tập',
      'Phường Hồng Lĩnh',
      'Phường Kỳ Anh',
      'Xã Thạch Hà',
      'Xã Cẩm Xuyên',
      'Xã Can Lộc',
      'Xã Nghi Xuân',
      'Xã Đức Thọ',
      'Xã Hương Sơn',
      'Xã Hương Khê'
    ]
  },
  {
    name: 'Nghệ An',
    aliases: ['Tỉnh Nghệ An'],
    wards: [
      'Phường Trường Vinh',
      'Phường Thành Vinh',
      'Phường Vinh Hưng',
      'Phường Vinh Phú',
      'Phường Cửa Lò',
      'Phường Hoàng Mai',
      'Phường Thái Hòa',
      'Xã Hưng Nguyên',
      'Xã Nghi Lộc',
      'Xã Diễn Châu',
      'Xã Quỳnh Lưu',
      'Xã Yên Thành',
      'Xã Đô Lương',
      'Xã Thanh Chương',
      'Xã Nam Đàn'
    ]
  },
  {
    name: 'Thanh Hóa',
    aliases: ['Tỉnh Thanh Hóa'],
    wards: [
      'Phường Hạc Thành',
      'Phường Đông Sơn',
      'Phường Quảng Phú',
      'Phường Sầm Sơn',
      'Phường Bỉm Sơn',
      'Phường Nghi Sơn',
      'Xã Hoằng Hóa',
      'Xã Quảng Xương',
      'Xã Đông Sơn',
      'Xã Triệu Sơn',
      'Xã Thọ Xuân',
      'Xã Nông Cống',
      'Xã Hà Trung',
      'Xã Nga Sơn',
      'Xã Hậu Lộc'
    ]
  },
  {
    name: 'Ninh Bình',
    aliases: ['Tỉnh Ninh Bình', 'Nam Định', 'Hà Nam'],
    wards: [
      'Phường Hoa Lư',
      'Phường Đông Thành',
      'Phường Nam Thành',
      'Phường Tam Điệp',
      'Phường Nam Định',
      'Phường Phủ Lý',
      'Phường Duy Tiên',
      'Xã Gia Viễn',
      'Xã Nho Quan',
      'Xã Yên Khánh',
      'Xã Yên Mô',
      'Xã Kim Sơn',
      'Xã Hải Hậu',
      'Xã Xuân Trường',
      'Xã Giao Thủy'
    ]
  },
  {
    name: 'Hưng Yên',
    aliases: ['Tỉnh Hưng Yên', 'Thái Bình'],
    wards: [
      'Phường Phố Hiến',
      'Phường Lam Sơn',
      'Phường Mỹ Hào',
      'Phường Thái Bình',
      'Phường Trần Lãm',
      'Xã Văn Giang',
      'Xã Văn Lâm',
      'Xã Yên Mỹ',
      'Xã Khoái Châu',
      'Xã Kim Động',
      'Xã Tiên Lữ',
      'Xã Phù Cừ',
      'Xã Đông Hưng',
      'Xã Tiền Hải',
      'Xã Thái Thụy'
    ]
  },
  {
    name: 'Bắc Ninh',
    aliases: ['Tỉnh Bắc Ninh', 'Bắc Giang'],
    wards: [
      'Phường Kinh Bắc',
      'Phường Vũ Ninh',
      'Phường Suối Hoa',
      'Phường Từ Sơn',
      'Phường Thuận Thành',
      'Phường Quế Võ',
      'Phường Bắc Giang',
      'Phường Việt Yên',
      'Xã Tiên Du',
      'Xã Yên Phong',
      'Xã Gia Bình',
      'Xã Lương Tài',
      'Xã Hiệp Hòa',
      'Xã Lục Ngạn'
    ]
  },
  {
    name: 'Quảng Ninh',
    aliases: ['Tỉnh Quảng Ninh'],
    wards: [
      'Phường Hạ Long',
      'Phường Hồng Gai',
      'Phường Bãi Cháy',
      'Phường Cẩm Phả',
      'Phường Uông Bí',
      'Phường Móng Cái',
      'Phường Đông Triều',
      'Phường Quảng Yên',
      'Xã Tiên Yên',
      'Xã Hải Hà',
      'Xã Đầm Hà',
      'Đặc khu Vân Đồn',
      'Đặc khu Cô Tô'
    ]
  },
  {
    name: 'Phú Thọ',
    aliases: ['Tỉnh Phú Thọ', 'Vĩnh Phúc', 'Hòa Bình'],
    wards: [
      'Phường Việt Trì',
      'Phường Gia Cẩm',
      'Phường Nông Trang',
      'Phường Phú Thọ',
      'Phường Vĩnh Yên',
      'Phường Phúc Yên',
      'Phường Hòa Bình',
      'Xã Lâm Thao',
      'Xã Phù Ninh',
      'Xã Thanh Thủy',
      'Xã Tam Nông',
      'Xã Thanh Sơn',
      'Xã Bình Xuyên',
      'Xã Vĩnh Tường',
      'Xã Lương Sơn'
    ]
  },
  {
    name: 'Thái Nguyên',
    aliases: ['Tỉnh Thái Nguyên', 'Bắc Kạn'],
    wards: [
      'Phường Phan Đình Phùng',
      'Phường Hoàng Văn Thụ',
      'Phường Túc Duyên',
      'Phường Sông Công',
      'Phường Phổ Yên',
      'Phường Bắc Kạn',
      'Xã Đại Từ',
      'Xã Phú Bình',
      'Xã Phú Lương',
      'Xã Đồng Hỷ',
      'Xã Định Hóa',
      'Xã Ba Bể'
    ]
  },
  {
    name: 'Tuyên Quang',
    aliases: ['Tỉnh Tuyên Quang', 'Hà Giang'],
    wards: [
      'Phường Minh Xuân',
      'Phường Tân Quang',
      'Phường Phan Thiết',
      'Phường Hà Giang',
      'Xã Sơn Dương',
      'Xã Yên Sơn',
      'Xã Hàm Yên',
      'Xã Chiêm Hóa',
      'Xã Na Hang',
      'Xã Lâm Bình',
      'Xã Đồng Văn',
      'Xã Mèo Vạc',
      'Xã Vị Xuyên'
    ]
  },
  {
    name: 'Lào Cai',
    aliases: ['Tỉnh Lào Cai', 'Yên Bái'],
    wards: [
      'Phường Lào Cai',
      'Phường Cốc Lếu',
      'Phường Kim Tân',
      'Phường Sa Pa',
      'Phường Yên Bái',
      'Phường Nghĩa Lộ',
      'Xã Bảo Thắng',
      'Xã Bảo Yên',
      'Xã Bát Xát',
      'Xã Bắc Hà',
      'Xã Văn Yên',
      'Xã Trấn Yên',
      'Xã Mù Cang Chải'
    ]
  },
  {
    name: 'Sơn La',
    aliases: ['Tỉnh Sơn La'],
    wards: [
      'Phường Tô Hiệu',
      'Phường Chiềng Lề',
      'Phường Quyết Thắng',
      'Phường Mộc Châu',
      'Phường Thảo Nguyên',
      'Xã Mai Sơn',
      'Xã Yên Châu',
      'Xã Thuận Châu',
      'Xã Phù Yên',
      'Xã Bắc Yên',
      'Xã Sông Mã'
    ]
  },
  {
    name: 'Lai Châu',
    aliases: ['Tỉnh Lai Châu'],
    wards: [
      'Phường Đoàn Kết',
      'Phường Tân Phong',
      'Phường Quyết Tiến',
      'Xã Tam Đường',
      'Xã Phong Thổ',
      'Xã Sìn Hồ',
      'Xã Than Uyên',
      'Xã Tân Uyên',
      'Xã Mường Tè',
      'Xã Nậm Nhùn'
    ]
  },
  {
    name: 'Điện Biên',
    aliases: ['Tỉnh Điện Biên'],
    wards: [
      'Phường Điện Biên Phủ',
      'Phường Mường Thanh',
      'Phường Him Lam',
      'Phường Mường Lay',
      'Xã Điện Biên',
      'Xã Điện Biên Đông',
      'Xã Tuần Giáo',
      'Xã Mường Ảng',
      'Xã Tủa Chùa',
      'Xã Mường Nhé',
      'Xã Nậm Pồ'
    ]
  },
  {
    name: 'Cao Bằng',
    aliases: ['Tỉnh Cao Bằng'],
    wards: [
      'Phường Sông Bằng',
      'Phường Hợp Giang',
      'Phường Đề Thám',
      'Phường Tân Giang',
      'Xã Hòa An',
      'Xã Quảng Hòa',
      'Xã Trùng Khánh',
      'Xã Nguyên Bình',
      'Xã Hà Quảng',
      'Xã Bảo Lạc'
    ]
  },
  {
    name: 'Lạng Sơn',
    aliases: ['Tỉnh Lạng Sơn'],
    wards: [
      'Phường Đông Kinh',
      'Phường Hoàng Văn Thụ',
      'Phường Tam Thanh',
      'Phường Chi Lăng',
      'Xã Cao Lộc',
      'Xã Hữu Lũng',
      'Xã Chi Lăng',
      'Xã Lộc Bình',
      'Xã Văn Lãng',
      'Xã Bắc Sơn',
      'Xã Bình Gia'
    ]
  }
];

// Bổ sung danh sách các tỉnh truyền thống nếu người dùng chọn theo tên tỉnh cũ
export const LEGACY_PROVINCE_SHORTCUTS = [
  'Bình Dương',
  'Bà Rịa - Vũng Tàu',
  'Long An',
  'Tiền Giang',
  'Bến Tre',
  'Trà Vinh',
  'Sóc Trăng',
  'Hậu Giang',
  'Bạc Liêu',
  'Kiên Giang',
  'Bình Phước',
  'Bình Thuận',
  'Ninh Thuận',
  'Phú Yên',
  'Bình Định',
  'Quảng Nam',
  'Quảng Bình',
  'Kon Tum',
  'Đắk Nông',
  'Hải Dương',
  'Hưng Yên',
  'Thái Bình',
  'Nam Định',
  'Hà Nam',
  'Vĩnh Phúc',
  'Bắc Giang',
  'Hòa Bình',
  'Yên Bái',
  'Hà Giang',
  'Bắc Kạn'
];

// Chuẩn hóa chuỗi bỏ dấu tiếng Việt để so khớp
export function removeAccents(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Tìm Tỉnh/Thành phố chuẩn từ tên bất kỳ (do GPS Nominatim trả về hoặc chuỗi cũ)
export function matchProvinceName(rawProvince = '') {
  if (!rawProvince) return '';
  const cleaned = String(rawProvince)
    .replace(/^(Tỉnh|Thành phố|TP\.|TP)\s+/i, '')
    .trim();
  const normCleaned = removeAccents(cleaned);

  for (const p of VIETNAM_PROVINCES_2_TIER) {
    const pClean = p.name.replace(/^(Tỉnh|Thành phố|TP\.|TP)\s+/i, '').trim();
    if (removeAccents(pClean) === normCleaned || removeAccents(p.name) === removeAccents(rawProvince)) {
      return p.name;
    }
    if (p.aliases && p.aliases.some((a) => removeAccents(a) === normCleaned || removeAccents(a) === removeAccents(rawProvince))) {
      return p.name;
    }
  }
  return rawProvince.trim();
}

// Lấy danh sách Phường/Xã/Đặc khu theo Tỉnh/Thành phố
export function getWardsByProvince(provinceName = '') {
  if (!provinceName) return [];
  const matchedName = matchProvinceName(provinceName);
  const found = VIETNAM_PROVINCES_2_TIER.find(
    (p) => p.name === matchedName || removeAccents(p.name) === removeAccents(provinceName)
  );
  return found ? found.wards : [];
}

// Chuẩn hóa tên Phường/Xã từ dữ liệu GPS Nominatim (bỏ cấp Quận/Huyện cũ nếu vô tình lọt vào)
export function normalizeWardFromNominatim(addressObj = {}) {
  const candidates = [
    addressObj.suburb,
    addressObj.quarter,
    addressObj.village,
    addressObj.town,
    addressObj.neighbourhood,
    addressObj.hamlet,
    addressObj.municipality,
    addressObj.city_district
  ].filter(Boolean);

  // Ưu tiên chuỗi có tiền tố Phường / Xã / Đặc khu / Thị trấn
  for (const c of candidates) {
    if (/^(Phường|Xã|Đặc khu|Thị trấn)\s+/i.test(c.trim())) {
      return c.trim();
    }
  }

  // Nếu chỉ có tên hoặc có chữ Quận/Huyện thì chuyển hóa thông minh sang Phường/Xã
  if (candidates.length > 0) {
    const first = candidates[0].trim();
    if (/^(Quận|Huyện)\s+/i.test(first)) {
      // Bỏ chữ Quận/Huyện để chuyển thành Phường/Xã tương ứng theo chuẩn 2 cấp
      const stripped = first.replace(/^(Quận|Huyện)\s+/i, '').trim();
      return /^\d+$/.test(stripped) ? `Phường ${stripped}` : `Phường ${stripped}`;
    }
    return first;
  }

  return '';
}

// Tách chuỗi địa chỉ `[Số nhà/Đường, ]<Phường/Xã>, <Tỉnh/Thành phố>` thành 3 phần
export function parseFullAddress2Tier(fullAddress = '') {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return { street: '', ward: '', province: '' };
  }

  // Loại bỏ hậu tố ", Việt Nam" hoặc ", Vietnam" nếu có
  const cleaned = fullAddress.replace(/,\s*(Việt Nam|Vietnam)\s*$/i, '').trim();
  const parts = cleaned
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { street: '', ward: '', province: '' };
  }

  if (parts.length === 1) {
    const maybeProv = matchProvinceName(parts[0]);
    const isKnownProv = VIETNAM_PROVINCES_2_TIER.some((p) => p.name === maybeProv);
    return isKnownProv
      ? { street: '', ward: '', province: maybeProv }
      : { street: parts[0], ward: '', province: '' };
  }

  const rawProvince = parts[parts.length - 1];
  const province = matchProvinceName(rawProvince);

  // Loại bỏ bất kỳ thành phần nào là cấp "Quận / Huyện / Thị xã" cũ ở giữa nếu có hơn 2 phần
  const remaining = parts.slice(0, parts.length - 1).filter((p) => !/^(Quận|Huyện|Thị xã|TP\.)\s+/i.test(p));
  const effectiveRemaining = remaining.length > 0 ? remaining : parts.slice(0, parts.length - 1);

  if (effectiveRemaining.length === 1) {
    return {
      street: '',
      ward: effectiveRemaining[0],
      province
    };
  }

  const ward = effectiveRemaining[effectiveRemaining.length - 1];
  const street = effectiveRemaining.slice(0, effectiveRemaining.length - 1).join(', ');
  return { street, ward, province };
}

// Ghép 3 phần thành chuỗi địa chỉ 2 cấp chuẩn: `[Số nhà/Đường, ]<Phường/Xã>, <Tỉnh/Thành phố>`
export function formatFullAddress2Tier({ street = '', ward = '', province = '' }) {
  const s = street.trim();
  const w = ward.trim();
  const p = province.trim();
  return [s, w, p].filter(Boolean).join(', ');
}
