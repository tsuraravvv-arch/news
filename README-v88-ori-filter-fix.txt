v88 ORI filter fix

修正内容:
- v87の後付けフィルタ条件置換を廃止し、安定版v80をベースに作り直し
- script.js の hasOriginal() を ORI 対応に修正
- ORI00001 など category: ORI の記事を「オリジナル」フィルタで表示
- 旧 type: OR / typeLabel: オリジナル / labels: オリジナル / 旧10000番台IDも互換でオリジナル扱い
- オリジナルフィルタボタンの data-filter を ORI に変更
- data/articles.json に articles-v86-add-JOB00021-JOB00030.json を同梱

期待される挙動:
- 初期表示が空にならない
- オリジナルで ORI00001 チョコミントの世界が表示される
- 旧オリジナル記事も同じフィルタに表示される
