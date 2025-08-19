# A1
1. base.controller 中的错误处理方法是干嘛的
2. userError 和 businessError 的区别和分别应用场景
3. 服务器内部报错，应当在 拦截器 里处理吧，因为是预期之外的错误，所以不是直接在 controller 中处理的
4. 所以 safeExecute 方法是专门用来主动报错的

# A2
1. 轻量拦截器的作用是不是和 baseController 重复了（即答：没重复，这里只 处理 catchError）
2. 明确返回类型，返回类型是不是应该跟 proto 定义有关，需要举个例子

# B1
1. 错误分类太多了，并且有些错误类型的分类不太对，比如找不到用户，实际应该是一个数据上的错误，而不应该是 not found ，not found 仅仅用来表示找不到资源比较好。
2. 使用场景是什么，controller 中应当都集成 baseController 作为响应处理方式，给多种处理方式反而提升了维护的复杂性，在团队中应当推行最佳实践，保证每个人编码的结果都差不多。
  - 非 controller 场景，如中间件、拦截器、守卫中构建响应
  - 已经继承其他 controller 的 controller 中，因为 ts 不支持多重继承
  - 工具函数

# B2
1. 这个守卫仅仅是为了运行时类型检测吗，我认为对开发体验的提升不大，反而影响了性能

# C1
1. 不应当在 http controller 中直接使用 grpc controller 中的内容，如果逻辑相似，可以将逻辑提取到 service 中，grpc 和 http 控制器都使用该 service 提供数据，而后续对响应数据的处理逻辑要区分开来


# 其他改进
1. 我希望 http 响应的 data 的数据类型也跟 proto 定义的一致，现在http 控制器中定义的返回值都是 any；
2. 对于 http 请求只使用 get 和 post 两种，get 用于获取数据，post 用于变更数据