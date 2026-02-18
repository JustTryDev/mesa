/**
 * 다국어 번역 데이터
 *
 * 비유: 영어-한국어 사전과 같습니다.
 * 같은 키(단어)를 찾으면 현재 언어에 맞는 번역을 돌려줍니다.
 *
 * 구조: translations.ko.hero.title = "한국어 제목"
 *       translations.en.hero.title = "English Title"
 *
 * 왜 이렇게 분리하나요?
 * → 번역을 수정할 때 이 파일만 고치면 됩니다.
 *   코드(디자인)를 건드리지 않고도 텍스트를 바꿀 수 있습니다.
 */

export const translations = {
  ko: {
    // 네비게이션
    nav: {
      about: 'About',
      activities: 'Activities',
      archive: 'Archive',
      notice: 'Notice',
    },

    // 히어로 섹션
    hero: {
      badge: '9th Recruit',
      title: 'MESA',
      subtitle: 'Materials Science & Engineering Study Association',
      description:
        '한양대학교 신소재공학부 학술 동아리',
      descriptionDetail:
        'MESA는 반도체·배터리·디스플레이·철강·기타산업 전체를 아우르는 재료 공학을 탐구하며, 전공이 실제 산업과 진학으로 확장되는 과정을 함께 그려갑니다.',
      scrollDown: '아래로 스크롤',
    },

    // About 섹션
    about: {
      label: 'About MESA',
      title: 'About MESA',
      intro:
        '한양대학교 신소재공학부 학술 동아리입니다.',
      introDetail:
        'Mesa는 반도체·배터리·디스플레이·철강·기타산업 전체를 아우르는 재료 공학을 탐구하며, 전공이 실제 산업과 진학으로 확장되는 과정을 함께 그려갑니다.',
      history:
        '1기부터 8기까지 꾸준히 학술 활동의 맥을 이어오고 있습니다.',
      description:
        'MESA는 함께 고민하고, 경험과 지식을 연결하며, 전공의 본질 위에서 진로를 설계하는 학술동아리입니다.',
      since: 'Since 2018',
      values: [
        {
          title: '혼자가 아닌, 함께 고민하는 구조',
          description:
            '진로가 명확하지 않거나 전공 공부가 막막한 단계에서 비슷한 고민을 가진 사람들과 고민을 공유하고 함께 커리어 방향을 그려가는 네트워크를 만듭니다.',
        },
        {
          title: '경험이 이어지는 성장 구조',
          description:
            '단순 스터디에서 끝나지 않고, 부원들과 선후배 간 연결을 통해 경험을 공유하고 진로를 탐색합니다. 학술 스터디 및 칼럼을 통해 양질의 정보를 공유하여 함께 성장하는 구조를 만듭니다.',
        },
        {
          title: '학문적 이해를 산업과 연구로',
          description:
            '전공 과목에 대한 심도 깊은 이해를 통해 전공이 어떻게 산업과 연결되고 연구에서 적용되는지를 탐색합니다. 학문적 기반을 다져 전공이 다양한 진로로 확장되는 흐름을 이해합니다.',
        },
      ],
    },

    // Programs 섹션
    programs: {
      label: 'Activities',
      title: 'MESA 9th Programs',
      essential: 'Essential Activities',
      additional: 'Additional Activities',
      items: [
        {
          title: '정기회합',
          description:
            '매주 수요일 저녁, 모든 부원이 함께 모여 전공과 진로에 대한 시야를 넓히는 시간을 가집니다. 학술특강, 미니컨퍼런스, 학술발표 등 진로 탐색 및 활동 공유의 장이 됩니다.',
          schedule: '매주 수요일',
        },
        {
          title: '정기 팀 학술 스터디',
          description:
            '관심 분야를 고려하여 팀을 편성해 개인 학술 칼럼 및 팀 프로젝트를 위한 학술 스터디를 진행합니다.',
        },
        {
          title: 'MESA 인사이트 칼럼',
          description:
            '팀 정기 학술 스터디를 통해 습득한 지식과 자료를 바탕으로, 본인이 탐구하고 싶은 세부 주제를 정해 비전공자도 이해할 수 있도록 정리하고 개인의 이해, 해석과 진로탐색 인사이트를 담은 글을 작성합니다.',
        },
        {
          title: '팀 학술 프로젝트',
          description:
            '정기 팀 학술 스터디 팀원들과 함께 한학기마다 공동 학술 프로젝트 활동을 수행합니다.',
        },
        {
          title: 'MESA 학술지 제작',
          description:
            '1년간의 학술 활동을 아카이브하는 학술지를 만듭니다. 학술지는 전원 강제가 아닌 선별·큐레이션 방식으로 제작되며, MESA의 고유 자산으로 남게됩니다.',
        },
        {
          title: '기타 활동',
          description:
            '전공 그룹 스터디, 메라클 모닝/나잇, 진로 세미나, 박람회 단체관람, 네트워킹, MESA 워크숍, 홈커밍데이 등 다양한 학습 습관 향상 및 진로탐색, 친목을 다지는 활동들을 자유롭게 참여할 수 있습니다.',
        },
      ],
    },

    // Archive 섹션
    archive: {
      label: 'Archive',
      title: 'Archive',
      subtitle: 'Materials Science & Engineering Study Association',
      history: '1th ~ 8th , 9th ~ing',
      since: 'Since 2018',
      viewMore: 'View More',
    },

    // Leadership 섹션
    leadership: {
      label: 'MESA 9th Executive',
      title: '9th Leader',
      leaders: [
        { name: '이준서', role: '회장', year: '22학번', department: '신소재공학과', imageUrl: '/image/이준서.jpg' },
        { name: '김헌종', role: '남자 부회장', year: '22학번', department: '신소재공학과', imageUrl: '/image/김훈종.jpg' },
        { name: '심은서', role: '여자 부회장', year: '24학번', department: '신소재공학과', imageUrl: '/image/심은서.jpg' },
        { name: '김도관', role: '총무', year: '22학번', department: '신소재공학과', imageUrl: '/image/김도관.jpg' },
      ],
    },

    // Footer
    footer: {
      contact: 'Contact',
      social: 'Social',
      rights: 'All rights reserved.',
    },

    // 챗봇
    chatbot: {
      title: 'MESA Assistant',
      placeholder: 'MESA에 대해 물어보세요...',
      greeting: '안녕하세요! MESA에 대해 궁금한 점을 물어보세요 :)',
      error: '죄송합니다. 잠시 후 다시 시도해주세요.',
    },
  },

  en: {
    nav: {
      about: 'About',
      activities: 'Activities',
      archive: 'Archive',
      notice: 'Notice',
    },

    hero: {
      badge: '9th Recruit',
      title: 'MESA',
      subtitle: 'Materials Science & Engineering Study Association',
      description:
        'An academic club of the Department of Materials Science and Engineering, Hanyang University.',
      descriptionDetail:
        'MESA explores materials science across semiconductors, batteries, displays, steel, and more, mapping how academic knowledge extends into industry and graduate studies.',
      scrollDown: 'Scroll Down',
    },

    about: {
      label: 'About MESA',
      title: 'About MESA',
      intro:
        'An academic club of the Department of Materials Science and Engineering, Hanyang University.',
      introDetail:
        'MESA explores materials science across semiconductors, batteries, displays, steel, and more, mapping how academic knowledge extends into industry and graduate studies.',
      history:
        'Since our 1st generation through the 8th, we have consistently carried forward our academic legacy.',
      description:
        'MESA is an academic club where members think together, connect experience with knowledge, and design career paths grounded in the essence of our major.',
      since: 'Since 2018',
      values: [
        {
          title: 'Collaborative Problem-Solving',
          description:
            'When career paths are unclear or studying feels overwhelming, we create a network where people with similar concerns share their worries and map out career directions together.',
        },
        {
          title: 'Connected Growth',
          description:
            'Beyond simple study groups, we share experiences and explore careers through connections between members and alumni. Quality information is shared through academic studies and columns to build a structure of collective growth.',
        },
        {
          title: 'From Academia to Industry',
          description:
            'Through deep understanding of coursework, we explore how our major connects to industry and research. We build academic foundations to understand how our field expands into diverse career paths.',
        },
      ],
    },

    programs: {
      label: 'Activities',
      title: 'MESA 9th Programs',
      essential: 'Essential Activities',
      additional: 'Additional Activities',
      items: [
        {
          title: 'Regular Meetings',
          description:
            'Every Wednesday evening, all members gather to broaden their perspectives on their major and career paths through academic lectures, mini-conferences, and presentations.',
          schedule: 'Every Wednesday',
        },
        {
          title: 'Team Academic Study',
          description:
            'Teams are formed based on interests for academic columns and team project study sessions.',
        },
        {
          title: 'MESA Insight Column',
          description:
            'Based on knowledge from team studies, members choose specific topics to explore and write articles with personal insights and career exploration takeaways, accessible even to non-specialists.',
        },
        {
          title: 'Team Academic Project',
          description:
            'Team study members collaborate on joint academic projects each semester.',
        },
        {
          title: 'MESA Journal',
          description:
            'We create an academic journal archiving a year of scholarly activities. The journal is curated selectively and becomes a unique asset of MESA.',
        },
        {
          title: 'Other Activities',
          description:
            'Major study groups, morning/night routines, career seminars, exhibition visits, networking, workshops, homecoming day, and more — diverse activities for learning habits, career exploration, and bonding.',
        },
      ],
    },

    archive: {
      label: 'Archive',
      title: 'Archive',
      subtitle: 'Materials Science & Engineering Study Association',
      history: '1st ~ 8th , 9th ~ing',
      since: 'Since 2018',
      viewMore: 'View More',
    },

    leadership: {
      label: 'MESA 9th Executive',
      title: '9th Leader',
      leaders: [
        { name: 'Junseo Lee', role: 'President', year: 'Class of 2022', department: 'Materials Science & Engineering', imageUrl: '/image/이준서.jpg' },
        { name: 'Heonjong Kim', role: 'Vice President', year: 'Class of 2022', department: 'Materials Science & Engineering', imageUrl: '/image/김훈종.jpg' },
        { name: 'Eunseo Shim', role: 'Vice President', year: 'Class of 2024', department: 'Materials Science & Engineering', imageUrl: '/image/심은서.jpg' },
        { name: 'Dogwan Kim', role: 'Secretary', year: 'Class of 2022', department: 'Materials Science & Engineering', imageUrl: '/image/김도관.jpg' },
      ],
    },

    footer: {
      contact: 'Contact',
      social: 'Social',
      rights: 'All rights reserved.',
    },

    chatbot: {
      title: 'MESA Assistant',
      placeholder: 'Ask about MESA...',
      greeting: 'Hi! Ask me anything about MESA :)',
      error: 'Sorry, please try again later.',
    },
  },
}

/**
 * 번역 데이터 타입
 *
 * 왜 as const를 안 쓰나요?
 * → as const를 쓰면 "한양대학교..." 같은 구체적인 문자열이 타입이 됩니다.
 *   ko와 en의 문자열이 다르므로 타입이 호환되지 않아 에러가 납니다.
 *   as const 없이 선언하면 모두 string 타입이 되어 자유롭게 교체 가능합니다.
 */
export type Translations = typeof translations.ko
