const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function runtime({url='http://localhost:18580/#search/path',saved,language='zh-CN',blocked=false}={}) {
  const storage=new Map(saved?[['soutui-lab.language',saved]]:[]),events=[];
  const context=vm.createContext({URL,URLSearchParams,navigator:{language},location:new URL(url),
    localStorage:{getItem(key){if(blocked)throw Error('disabled');return storage.get(key)||null;},setItem(key,value){storage.set(key,value);}},
    document:{documentElement:{lang:''},title:'',querySelectorAll(){return [];}},
    history:{replaceState(_,__,value){context.newURL=value;}},
    CustomEvent:function(type,options){this.type=type;this.detail=options.detail;},dispatchEvent(event){events.push(event);}
  });
  vm.runInContext(fs.readFileSync('web/i18n.js','utf8'),context);
  return {context,storage,events};
}
test('explicit language overrides a stored preference; browser language supplies the default',()=>{
  assert.equal(runtime({url:'http://localhost/?lang=en#ads/path',saved:'zh'}).context.I18n.lang,'en');
  assert.equal(runtime({saved:'en'}).context.I18n.lang,'en');
  assert.equal(runtime({language:'en-GB'}).context.I18n.lang,'en');
  assert.equal(runtime({language:'zh-TW'}).context.I18n.lang,'zh');
});
test('language switch persists while preserving lesson paths, query values and deep links',()=>{
  const {context,storage,events}=runtime({url:'http://localhost/learn/search_35?view=reader#section-2'});
  context.I18n.setLanguage('en');
  assert.equal(context.newURL,'/learn/search_35?view=reader&lang=en#section-2');
  assert.equal(storage.get('soutui-lab.language'),'en');
  assert.equal(context.document.documentElement.lang,'en');
  assert.equal(events[0].detail,'en');
  context.I18n.setLanguage('unsupported');
  assert.equal(context.I18n.lang,'en');
});
test('translation does not alter user inputs, method IDs or unknown source text',()=>{
  const {context}=runtime({language:'en'});
  assert.equal(context.I18n.t('双塔训练'),'Two-tower training');
  for(const value of ['two_tower','my-experiment-name','未注册的真实语料'])assert.equal(context.I18n.t(value),value);
  assert.doesNotThrow(()=>runtime({blocked:true}));
  assert.equal(runtime({blocked:true,url:'http://localhost/?lang=en'}).context.I18n.lang,'en');
});
