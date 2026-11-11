import rawSpecies from './speciesData.json';

// Danh mục theo CDM: DANH_MUC
export const CATEGORIES = [
  { id: 'all', name: 'Tất cả cây', icon: 'yard', desc: 'Toàn bộ bộ sưu tập kiểng lá' },
  { id: 'dot-bien', name: 'Đột biến cẩm thạch (Variegated)', icon: 'auto_awesome', desc: 'Các cá thể Albo, Thai Constellation, Aurea đột biến độc bản' },
  { id: 'de-ban', name: 'Cây để bàn & Nội thất', icon: 'desk', desc: 'Cỡ mini & trung bình, trang trí phòng khách và bàn làm việc' },
  { id: 'loc-khong-khi', name: 'Cây lọc không khí', icon: 'air', desc: 'Hấp thụ độc tố benzen, formaldehyde cho không gian sống trong lành' },
  { id: 'phong-thuy', name: 'Cây phong thủy & May mắn', icon: 'spa', desc: 'Mang lại sinh khí, tài lộc và bình an cho gia chủ' },
  { id: 'ngoai-troi', name: 'Đại cảnh & Ban công', icon: 'nature_people', desc: 'Dáng cây cao lớn trên 1m, tán rộng tạo điểm nhấn không gian' }
];

// Danh sách 90 loài theo CDM: LOAI_CAY (kèm tri thức thực vật học)
export const SPECIES_LIST = rawSpecies.map((sp) => {
  const defaultInfo = {
    xuatXu: 'Nhiệt đới châu Mỹ / Đông Nam Á',
    anhSang: 'Tán xạ gián tiếp 60-70%',
    doAm: '65% - 85%',
    tuoiNuoc: '1 - 2 lần/tuần (khi mặt đất se khô)',
    datTrong: 'Xơ dừa, perlite, pumice, vỏ thông thoát nước tốt',
    dacDiem: 'Lá bóng đẹp, bản lá dày, gân lá nổi rõ rệt đặc trưng.',
    giaThamKhao: '350.000 ₫ - 3.500.000 ₫'
  };

  // Tùy biến một số loài phổ biến
  if (sp.vietnamese_name.includes('Trầu bà lá xẻ') || sp.vietnamese_name.includes('Monstera')) {
    defaultInfo.xuatXu = 'Rừng mưa nhiệt đới Trung & Nam Mỹ';
    defaultInfo.dacDiem = 'Lá xẻ tai sâu kèm các lỗ khuyết fenestration tự nhiên tuyệt đẹp.';
    defaultInfo.giaThamKhao = '450.000 ₫ - 15.000.000 ₫';
  } else if (sp.vietnamese_name.includes('Lưỡi hổ') || sp.original_label.includes('Snake plant')) {
    defaultInfo.xuatXu = 'Tây Phi';
    defaultInfo.tuoiNuoc = '10 - 14 ngày/lần (chịu hạn cực tốt)';
    defaultInfo.dacDiem = 'Lá vươn thẳng hình thanh kiếm, viền vàng hoặc sọc vằn xám, lọc khí đêm mạnh.';
    defaultInfo.giaThamKhao = '180.000 ₫ - 850.000 ₫';
  } else if (sp.vietnamese_name.includes('Kim tiền') || sp.original_label.includes('ZZ Plant')) {
    defaultInfo.xuatXu = 'Đông Phi';
    defaultInfo.tuoiNuoc = '1 - 2 tuần/lần';
    defaultInfo.dacDiem = 'Thân củ trữ nước, lá xanh mướt xếp đôi đều đặn như chuỗi tiền tài.';
    defaultInfo.giaThamKhao = '200.000 ₫ - 950.000 ₫';
  }

  return {
    ...sp,
    ...defaultInfo
  };
});

// Danh sách sản phẩm chậu cây theo CDM: SAN_PHAM + HINH_ANH_SAN_PHAM
export const PRODUCTS = [
  {
    id: 1,
    speciesId: 54, // Trầu bà lá xẻ (Monstera Deliciosa)
    speciesName: 'Monstera Deliciosa (Trầu bà lá xẻ)',
    name: 'Monstera Deliciosa Albo Half-Moon Cẩm Thạch',
    category: 'dot-bien',
    price: 3850000,
    originalPrice: 4500000,
    stock: 2,
    size: 'Cao 55cm, chậu gốm Ø24cm',
    leafCondition: '4 lá xẻ hoàn chỉnh, 1 lá Half-Moon 50/50, 1 búp mới',
    healthStatus: 'Rễ phụ bám trụ khỏe, đã thuần dưỡng khí hậu miền Nam 8 tháng',
    tag: 'Đột biến cẩm thạch',
    isHot: true,
    rating: 5.0,
    reviewCount: 14,
    image: '/plants/54.jpg',
    gallery: ['/plants/54.jpg'],
    desc: 'Cá thể Monstera Albo đột biến Sectoral Half-Moon hiếm có với mảng trắng tuyết phân chia đối xứng trên phiến lá. Bộ rễ gió khỏe khoắn, được trồng trong giá thể chuyên dụng cao cấp gồm vỏ thông New Zealand và đá bọt perlite.'
  },
  {
    id: 2,
    speciesId: 11, // Môn Alocasia
    speciesName: 'Alocasia Amazonica (Môn Quan Âm)',
    name: 'Môn Quan Âm Alocasia Polly Gân Bạc Để Bàn',
    category: 'de-ban',
    price: 380000,
    originalPrice: 450000,
    stock: 8,
    size: 'Cao 35cm, chậu sứ trắng Ø16cm',
    leafCondition: 'Lá hình khiên sắc nét, gân trắng bạc nổi bật trên nền xanh đậm',
    healthStatus: 'Cây giống thuần khỏe, củ rễ ổn định, sẵn sàng trưng bày phòng khách',
    tag: 'Bán chạy',
    isHot: true,
    rating: 4.9,
    reviewCount: 32,
    image: '/plants/11.jpg',
    gallery: ['/plants/11.jpg'],
    desc: 'Chậu Môn Quan Âm Alocasia để bàn kích thước nhỏ gọn tinh tế, điểm nhấn hoàn hảo cho bàn làm việc hoặc kệ sách.'
  },
  {
    id: 3,
    speciesId: 33, // Bàng Singapore
    speciesName: 'Ficus Lyrata (Bàng Singapore)',
    name: 'Bàng Singapore Cỡ Trung Kèm Chậu Gốm Bát Tràng',
    category: 'loc-khong-khi',
    price: 750000,
    originalPrice: 890000,
    stock: 4,
    size: 'Cao 75cm - 85cm, chậu gốm sứ thủ công Ø22cm',
    leafCondition: 'Tán lá to bản xanh bóng hình đàn vĩ cầm, thân thẳng vững chãi',
    healthStatus: 'Sinh trưởng mạnh mẽ, kháng bệnh tốt, phù hợp không gian máy lạnh',
    tag: 'Ưa chuộng',
    isHot: true,
    rating: 4.8,
    reviewCount: 26,
    image: '/plants/33.jpg',
    gallery: ['/plants/33.jpg'],
    desc: 'Chậu cây Bàng Singapore cỡ trung với dáng thế uyển chuyển sang trọng, chậu gốm phủ men mộc cao cấp tôn lên sắc xanh nhiệt đới.'
  },
  {
    id: 4,
    speciesId: 14, // Môn Caladium
    speciesName: 'Caladium Bicolor (Môn Cảnh Hồng Ngọc)',
    name: 'Môn Cảnh Caladium Đột Biến Hồng Cẩm Thạch',
    category: 'dot-bien',
    price: 2900000,
    originalPrice: 3400000,
    stock: 3,
    size: 'Cao 60cm, chậu men sứ Ø20cm',
    leafCondition: 'Sắc hồng phấn pha gân lục bảo rực rỡ bao phủ trên 70% diện tích lá',
    healthStatus: 'Mô cấy phòng lab Thái Lan, đã dưỡng thuần khí hậu VN hơn 6 tháng',
    tag: 'Đột biến Platinum',
    isHot: true,
    rating: 5.0,
    reviewCount: 9,
    image: '/plants/14.jpg',
    gallery: ['/plants/14.jpg'],
    desc: 'Dòng Caladium đột biến sắc tố ổn định, mảng hoa văn hồng ngọc nổi bật trong mọi không gian nội thất.'
  },
  {
    id: 5,
    speciesId: 3, // Hồng môn
    speciesName: 'Anthurium Andraeanum (Hồng Môn Nhung)',
    name: 'Anthurium Warocqueanum (Nữ Hoàng Hồng Môn)',
    category: 'dot-bien',
    price: 4200000,
    originalPrice: 4800000,
    stock: 2,
    size: 'Bản lá dài 45cm, thân cao 60cm',
    leafCondition: 'Lá nhung bóng mượt, sắc đỏ hồng rực rỡ kèm gân lá nổi rõ',
    healthStatus: 'Rễ củ đâm sâu, ưa ẩm cao 75-90%, phát triển rực rỡ',
    tag: 'Nữ Hoàng Aroid',
    isHot: true,
    rating: 4.9,
    reviewCount: 11,
    image: '/plants/3.jpg',
    gallery: ['/plants/3.jpg'],
    desc: 'Được mệnh danh là Nữ hoàng của họ Ráy, lá và mo hoa phủ lớp nhung huyền bí kiêu kỳ thu hút mọi ánh nhìn.'
  },
  {
    id: 6,
    speciesId: 72, // Cây Kim tiền
    speciesName: 'Zamioculcas Zamiifolia (Cây Kim Tiền)',
    name: 'Cây Kim Tiền Raven Đen Huyền Bí Phong Thủy',
    category: 'phong-thuy',
    price: 490000,
    originalPrice: 550000,
    stock: 12,
    size: 'Cao 50cm, chậu đá mài bo tròn',
    leafCondition: 'Lá dày bóng xếp đôi đều đặn, tán xòe tròn đầy sức sống',
    healthStatus: 'Cực kỳ dễ chăm sóc, chịu bóng râm và chịu hạn kiên cường',
    tag: 'Hút tài lộc',
    isHot: false,
    rating: 4.8,
    reviewCount: 45,
    image: '/plants/72.jpg',
    gallery: ['/plants/72.jpg'],
    desc: 'Biểu tượng của tài lộc bền vững, khả năng sống mãnh liệt trong môi trường văn phòng thiếu sáng, thanh lọc độc tố hiệu quả.'
  },
  {
    id: 7,
    speciesId: 67, // Cây Lưỡi Hổ
    speciesName: 'Dracaena Trifasciata (Cây Lưỡi Hổ)',
    name: 'Lưỡi Hổ Hoàng Kim Moonshine Lọc Khí Đêm',
    category: 'loc-khong-khi',
    price: 320000,
    originalPrice: 390000,
    stock: 15,
    size: 'Cao 45cm, chậu xi măng trắng Ø18cm',
    leafCondition: 'Lá vươn thẳng viền vàng ánh kim sắc nét, không tì vết',
    healthStatus: 'Nhả khí oxy ban đêm theo cơ chế CAM, chống bức xạ máy tính',
    tag: 'Phòng ngủ & Bàn làm việc',
    isHot: false,
    rating: 4.9,
    reviewCount: 38,
    image: '/plants/67.jpg',
    gallery: ['/plants/67.jpg'],
    desc: 'Được NASA công nhận là một trong những loài cây thanh lọc độc tố formaldehyde và benzen hàng đầu, mang lại giấc ngủ thư thái sâu lắng.'
  },
  {
    id: 8,
    speciesId: 9, // Thiên điểu
    speciesName: 'Strelitzia Reginae (Cây Thiên Điểu)',
    name: 'Thiên Điểu Đại Cảnh Nhiệt Đới Cao 1m3',
    category: 'ngoai-troi',
    price: 1650000,
    originalPrice: 1950000,
    stock: 2,
    size: 'Cao 1m3, tán rộng 1m1, chậu đá mài cao cấp Ø35cm',
    leafCondition: 'Tán lá bản rộng vươn cao bề thế chuẩn phong cách Tropical',
    healthStatus: 'Cây mẹ thuần chủng lâu năm, sức đề kháng vượt trội',
    tag: 'Đại sảnh & Biệt thự',
    isHot: true,
    rating: 5.0,
    reviewCount: 7,
    image: '/plants/9.jpg',
    gallery: ['/plants/9.jpg'],
    desc: 'Chậu đại thụ chuyên dành cho phòng khách biệt thự, sảnh lễ tân khách sạn hoặc quán cafe phong cách tropical nhiệt đới sang trọng.'
  }
];

// Dữ liệu đánh giá theo CDM: DANH_GIA_SAN_PHAM
export const INITIAL_REVIEWS = [
  {
    id: 1,
    productId: 1,
    userName: 'Lê Hoàng Nam (Bảo Lộc)',
    rating: 5,
    date: '10/10/2026',
    comment: 'Cây giao đóng gói thùng gỗ rất kỹ càng, mảng trắng Half-Moon rõ nét không hề bị cháy mép khi vận chuyển 2 ngày. Rất hài lòng với vườn!',
    verified: true
  },
  {
    id: 2,
    productId: 3,
    userName: 'Trần Thị Mai Phương',
    rating: 5,
    date: '08/10/2026',
    comment: 'Chậu gốm men mộc đẹp hơn trong ảnh nhiều. Tính năng quét AI Vision của shop phát hiện đúng loài Monstera và hướng dẫn chăm sóc chi tiết.',
    verified: true
  }
];
