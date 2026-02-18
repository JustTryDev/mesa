import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * 챗봇 API Route
 *
 * 비유: 식당의 주방과 같습니다.
 * 손님(프론트엔드)이 주문(질문)을 하면,
 * 주방(서버)이 요리사(OpenAI)에게 전달하고,
 * 완성된 요리(답변)를 다시 손님에게 돌려줍니다.
 *
 * 왜 API Route를 쓰나요?
 * → API 키를 프론트엔드에 노출하면 누구나 가져가서 쓸 수 있습니다.
 *   서버에서만 API 키를 사용하면 안전합니다.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * MESA 홈페이지 전체 내용 — 시스템 프롬프트에 포함
 * 챗봇이 이 내용 안에서만 답변하도록 제한합니다.
 */
const MESA_CONTEXT = `
# MESA (Materials Science & Engineering Study Association)
한양대학교 신소재공학부 학술동아리

## 기본 정보
- 설립: 2018년
- 현재: 9기 활동 중 (1기~8기 활동 이력)
- 소속: 한양대학교 신소재공학부
- 이메일: hyumesa9@gmail.com
- 인스타그램: @hyu_mesa
- 네이버 카페: https://cafe.naver.com/hyumesa

## MESA 소개
MESA는 반도체·배터리·디스플레이·철강·기타산업 전체를 아우르는 재료 공학을 탐구하며, 전공이 실제 산업과 진학으로 확장되는 과정을 함께 그려갑니다.
MESA는 함께 고민하고, 경험과 지식을 연결하며, 전공의 본질 위에서 진로를 설계하는 학술동아리입니다.

## 핵심 가치 3가지
1. 혼자가 아닌, 함께 고민하는 구조: 진로가 명확하지 않거나 전공 공부가 막막한 단계에서 비슷한 고민을 가진 사람들과 고민을 공유하고 함께 커리어 방향을 그려가는 네트워크를 만듭니다.
2. 경험이 이어지는 성장 구조: 단순 스터디에서 끝나지 않고, 부원들과 선후배 간 연결을 통해 경험을 공유하고 진로를 탐색합니다. 학술 스터디 및 칼럼을 통해 양질의 정보를 공유하여 함께 성장하는 구조를 만듭니다.
3. 학문적 이해를 산업과 연구로: 전공 과목에 대한 심도 깊은 이해를 통해 전공이 어떻게 산업과 연결되고 연구에서 적용되는지를 탐색합니다.

## MESA 9기 프로그램

### Essential Activities (필수 활동)
1. 정기회합 (매주 수요일): 매주 수요일 저녁, 모든 부원이 함께 모여 전공과 진로에 대한 시야를 넓히는 시간. 학술특강, 미니컨퍼런스, 학술발표 등.
2. 정기 팀 학술 스터디: 관심 분야를 고려하여 팀을 편성해 개인 학술 칼럼 및 팀 프로젝트를 위한 학술 스터디 진행.
3. MESA 인사이트 칼럼: 팀 정기 학술 스터디를 통해 습득한 지식과 자료를 바탕으로, 본인이 탐구하고 싶은 세부 주제를 정해 비전공자도 이해할 수 있도록 정리하고 개인의 이해, 해석과 진로탐색 인사이트를 담은 글 작성.
4. 팀 학술 프로젝트: 정기 팀 학술 스터디 팀원들과 함께 한학기마다 공동 학술 프로젝트 활동 수행.

### Additional Activities (추가 활동)
1. MESA 학술지 제작: 1년간의 학술 활동을 아카이브하는 학술지. 선별·큐레이션 방식으로 제작되며 MESA의 고유 자산으로 남음.
2. 기타 활동: 전공 그룹 스터디, 메라클 모닝/나잇, 진로 세미나, 박람회 단체관람, 네트워킹, MESA 워크숍, 홈커밍데이 등.

## 9기 회장단
- 회장: 이준서 (22학번, 신소재공학과)
- 남자 부회장: 김헌종 (22학번, 신소재공학과)
- 여자 부회장: 심은서 (24학번, 신소재공학과)
- 총무: 김도관 (22학번, 신소재공학과)
`

const SYSTEM_PROMPT = `너는 MESA 학술동아리 안내 도우미 "MESA Bot"이야.
아래 제공된 MESA 홈페이지 내용만을 기반으로 친절하고 정확하게 답변해.
홈페이지 내용에 없는 질문에는 "죄송합니다, 해당 정보는 MESA 홈페이지에 포함되어 있지 않습니다. 더 자세한 내용은 hyumesa9@gmail.com으로 문의해주세요."라고 답해.
답변은 간결하되 핵심을 담아서 해. 한국어로 답변하되, 영어로 질문하면 영어로 답변해.

${MESA_CONTEXT}`

/** 메시지 타입 */
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { messages } = (await request.json()) as { messages: ChatMessage[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '메시지가 비어있습니다.' },
        { status: 400 }
      )
    }

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const reply = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.'

    return NextResponse.json({ message: reply })
  } catch (error) {
    // 서버 콘솔에 상세 에러 출력 (디버깅용)
    console.error('[ChatBot API Error]', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: `챗봇 오류: ${errorMessage}` },
      { status: 500 }
    )
  }
}
