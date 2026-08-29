越鯉 共通エンジン版（手動アップロード用）

GitHub の koshi-no-koi リポジトリ直下に、この構成のままアップロードしてください。

index.html
shared/
  koi-engine.js
pond/
  index.html
  style.css
  app.js

公開後:
- 本体: /koshi-no-koi/
- 池:   /koshi-no-koi/pond/

重要:
- 本体と池の両方が shared/koi-engine.js を利用します。
- 同じ番号は同じ deriveFromId / beautifulNormalSVG / legendFullBodySVG を通ります。
- 今後鯉の生成方式を変更するときは shared/koi-engine.js を更新すれば両方に反映できます。

アップロード時は index.html もこのセットのものへ置き換えてください。
