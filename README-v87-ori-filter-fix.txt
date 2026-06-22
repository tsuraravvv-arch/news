v87 ORI filter fix

修正内容:
- ORIカテゴリをフィルタ対象として認識
- 旧 type: OR / typeLabel: オリジナル / labels: オリジナル / 旧10000番台IDを表示上 ORI として扱う互換処理を追加
- オリジナルタグ／旧ORフィルタを ORI に誘導
- data/articles.json に articles-v86-add-JOB00021-JOB00030.json を同梱

期待される挙動:
- ORIフィルタで ORI00001 チョコミントの世界を表示
- 旧オリジナルプロンプトも ORI として表示
- オリジナルタグクリック時も ORI記事が表示
