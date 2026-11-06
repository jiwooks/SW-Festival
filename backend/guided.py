"""Persistent human-led chat with bounded, grounded peer exchanges (protocol 5)."""
import re
from datetime import datetime, timezone
from .adaptive import AdaptiveConversation
from .schemas import QuestionPlan, ConversationThread
from .prompts import ROUNDS, PRE, POST
from .services import brief_payload, generate_report, guard_report_consensus
from .context import ContextManager, fingerprint

def question_plan(s,llm):
    plan=llm.call('questions',{'brief':brief_payload(s.brief),'topics':ROUNDS,
        'participants':[{'id':c.id,'role':c.immutable_core.decision_model.buying_role,
            'context':c.immutable_core.identity_context.use_context,'segment':c.immutable_core.identity_context.segment,
            'unknowns':c.session_state.unresolved_issues[:3]} for c in s.cards]},QuestionPlan,max_tokens=900)
    if {q.topic for q in plan.suggestions}!={name for name,_ in ROUNDS}: raise ValueError('Question plan must cover six topics')
    for n,q in enumerate(plan.suggestions):
        q.id=f'q{n+1}'
        if q.persona_id not in {c.id for c in s.cards}: q.persona_id=None
    return plan.suggestions

class GuidedConversation(AdaptiveConversation):
    def state(self,value,save):
        self.s.status=value
        if not self.s.state_history or self.s.state_history[-1]!=value: self.s.state_history.append(value)
        save(self.s)

    def start(self,s,save):
        if not 1<=len(s.cards)<=3: raise ValueError('1-3 validated cards required')
        self.restore(s); s.lounge_mode='guided'; s.protocol_version='5'; self.state('PRE',save)
        for pid in self.agents:
            if not any(t.phase=='pre' and t.persona_id==pid for t in s.transcript):
                self.speak(pid,'pre','Private Pre',PRE,save,max_tokens=320); save(s)
        if not s.dialogue_runtime.get('opened'):
            self.event('각자의 첫 생각을 독립적으로 받았습니다. 메시지를 보내면 선택한 참여자들이 자기 조건을 설명하고 서로 비교합니다. 같은 입력칸에서 계속 물어보세요.')
            s.dialogue_runtime['opened']=True
        s.error=None; self.state('WAITING',save); return s

    def thread_context(self,thread):
        active=[t for t in self.s.transcript if t.phase=='group' and t.thread_id==thread.id]
        older=[t for t in self.s.transcript if t.phase=='group' and t.thread_id!=thread.id]
        self.public=ContextManager(recent=8,summary_chars=1100)
        self.public.summary='\n'.join(f'[{t.id} {t.persona_id}] {t.content[:180]} / 조건: {t.reason[:100]}' for t in older[-4:])[-1100:]
        for t in active: self.public.add(t)

    @staticmethod
    def has_conditions(card):
        c=card.immutable_core
        return bool(c.reasoning_rules or any(v not in ('UNKNOWN','',None) for v in (c.identity_context.use_context,c.decision_model.buying_role,c.problem_context.current_alternative)))

    def choose(self,ids,question):
        def grams(text):
            clean=re.sub(r'\W','',text.lower())
            return {clean[i:i+2] for i in range(max(0,len(clean)-1))}
        q=grams(question)
        def score(pid):
            a=self.agents[pid]; c=a.card.immutable_core
            profile=' '.join([c.identity_context.segment,c.identity_context.use_context,c.decision_model.buying_role,c.problem_context.current_alternative,
                c.decision_model.adoption_barrier,c.decision_model.switching_cost,*[r.trigger+' '+r.value+' '+r.tradeoff for r in c.reasoning_rules]])
            name=a.card.presentation.display_name
            mention=3 if (name and name in question) or re.search(r'(?<!\w)'+re.escape(pid)+r'(?!\w)',question) else 0
            return mention+len(q&grams(profile))/max(1,len(q))+self.controller.score(a,question,self.public,len(self.s.transcript),self.last,self.agents)
        return sorted(ids,key=lambda pid:(-score(pid),pid))[0]

    def peer(self,pid,thread):
        turns=[t for t in self.s.transcript if t.id in thread.utterance_ids and t.persona_id!=pid]
        return next((t for t in reversed(turns) if t.addressed_to==pid and t.followup_question),None) or (turns[-1] if turns else None)

    def next_action(self,r,thread):
        ids=r['scope']; missing=[p for p in ids if p not in r['contributed']]
        if missing:
            pid=self.choose(missing,thread.question)
            return {'pid':pid,'question':thread.question,'reply':None,'stage':'contribution'}
        if r['interaction']=='direct' or len(ids)<2 or not any(self.has_conditions(self.agents[p].card) for p in ids): return None
        missing=[p for p in ids if p not in r['crossed'] and self.has_conditions(self.agents[p].card)]
        if missing:
            pid=self.choose(missing,thread.question); peer=self.peer(pid,thread)
            if peer: return {'pid':pid,'question':'원질문에 대한 동료의 구체적인 조건을 자기 카드의 대안·역할·판단 조건과 비교하고 새 이유나 상충 조건을 설명하세요. 없는 이견이나 시장 사실을 만들지 마세요.','reply':peer.id,'stage':'cross_response'}
        turns=[t for t in self.s.transcript if t.id in thread.utterance_ids]
        for t in reversed(turns):
            if t.id in r['handled_requests'] or not t.followup_question or t.followup_kind not in ('peer_condition','clarification'): continue
            pid=t.addressed_to
            if pid not in ids or pid==t.persona_id or 'response_repeat_unresolved' in t.quality_flags: continue
            if any(flag.endswith('_withheld') for flag in t.quality_flags): continue
            if any(x.reply_to==t.id and x.persona_id==pid for x in turns): continue
            if any(self.repeated_question(t.followup_question,x.followup_question) for x in turns if x.id!=t.id and x.followup_question): continue
            r['handled_requests'].append(t.id)
            return {'pid':pid,'question':t.followup_question,'reply':t.id,'stage':'clarification'}
        return None

    def ask(self,s,question,persona_id,save,interaction='auto'):
        if s.status in ('SELECTED','FAILED','PRE') and not any(t.phase=='group' for t in s.transcript): self.start(s,save)
        self.restore(s); s.lounge_mode='guided'; s.protocol_version='5'
        if persona_id and persona_id not in self.agents: raise ValueError('Unknown persona')
        snapshot=s.dialogue_runtime.get('report_snapshot')
        if snapshot and not snapshot.get('done'): raise ValueError('중단된 리포트 생성을 먼저 재개하세요.')
        r=s.dialogue_runtime.get('followup'); key=[question,persona_id,interaction]
        if r and not r.get('done') and r['key']!=key: raise ValueError('미완료 메시지를 같은 내용으로 재개하세요.')
        if not r or r.get('done'):
            thread=ConversationThread(id=f'th{len(s.threads)+1}',question=question,interaction=interaction); s.threads.append(thread); self.thread_context(thread)
            pid=persona_id or self.choose(list(self.agents),question); scope=[pid] if interaction=='direct' else list(self.agents)
            r={'key':key,'count':0,'pending':{'pid':pid,'question':question,'reply':None,'stage':'contribution'},'done':False,
               'thread_id':thread.id,'scope':scope,'interaction':interaction,'contributed':[],'crossed':[],'handled_requests':[]}
            s.dialogue_runtime['followup']=r; s.dialogue_runtime.pop('finish_started',None); self.event(question,'founder')
        thread=next(t for t in s.threads if t.id==r['thread_id']); self.thread_context(thread)
        r.setdefault('scope',[persona_id or next(iter(self.agents))] if interaction=='direct' else list(self.agents)); r.setdefault('interaction',interaction)
        r.setdefault('contributed',list(dict.fromkeys(t.persona_id for t in s.transcript if t.id in thread.utterance_ids)))
        r.setdefault('crossed',[]); r.setdefault('handled_requests',[])
        if r.get('pending'): r['pending'].setdefault('stage','contribution')
        budget=1 if interaction=='direct' else 3*len(r['scope'])
        if s.report: s.report_stale=True
        self.state('WAITING',save)
        while r['pending'] and r['count']<budget:
            p=r['pending']; t=self.speak(p['pid'],'group','Founder Follow-up',p['question'],save,p['reply'],max_tokens=640,conversation_step=p['stage'])
            t.thread_id=thread.id; thread.utterance_ids.append(t.id); r['count']+=1
            bucket='contributed' if p['stage']=='contribution' else 'crossed' if p['stage']=='cross_response' else None
            if bucket and p['pid'] not in r[bucket]: r[bucket].append(p['pid'])
            # A turn with nothing new means the exchange is exhausted; stop instead of asking for more copies.
            r['pending']=None if 'response_repeat_unresolved' in t.quality_flags and p['stage']!='contribution' else self.next_action(r,thread)
            save(s)
        issues=[issue for t in s.transcript if t.id in thread.utterance_ids for issue in t.unresolved_issues]
        if r['pending']: issues.append(r['pending']['question'][-140:])
        thread.remaining_issues=list(dict.fromkeys(issues))[-8:]; thread.status='returned_to_user'
        thread.stop_reason='response_budget' if r['pending'] else 'direct' if interaction=='direct' else 'no_grounded_expansion' if len(r['scope'])>1 and not r['crossed'] else 'useful_exchange_complete'
        r['pending']=None; r['done']=True; s.error=None; self.state('WAITING',save); return s

    def finish(self,s,save):
        self.restore(s); hashes={c.id:fingerprint(c) for c in s.cards}; revision=sum(t.phase=='group' for t in s.transcript)
        if s.report and s.report_revision==revision and not s.report_stale:
            s.report=guard_report_consensus(s,s.report)
            self.state('COMPLETE',save); return s
        followup=s.dialogue_runtime.get('followup')
        if followup and not followup.get('done'): raise ValueError('중단된 메시지를 먼저 재개하세요.')
        r=s.dialogue_runtime.get('report_snapshot')
        if not r or r.get('done'):
            last_public=max((i for i,t in enumerate(s.transcript) if t.phase=='group'),default=-1)
            posted=[t.persona_id for i,t in enumerate(s.transcript) if t.phase=='post' and i>last_public]
            r={'revision':revision,'posted':list(dict.fromkeys(posted)),'done':False}; s.dialogue_runtime['report_snapshot']=r
        if r['revision']!=revision: raise ValueError('Report snapshot changed while pending')
        self.state('POST',save)
        for pid in self.agents:
            if pid not in r['posted']:
                self.speak(pid,'post','Private Post',POST,save,max_tokens=320,snapshot_revision=revision); r['posted'].append(pid); save(s)
        if any(fingerprint(c)!=hashes[c.id] for c in s.cards): raise ValueError('immutable core mutation')
        self.state('REPORT',save); s.report=generate_report(s,self.llm)
        s.report_revision=revision; s.report_generated_at=datetime.now(timezone.utc).isoformat()
        s.report_stale=False; r['done']=True; s.error=None; self.state('COMPLETE',save); return s
