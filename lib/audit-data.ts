export interface AuditItem {
  id: string
  title: string
  description: string
  priority: "P1" | "P2" | "P3" | "P4"
  area: "Facility" | "Records" | "Compliance" | "Animal Welfare"
  sourceCode: string // P1-Facility2, P1-Records10 등
  isRepeatIssue?: boolean
  actionRequired?: string
  relatedSources?: string[] // 반복지적인 경우 관련된 다른 소스들
}

export interface Category {
  id: string
  title: string
  icon: string
  color: string
  items: AuditItem[]
}

export interface RequiredDocument {
  id: string
  title: string
  description: string
}

export const categories: Category[] = [
  {
    id: "water-lss",
    title: "수질 및 생명유지시스템(LSS)",
    icon: "🌊",
    color: "#87CEEB",
    items: [
      {
        id: "w1",
        title: "신규 해수 수질 검사 강화",
        description:
          "현재 검사가 거의 이루어지지 않고 기록도 없는 상태입니다. 해수가 입고될 때마다 최소한 DO(용존산소), 염도, pH, 암모니아, 수온을 측정하고, 중금속 검사는 연 2회 유지해야 합니다. 모든 결과는 OERCA에 업로드해야 합니다.",
        priority: "P1",
        area: "Facility",
        sourceCode: "P1-Facility2",
        actionRequired: "해수 수질 검사 기록표 따로 만들어야 합니다.",
      },
      {
        id: "w2",
        title: "인공 해염 비축",
        description:
          "현재 비상용 인공 해염 재고가 거의 없는 상태입니다. 외부 업체로부터 해수를 공급받고 있는데, 공급이 지연되거나 수질이 불량할 경우(예: 염도 저하)에 대비해 인공 해염을 충분히 확보해 두어야 합니다.",
        priority: "P1",
        area: "Facility",
        sourceCode: "P1-Facility2",
      },
      {
        id: "w3",
        title: "입고 해수 여과 시스템 구축",
        description:
          "현재 새로 들어오는 해수에 순환 및 여과 장치가 전혀 없습니다. 병원균이나 유해 화학물질 제거를 위해 UV, 오존, 기계적 여과, 화학적 여과를 포함한 여과 시스템을 설치해야 합니다.",
        priority: "P1",
        area: "Facility",
        sourceCode: "P1-Facility2",
      },
      {
        id: "w4",
        title: "TGP 수치 개선 (맹그로브/비치/레이풀)",
        description:
          "해당 세 곳의 TGP(총가스압)가 기준치인 103%를 초과하고 있습니다. 현재 폭기(aeration)를 추가했으나 아직 기준 이하로 내려오지 않은 상태로, LSS(생명유지시스템) 차원의 추가 조치가 필요합니다.",
        priority: "P1",
        area: "Facility",
        sourceCode: "P1-Facility2",
      },
      {
        id: "w5",
        title: "UV 램프 작동 상태 점검 및 개선",
        description:
          "일부 UV 유닛의 램프가 작동하지 않는 상태로 감사 중 발견되었습니다. 모든 UV 램프가 항상 정상 작동하는지 확인해야 하며, 투명 커버가 너무 어두워 직원들이 육안으로 확인하기 어려운 경우 즉시 교체해야 합니다. 장기적으로는 유지보수 및 점검이 용이한 대형 단일 유닛으로 교체하는 것을 권장합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare6",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance22", "P4-Facility1"],
      },
      {
        id: "w6",
        title: "Mangrove 및 Raypool 탱크 구리 농도 저감",
        description:
          "Mangrove 탱크는 Raypool과 연결되어 있으며 여전히 구리 농도가 높아 연골어류를 수용하기에 적합하지 않습니다. 탄소 여과 및 수질 교체로 일부 개선되었으나 아직 충분하지 않습니다. Cuprasorb를 신속히 확보하여 구리 농도가 안전한 수준에 도달할 때까지 지속적으로 사용해야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare6",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance9"],
      },
      {
        id: "w7",
        title: "조류/포유류 수조 LSS 시스템 개선",
        description:
          "일부 LSS(생명유지시스템)가 해당 종에게 적합한 수질 및 공기 질을 제공하기에 부족합니다. 특히 조류와 포유류 수조에서 수질 및 공기 질 문제가 지속되고 있으며 이전 감사에서도 반복 지적된 사항입니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance22",
        isRepeatIssue: true,
      },
      {
        id: "w8",
        title: "Ocean Kingdom ORP 프로브 설치 검토",
        description:
          "두 번째 ORP 프로브가 오존 발생기에 추가되었으나 소형 펌프를 통해 급수되는 구조입니다. 이 펌프가 고장날 경우 오존 제어 불량 및 DO 알람 손실로 이어질 수 있습니다. 유량계(flow meter)를 설치하여 직원들이 매일 점검 시 정상 급수 여부를 쉽게 확인할 수 있도록 개선해야 합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare7",
        relatedSources: ["P3-Compliance22"],
      },
      {
        id: "w9",
        title: "LSS 구역 청결 개선",
        description:
          "이전 복지 감사에서 반복 지적된 사항으로, LSS(생명유지시스템) 구역의 청결 상태 개선이 필요합니다.",
        priority: "P4",
        area: "Facility",
        sourceCode: "P4-Facility1",
        isRepeatIssue: true,
      },
      {
        id: "w10",
        title: "펭귄 전시관 LSS 여과기 링 클램프 교체",
        description:
          "펭귄 전시관 LSS 여과기 상단의 링 클램프에 심각한 녹 발생이 확인되었습니다. 해당 부품이 파손될 경우 전시 수조 배수 및 LSS 실 침수로 이어질 수 있으며, 이는 시설 내 모든 동물에게 영향을 미칠 수 있는 잠재적 위험 요소입니다. 즉각적인 교체가 필요합니다.",
        priority: "P4",
        area: "Facility",
        sourceCode: "P4-Facility1",
      },
      {
        id: "w11",
        title: "UV 램프 관리 개선 및 대형 유닛으로 교체",
        description:
          "현재 50개 이상의 소형 UV 유닛을 운용 중으로, 항상 다수의 램프가 작동하지 않는 상태이며 유지보수에 막대한 인력이 소요되고 있습니다. 소형 유닛들을 대형 단일 유닛으로 교체하고, 어두워진 엔드캡은 즉시 교체하여 직원들이 램프 작동 여부를 쉽게 확인할 수 있도록 해야 합니다.",
        priority: "P4",
        area: "Facility",
        sourceCode: "P4-Facility1",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance22", "P3-Animal Welfare6"],
      },
      {
        id: "w12",
        title: "전시관별 DO/pH 일일 기록 OERCA 입력",
        description:
          "현재 대부분의 환경 기록이 OERCA에 입력되고 있으나, 각 전시관의 일일 DO(용존산소) 및 pH 측정값이 OERCA에 입력되지 않고 있으며, 이는 정기적으로 반드시 입력되어야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records2",
      },
      {
        id: "w13",
        title: "전 수조 TGP 주 1회 측정",
        description:
          "현재 TGP(총가스압) 측정은 수심 1m 이상의 일부 수조에서만 이루어지고 있습니다. 수심에 관계없이 모든 수조에서 주 1회 TGP 측정이 실시되어야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records2",
      },
      {
        id: "w14",
        title: "OERCA 경보 기준값 조정",
        description:
          "현재 OERCA에 설정된 일부 수질 항목의 상·하한 경보 범위가 지나치게 넓어 동물 안전을 위한 적시 경보가 발생하지 않을 수 있습니다. pH를 비롯한 각 항목의 경보 범위를 보다 좁은 범위로 조정하여야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records2",
      },
      {
        id: "w15",
        title: "악어 및 이구아나 수조 공기 공급 히터 설치",
        description:
          "겨울철 외부 공기가 너무 차가워 직원들이 환기량을 줄이게 되고, 이로 인해 진균(곰팡이) 수치가 높아지는 문제가 반복되고 있습니다. 공기 공급 라인에 히터를 설치하여 겨울철에도 적절한 환기량을 유지할 수 있도록 해야 합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance22",
        relatedSources: ["P3-Animal Welfare6"],
      },
      {
        id: "w16",
        title: "신규 유입 해수 수질 기록 추가",
        description:
          "새로 유입되는 해수에 대한 수질 검사 결과를 측정하고 OERCA에 기록하여야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records2",
        actionRequired: "해수 수질 검사 기록표 따로 만들어야 합니다.",
      },
    ],
  },
  {
    id: "data-management",
    title: "데이터 및 개체 관리",
    icon: "📊",
    color: "#DDA0DD",
    items: [
      {
        id: "d1",
        title: "센서스(재고) 데이터 정확성 개선",
        description:
          "현재 월 평균 폐사 수가 약 12마리로 보고되고 있으나, 전체 사육 개체 수가 7,000마리 이상임을 감안하면 실제 수치는 더 높을 가능성이 있습니다. 센서스 데이터에 누락된 종이 있고, 번식 seahorse(6개월 이상 된 개체)처럼 OERCA에 등록되지 않은 동물들도 있습니다.",
        priority: "P1",
        area: "Records",
        sourceCode: "P1-Records10",
        isRepeatIssue: true,
        relatedSources: ["P2-Records3", "P2-Compliance26"],
      },
      {
        id: "d2",
        title: "폐사 데이터 검토 및 재발 방지 프로세스 구축",
        description:
          "Piranha 및 Red Garra의 대량 폐사 사건이 있었음에도 불구하고 원인 분석이나 재발 방지 조치가 이루어지지 않았습니다. 폐사 사건 발생 시 데이터를 체계적으로 수집·검토하고, 원인을 파악하여 재발을 막기 위한 학습 및 개선 절차를 반드시 마련해야 합니다.",
        priority: "P1",
        area: "Records",
        sourceCode: "P1-Records10",
        isRepeatIssue: true,
        actionRequired:
          "폐사보고서에 폐사 개체에 대한 문제상황 및 개선방안 추가 필요합니다.",
      },
      {
        id: "d3",
        title: "번식 개체 OERCA 즉시 등록",
        description:
          "SEALIFE 번식 기준에 따라 번식 개체(예: seahorse)는 태어날 때 즉시 OERCA에 등록해야 합니다. 그러나 이전 감사에서 수차례 지적되었음에도 이전 감사 이전에 태어난 seahorse조차 여전히 등록되지 않은 상태입니다. 반기 센서스 때까지 기다려서는 안 됩니다.",
        priority: "P2",
        area: "Records",
        sourceCode: "P2-Records3",
        isRepeatIssue: true,
        relatedSources: ["P2-Compliance26", "P3-Compliance9"],
      },
      {
        id: "d4",
        title: "센서스 정확도 개선",
        description:
          "일부 수조에서 실제 개체 수와 센서스 기록이 일치하지 않으며, 특정 종(예: Pineapple Fish)이 아예 누락된 사례도 있습니다. 모든 수조의 개체 수와 종 목록을 재확인하고 정확하게 기록해야 합니다.",
        priority: "P2",
        area: "Records",
        sourceCode: "P2-Records3",
        isRepeatIssue: true,
        relatedSources: ["P2-Compliance26", "P1-Records10"],
      },
    ],
  },
  {
    id: "animal-welfare",
    title: "동물 복지 및 환경 풍부화",
    icon: "🐧",
    color: "#A8D5BA",
    items: [
      {
        id: "a1",
        title: "과밀 수조 및 테마 환경 개선",
        description:
          "Red tail Catfish, Penguin 수조 등 과밀 상태인 수조를 개선해야 합니다. 또한 Rainbow Lounge, Mangrove, Partition Oceanarium의 Wobbegong 수조 등 일부 수조에 적절한 테마 환경이 부족합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance9",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance7", "P3-Animal Welfare4"],
      },
      {
        id: "a2",
        title: "이구아나/펭귄/악어 수조 공기 순환 개선",
        description:
          "해당 수조들의 공기 질이 불량하며 특히 진균(곰팡이) 수치가 높습니다. 추운 계절에도 충분한 공기 순환이 이루어질 수 있도록 히터 설치를 포함한 환기 시스템 개선이 필요합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance9",
        relatedSources: ["P3-Animal Welfare6"],
      },
      {
        id: "a3",
        title: "악어 수조 적합성 검토",
        description:
          "현재 악어 수조는 해당 동물을 수용하기에 너무 작아 복지 기준에 부적합합니다. 보다 적절한 환경으로의 개선이 필요합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance9",
        relatedSources: ["P3-Animal Welfare8"],
      },
      {
        id: "a4",
        title: "Seahorse 치어 먹이 문제 해결 및 번식 중단",
        description:
          "현재 Seahorse 치어에게 적합한 먹이가 제공되지 않고 있습니다. 먹이 문제가 해결될 때까지 번식을 중단해야 하며, 번식이 재개될 경우 태어나는 즉시 OERCA에 등록해야 합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance9",
      },
      {
        id: "a5",
        title: "물범 전시 조명 조정",
        description:
          "스테이지 및 풀 구역의 조명이 너무 밝아 씰이 프레젠테이션 중 눈을 찡그리는 현상이 관찰되었으며, 기존에 있는 눈 문제를 더욱 악화시킬 수 있습니다. 조명 밝기를 낮추고 위치를 재조정해야 합니다. 장기적으로는 메탈 할라이드 조명보다 눈부심이 적은 형광등 계열의 부드러운 조명으로 교체하는 것을 권장합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare10",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance7"],
      },
      {
        id: "a6",
        title: "Rainbow Lounge 테마 환경 개선",
        description:
          "Rainbow Lounge 수조의 테마 환경이 부족합니다. 환경 개선과 함께 아크릴 패널에 단방향 필름을 부착하여 동물이 관람객을 인식하지 못하도록 함으로써 스트레스를 줄여야 합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance7",
      },
      {
        id: "a7",
        title: "Wobbegong 환경 개선 또는 이동",
        description:
          "Partition 탱크의 Wobbegong은 숨을 수 있는 테마 환경이 전혀 없어 배수구에 숨으려는 행동이 관찰되었습니다. 적절한 테마 환경(은신처 등)을 추가하거나 더 적합한 수조로 이동시켜야 합니다.",
        priority: "P3",
        area: "Compliance",
        sourceCode: "P3-Compliance7",
        relatedSources: ["P3-Animal Welfare8"],
      },
      {
        id: "a8",
        title: "과밀 및 부적합 수조 동물 재입양 지속 추진",
        description:
          "크로코다일, 펭귄, 액솔로틀, Pacu, 스톤피쉬, Red Tail Catfish 등 수조가 너무 작거나 과밀 상태인 동물들의 재입양을 지속적으로 추진해야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare4",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance7", "P3-Compliance9"],
      },
      {
        id: "a9",
        title: "Gallery 탱크 Cleaner Wrasse 개체 수 감소",
        description:
          "Batfish와 함께 있는 Gallery 탱크의 Cleaner Wrasse를 현재 4마리에서 1마리로 줄여야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare4",
        isRepeatIssue: true,
      },
      {
        id: "a10",
        title: "LSS 섬프 내 어류 전체 제거",
        description:
          "현재 LSS 섬프 안에 어류가 있는 상태로, 이는 적절하지 않습니다. 섬프 내 모든 어류를 제거해야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare4",
        isRepeatIssue: true,
      },
      {
        id: "a11",
        title: "Red Tail Catfish 및 펭귄 수조 개체 수 감소",
        description:
          "Red Tail Catfish 및 펭귄 수조는 여전히 과밀 상태입니다. 적정 수준으로 개체 수를 줄여야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare4",
        isRepeatIssue: true,
        relatedSources: ["P3-Compliance7", "P3-Compliance9"],
      },
      {
        id: "a12",
        title: "악어 재입양 문제 해결",
        description:
          "악어가 현재 수조에 비해 너무 크게 성장하여 복지 기준에 부적합합니다. 재입양을 지속적으로 시도하고 있으나 계속 실패하고 있는 상태로, 반드시 해결책을 찾아야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare8",
        isRepeatIssue: true,
        relatedSources: ["P3-Animal Welfare4"],
      },
      {
        id: "a13",
        title: "Mangrove 탱크 상어 환경 개선",
        description:
          "Mangrove 탱크의 상어들은 지속적인 고농도 구리, 테마 환경 부족, 일부 개체의 과도한 성장으로 인해 해당 수조에 적합하지 않은 상태입니다. 구리 농도를 낮추고 테마 환경을 추가해야 하며, 수조에 비해 너무 크게 성장한 개체는 더 적합한 환경으로 이동시켜야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare8",
      },
      {
        id: "a14",
        title: "Partition Oceanarium Wobbegong 테마 환경 추가",
        description:
          "Wobbegong이 숨을 수 있는 테마 환경이 전혀 없어 감사 중 배수구에 숨으려는 행동이 관찰되었습니다. 이는 동물에게 심각한 스트레스를 유발할 수 있으므로 은신처 등 적절한 테마 환경을 반드시 추가해야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare8",
        relatedSources: ["P3-Compliance7"],
      },
      {
        id: "a15",
        title: "종별 풍부화 계획 수립",
        description:
          "풍부화 기록이 작성되고 있는 것은 긍정적이며 이전 감사 대비 전반적으로 개선되었습니다. 그러나 기록만으로는 부족하며, 각 종별로 체계적인 풍부화 계획서를 별도로 작성해야 합니다. 계획서에는 각 종에 적합한 풍부화 방법과 목표 등이 포함되어야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records5",
        actionRequired:
          "풍부화 방법과 목표가 담긴 풍부화 계획서가 필요합니다. 풍부화목표, 방법, 종류, 빈도 등을 포함해주세요.",
      },
      {
        id: "a16",
        title: "물범/수달/펭귄 풍부화 계획 및 실행 개선",
        description:
          "현재 물범, 수달, 펭귄의 풍부화가 장난감 2개를 주기적으로 교체하는 수준에 그치는 등 매우 기초적이고 제한적입니다. 풍부화 기록은 작성되고 있으나 공식적인 풍부화 계획서 및 훈련 계획서는 없는 상태입니다. 다음 감사까지 개선되지 않을 경우 P3로 에스컬레이션될 예정입니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare2",
        isRepeatIssue: true,
        actionRequired:
          "풍부화 방법과 목표가 담긴 풍부화 계획서가 필요합니다. 풍부화목표, 방법, 종류, 빈도 등을 포함해주세요.",
      },
      {
        id: "a17",
        title: "수달/물범/펭귄 전시관 테마 및 환경 풍부화 지속 개선",
        description:
          "이전 복지 감사 이후 수달, 물범, 펭귄 전시관의 테마 환경 및 환경 풍부화가 개선되었으나, 지속적인 추가 개선이 필요합니다. 참고용으로 타 시설 전시관 사진이 공유된 바 있으며, 이를 참고하여 비교적 간단하게 적용 가능한 아이디어들을 적극 활용할 것을 권장합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare11",
      },
    ],
  },
  {
    id: "facility-safety",
    title: "시설 보수 및 안전",
    icon: "🛠",
    color: "#F0E68C",
    items: [
      {
        id: "f1",
        title: "수달 물기 행동 문제 해결",
        description:
          "약 12개월째 지속되고 있는 수달의 직원 물기 문제가 아직 해결되지 않았습니다. 수달 물림은 매우 위험할 수 있으며 훈련 및 핸들링 문제를 나타냅니다. 시니어 스태프가 보다 적극적으로 개입하여 직원 안전을 최우선으로 관리해야 하며, 모든 물기 및 아차사고(near miss)를 기록하여 빈도를 모니터링해야 합니다. 수개월 내 해결되지 않을 경우 외부 트레이너의 도움을 받아야 합니다.",
        priority: "P2",
        area: "Compliance",
        sourceCode: "P2-Compliance3",
        isRepeatIssue: true,
        relatedSources: ["P4-Animal Welfare3"],
        actionRequired:
          "수달 바이팅 행동 관련 기록 및 개선 방안 문서만 따로 제작하여 기록 필요합니다.",
      },
      {
        id: "f2",
        title: "안전 관련 미비사항 개선 (전기 안전 및 다이버 접근)",
        description:
          "전기 안전 문제 및 수조 다이버 접근 관련 안전 사항이 이전 감사에서도 지적된 반복 문제입니다. 해당 보고서 전반에 걸쳐 나열된 항목들을 지속적으로 점검하고 개선해 나가야 합니다. 전선 및 코드 위치를 확인해주세요.",
        priority: "P2",
        area: "Compliance",
        sourceCode: "P2-Compliance3",
        isRepeatIssue: true,
        relatedSources: ["P4-Animal Welfare15"],
      },
      {
        id: "f3",
        title: "Gallery BOH 구역 전반적인 보수 작업",
        description:
          "Gallery 섹션의 BOH(백오피스) 구역 다수에 걸쳐 대규모 보수가 필요합니다. 구체적으로 조명 교체, 수조 뚜껑 또는 점프 방지 장벽 설치, 수조 위 벽면의 벗겨지는 페인트 제거 및 보수, 녹이 슬거나 페인트가 떨어지는 노후 조명 교체가 필요합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare14",
        isRepeatIssue: true,
      },
      {
        id: "f4",
        title: "Partition 탱크 위 Ocean Kingdom 통로 박리 페인트 제거 및 보수",
        description:
          "Partition 탱크 위 통로의 노란 페인트가 벗겨지고 있습니다. 페인트 조각이 수조 안으로 떨어져 동물이 섭취할 위험이 있으므로 신중하게 제거하고 보수해야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare14",
      },
      {
        id: "f5",
        title: "물범 풀 벽면 박리 페인트 제거 및 보수",
        description:
          "물범 풀 벽면의 코팅이 벗겨지고 있습니다. 물범은 이물질을 자주 삼키는 습성이 있어 매우 위험할 수 있습니다. 리노베이션 당시 새로 시공한 코팅임에도 불구하고 이미 손상이 발생하고 있으므로 빠른 보수가 필요합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare14",
      },
      {
        id: "f6",
        title: "수달/악어/이구아나 수조 환기 개선",
        description:
          "해당 수조들의 진균(곰팡이) 수치가 높으며, 따뜻한 계절에는 수치가 낮아지는 것으로 보아 환기 부족이 주요 원인임을 알 수 있습니다. 히터를 설치하여 적정 온도를 유지하면서 신선한 외부 공기의 유입을 늘려야 합니다.",
        priority: "P3",
        area: "Animal Welfare",
        sourceCode: "P3-Animal Welfare6",
        relatedSources: ["P3-Compliance22"],
      },
      {
        id: "f7",
        title: "전 시설 직원 및 다이버 접근 환경 개선",
        description:
          "다수의 전시관에서 직원 접근 환경이 열악하고 안전하지 않은 것으로 확인되었습니다. 개선이 필요한 전시관: 펭귄 수조, Posco 수조, 악어 수조, 피라루크 수조, 레이크 수조. 해당 구역에 대한 다이버 및 직원의 안전한 접근 환경 확보가 시급히 필요합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare15",
        isRepeatIssue: true,
      },
    ],
  },
  {
    id: "nutrition-health",
    title: "영양 및 건강 관리",
    icon: "🥗",
    color: "#E8B4B8",
    items: [
      {
        id: "n1",
        title: "전 시설 영양 검토 및 영양 계획 수립/시행",
        description:
          "이전 복지 감사에서 지적된 사항으로, 전 시설 영양 검토 및 모든 종·전시관별 영양 계획 수립과 시행이 요구되었습니다. 현재 검토가 진행 중이나 완료되지 않았으며, 완료된 일부 항목에서도 오류가 발견되어 수정이 필요합니다. 다음 감사 전까지 해결하지 못할 경우 P3로 에스컬레이션될 예정입니다.",
        priority: "P4",
        area: "Compliance",
        sourceCode: "P4-Compliance19",
        isRepeatIssue: true,
        relatedSources: ["P4-Animal Welfare5", "P4-Records4"],
        actionRequired: "영양계획 업데이트 필요합니다.",
      },
      {
        id: "n2",
        title: "연골어류 보충제 적정 투여",
        description:
          "현재 시설 내 연골어류(상어·가오리류)에 대한 보충제 투여가 제조사 권장 기준에 미치지 못하고 있습니다. 그 결과 맹그로브 전시관 상어에서 갑상선종이 발생하였습니다. 보충제가 매 급이 시마다 투여되어야 함에도 불구하고 주 1회만 투여되고 있었습니다. 시설 내 보충제 재고가 부족한 상태로, 적정 투여량 확보 및 즉각적인 재고 보충이 필요합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare5",
        relatedSources: ["P4-Compliance19"],
      },
      {
        id: "n3",
        title: "물범 안구 건강 관리 강화",
        description:
          "물범의 눈 치료를 대부분의 경우 수행할 수 있게 된 것은 긍정적입니다. 이 훈련을 지속하는 동시에, 안과 전문의가 최소 연 1회 방문하여 물범의 안구 건강을 평가할 수 있도록 예산을 확보하고 관련 훈련을 준비해야 합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare3",
      },
      {
        id: "n4",
        title: "훈련 기록 상세화 및 훈련 방향 개선",
        description:
          "현재 훈련 기록이 작성되고 있으나 내용이 지나치게 간략합니다. 케이지 훈련, 촉진 검사, 구강 검사 등 실질적인 건강 평가에 활용 가능한 기술을 중심으로 훈련 수준을 높여야 합니다. 특히 물범의 눈 치료 훈련을 지속하고, 물범 2마리를 스테이지 프레젠테이션에 참여시키는 훈련을 진행해야 합니다. 미숙한 개체 및 기술을 우선적으로 집중 훈련하는 방향으로 전환이 필요합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records6",
        actionRequired:
          "트레이닝 기록이 상세하지 않습니다. 트레이닝계획, 결과, 미숙한 개체에 대한 개선방안과 결과 등 상세한 기록이 필요합니다. 특히 물범들 중 무대에 올라오지 않는 개체들은 따로 기록해주세요.",
      },
      {
        id: "n5",
        title: "영양 계획 완성 및 데이터 정확성 확보",
        description:
          "Kerry와 함께 전시장 전체 영양 검토를 진행한 것은 긍정적이나 아직 완료되지 않은 상태이며, 완료된 섹션에서도 다수의 오류가 발견되었습니다. 이전 감사에서도 반복 지적된 지속적인 미해결 사항으로, 다음 감사 전까지 해결하지 못할 경우 P3로 에스컬레이션될 예정입니다. 모든 영양 계획을 마무리하고 데이터 정확성을 반드시 확보해야 합니다.",
        priority: "P4",
        area: "Records",
        sourceCode: "P4-Records4",
        isRepeatIssue: true,
        relatedSources: ["P4-Compliance19", "P4-Animal Welfare5"],
      },
      {
        id: "n6",
        title: "훈련 수준 지속 개선 및 훈련 계획서 수립",
        description:
          "펭귄, 물범, 수달에 대한 훈련 및 기록이 이루어지고 있는 것은 긍정적이나 여전히 기초적인 수준입니다. 케이지 훈련, 촉진 검사, 구강 검사 등 실질적인 건강 평가에 활용 가능한 기술을 중심으로 훈련 수준을 높여야 합니다. 또한 모든 관련 동물에 대한 공식 훈련 계획서를 수립해야 합니다.",
        priority: "P4",
        area: "Animal Welfare",
        sourceCode: "P4-Animal Welfare3",
        actionRequired:
          "트레이닝 기록이 상세하지 않습니다. 트레이닝계획, 결과, 미숙한 개체에 대한 개선방안과 결과 등 상세한 기록이 필요합니다. 특히 물범들 중 무대에 올라오지 않는 개체들은 따로 기록해주세요.",
      },
    ],
  },
]

export const requiredDocuments: RequiredDocument[] = [
  {
    id: "doc1",
    title: "행동풍부화 기록 문서",
    description: "행동풍부화 계획, 목표, 방법, 종류, 빈도 등을 포함",
  },
  {
    id: "doc2",
    title: "폐사보고서 상세화",
    description: "폐사 개체에 대한 문제상황 및 개선방안 추가",
  },
  {
    id: "doc3",
    title: "수달 바이팅 행동 기록문서",
    description: "행동기록 및 개선방안",
  },
  {
    id: "doc4",
    title: "미출연 물범 개체 기록",
    description:
      "무대로 나오지 않는 물범 2마리에 대한 트레이닝 계획, 결과, 개선방안",
  },
  {
    id: "doc5",
    title: "전체 트레이닝 기록 문서",
    description:
      "모든 트레이닝 시행 개체의 상세한 기록 (계획, 결과, 특이사항 등)",
  },
  {
    id: "doc6",
    title: "자연해수 수질 테스트 기록표",
    description: "신규 유입 해수 수질 검사 결과 기록",
  },
  {
    id: "doc7",
    title: "영양계획 업데이트",
    description:
      "Part.1 완료 및 승인됨. 영양강화 품목 추가사항 기재 필요 (특히 연골어류 영양제)",
  },
]
