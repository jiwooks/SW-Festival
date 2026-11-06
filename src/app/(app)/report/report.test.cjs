// Synthetic fixtures verify rendering contracts. These do not evaluate persona quality.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '@/components/PersonaAvatar') request = path.resolve(__dirname, '../../../components/PersonaAvatar.tsx');
  if (request === '@/lib/korean-text') request = path.resolve(__dirname, '../../../lib/korean-text.ts');
  return originalResolve.call(this, request, parent, ...rest);
};
const oldTsx = Module._extensions['.tsx'];
const oldTs = Module._extensions['.ts'];
const oldCss = Module._extensions['.css'];
Module._extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
Module._extensions['.css'] = (module) => { module.exports = { page: 'page', body: 'body', copy: 'copy', printOnly: 'print-only' }; };
Module._extensions['.ts'] = Module._extensions['.tsx'];
const { ReportClient, reportText } = require('./ReportView.tsx');
Module._resolveFilename = originalResolve;
if (oldTsx) Module._extensions['.tsx'] = oldTsx; else delete Module._extensions['.tsx'];
if (oldTs) Module._extensions['.ts'] = oldTs; else delete Module._extensions['.ts'];
if (oldCss) Module._extensions['.css'] = oldCss; else delete Module._extensions['.css'];

const sectionNames = ['Target Snapshot', 'Problem Signal', 'Solution Reaction', 'Target Differences', 'Agreement', 'Disagreement', 'Unknown/Unsupported', 'Real Interview Next Steps'];
function fixture(stances = ['positive', 'conditional']) {
  const participants = stances.map((_, index) => ({ id: `p${index + 1}`, name: `합성 참여자 ${index + 1}`, segment: `합성 이용자 유형 ${index + 1}` }));
  const positions = participants.map((p, index) => ({ ...p, persona_id: p.id, stance: stances[index], stance_label: '합성 태그', content: `합성 공개 발언 ${index + 1}`, reason: '합성 조건 설명', utterance_id: `u${index + 1}`, evidence_ids: [], quality_flags: [] }));
  const insight = { text: '합성 대화에서 확인할 가설', utterance_ids: positions.map((p) => p.utterance_id), evidence_ids: [], hypothesis: true, confidence: 'low', evidence_level: 0 };
  return {
    meta: { session_id: 'synthetic-render-only', generated_at: null, revision: stances.length, revision_inferred: false, stale: false, persona_count: participants.length, question_count: 1, public_turn_count: stances.length, insight_count: 1, change_count: 0, unknown_count: 1, excluded_insight_count: 0, participants, metrics_notice: '합성 화면 테스트이며 실제 성능 결과가 아닙니다.' },
    notice: 'AI 시뮬레이션 가설입니다.', conclusion: [insight],
    topics: [{ id: 'synthetic-question', question: '어떤 조건에서 검토하나요?', utterance_ids: insight.utterance_ids, positions, insights: [insight] }],
    new_insights: [insight], changes: [], followups: [{ question: '현재 대안은 무엇인가요?', topic_id: 'synthetic-question', persona_id: null, utterance_ids: [], kind: 'suggestion', why: '합성 후속 질문' }],
    unknowns: [{ text: '실제 구매 행동 미확인', utterance_ids: [], evidence_ids: [] }], real_interview: [{ ...insight, text: '최근 실제 경험은 어땠나요?' }],
    sections: Object.fromEntries(sectionNames.map((section) => [section, [{ ...insight, section }]])),
    sources: positions.map((p) => ({ ...p, id: p.utterance_id, phase: 'group' })),
  };
}
function render(report) {
  return renderToStaticMarkup(React.createElement(ReportClient, { report, regenerating: false, onRegenerate() {}, onContinue() {}, onAsk() {}, onNewTargets() {}, mode: 'mock' }));
}

test('conditional stance does not become positive consensus', () => {
  const html = render(fixture());
  assert.ok(html.includes('조건 확인 필요'));
  assert.ok(!html.includes('참여자 모두 긍정 반응'));
  assert.ok(!html.includes('2 : 1'));
});
test('one to three participants receive consensus only with each positive source', () => {
  for (const size of [1, 2, 3]) {
    const report = fixture(Array(size).fill('positive'));
    assert.ok(render(report).includes('참여자 모두 긍정 반응'));
    report.topics[0].positions[0].utterance_id = null;
    assert.ok(!render(report).includes('참여자 모두 긍정 반응'));
  }
});
test('positive/negative counts exclude conditional participants', () => {
  const html = render(fixture(['positive', 'negative', 'conditional']));
  assert.ok(html.includes('긍정 1 · 부정 1'));
  assert.ok(!html.includes('긍정 2'));
});
test('unknown position is labeled unconfirmed rather than proven refusal', () => {
  const html = render(fixture(['unknown']));
  assert.ok(html.includes('미확인'));
  assert.ok(!html.includes('참여자 모두 긍정 반응'));
});
test('exact quotes are preserved as text and model markup cannot execute', () => {
  const report = fixture();
  const quote = '"부족 이나"는 원문입니다. <script>danger()</script>';
  report.sources[0].content = quote;
  const html = render(report);
  assert.ok(html.includes('부족 이나'));
  assert.ok(html.includes('&lt;script&gt;danger()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>danger()'));
  assert.ok(reportText(report).includes(quote));
});
test('stale report states its saved revision and legacy date stays unknown', () => {
  const report = fixture(); report.meta.stale = true;
  const html = render(report);
  assert.ok(html.includes('이 리포트 이후 대화가 추가되었습니다.'));
  assert.ok(html.includes('생성 날짜 미기록'));
  assert.ok(reportText(report).includes('저장된 시점'));
});
test('text export retains eight sections, metrics, questions and original citations', () => {
  const report = fixture(); report.sources[0].phase = 'pre';
  const text = reportText(report);
  for (const label of ['타깃 요약', '문제 반응', '서비스 반응', '타깃 간 차이', '공통 반응', '의견 차이', '미확인·근거 부족', '실제 인터뷰 계획']) assert.ok(text.includes(label));
  for (const label of ['다룬 질문: 1', '긍정·부정이 갈린 질문: 0', '입장 표현 변화: 0', '추출한 인사이트: 1', 'u1', 'pre', '최근 실제 경험은 어땠나요?']) assert.ok(text.includes(label));
});
test('mock mode is explicitly synthetic and followups wait for user submission', () => {
  const html = render(fixture());
  assert.ok(html.includes('합성 응답이며 실제 Qwen 출력이나 성능 검증 결과가 아닙니다.'));
  assert.ok(html.includes('내용을 확인한 뒤 직접 보내세요.'));
  assert.ok(!html.includes('박민수'));
  assert.ok(!html.includes('월 1만 원'));
});
test('generated prose spacing is formatted while source quote and JSON remain exact', () => {
  const report = fixture();
  report.conclusion[0].text = '조건 부족 이나 "부족 이나"는 원문입니다.';
  report.sources[0].content = '조건 부족 이나 "부족 이나"는 원문입니다.';
  const raw = JSON.stringify(report);
  const html = render(report);
  assert.ok(html.includes('조건 부족이나'));
  assert.ok(html.includes('조건 부족 이나'));
  assert.equal(JSON.stringify(report), raw);
  assert.ok(reportText(report).includes('조건 부족 이나'));
});
test('report dates use Seoul calendar day rather than UTC calendar day', () => {
  const report = fixture(); report.meta.generated_at = '2026-10-04T18:30:00Z';
  assert.ok(render(report).includes('2026. 10. 5.'));
  assert.ok(reportText(report).includes('2026. 10. 5.'));
});
