# Mirai-js

> 稳定版本在 v2.x 分支上维护, 当前 master 是 v3.x 的开发分支

[![HitCount](https://hits.dwyl.com/drincann/drincann/Mirai-js.svg?style=flat-square)](http://hits.dwyl.com/drincann/drincann/Mirai-js)

Mirai-js v3，一个运行在 Node.js、浏览器下的，简单的 QQ 机器人开发框架。

使用一目了然的异步 api，优良的类型提示，以及强大的中间件机制来实现你的应用。

```js
bot.on('FriendMessage', async (ctx, next) => {
  await next()
  console.log(`receive message from ${ctx.sender.id}`)
})
  .pipe(Middlewares.textProcessor()) // parse the plain text to ctx.text
  .pipe(async (ctx, next) => {
    await bot.sendMessage({
      qq: ctx.sender.id,
      message: ctx.text,
    });
  });
```

开发文档(v2):

- GitHub Page -> [https://drincann.github.io/Mirai-js](https://drincann.github.io/Mirai-js)
- Vercel     -> [https://mirai-js.vercel.app](https://mirai-js.vercel.app)

QQ 群: 730757181

如果觉得这个项目还不错的话，就动动小手给个 star 吧！

## Stargazers over time

[![Stargazers over time](https://starchart.cc/Drincann/Mirai-js.svg)](https://starchart.cc/Drincann/Mirai-js)


## 支持这个项目

<a href="https://opencollective.com/mirai-js#sponsors" target="_blank"><img src="https://opencollective.com/mirai-js/sponsors.svg?width=890"></a>
<a href="https://opencollective.com/mirai-js#backers" target="_blank"><img src="https://opencollective.com/mirai-js/backers.svg?width=890"></a>

## 感谢

[<img width="200" src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png"></img>](https://www.jetbrains.com/community/opensource/#support)


> [JetBrains](https://www.jetbrains.com/community/opensource/#support) 一直致力于创造强大、高效的开发工具。

感谢 [JetBrains](https://www.jetbrains.com/community/opensource/#support) 对该项目支持的开源开发许可证。
