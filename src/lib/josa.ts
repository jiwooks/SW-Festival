/**
 * 받침에 맞춰 조사를 고른다. "을(를)" 처럼 괄호로 두 개를 다 쓰지 않기 위해서다.
 * 마지막 글자가 한글이 아니면(영문·숫자) 받침 없음으로 본다.
 */
export function josa(word: string, withJong: string, withoutJong: string) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  const hasJong = code >= 0 && code < 11172 && code % 28 !== 0;
  return word + (hasJong ? withJong : withoutJong);
}
