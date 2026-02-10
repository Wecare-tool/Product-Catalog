
import { CatalogPage, TableOfContentsItem } from './types';

// Hàm hỗ trợ tạo dữ liệu giả lập
const generateCatalogData = () => {
  const pages: CatalogPage[] = [];
  const toc: TableOfContentsItem[] = [];
  
  let pageCounter = 1;

  // --- Kho ảnh thực tế ---
  const images = {
    cover: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=1200&auto=format&fit=crop",
    intro: "https://scontent.fsgn2-7.fna.fbcdn.net/v/t39.30808-6/512006088_1186283273511701_3376794404110988793_n.png?_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=cSB_P1QXL0gQ7kNvwHlo0DV&_nc_oc=AdkJWMJRYRecu_CbpPZD-DrDNr6vYjxn9aDOGL06Kf5ZS0cwhjzxufvgkSM_W3Gu74A&_nc_zt=23&_nc_ht=scontent.fsgn2-7.fna&_nc_gid=PrA8jg3h--KVpTb4NeSjRQ&oh=00_AfnyWACoCf2VGtDbV0EaVf-t-KGWNVUb2IP9ShUNa8o6Bg&oe=69418901",
    hex_bolts: [
      "https://images.unsplash.com/photo-1616405391509-5a1e8a8b0c84?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589985902809-39d10d64201d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621256372580-c1e13717621c?q=80&w=800&auto=format&fit=crop",
    ],
    socket_screws: [
      "https://images.unsplash.com/photo-1567608129758-c052737666b5?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?q=80&w=800&auto=format&fit=crop",
    ],
    wood_screws: [
      "https://images.unsplash.com/photo-1581147036324-c17ac41d1685?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=800&auto=format&fit=crop",
    ],
    tapping: [
      "https://images.unsplash.com/photo-1617105747683-16c68383a887?q=80&w=800&auto=format&fit=crop",
      "https://plus.unsplash.com/premium_photo-1678129486121-6548a3136284?q=80&w=800&auto=format&fit=crop"
    ],
    anchors: [
      "https://images.unsplash.com/photo-1565518881273-09477eb37286?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533235651662-386419519c5c?q=80&w=800&auto=format&fit=crop",
    ],
    nuts_washers: [
      "https://images.unsplash.com/photo-1597423244039-959fb25dfb42?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622325367699-f5383a651f67?q=80&w=800&auto=format&fit=crop",
    ],
    appendix: "https://images.unsplash.com/photo-1581093588401-fbb0736527a1?q=80&w=1200&auto=format&fit=crop"
  };

  // --- 1. Trang Bìa ---
  pages.push({
    id: pageCounter++,
    title: "Catalogue Vật tư Liên kết Wecare 2025",
    section: "Trang bìa",
    type: 'standard',
    image: images.cover,
    content: `Cung cấp giải pháp cung ứng vật tư, nguyên vật liệu, phụ kiện cho nhà máy, ngành công nghiệp.

Trụ sở 1:
14-16-18-20, Đường 36, P. Bình Phú, Q6, HCM
📞 0983 161 162

Trụ sở 2:
Lô B39, Khu Công nghiệp Phú Tài, Phường Quy Nhơn Bắc, Tỉnh Gia Lai
📞 +84 378 339 009

Email: support@wecare.com.vn`
  });
  toc.push({ id: 'cover', title: 'Trang bìa', pageNumber: 1 });

  // --- 2. Giới thiệu ---
  pages.push({
    id: pageCounter++,
    title: "Chất lượng Kỹ thuật",
    section: "Giới thiệu",
    type: 'standard',
    image: images.intro,
    content: "Vật tư liên kết Wecare được sản xuất theo tiêu chuẩn ISO 9001. Từ bu lông kết cấu hạng nặng đến ốc vít vi mô chính xác, chúng tôi cung cấp sức mạnh gắn kết thế giới của bạn."
  });
  toc.push({ id: 'intro', title: 'Giới thiệu', pageNumber: 2 });

  // --- Định nghĩa Danh mục ---
  const categories = [
    { 
      id: 'hex_bolts', 
      title: 'Bu lông Lục giác (Hex Bolts)', 
      prefix: 'HEX', 
      count: 15, 
      desc: 'Tiêu chuẩn DIN 931/933. Có sẵn Class 8.8, 10.9 và Inox A2/A4.',
      imgPool: images.hex_bolts
    },
    { 
      id: 'socket_screws', 
      title: 'Vít Lục giác chìm (Socket Screws)', 
      prefix: 'SOC', 
      count: 12, 
      desc: 'DIN 912. Đầu lục giác chìm giúp lắp ráp chính xác trong không gian hẹp.',
      imgPool: images.socket_screws
    },
    { 
      id: 'wood_screws', 
      title: 'Vít Gỗ & Ván dăm (Wood Screws)', 
      prefix: 'WOD', 
      count: 10, 
      desc: 'Mạ kẽm vàng, hình học ren tối ưu để bắt vít nhanh mà không cần khoan mồi.',
      imgPool: images.wood_screws
    },
    { 
      id: 'tapping', 
      title: 'Vít Tự khoan (Self-Tapping)', 
      prefix: 'TAP', 
      count: 10, 
      desc: 'Thép cứng cho kim loại tấm và nhôm định hình. Có sẵn long đen EPDM.',
      imgPool: images.tapping
    },
    { 
      id: 'anchors', 
      title: 'Bu lông Nở & Neo (Anchors)', 
      prefix: 'ANC', 
      count: 10, 
      desc: 'Nở sắt chịu tải trọng nặng, nở đạn và hệ thống hóa chất cấy thép.',
      imgPool: images.anchors
    },
    { 
      id: 'nuts_washers', 
      title: 'Đai ốc & Long đen (Nuts & Washers)', 
      prefix: 'NUT', 
      count: 10, 
      desc: 'Đai ốc lục giác DIN 934, đai ốc khóa Nylon và long đen phẳng kết cấu (DIN 125).',
      imgPool: images.nuts_washers
    }
  ];

  // --- Vòng lặp tạo trang ---
  categories.forEach(cat => {
    // 1. Tạo trang giới thiệu danh mục (Category Intro)
    const categoryStartPage = pageCounter;
    pages.push({
        id: pageCounter++,
        title: cat.title,
        section: cat.title,
        type: 'standard',
        image: cat.imgPool[0], // Dùng ảnh đầu tiên làm bìa chương
        content: `CHƯƠNG: ${cat.title}\n\n${cat.desc}\n\nXem trang kế tiếp để biết danh sách chi tiết sản phẩm.`
    });

    // Chuẩn bị dữ liệu cho trang Bảng (Table Page) và các trang chi tiết
    const tableRows = [];
    const detailPages: CatalogPage[] = [];
    
    // Trang bảng sẽ nằm ngay sau trang bìa chương
    const tablePageId = pageCounter++; 

    // Tạo các trang chi tiết và thu thập dữ liệu cho bảng
    for (let i = 0; i < cat.count; i++) {
        const itemNum = i + 1;
        const currentId = pageCounter++; // ID cho trang chi tiết
        
        // Thuộc tính giả lập
        const sizeM = 4 + (i % 8) * 2; // M4, M6, M8...
        const length = 10 + (i % 10) * 5; // 10mm, 15mm...
        const material = i % 3 === 0 ? "Inox 316 (A4)" : (i % 3 === 1 ? "Inox 304 (A2)" : "Thép Carbon 8.8");
        const finish = i % 2 === 0 ? "Mộc (Plain)" : "Mạ Kẽm (Zinc)";
        const model = `WC-${cat.prefix}-${1000 + itemNum}`;

        // Thêm vào dữ liệu bảng
        tableRows.push({
            model: model,
            size: `M${sizeM} x ${length}mm`,
            material: material,
            finish: finish,
            refPage: currentId
        });

        // Tạo trang chi tiết sản phẩm
        const image = cat.imgPool[i % cat.imgPool.length];
        detailPages.push({
            id: currentId,
            title: `Chi tiết: ${cat.title} - ${model}`,
            section: cat.title,
            type: 'standard',
            image: image, 
            content: `
              ${cat.desc}
              
              Thông số kỹ thuật sản phẩm:
              - Mã sản phẩm: ${model}
              - Kích thước: M${sizeM} x ${length}mm
              - Vật liệu: ${material}
              - Bề mặt: ${finish}
              - Bước ren: ${sizeM <= 6 ? '0.8mm' : '1.25mm'}
              - Độ bền kéo: ${i % 3 === 2 ? '800 N/mm²' : '700 N/mm²'}

              Ứng dụng:
              Lý tưởng cho ${cat.id === 'wood_screws' ? 'lắp ráp đồ gỗ và mộc' : cat.id === 'anchors' ? 'bê tông và xây dựng' : 'máy móc công nghiệp chung và ô tô'}.
            `
        });
    }

    // 2. Tạo trang Danh sách sản phẩm (Table Page)
    pages.push({
        id: tablePageId,
        title: `Danh mục sản phẩm: ${cat.title}`,
        section: cat.title,
        type: 'table',
        content: `Bảng danh sách các mã sản phẩm thuộc nhóm ${cat.title}.`,
        tableRows: tableRows
    });

    // 3. Đưa các trang chi tiết vào mảng chính
    pages.push(...detailPages);

    // Thêm vào Mục lục (TOC)
    toc.push({
        id: cat.id,
        title: cat.title,
        pageNumber: categoryStartPage,
        children: [
            { id: `${cat.id}_list`, title: 'Danh sách sản phẩm', pageNumber: tablePageId },
            { id: `${cat.id}_start`, title: 'Chi tiết bắt đầu', pageNumber: tablePageId + 1 }
        ]
    });
  });

  // --- Trang cuối: Thông số kỹ thuật ---
  pages.push({
    id: pageCounter,
    title: "Phụ lục Kỹ thuật",
    section: "Phụ lục",
    type: 'standard',
    image: images.appendix,
    content: "Bảng lực siết, thành phần vật liệu và biểu đồ khả năng chịu tải."
  });
  toc.push({ id: 'appendix', title: 'Thông số Kỹ thuật', pageNumber: pageCounter });

  return { pages, toc };
};

const generatedData = generateCatalogData();

export const CATALOG_PAGES: CatalogPage[] = generatedData.pages;
export const TOC_ITEMS: TableOfContentsItem[] = generatedData.toc;
