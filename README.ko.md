# Copy HTML for AI

[English](README.md) | **한국어**

웹 페이지에서 **우클릭한 요소의 HTML을 클립보드로 복사**하는 Chrome 확장 프로그램입니다.
AI에게 화면 구조를 설명할 때 "이 부분이 어떻게 생겼냐면…" 하고 일일이 옮겨 적는 수고를 덜어줍니다.

> **Chrome Web Store 소개**
>
> _우클릭한 요소의 HTML을 클립보드로 복사해, AI에게 화면을 쉽게 설명할 수 있게 해줍니다._
>
> 복사한 HTML을 ChatGPT, Claude 등 AI에게 붙여넣으면 "이 부분 고쳐줘", "이 레이아웃 설명해줘" 같은 요청을 정확한 맥락과 함께 전달할 수 있습니다. 어떤 데이터도 수집·저장·전송하지 않으며 모든 처리는 로컬에서 이루어집니다. [개인정보처리방침](PRIVACY.md) 참고.

## 기능

요소 위에서 우클릭하면 **Copy HTML for AI ▸** 메뉴 아래에 세 가지 항목이 나타납니다.

| 메뉴 | 복사 내용 |
| --- | --- |
| **This element (cleaned up)** | `script`/`style` 제거, 긴 속성값 축약, 들여쓰기 정리 — AI에게 붙여넣기 좋음 |
| **This element (raw outerHTML)** | 선택한 요소의 원본 `outerHTML` 전체 |
| **Parent element (one level up)** | 안쪽 작은 요소가 잘못 잡혔을 때, 부모를 정리해서 복사 |

복사가 끝나면 **복사된 요소를 화면에 초록 테두리로 잠깐 표시**하고, 우측 하단 토스트로 무엇을 복사했는지 알려줍니다. 의도와 다른 요소가 잡혔다면 바로 알아챌 수 있어요.

### 메타데이터 헤더

복사 결과 맨 위에는 AI가 화면을 이해하도록 돕는 영어 주석이 붙습니다.

```html
<!-- page: https://example.com/products -->
<!-- selector: #content > div.list > div.card:nth-of-type(3) (unique on page) -->
<!-- element: a "Add to cart" → /cart/add?id=42 -->
<!-- position: 320×40px · middle right of viewport -->
<!-- region: inside <main> "Recommended" -->
<div class="card">…</div>
```

| 항목 | 의미 |
| --- | --- |
| **page** | 어떤 화면인지 (URL) |
| **selector** | 같은 모양이 여러 개여도 *몇 번째*인지 특정 + `unique on page` 검증 |
| **element** | 태그·role·접근성 이름·aria 상태·링크/입력값 등 "이게 무엇인지" |
| **position** | 화면상 크기와 위치, **숨김/뷰포트 밖 여부** (안 보인다류 문제에 결정적) |
| **region** | 가장 가까운 랜드마크(header/nav/main 등)와 그 영역 제목 |

### 선택자 생성 방식

DevTools의 "Copy selector"와 달리, **빌드마다 바뀌는 해시 클래스를 제외**해서 재현 가능한 선택자를 만듭니다.

| 종류 | 예시 | 처리 |
| --- | --- | --- |
| 안정적인 id | `#newsstand` | 사용 (경로 종료) |
| 안정적인 속성 | `data-testid`, `name`, `aria-label` | 우선 사용 |
| 일반 클래스 | `.card`, `.news_desc` | 사용 |
| CSS Modules / styled-components / emotion | `...module__x___AiQyW`, `sc-abc123`, `css-1a2b3c` | **제외** → `:nth-of-type`으로 대체 |

## 설치

### Chrome Web Store에서 설치

게시 후 Chrome Web Store에서 바로 설치할 수 있습니다. _(심사 통과 후 링크가 여기에 추가됩니다.)_

### 개발자 모드 (압축해제된 확장 로드)

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드** 클릭
4. 이 폴더 선택

## 사용법

1. 아무 웹 페이지에서 설명하고 싶은 요소 위에 마우스를 올리고 **우클릭**
2. **Copy HTML for AI ▸** 에서 원하는 항목 선택
3. AI 채팅창에 붙여넣기

## 파일 구조

- `manifest.json` — 확장 설정 (Manifest V3, `contextMenus` 권한)
- `background.js` — 우클릭 메뉴 등록 및 클릭 처리
- `content.js` — 우클릭 요소 추적, HTML 추출/정리, 메타데이터 헤더 생성, 클립보드 복사, 하이라이트/토스트

## 참고

- 패키지 전체(UI 텍스트·복사 헤더·코드 주석)가 영어로 작성되어 있습니다.
- iframe 안의 요소도 복사할 수 있도록 모든 프레임에서 동작합니다.
- 간결 정리 모드에서 100자가 넘는 속성값(예: base64 이미지)은 `…`로 잘립니다.

## 개인정보

이 확장 프로그램은 어떤 사용자 데이터도 수집·저장·전송하지 않습니다. 모든 처리는 브라우저 내에서 로컬로 이루어집니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 참고하세요.
