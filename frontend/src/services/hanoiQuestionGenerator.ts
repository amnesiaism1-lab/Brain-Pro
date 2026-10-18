import { 
  IHanoiQuestion, 
  PracticalGameMode, 
  HANOI_COGNITIVE_GRAPH,
  IPersonalAnchor
} from '@brain-exercises/shared';

const { corridors, nodes, cells, destinations } = HANOI_COGNITIVE_GRAPH;

// Utility to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate Mode A: Chuỗi trục "Một đường nhiều tên"
export function generateCorridorChainQuestion(level: number): IHanoiQuestion {
  const corridor = corridors[Math.floor(Math.random() * corridors.length)];
  const seq = corridor.streetSequence;
  
  // Pick an index from 0 to length - 2
  const idx = Math.floor(Math.random() * (seq.length - 1));
  const currentStreet = seq[idx];
  const nextCorrectStreet = seq[idx + 1];

  // Distractors from other corridors or different positions
  const otherStreets = corridors
    .flatMap(c => c.streetSequence)
    .filter(s => s !== nextCorrectStreet && s !== currentStreet);
  
  const shuffledDistractors = shuffleArray(Array.from(new Set(otherStreets))).slice(0, 3);
  const allChoices = shuffleArray([nextCorrectStreet, ...shuffledDistractors]);

  return {
    id: `q-corridor-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'corridor_chain',
    level,
    title: 'Chuỗi Trục Xuyên Tâm: Một Đường Nhiều Tên',
    prompt: `Bạn đang đi thẳng trên trục "${corridor.name}". Khi đi hết đoạn đường "${currentStreet}", đoạn thẳng tiếp theo đổi tên thành đường nào?`,
    subPrompt: `Khu vực: ${corridor.districts.join(' - ')} | Hướng: ${corridor.orientation}`,
    contextClues: {
      corridorName: corridor.name,
      district: corridor.districts.join(', ')
    },
    options: allChoices.map(choice => ({
      id: `opt-${choice}`,
      text: choice,
      isCorrect: choice === nextCorrectStreet,
      explanation: choice === nextCorrectStreet
        ? `Chính xác! Thứ tự trên trục là: ${seq.join(' ➔ ')}.`
        : `Chưa đúng. Đi hết "${currentStreet}" sẽ nối thẳng sang "${nextCorrectStreet}".`
    })),
    hint: `Đây là một đường thẳng liên tục nối tiếp nhau qua các ngã tư lớn.`,
    cognitiveLesson: corridor.cognitiveRule
  };
}

// Generate Mode B: Thứ tự giao cắt dọc trục
export function generateCrossStreetOrderQuestion(level: number): IHanoiQuestion {
  const corridorWithCross = corridors.filter(c => c.crossStreetsInOrder && c.crossStreetsInOrder.length >= 3);
  const corridor = corridorWithCross[Math.floor(Math.random() * corridorWithCross.length)];
  const crossList = corridor.crossStreetsInOrder;

  const idx = Math.floor(Math.random() * (crossList.length - 1));
  const currentNode = crossList[idx];
  const nextNode = crossList[idx + 1];
  const correctStreets = nextNode.intersectingStreets.join(' / ');

  const otherNodes = corridors
    .flatMap(c => c.crossStreetsInOrder)
    .filter(n => n.nodeName !== nextNode.nodeName);
  const distractorStreets = shuffleArray(otherNodes).slice(0, 3).map(n => n.intersectingStreets.join(' / '));
  const choices = shuffleArray([correctStreets, ...distractorStreets]);

  return {
    id: `q-cross-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'cross_street_order',
    level,
    title: 'Thứ Tự Giao Cắt Dọc Tuyến',
    prompt: `Bạn đi dọc theo "${corridor.name}". Vừa vượt qua nút "${currentNode.nodeName}", nút giao cắt quan trọng tiếp theo bạn sẽ gặp là gì?`,
    subPrompt: `Trục: ${corridor.name}`,
    contextClues: {
      corridorName: corridor.name,
      intersectionName: currentNode.nodeName
    },
    options: choices.map(choice => ({
      id: `opt-${choice}`,
      text: choice,
      isCorrect: choice === correctStreets,
      explanation: choice === correctStreets
        ? `Đúng! Sau nút "${currentNode.nodeName}" là nút "${nextNode.nodeName}" (cắt ${correctStreets}).`
        : `Chưa đúng. Nút tiếp theo sau "${currentNode.nodeName}" là nút "${nextNode.nodeName}".`
    })),
    hint: `Hình dung thứ tự các giao lộ từ trung tâm đi ra ngoại thành.`,
    cognitiveLesson: `Nhớ các mốc giao cắt theo thứ tự giúp bạn ước lượng quãng đường và biết trước khi nào cần chuẩn bị chuyển làn để rẽ.`
  };
}

// Generate Mode C: Tôi ở ngã tư nào?
export function generateWhichIntersectionQuestion(level: number): IHanoiQuestion {
  const validNodes = nodes.filter(n => n.connectedStreets.length >= 2);
  const targetNode = validNodes[Math.floor(Math.random() * validNodes.length)];
  
  // Pick 2 connected streets
  const shuffledStreets = shuffleArray(targetNode.connectedStreets);
  const st1 = shuffledStreets[0];
  const st2 = shuffledStreets[1];

  const otherNodes = validNodes.filter(n => n.id !== targetNode.id);
  const distractorNodes = shuffleArray(otherNodes).slice(0, 3);
  const choiceNodes = shuffleArray([targetNode, ...distractorNodes]);

  return {
    id: `q-which-node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'which_intersection',
    level,
    title: 'Tôi Đang Ở Ngã Tư Nào?',
    prompt: `Bạn đang dừng đèn đỏ tại điểm giao cắt giữa 2 phố: "${st1}" và "${st2}". Bạn đang đứng ở nút giao nào?`,
    subPrompt: `Quận: ${targetNode.district} ${targetNode.folkName ? `(${targetNode.folkName})` : ''}`,
    contextClues: {
      district: targetNode.district,
      intersectionName: targetNode.name
    },
    options: choiceNodes.map(node => ({
      id: `opt-${node.id}`,
      text: `${node.name} (${node.district})`,
      subText: node.folkName ? `Tên quen gọi: ${node.folkName}` : undefined,
      isCorrect: node.id === targetNode.id,
      explanation: node.id === targetNode.id
        ? `Chính xác! Nút giao ${node.name} là nơi hội tụ của: ${node.connectedStreets.join(', ')}.`
        : `Không phải. Nút ${node.name} gồm các phố: ${node.connectedStreets.join(', ')}.`
    })),
    hint: `Chú ý quận ${targetNode.district} và các công trình giao thông tại đây.`,
    cognitiveLesson: `Kỹ năng định vị tức thì: Khi nghe thấy tên 2 phố giao nhau, não bộ lập tức xác định được nút giao và ô phố tương ứng mà không cần mở bản đồ.`
  };
}

// Generate Mode D: Ô phố & Lối thoát ra trục
export function generateSuperblockCellQuestion(level: number): IHanoiQuestion {
  const cell = cells[Math.floor(Math.random() * cells.length)];
  
  // Question type 1: Bounding streets -> Identify cell
  // Question type 2: Inside landmark -> Pick escape street
  const isTypeLandmark = Math.random() > 0.5 && cell.keyLandmarksInside.length > 0;

  if (isTypeLandmark) {
    const landmark = cell.keyLandmarksInside[Math.floor(Math.random() * cell.keyLandmarksInside.length)];
    const correctExit = cell.primaryExits[0] || cell.boundingStreets[0];
    
    const otherCellsExits = cells
      .filter(c => c.id !== cell.id)
      .flatMap(c => c.primaryExits);
    const distractors = shuffleArray(Array.from(new Set(otherCellsExits))).slice(0, 3);
    const choices = shuffleArray([correctExit, ...distractors]);

    return {
      id: `q-cell-exit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      mode: 'superblock_cell',
      level,
      title: 'Tư Duy Ô Phố: Lối Thoát Ra Trục Chính',
      prompt: `Bạn đang ở khu vực "${landmark}" (thuộc ${cell.name}). Khi muốn thoát nhanh nhất ra các trục giao thông lớn, con đường thông suốt nào là lối thoát chính của ô phố này?`,
      subPrompt: `Khu dân cư: ${cell.folkNeighborhood}`,
      contextClues: {
        district: cell.district,
        knownLandmark: landmark
      },
      options: choices.map(choice => ({
        id: `opt-${choice}`,
        text: choice,
        isCorrect: choice === correctExit,
        explanation: choice === correctExit
          ? `Chính xác! "${choice}" là một trong các trục gom/lối thoát chính: ${cell.primaryExits.join(', ')} dẫn thẳng ra ${cell.boundingStreets.join(', ')}.`
          : `Chưa tối ưu. Ở ô ${cell.name}, các lối thoát chính gồm: ${cell.primaryExits.join(', ')}.`
      })),
      hint: `Tìm con đường dẫn thẳng ra 4 trục bao quanh: ${cell.boundingStreets.join(' - ')}.`,
      cognitiveLesson: cell.cognitiveStrategy
    };
  }

  // Type: identify bounding streets
  const correctStreetsStr = cell.boundingStreets.join(' - ');
  const otherCells = cells.filter(c => c.id !== cell.id);
  const distractorCells = shuffleArray(otherCells).slice(0, 3);
  const choices = shuffleArray([cell, ...distractorCells]);

  return {
    id: `q-cell-bounds-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'superblock_cell',
    level,
    title: 'Tư Duy Ô Phố: Khung Trục Bao Quanh',
    prompt: `Khu vực "${cell.folkNeighborhood}" (${cell.name}) được bao quanh bởi 4 trục đường chính nào?`,
    subPrompt: `Quận: ${cell.district} | Vùng: ${cell.ringZone}`,
    contextClues: {
      district: cell.district
    },
    options: choices.map(item => ({
      id: `opt-${item.id}`,
      text: item.boundingStreets.join(' - '),
      subText: `Ô ${item.folkNeighborhood}`,
      isCorrect: item.id === cell.id,
      explanation: item.id === cell.id
        ? `Đúng! Ô phố này nằm gọn trong khung: ${correctStreetsStr}.`
        : `Chưa đúng. Khung này là của ô ${item.name}.`
    })),
    hint: `Nhớ rằng mọi ô phố Hà Nội đều được bao bởi 3-4 trục đường lớn có tên.`,
    cognitiveLesson: cell.cognitiveStrategy
  };
}

// Generate Mode E: Giải mã địa chỉ & Ngõ ngách
export function generateAddressDecoderQuestion(level: number): IHanoiQuestion {
  const dest = destinations[Math.floor(Math.random() * destinations.length)];
  const choices = shuffleArray([
    dest.accessStreet,
    ...shuffleArray(destinations.filter(d => d.accessStreet !== dest.accessStreet).map(d => d.accessStreet)).slice(0, 3)
  ]);

  return {
    id: `q-address-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'address_decoder',
    level,
    title: 'Giải Mã Địa Chỉ & Tiếp Cận Đích Đến',
    prompt: `Bạn cần đến "${dest.name}" (Địa chỉ: ${dest.address}). Trục đường tiếp cận chính và vị trí cổng vào nằm trên đường nào?`,
    subPrompt: `Loại địa điểm: ${dest.category} | Quận: ${dest.district}`,
    contextClues: {
      destination: dest.name,
      district: dest.district,
      addressString: dest.address
    },
    options: choices.map(street => ({
      id: `opt-${street}`,
      text: street,
      isCorrect: street === dest.accessStreet,
      explanation: street === dest.accessStreet
        ? `Chính xác! Cổng vào: ${dest.gatePosition}. Mẹo xe máy: ${dest.motorbikeTip}`
        : `Chưa đúng. Đường tiếp cận chính của ${dest.name} là phố "${dest.accessStreet}".`
    })),
    hint: `Xem kỹ tên đường trong địa chỉ: ${dest.address}.`,
    cognitiveLesson: `Đọc địa chỉ Hà Nội: Số nhà lẻ/chẵn phân bố hai bên đường; địa chỉ cổng chính và cổng phụ (như bệnh viện Bạch Mai cổng Phương Mai vs Giải Phóng) giúp tiết kiệm 15-20 phút quay đầu xe.`
  };
}

// Generate Mode F: Lập tuyến tối ưu A -> B
export function generateRoutePlannerQuestion(level: number): IHanoiQuestion {
  const sampleRoutes = [
    {
      origin: 'Bến xe Mỹ Đình (Nam Từ Liêm)',
      dest: 'Bệnh viện Bạch Mai (Giải Phóng)',
      vehicle: 'motorbike' as const,
      correctRoute: 'Phạm Hùng ➔ Khuất Duy Tiến ➔ Nguyễn Trãi ➔ Ngã Tư Sở ➔ Trường Chinh (VĐ2) ➔ Ngã Tư Vọng ➔ Giải Phóng',
      distractors: [
        'Phạm Hùng ➔ Cầu Thăng Long ➔ Võ Chí Công ➔ Cầu Nhật Tân ➔ Giải Phóng',
        'Phạm Hùng ➔ Cầu Giấy ➔ Kim Mã ➔ Phố Huế ➔ Cầu Vĩnh Tuy ➔ Giải Phóng',
        'Phạm Hùng ➔ Đại Lộ Thăng Long ➔ Ba La Hà Đông ➔ Phùng Hưng ➔ Giải Phóng'
      ],
      lesson: 'Tuyến tối ưu kết hợp Trục Vành đai 3 và Vành đai 2: Đi đường Trường Chinh dưới thấp vừa thông thoáng vừa rẽ thẳng vào đường Giải Phóng.'
    },
    {
      origin: 'Hồ Hoàn Kiếm (Bờ Hồ)',
      dest: 'Aeon Mall Long Biên (Cổ Linh)',
      vehicle: 'motorbike' as const,
      correctRoute: 'Đinh Tiên Hoàng ➔ Trần Nhật Duật ➔ Cầu Chương Dương ➔ Nguyễn Văn Cừ ➔ Cổ Linh',
      distractors: [
        'Đinh Tiên Hoàng ➔ Giảng Võ ➔ Láng Hạ ➔ Lê Văn Lương ➔ Cổ Linh',
        'Đinh Tiên Hoàng ➔ Giải Phóng ➔ Pháp Vân ➔ Cầu Thanh Trì ➔ Cổ Linh',
        'Đinh Tiên Hoàng ➔ Cầu Giấy ➔ Cầu Thăng Long ➔ Đông Anh ➔ Cổ Linh'
      ],
      lesson: 'Vượt sông Hồng từ Phố Cổ sang Long Biên: Cầu Chương Dương là đường ngắn nhất nối trực tiếp sang Nguyễn Văn Cừ rồi rẽ Cổ Linh.'
    },
    {
      origin: 'Đại học Bách Khoa (Đại Cồ Việt)',
      dest: 'Hà Đông (Cầu Trắng Hà Đông)',
      vehicle: 'motorbike' as const,
      correctRoute: 'Đại Cồ Việt ➔ Xã Đàn (VĐ1) ➔ Ô Chợ Dừa ➔ Tây Sơn ➔ Ngã Tư Sở ➔ Nguyễn Trãi ➔ Trần Phú (Hà Đông)',
      distractors: [
        'Đại Cồ Việt ➔ Trần Khát Chân ➔ Cầu Vĩnh Tuy ➔ Long Biên ➔ Hà Đông',
        'Đại Cồ Việt ➔ Giải Phóng ➔ Hoàng Liệt ➔ Cầu Thanh Trì ➔ Hà Đông',
        'Đại Cồ Việt ➔ Phố Huế ➔ Đinh Tiên Hoàng ➔ Cầu Giấy ➔ Hà Đông'
      ],
      lesson: 'Lập tuyến phân cấp: Từ Vành đai 1 (Đại Cồ Việt - Xã Đàn) bắt vào trục xuyên tâm Tây Nam (Tây Sơn - Nguyễn Trãi - Trần Phú) chạy thẳng một mạch đến Cầu Trắng.'
    },
    {
      origin: 'Ngã Tư Sở (Đống Đa)',
      dest: 'Cầu Giấy (Đại học Quốc Gia)',
      vehicle: 'motorbike' as const,
      correctRoute: 'Đường Láng (men theo sông Tô Lịch) ➔ Nút Cầu Giấy ➔ Cầu Giấy ➔ Xuân Thủy ➔ ĐHQG',
      distractors: [
        'Trường Chinh ➔ Giải Phóng ➔ Pháp Vân ➔ ĐHQG',
        'Nguyễn Trãi ➔ Hà Đông ➔ Ba La ➔ Nhổn ➔ ĐHQG',
        'Tây Sơn ➔ Tôn Đức Thắng ➔ Cửa Nam ➔ Long Biên ➔ ĐHQG'
      ],
      lesson: 'Đường Láng là hành lang ven sông Tô Lịch nối thông suốt từ Ngã Tư Sở lên thẳng Cầu Giấy không phải chuyển trục phức tạp.'
    }
  ];

  const routeItem = sampleRoutes[Math.floor(Math.random() * sampleRoutes.length)];
  const choices = shuffleArray([routeItem.correctRoute, ...routeItem.distractors]);

  return {
    id: `q-route-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'route_planner_ab',
    level,
    title: 'Lập Tuyến Tối Ưu A ➔ B',
    prompt: `Bạn đi XE MÁY từ "${routeItem.origin}" đến "${routeItem.dest}". Tuyến đường phân cấp tối ưu và hợp lý nhất là gì?`,
    subPrompt: `Điểm đi: ${routeItem.origin} ➔ Đích: ${routeItem.dest}`,
    contextClues: {
      origin: routeItem.origin,
      destination: routeItem.dest,
      vehicleType: routeItem.vehicle
    },
    options: choices.map(route => ({
      id: `opt-${route}`,
      text: route,
      isCorrect: route === routeItem.correctRoute,
      explanation: route === routeItem.correctRoute
        ? `Tối ưu tuyệt đối! ${routeItem.lesson}`
        : `Tuyến đường này đi vòng quá xa hoặc đi nhầm hướng hoàn toàn.`
    })),
    hint: `Hãy tư duy theo thứ tự: Trục gom ➔ Trục vành đai / Trục hướng tâm ➔ Trục tiếp cận.`,
    cognitiveLesson: routeItem.lesson
  };
}

// Generate Mode G: Bẫy một chiều & Cấm rẽ
export function generateOneWayTrapQuestion(level: number): IHanoiQuestion {
  const traps = [
    {
      location: 'Phố Huế & Bà Triệu (Hai Bà Trưng - Hoàn Kiếm)',
      question: 'Cặp phố song song một chiều nổi tiếng tại khu vực trung tâm có quy ước chiều đi thế nào?',
      correct: 'Phố Huế đi một chiều từ Nam lên Bắc (hướng về Bờ Hồ); Bà Triệu đi một chiều từ Bắc xuống Nam (hướng ra Đại Cồ Việt)',
      distractors: [
        'Bà Triệu đi một chiều từ Nam lên Bắc; Phố Huế đi một chiều từ Bắc xuống Nam',
        'Cả hai phố đều cho phép xe máy đi 2 chiều nhưng cấm ô tô',
        'Phố Huế và Bà Triệu chỉ đi một chiều vào giờ cao điểm'
      ],
      lesson: 'Quy tắc vàng: Phố Huế kéo dài từ Đại Cồ Việt lên Hàng Bài về Bờ Hồ (chiều Hướng Tâm). Bà Triệu từ Tràng Thi/Hồ Gươm đi xuống Đại Cồ Việt (chiều Ly Tâm).'
    },
    {
      location: 'Cầu vượt Ngã Tư Sở & Đường trên cao Vành đai 2',
      question: 'Xe máy di chuyển trên đường Trường Chinh (Vành đai 2) có được phép đi lên đường trên cao (cầu cạn) từ Ngã Tư Sở đến Cầu Vĩnh Tuy không?',
      correct: 'CẤM XE MÁY: Đường trên cao VĐ2 cấm toàn bộ xe máy, người đi bộ và xe thô sơ. Xe máy phải đi ở làn đường mặt đất.',
      distractors: [
        'Được phép đi xe máy trên toàn tuyến đường trên cao với tốc độ tối đa 60 km/h',
        'Chỉ cấm xe máy vào giờ cao điểm (6h-9h và 17h-19h)',
        'Được phép đi xe máy đoạn từ Ngã Tư Sở đến Ngã Tư Vọng'
      ],
      lesson: 'Bẫy phạt phổ biến: Toàn bộ đường cạn trên cao Vành Đai 2 và Vành Đai 3 đều cấm xe máy tuyệt đối. Người đi xe máy chỉ được đi mặt đất hoặc cầu vượt nhẹ.'
    },
    {
      location: 'Hầm chui Kim Liên (Vành đai 1)',
      question: 'Xe máy có được lưu thông qua Hầm chui Kim Liên (nối Xã Đàn ↔ Đại Cồ Việt) không?',
      correct: 'ĐƯỢC PHÉP: Xe máy được phép đi qua hầm Kim Liên ở cả 2 chiều để tránh đèn đỏ ngã 4 Giải Phóng - Lê Duẩn.',
      distractors: [
        'Cấm xe máy hoàn toàn, xe máy bắt buộc phải đi trên mặt đường bằng',
        'Chỉ cho xe máy đi một chiều từ Đại Cồ Việt sang Xã Đàn',
        'Chỉ cho phép xe buýt và ô tô con lưu thông'
      ],
      lesson: 'Hầm chui Kim Liên, hầm Trung Hòa, hầm Thanh Xuân, hầm Lê Văn Lương đều cho phép xe máy lưu thông, giúp xe máy vượt ngã tư lớn mà không cần chờ đèn.'
    }
  ];

  const trap = traps[Math.floor(Math.random() * traps.length)];
  const choices = shuffleArray([trap.correct, ...trap.distractors]);

  return {
    id: `q-trap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'oneway_turn_trap',
    level,
    title: 'Bẫy Một Chiều & Làn Đường Xe Máy',
    prompt: `Tại "${trap.location}": ${trap.question}`,
    subPrompt: `Quy tắc giao thông & Điều hướng xe máy`,
    contextClues: {
      vehicleType: 'motorbike',
      knownLandmark: trap.location
    },
    options: choices.map(choice => ({
      id: `opt-${choice}`,
      text: choice,
      isCorrect: choice === trap.correct,
      explanation: choice === trap.correct
        ? `Chính xác! ${trap.lesson}`
        : `Sai luật giao thông! Hãy ghi nhớ quy tắc này để không bị phạt và tránh đi ngược chiều nguy hiểm.`
    })),
    hint: `Chú ý quy định phân làn giữa xe máy và ô tô trên các tuyến vành đai và hầm vượt.`,
    cognitiveLesson: trap.lesson
  };
}

// Generate Mode H: Luyện tuyến từ Đích cá nhân
export function generatePersonalAnchorQuestion(
  level: number, 
  anchors: IPersonalAnchor[]
): IHanoiQuestion {
  if (!anchors || anchors.length === 0) {
    // Fallback to route planner if no anchors
    return generateRoutePlannerQuestion(level);
  }

  const anchor = anchors[Math.floor(Math.random() * anchors.length)];
  const dest = destinations[Math.floor(Math.random() * destinations.length)];

  // Create question from user anchor to dest
  const correctOption = `Từ "${anchor.customTitle}" (${anchor.nearestStreet}) ➔ thoát ra "${anchor.nearestIntersection}" ➔ bám trục chính ➔ tiếp cận cổng "${dest.name}" trên phố "${dest.accessStreet}".`;
  
  const fakeExit1 = `Đi ngược chiều từ "${anchor.nearestStreet}" ➔ đi thẳng đường gom không ra trục lớn.`;
  const fakeExit2 = `Từ "${anchor.customTitle}" ➔ đi vòng qua Cầu Thanh Trì sang Gia Lâm rồi quay lại "${dest.name}".`;
  const fakeExit3 = `Từ "${anchor.customTitle}" ➔ chạy vào ngõ cụt khu dân cư không ra được "${anchor.nearestIntersection}".`;

  const choices = shuffleArray([correctOption, fakeExit1, fakeExit2, fakeExit3]);

  return {
    id: `q-personal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'personal_anchor_drill',
    level,
    title: `Luyện Tuyến Đích Cá Nhân: ${anchor.customTitle}`,
    prompt: `Từ điểm neo của bạn: "${anchor.customTitle}" (${anchor.nearestStreet}, ${anchor.district}), bạn muốn đi xe máy đến "${dest.name}" (${dest.district}). Chiến lược tiếp cận nào đúng chuẩn phân cấp?`,
    subPrompt: `Điểm neo cá nhân: ${anchor.customTitle} | Nút giao gần nhất: ${anchor.nearestIntersection}`,
    contextClues: {
      origin: anchor.customTitle,
      destination: dest.name,
      intersectionName: anchor.nearestIntersection
    },
    options: choices.map(choice => ({
      id: `opt-${choice}`,
      text: choice,
      isCorrect: choice === correctOption,
      explanation: choice === correctOption
        ? `Xuất sắc! Bạn luôn bắt đầu bằng việc thoát ra nút giao gần nhất (${anchor.nearestIntersection}), lên trục chính rồi tiếp cận cổng (${dest.accessStreet}).`
        : `Lựa chọn này không hợp lý về hướng đi hoặc bị bế tắc trong ngõ.`
    })),
    hint: `Luôn nhớ nguyên lý 3 bước: Thoát ra nút giao gần nhất ➔ Chạy trục chính ➔ Rẽ vào phố tiếp cận đích.`,
    cognitiveLesson: `Đích cá nhân là nơi bạn bắt đầu và kết thúc mỗi ngày. Thuộc các ngã rẽ từ nhà/chỗ làm ra các trục chính giúp bạn không bao giờ bị bỡ ngỡ dù xuất phát đi bất cứ đâu trong thành phố.`
  };
}

// Generate Mode I: Mất GPS - Phục hồi vị trí
export function generateGpsLossRecoveryQuestion(level: number): IHanoiQuestion {
  const scenarios = [
    {
      clue: 'Bạn đi lạc vào một khu dân cư đông đúc. Ngước nhìn lên cao, bạn thấy bóng một tòa tháp kính cao 72 tầng (Keangnam Landmark 72) ở ngay hướng Đông Nam.',
      location: 'Khu dân cư Mễ Trì / Làng Đình Thôn (Nam Từ Liêm)',
      escape: 'Đi về hướng có tòa tháp Keangnam để đâm thẳng ra trục lớn Phạm Hùng (Vành đai 3)',
      distractors: [
        'Đi ngược hướng tòa tháp để chạy về phía Bờ Hồ',
        'Tòa tháp đó là Lotte Liễu Giai, bạn đang ở Ba Đình',
        'Đi men theo đường đất nhỏ để sang Gia Lâm'
      ],
      lesson: 'Mốc Skyline vĩ mô: Keangnam 72 tầng là ngọn hải đăng khổng lồ của toàn khu Tây Nam Từ Liêm / Cầu Giấy. Khi mất GPS, cứ hướng về phía tháp sẽ ra được trục Phạm Hùng.'
    },
    {
      clue: 'Bạn đang đi ven một bờ sông nhỏ thấy dòng sông chảy song song bên tay phải theo hướng Nam, bên kia sông là dãy nhà quận Cầu Giấy, phía trên cao có cầu vượt đường sắt trên cao cắt ngang.',
      location: 'Đường Láng (bờ sông Tô Lịch, đoạn Cầu Giấy - Yên Hòa)',
      escape: 'Bạn đang ở Đường Láng. Cứ đi thẳng xuôi dòng sông Tô Lịch sẽ tới Cầu Hòa Mục (Lê Văn Lương) và Ngã Tư Sở.',
      distractors: [
        'Bạn đang ở đê Sông Hồng đoạn Long Biên',
        'Bạn đang ở đường Kim Mã cạnh hồ Thủ Lệ',
        'Bạn đang ở đê sông Nhuệ đoạn Hà Đông'
      ],
      lesson: 'Biên ranh giới tự nhiên: Sông Tô Lịch chảy dọc Đường Láng từ Bưởi xuống Ngã Tư Sở rồi ra Hoàng Mai. Nhìn thấy sông Tô Lịch bên phải hướng Nam tức bạn đang ở Đường Láng hướng về Ngã Tư Sở.'
    },
    {
      clue: 'Bạn thấy trước mặt là một nhà ga đường sắt trên cao hiện đại với biển tên "Ga Thượng Đình", phía dưới là dòng phương tiện xe máy rất đông.',
      location: 'Đường Nguyễn Trãi (Thanh Xuân), cách Ngã Tư Sở khoảng 500m',
      escape: 'Bạn đang trên trục Nguyễn Trãi hướng về Hà Đông; quay đầu lại 500m là Ngã Tư Sở và Vành đai 2.',
      distractors: [
        'Bạn đang ở đường Cầu Giấy trên tuyến Metro số 3',
        'Bạn đang ở đường Giải Phóng gần ga Giáp Bát',
        'Bạn đang ở đường Hoàng Hoa Thám'
      ],
      lesson: 'Tuyến Metro Cát Linh - Hà Đông chạy dọc trục Tây Sơn - Nguyễn Trãi - Trần Phú - Quang Trung. Ga Thượng Đình nằm sát Ngã Tư Sở và Royal City.'
    }
  ];

  const scen = scenarios[Math.floor(Math.random() * scenarios.length)];
  const choices = shuffleArray([scen.escape, ...scen.distractors]);

  return {
    id: `q-gps-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    mode: 'gps_loss_recovery',
    level,
    title: 'Mất GPS: Phục Hồi Vị Trí Dựa Vào Manh Mối',
    prompt: `Điện thoại hết pin, mất tín hiệu GPS. Manh mối thực tế: "${scen.clue}". Vị trí thực tế và hướng xử lý thoát ra là gì?`,
    subPrompt: `Kỹ năng phục hồi định vị khi mất công nghệ hỗ trợ`,
    contextClues: {
      knownLandmark: scen.location
    },
    options: choices.map(choice => ({
      id: `opt-${choice}`,
      text: choice,
      isCorrect: choice === scen.escape,
      explanation: choice === scen.escape
        ? `Chính xác! ${scen.lesson}`
        : `Phán đoán sai manh mối. Manh mối này xác định bạn ở: ${scen.location}.`
    })),
    hint: `Chú ý các mốc skyline cao tầng, mặt nước hoặc hạ tầng đường sắt trên cao.`,
    cognitiveLesson: scen.lesson
  };
}

// Master Generator by Practical Mode
export function generatePracticalHanoiQuestion(
  mode: PracticalGameMode, 
  level: number,
  personalAnchors?: IPersonalAnchor[]
): IHanoiQuestion {
  switch (mode) {
    case 'corridor_chain':
      return generateCorridorChainQuestion(level);
    case 'cross_street_order':
      return generateCrossStreetOrderQuestion(level);
    case 'which_intersection':
      return generateWhichIntersectionQuestion(level);
    case 'superblock_cell':
      return generateSuperblockCellQuestion(level);
    case 'address_decoder':
      return generateAddressDecoderQuestion(level);
    case 'route_planner_ab':
      return generateRoutePlannerQuestion(level);
    case 'oneway_turn_trap':
      return generateOneWayTrapQuestion(level);
    case 'personal_anchor_drill':
      return generatePersonalAnchorQuestion(level, personalAnchors || []);
    case 'gps_loss_recovery':
      return generateGpsLossRecoveryQuestion(level);
    default:
      return generateCorridorChainQuestion(level);
  }
}
