# Copy HTML for AI

[English](README.md) | **한국어**

웹 페이지에서 **요소를 가리켜 그 요소에 대한 간결한 "지칭 정보"를 클립보드로 복사**하는 Chrome 확장 프로그램입니다. 복사한 내용을 AI(ChatGPT, Claude 등)에 붙여넣고 "이 UI 고쳐줘 / 설명해줘"라고 요청하면 됩니다.

원본 HTML을 통째로 담는 대신, AI가 요소를 *찾아내고 디버깅하는 데* 꼭 필요한 것만 복사합니다 — 고유 선택자, 요소의 정체, 뷰포트 기준 크기, 그리고 보이는 모습을 결정하는 **핵심 computed CSS**.

> **Chrome Web Store 소개**
>
> _요소를 가리켜 AI가 바로 쓸 수 있는 지칭 정보(선택자 + 핵심 CSS)를 복사해, AI에게 해당 UI의 수정·설명을 요청할 수 있게 해줍니다._
>
> 어떤 데이터도 수집·저장·전송하지 않으며 모든 처리는 로컬에서 이루어집니다. [개인정보처리방침](PRIVACY.md) 참고.

## 사용 방법

DevTools의 "검사"처럼 **선택 모드**를 세 가지 방법으로 시작할 수 있습니다.

- **툴바 아이콘** 클릭
- **단축키** — 기본 **Alt+Shift+C** (Mac: **Option+Shift+C**)
- 우클릭 → **Copy HTML for AI**

그다음:

1. **호버** — 파란 테두리와 라벨(태그 + 크기)이 커서를 따라다닙니다.
2. 요소를 **클릭** — 지칭 정보가 복사되고, 요소가 초록색으로 깜빡이며, 토스트에 복사된 내용 전체가 표시됩니다.
3. **Esc**(또는 단축키·아이콘 재입력)로 취소합니다.

> 단축키는 `chrome://extensions/shortcuts`에서 바꿀 수 있습니다. 아이콘 툴팁에 현재 지정된 키가 표시됩니다.

## 무엇이 복사되나

요소를 설명하는 주석 블록입니다 — **HTML 본문 없이** AI에게 필요한 지칭 정보만. 기본값·0값·`static` 포지셔닝·투명 배경은 생략해 의미 있는 신호만 남깁니다.

```html
<!-- AI UI-debugging reference for the element below. -->
<!-- page: https://example.com/products -->
<!-- selector: #content > div.list > div.card:nth-of-type(3) (unique on page) -->
<!-- element: a "Add to cart" → /cart/add?id=42 -->
<!-- class: card card--featured -->
<!-- size: 320×40px · viewport 1440×900 desktop -->
<!-- layout: display:flex; dir:row; justify:space-between; align:center; gap:8px -->
<!-- box: padding:8px 12px; border:1px solid #ddd; radius:6px -->
<!-- text: 14px/20px Inter; weight:600; color:#1a1a1a -->
<!-- visual: background:#ffffff; box-shadow -->
<!-- region: inside <main> "Recommended" -->
```

| 항목 | 의미 |
| --- | --- |
| **page** | 어떤 화면인지 (URL) |
| **selector** | 같은 모양이 여러 개여도 *몇 번째*인지 특정 + `unique on page` 검증. 절대 잘리지 않음. |
| **element** | 태그·role·접근성 이름·aria 상태·링크/입력값 등 "이게 무엇인지". 컨테이너 요소는 자손 텍스트가 합쳐진 노이즈를 생략. |
| **class** | 실제 적용된 모든 클래스 (selector는 안정적인 것만 추리므로, 디버깅엔 전체가 필요) |
| **size** | CSS px 렌더 크기 + 뷰포트 크기·폼팩터(desktop/mobile) — 크기에 맥락을 부여 |
| **layout** | `display`, flex/grid 정렬·`gap`, 설정된 경우 `overflow` |
| **box** | padding / margin / border / radius 중 0이 아닌 것만 |
| **text** | font 크기/줄간격/계열, weight, color |
| **visual** | background, opacity, shadow 중 설정된 것만 |
| **positioning** | `static`이 아닐 때만 position / z-index / inset |
| **region** | 가장 가까운 랜드마크(header/nav/main 등)와 그 영역 제목 |
| **⚠ not visible / off-screen** | 요소가 숨겨졌거나 화면 밖일 때**만**, 구체적 이유(`display:none` 등)와 함께 표시 |

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

선택 모드 시작(툴바 아이콘 · **Alt+Shift+C** · 우클릭 → **Copy HTML for AI**) → 요소에 마우스 올리고 클릭 → AI 채팅창에 붙여넣기.

## 파일 구조

- `manifest.json` — 확장 설정 (Manifest V3, `contextMenus` 권한, 툴바 `action`, 선택 모드 키보드 `command`)
- `background.js` — 단일 우클릭 메뉴 등록, 툴바 아이콘·단축키·메뉴 처리(모두 선택 모드 시작), 아이콘 툴팁의 단축키 표시 갱신
- `content.js` — 선택 모드 실행(호버 하이라이트 + 클릭 복사), 메타데이터/CSS 지칭 정보 생성, 클립보드 복사, 하이라이트/토스트

## 참고

- 패키지 전체(UI 텍스트·복사 정보·코드 주석)가 영어로 작성되어 있습니다.
- iframe 안의 요소도 복사할 수 있도록 모든 프레임에서 동작합니다.
- 의미 있는 CSS만 포함하며, 기본값·0값은 생략해 출력을 짧게 유지합니다.

## 개인정보

이 확장 프로그램은 어떤 사용자 데이터도 수집·저장·전송하지 않습니다. 모든 처리는 브라우저 내에서 로컬로 이루어집니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 참고하세요.
