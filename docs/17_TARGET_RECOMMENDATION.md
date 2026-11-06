# Target recommendation contract (2026-10-04)

The first recommendation answers **who could use, introduce or buy this idea**, not what to research. The button says `타깃 추천받기`; selecting up to three targets is followed by persona generation and independent persona validation. The name/segment presentation after selection remains unchanged.

- `segment_name`: a concrete potential participant group, described by activity or organizational context. A feature, interview question, validation task, pricing model or metric cannot occupy this field.
- `why_relevant`: why this participant could encounter the founder's problem or be involved in adoption. `problem_exposure` describes that situation; `expected_current_alternative` remains a hypothesis or UNKNOWN. The internal buying role is separate from the segment name.
- Exactly six initial candidates are generated from the supplied idea. No fixed list of customers is substituted when Qwen fails. Contrast remains based on exposure, alternatives and decision conditions, not demographics.
- Check input limits and source IDs/levels, then perform one independent, compact batch review of participant identity and plausible idea relevance. Review must cover every candidate exactly once. A narrow local guard additionally rejects bare task/topic labels. This guard is not a universal semantic classifier.
- If the generated batch fails the semantic check or has fewer than three distinct decision/exposure profiles, provide its concrete issues to one regeneration attempt and review that attempt. At most two generator/reviewer attempts; never retry indefinitely or quietly use mock customers.
- Store successful/failed candidate batches and reviews in `target_audits` when a recommendation eventually succeeds. Reusing an unchanged approved target avoids an extra selection review. New/edited or legacy unreviewed selections receive one batch review before any persona building; user-authored targets are rejected with an editable error, never silently rewritten.
- A `CREATED` session without personas/transcript can explicitly regenerate its recommendations using its stored idea. Keep the replaced batch in the audit trail; write the new batch only after success. Selected personas or started conversations cannot be changed by this endpoint. Existing sessions remain readable.

UI cards explicitly label the participant group, recommendation reason, problem situation and expected alternative. A separate `타깃 다시 추천받기` action repairs a previously saved bad batch. Removing the word “hypothesis” from the button does not raise evidence levels: without source data recommendations stay L0/low. Semantic review establishes the type of the recommendation, **not actual target accuracy, customer demand or persona fidelity**. Automated fixtures and a real Qwen smoke are recorded separately.

## Integration fixes found during real Qwen verification

Long recommendation reasons/situations/expected alternatives use multiline fields. Selection reads both inputs and textareas, preserves user edits and rejects missing participant/reason fields. Static UI assets are versioned so a normal refresh fetches the new layout.

The first real selection attempt revealed fabricated reasoning-rule source IDs and three failed builds. The builder request grammar now permits only supplied IDs for rules/anchors, and only L2+ source IDs for timeline events. With no sources, rule evidence IDs, anchors and timeline are constrained to empty lists. The prompt distinguishes hypothetical basis_fields from source IDs. The existing exact-quote/UNKNOWN validator remains in place; this does not establish full semantic fidelity. The failed attempt is preserved separately from the successful rerun.

## 2026-11-06 기본값 변경: 관대한 추천 (`TARGET_REVIEW`)

실제 사용에서 4B 검사 모델이 프롬프트와 다르게 유효한 구매자(예: 음식점 원자재 구매 담당)까지 "비고객"으로 탈락시켜, 추천 전체가 실패하는 일이 반복됐다. 그래서 기본값을 **lenient**로 바꿨다.

- 모델 검사(`target_review`)를 호출하지 않는다. 결정적으로 거르는 것은 할 일·주제형 이름을 막는 로컬 검사(`target_label_issue`)뿐이다. 근거 수준은 막지 않고 인용 자료 중 가장 낮은 수준으로 낮춘다.
- 로컬 검사를 통과한 후보가 3개 미만일 때만 한 번 다시 생성한다. 그래도 모자라면 남은 후보를 그대로 반환하고, 0개일 때만 실패한다.
- 선택 단계에서도 모델 검사 없이 로컬 검사와 중복 검사만 한다.
- `TARGET_REVIEW=strict`로 실행하면 위 규칙(검사·재생성·실패)을 원래대로 적용한다.
